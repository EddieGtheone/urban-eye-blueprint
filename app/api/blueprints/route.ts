import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { Answers, evaluateBlueprint } from "@/lib/assessment";
import { generateAiBlueprintReport, ReportContact } from "@/lib/ai-report";
import { getWebsiteSnapshot } from "@/lib/website-snapshot";

export const runtime = "nodejs";
export const maxDuration = 60;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asString(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function leadScore(answers: Answers, timeline: string, urgency: string) {
  let score = urgency === "Immediate" ? 35 : urgency === "Important" ? 25 : 15;
  if (["now", "30_days"].includes(timeline)) score += 25;
  else if (timeline === "90_days") score += 18;
  else if (timeline === "6_months") score += 10;
  if (["products", "hybrid"].includes(answers.business_model)) score += 8;
  if (["500_5000", "5000_20000", "20000_plus"].includes(answers.sku_count)) score += 12;
  if (["launch", "connect_systems", "save_time"].includes(answers.primary_goal)) score += 8;
  return Math.min(100, score);
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && serviceKey ? { url, serviceKey } : null;
}

async function saveToSupabase(record: Record<string, unknown>) {
  const config = supabaseConfig();
  if (!config) {
    // Demo mode is for local development only. In production, missing
    // credentials must fail loudly rather than silently dropping leads.
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_MODE !== "true") {
      console.error("Blueprint misconfiguration: Supabase credentials are missing in production.");
      throw new Error("The blueprint service is temporarily unavailable. Please try again shortly.");
    }
    return { saved: false, demo: true };
  }

  const response = await fetch(`${config.url}/rest/v1/blueprint_submissions`, {
    method: "POST",
    headers: {
      apikey: config.serviceKey,
      Authorization: `Bearer ${config.serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify(record),
    cache: "no-store"
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Supabase blueprint insert failed", response.status, detail);
    throw new Error("We could not save your plan. Please try again.");
  }
  return { saved: true, demo: false };
}

// The AI report is written in a follow-up PATCH so a slow or failed generation
// never blocks or loses the lead row that was already inserted above.
async function saveAiReportToSupabase(id: string, values: Record<string, unknown>) {
  const config = supabaseConfig();
  if (!config) return false;

  const response = await fetch(`${config.url}/rest/v1/blueprint_submissions?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      apikey: config.serviceKey,
      Authorization: `Bearer ${config.serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify(values),
    cache: "no-store"
  });

  if (!response.ok) {
    const detail = await response.text();
    // The report still reaches the visitor even if the optional AI migration is not installed yet.
    console.error("Supabase AI report update failed", response.status, detail);
    return false;
  }
  return true;
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 64_000) return NextResponse.json({ error: "Request is too large." }, { status: 413 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const contact = (body.contact || {}) as Record<string, unknown>;
  const answers = (body.answers || {}) as Answers;
  const honeypot = asString(contact.company_site, 200);
  const startedAt = Number(body.startedAt || 0);

  // Quietly accept obvious bot submissions without writing them.
  if (honeypot) return NextResponse.json({ id: randomUUID(), accepted: true, filtered: true });
  if (!startedAt || Date.now() - startedAt < 3000) {
    return NextResponse.json({ error: "Please wait a moment, then try again." }, { status: 429 });
  }

  const name = asString(contact.name, 120);
  const email = asString(contact.email, 254).toLowerCase();
  const company = asString(contact.company, 180);
  const website = asString(contact.website, 500);
  const role = asString(contact.role, 120);
  const timeline = asString(contact.timeline, 50);
  // Delivery consent is required; ongoing marketing consent is optional and
  // recorded separately so we never treat delivery as a marketing opt-in.
  const deliveryConsent = contact.deliveryConsent === true;
  const marketingConsent = contact.marketingConsent === true;

  if (!name || !company || !emailPattern.test(email) || !timeline || !deliveryConsent) {
    return NextResponse.json({ error: "Add the required contact details and try again." }, { status: 422 });
  }

  const canonicalResult = evaluateBlueprint(answers);
  const id = randomUUID();
  const score = leadScore(answers, timeline, canonicalResult.urgency);
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  const ipHash = forwarded
    ? createHash("sha256").update(`${process.env.IP_HASH_SALT || "urban-eye"}:${forwarded}`).digest("hex")
    : null;

  const record = {
    id,
    source: asString(body.source, 100) || "business-modernization-blueprint",
    status: "new",
    name,
    email,
    company,
    website: website || null,
    role: role || null,
    timeline,
    business_model: answers.business_model || null,
    primary_goal: answers.primary_goal || null,
    primary_service: canonicalResult.servicePath,
    primary_pillar: canonicalResult.primaryPillar,
    secondary_pillar: canonicalResult.secondaryPillar,
    urgency: canonicalResult.urgency,
    fit_score: score,
    lead_temperature: score >= 70 ? "hot" : score >= 45 ? "warm" : "nurture",
    answers,
    scores: canonicalResult.scores,
    blueprint_result: canonicalResult,
    utm: typeof body.utm === "object" && body.utm ? body.utm : {},
    page_url: asString(body.pageUrl, 1000) || null,
    referrer: asString(body.referrer, 1000) || null,
    consent_at: new Date().toISOString(),
    marketing_consent: marketingConsent,
    marketing_consent_at: marketingConsent ? new Date().toISOString() : null,
    ip_hash: ipHash,
    user_agent: asString(request.headers.get("user-agent"), 500) || null
  };

  try {
    const storage = await saveToSupabase(record);

    // Expand the approved deterministic result into a detailed report. The
    // model cannot change the pillar, urgency, scores, or recommended service;
    // a deterministic fallback is returned if the AI call is unavailable.
    const reportContact: ReportContact = { name, company, website, role, timeline };
    const websiteSnapshot = website ? await getWebsiteSnapshot(website) : null;
    const ai = await generateAiBlueprintReport(reportContact, answers, canonicalResult, websiteSnapshot);

    if (storage.saved) {
      await saveAiReportToSupabase(id, {
        ai_report: ai.report,
        ai_status: ai.status,
        ai_model: ai.model,
        ai_generated_at: new Date().toISOString(),
        website_snapshot_used: ai.websiteSnapshotUsed,
        ai_error: ai.error || null
      });
    }

    return NextResponse.json({
      id,
      result: canonicalResult,
      aiReport: ai.report,
      aiStatus: ai.status,
      aiModel: ai.model,
      websiteSnapshotUsed: ai.websiteSnapshotUsed,
      ...storage
    }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "We could not save your plan. Please try again." }, { status: 503 });
  }
}
