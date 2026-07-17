import OpenAI from 'openai';
import { Answers, BlueprintResult, PILLAR_LABELS, QUESTIONS } from '@/lib/assessment';
import { WebsiteSnapshot } from '@/lib/website-snapshot';
import { SALES_MARKETING_PRINCIPLES } from '@/lib/marketing-principles';

export type ReportContact = {
  name: string;
  company: string;
  website: string;
  role: string;
  timeline: string;
};

export type AiBlueprintReport = {
  reportTitle: string;
  reportSubtitle: string;
  generatedFor: string;
  executiveSummary: string;
  companySnapshot: {
    whatTheySell: string;
    statedGoal: string;
    currentState: string;
    websiteObservations: string[];
  };
  primaryDiagnosis: {
    headline: string;
    summary: string;
    evidence: string[];
    businessImpact: string[];
    riskOfDelay: string;
  };
  priorityActions: Array<{
    rank: number;
    title: string;
    whyNow: string;
    actions: string[];
    expectedOutcome: string;
    suggestedOwner: string;
    timeframe: string;
  }>;
  roadmap: Array<{
    period: string;
    objective: string;
    actions: string[];
    proofOfProgress: string;
  }>;
  metrics: Array<{
    name: string;
    whyItMatters: string;
    startingPoint: string;
    targetDirection: string;
  }>;
  evidenceLog: Array<{
    source: 'Reported' | 'Observed' | 'Inferred' | 'Unknown';
    finding: string;
  }>;
  urbanEyeRecommendation: {
    service: string;
    projectName: string;
    outcome: string;
    included: string[];
    notIncluded: string[];
    duration: string;
    firstStep: string;
  };
  assumptions: string[];
  disclaimer: string;
};

export type AiReportGeneration = {
  report: AiBlueprintReport;
  status: 'generated' | 'fallback_no_key' | 'fallback_error';
  model: string;
  websiteSnapshotUsed: boolean;
  error?: string;
};

const reportSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'reportTitle', 'reportSubtitle', 'generatedFor', 'executiveSummary', 'companySnapshot',
    'primaryDiagnosis', 'evidenceLog', 'priorityActions', 'roadmap', 'metrics', 'urbanEyeRecommendation',
    'assumptions', 'disclaimer'
  ],
  properties: {
    reportTitle: { type: 'string' },
    reportSubtitle: { type: 'string' },
    generatedFor: { type: 'string' },
    executiveSummary: { type: 'string' },
    companySnapshot: {
      type: 'object', additionalProperties: false,
      required: ['whatTheySell', 'statedGoal', 'currentState', 'websiteObservations'],
      properties: {
        whatTheySell: { type: 'string' },
        statedGoal: { type: 'string' },
        currentState: { type: 'string' },
        websiteObservations: { type: 'array', minItems: 2, maxItems: 4, items: { type: 'string' } }
      }
    },
    primaryDiagnosis: {
      type: 'object', additionalProperties: false,
      required: ['headline', 'summary', 'evidence', 'businessImpact', 'riskOfDelay'],
      properties: {
        headline: { type: 'string' },
        summary: { type: 'string' },
        evidence: { type: 'array', minItems: 3, maxItems: 5, items: { type: 'string' } },
        businessImpact: { type: 'array', minItems: 2, maxItems: 4, items: { type: 'string' } },
        riskOfDelay: { type: 'string' }
      }
    },
    priorityActions: {
      type: 'array', minItems: 3, maxItems: 3,
      items: {
        type: 'object', additionalProperties: false,
        required: ['rank', 'title', 'whyNow', 'actions', 'expectedOutcome', 'suggestedOwner', 'timeframe'],
        properties: {
          rank: { type: 'integer', minimum: 1, maximum: 3 },
          title: { type: 'string' },
          whyNow: { type: 'string' },
          actions: { type: 'array', minItems: 3, maxItems: 4, items: { type: 'string' } },
          expectedOutcome: { type: 'string' },
          suggestedOwner: { type: 'string' },
          timeframe: { type: 'string' }
        }
      }
    },
    roadmap: {
      type: 'array', minItems: 3, maxItems: 3,
      items: {
        type: 'object', additionalProperties: false,
        required: ['period', 'objective', 'actions', 'proofOfProgress'],
        properties: {
          period: { type: 'string', enum: ['Days 1-30', 'Days 31-60', 'Days 61-90'] },
          objective: { type: 'string' },
          actions: { type: 'array', minItems: 3, maxItems: 5, items: { type: 'string' } },
          proofOfProgress: { type: 'string' }
        }
      }
    },
    metrics: {
      type: 'array', minItems: 4, maxItems: 4,
      items: {
        type: 'object', additionalProperties: false,
        required: ['name', 'whyItMatters', 'startingPoint', 'targetDirection'],
        properties: {
          name: { type: 'string' },
          whyItMatters: { type: 'string' },
          startingPoint: { type: 'string' },
          targetDirection: { type: 'string' }
        }
      }
    },
    evidenceLog: {
      type: 'array', minItems: 4, maxItems: 8,
      items: {
        type: 'object', additionalProperties: false,
        required: ['source', 'finding'],
        properties: {
          source: { type: 'string', enum: ['Reported', 'Observed', 'Inferred', 'Unknown'] },
          finding: { type: 'string' }
        }
      }
    },
    urbanEyeRecommendation: {
      type: 'object', additionalProperties: false,
      required: ['service', 'projectName', 'outcome', 'included', 'notIncluded', 'duration', 'firstStep'],
      properties: {
        service: { type: 'string' },
        projectName: { type: 'string' },
        outcome: { type: 'string' },
        included: { type: 'array', minItems: 4, maxItems: 7, items: { type: 'string' } },
        notIncluded: { type: 'array', minItems: 2, maxItems: 4, items: { type: 'string' } },
        duration: { type: 'string' },
        firstStep: { type: 'string' }
      }
    },
    assumptions: { type: 'array', minItems: 2, maxItems: 4, items: { type: 'string' } },
    disclaimer: { type: 'string' }
  }
} as const;

export function answerLabel(questionId: string, value: string | undefined) {
  if (!value) return 'Not provided';
  const question = QUESTIONS.find((item) => item.id === questionId);
  return question?.options.find((option) => option.value === value)?.label || value;
}

function timelineLabel(value: string) {
  const labels: Record<string, string> = {
    now: 'Now', '30_days': 'Within 30 days', '90_days': 'Within 90 days',
    '6_months': 'Within 6 months', exploring: 'Just exploring'
  };
  return labels[value] || value || 'Not provided';
}

function websiteObservations(snapshot: WebsiteSnapshot | null) {
  if (!snapshot) {
    return [
      "We couldn't pull a live look at your site this time — an easy thing to walk through together.",
      'For now, this plan is built from your answers and the priorities they point to.'
    ];
  }
  const observations = [];
  if (snapshot.title) observations.push(`Your homepage leads with: ${snapshot.title}`);
  if (snapshot.description) observations.push(`How it describes you: ${snapshot.description}`);
  if (snapshot.headings.length) observations.push(`What stands out on the page: ${snapshot.headings.slice(0, 4).join('; ')}`);
  observations.push("We looked at your public homepage only — there's more we'll uncover once we dig in together.");
  return observations.slice(0, 4);
}

export function buildFallbackAiReport(
  contact: ReportContact,
  answers: Answers,
  result: BlueprintResult,
  snapshot: WebsiteSnapshot | null
): AiBlueprintReport {
  const evidence = [
    `The stated 90-day goal is "${answerLabel('primary_goal', answers.primary_goal)}."`,
    `The website was described as "${answerLabel('website_state', answers.website_state)}."`,
    `Lead capture currently relies on "${answerLabel('lead_capture', answers.lead_capture)}."`,
    `Repeat work was rated "${answerLabel('manual_work', answers.manual_work)}."`
  ];
  if (['products', 'hybrid'].includes(answers.business_model)) {
    evidence.push(`The company manages ${answerLabel('sku_count', answers.sku_count)} and rated product data "${answerLabel('catalog_quality', answers.catalog_quality)}."`);
  }

  const priorityActions = result.priorities.map((priority, index) => ({
    rank: index + 1,
    title: priority.title,
    whyNow: index === 0 ? 'This is where your momentum starts. It is the single biggest thing holding your business back right now, and fixing it first makes everything after it easier and more rewarding.' : 'This is what protects your win. Get it in place and the progress you just made keeps paying off instead of leaking away somewhere else in the customer journey.',
    actions: [
      priority.detail,
      index === 0 ? result.quickWin.detail : `Give the ${PILLAR_LABELS[priority.pillar].toLowerCase()} side one clear owner so nothing slips through the cracks.`,
      'Pick one result you actually care about and check it every week — small, steady wins compound fast.'
    ],
    expectedOutcome: index === 0 ? 'A business that feels focused instead of scattered — less wasted effort, real traction, and a foundation you can confidently build on.' : 'A smoother experience for your customers and your team, with fewer gaps where good opportunities used to disappear.',
    suggestedOwner: contact.role || (answers.team_size === 'solo' ? contact.name : 'You or a trusted lead'),
    timeframe: index === 0 ? 'Start in the next 30 days' : index === 1 ? 'Kick off by day 45' : 'Land it by day 90'
  }));

  const evidenceLog: AiBlueprintReport['evidenceLog'] = [
    { source: 'Reported', finding: `Your goal for the next 90 days: ${answerLabel('primary_goal', answers.primary_goal)}.` },
    { source: 'Reported', finding: `How leads reach you today: ${answerLabel('lead_capture', answers.lead_capture)}.` },
    { source: 'Reported', finding: `What happens after someone shows interest: ${answerLabel('follow_up', answers.follow_up)}.` },
    { source: 'Reported', finding: `You described your website as: ${answerLabel('website_state', answers.website_state)}.` }
  ];
  if (['products', 'hybrid'].includes(answers.business_model)) {
    evidenceLog.push({ source: 'Reported', finding: `Catalog size ${answerLabel('sku_count', answers.sku_count)}, with product data rated "${answerLabel('catalog_quality', answers.catalog_quality)}".` });
  }
  if (snapshot) {
    if (snapshot.title) evidenceLog.push({ source: 'Observed', finding: `Your homepage leads with "${snapshot.title}".` });
    if (snapshot.headings.length) evidenceLog.push({ source: 'Observed', finding: `The page emphasizes: ${snapshot.headings.slice(0, 3).join('; ')}.` });
  } else {
    evidenceLog.push({ source: 'Unknown', finding: 'We could not review your public website this time — an easy thing to look at together.' });
  }
  evidenceLog.push({ source: 'Inferred', finding: `${PILLAR_LABELS[result.primaryPillar]} is your clearest place to start, based on how your answers scored.` });
  evidenceLog.push({ source: 'Unknown', finding: 'Your analytics, lead-routing rules, and internal tools were not reviewed yet — checking them would sharpen this further.' });

  const projectNames: Record<string, string> = {
    website: 'Website Modernization Sprint',
    commerce: 'Catalog & Buying Experience Sprint',
    marketing: 'Lead Response & Follow-Up Sprint',
    technology: 'Operations & Automation Sprint'
  };

  return {
    reportTitle: `${contact.company} 90-Day Business Plan`,
    reportSubtitle: 'Your clearest next move, the momentum it unlocks, and exactly where to begin.',
    generatedFor: contact.company,
    executiveSummary: `Here is the good news for ${contact.company}: you do not need to fix everything at once. Your answers point to one clear place to start — ${PILLAR_LABELS[result.primaryPillar].toLowerCase()} — and that is where your fastest wins are hiding. ${result.profileSummary} The plan below moves in the right order: unlock the biggest opportunity first, connect the pieces around it, then launch and feel the difference. Start now and you build a lead that gets harder for competitors to close every week.`,
    companySnapshot: {
      whatTheySell: answerLabel('business_model', answers.business_model),
      statedGoal: answerLabel('primary_goal', answers.primary_goal),
      currentState: `${answerLabel('team_size', answers.team_size)}. Desired start: ${timelineLabel(contact.timeline)}.`,
      websiteObservations: websiteObservations(snapshot)
    },
    primaryDiagnosis: {
      headline: result.profile,
      summary: result.profileSummary,
      evidence: evidence.slice(0, 5),
      businessImpact: [
        'Right now your energy and budget get spread thin across too many small fixes, so none of them really move the needle.',
        'Your customers can feel the gaps — an uneven experience between your website, your follow-up, and how your business runs behind the scenes.',
        `The biggest, fastest win on the table is ${PILLAR_LABELS[result.primaryPillar].toLowerCase()} — get this right and everything else gets easier.`
      ],
      riskOfDelay: 'Every month you wait, more leads, more content, and more busywork pile onto the same shaky foundation. The problem does not stay the same size — it grows, and so does the effort to fix it later. The businesses that move first are already pulling ahead.'
    },
    priorityActions,
    roadmap: result.roadmap.map((phase, index) => ({
      period: index === 0 ? 'Days 1-30' : index === 1 ? 'Days 31-60' : 'Days 61-90',
      objective: phase.title,
      actions: phase.actions,
      proofOfProgress: index === 0 ? 'You have one clear owner, a starting point you can measure, and a first move everyone agrees on — no more guessing.' : index === 1 ? 'The improved experience is in front of real customers and leads, and you can already feel it working better.' : 'It is live, it is yours, and you have your first look at the difference it made.'
    })),
    metrics: [
      { name: 'Real inquiries from your website', whyItMatters: 'Tells you whether visitors actually get what you do and take the next step — the clearest sign your site is working for you.', startingPoint: 'Jot down how many you get in a typical month today.', targetDirection: 'More of the right people reaching out, booking, or buying.' },
      { name: 'How fast you follow up', whyItMatters: 'The quicker you respond, the more deals you win — speed is one of the easiest edges to grab.', startingPoint: 'Notice how long it usually takes to reply to a new lead.', targetDirection: 'Faster replies, and no lead left hanging.' },
      { name: 'Hours you get back each week', whyItMatters: 'Every hour spent on repetitive busywork is an hour not spent growing — this is time you can win back.', startingPoint: 'Ballpark the hours the team loses to repeat work now.', targetDirection: 'Less doing the same thing twice, more moving the business forward.' },
      { name: result.primaryPillar === 'commerce' ? 'How easy your products are to trust and buy' : 'Your headline 90-day win', whyItMatters: 'Keeps the whole effort pointed at a result you can actually see and feel.', startingPoint: result.primaryPillar === 'commerce' ? 'Look at how many products have the clear info and images buyers expect.' : 'Pick one number that matters — leads, sales, or time saved — and mark where you stand.', targetDirection: 'Steady, visible improvement every time you check in.' }
    ],
    evidenceLog: evidenceLog.slice(0, 8),
    urbanEyeRecommendation: {
      service: result.servicePath,
      projectName: projectNames[result.primaryPillar] || `${PILLAR_LABELS[result.primaryPillar]} Sprint`,
      outcome: `A focused first project that turns your ${PILLAR_LABELS[result.primaryPillar].toLowerCase()} priority into something real — clear ownership, a working solution, and a way to see it paying off.`,
      included: [
        `A quick review of where your ${PILLAR_LABELS[result.primaryPillar].toLowerCase()} stands today`,
        result.implementationOpportunity.detail,
        ...result.priorities.slice(0, 2).map((priority) => priority.detail),
        'A simple way to measure the result so you can feel the difference'
      ].slice(0, 6),
      notIncluded: [
        'A full rebuild of everything at once — we start where it matters most',
        'Long-term retainers or big commitments before you see value'
      ],
      duration: '2–3 weeks',
      firstStep: 'Book a 20-minute Blueprint Review with Urban Eye and we will map your first win together.'
    },
    assumptions: [
      'This plan is built from your answers and a quick look at your public homepage — the more we learn together, the sharper it gets.',
      'We have not looked inside your analytics, tools, or finances yet, so treat this as a confident starting direction, not the final word.',
      'We will lock in specific targets once we see your real numbers together.'
    ],
    disclaimer: 'This is a planning guide to help you decide where to start — a clear direction, not a promise of specific results. Before any big investment, we will confirm the details, timing, and feasibility with you.'
  };
}

function promptPayload(contact: ReportContact, answers: Answers, result: BlueprintResult, snapshot: WebsiteSnapshot | null) {
  const labeledAnswers = Object.fromEntries(
    Object.entries(answers).map(([key, value]) => [key, answerLabel(key, value)])
  );
  return {
    company: contact.company,
    contactRole: contact.role || 'Not provided',
    websiteProvided: contact.website || 'Not provided',
    desiredStart: timelineLabel(contact.timeline),
    questionnaire: labeledAnswers,
    fixedAssessment: result,
    websiteSnapshot: snapshot ? {
      url: snapshot.url,
      title: snapshot.title,
      description: snapshot.description,
      headings: snapshot.headings,
      visibleTextExcerpt: snapshot.text
    } : null
  };
}

export async function generateAiBlueprintReport(
  contact: ReportContact,
  answers: Answers,
  result: BlueprintResult,
  snapshot: WebsiteSnapshot | null
): Promise<AiReportGeneration> {
  const fallback = buildFallbackAiReport(contact, answers, result, snapshot);
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-5-mini';
  if (!apiKey) return { report: fallback, status: 'fallback_no_key', model: 'deterministic-fallback', websiteSnapshotUsed: Boolean(snapshot) };

  const client = new OpenAI({ apiKey, timeout: 45_000, maxRetries: 1 });
  try {
    const response = await client.responses.create({
      model,
      store: false,
      reasoning: { effort: 'low' },
      instructions: [
        "You are the team at Urban Eye by Brooks & Co. — a modernization partner that helps businesses look sharper, sell smarter, market with intent, and run smoother.",
        "Write this 90-day plan like a sharp, encouraging human expert talking with a business owner who respects their time. Warm, confident, and genuinely exciting — a plan they want to lean into, never a technical audit or a dry checklist.",
        "Make them feel the opportunity. Paint a clear picture of what 90 focused days could unlock for their business, and let them feel what it quietly costs to keep waiting while sharper competitors pull ahead. Give them real momentum and a reason to start now.",
        SALES_MARKETING_PRINCIPLES,
        "The fixedAssessment scores, ranking, urgency, and recommended service are authoritative. Never change them — your job is to bring them to life and make them compelling, not to re-decide them.",
        "Use only the questionnaire answers and the website snapshot provided. Never invent customers, revenue, staff, products, technology, results, or website findings. The energy and urgency must come from vivid framing and real stakes — never from made-up numbers, savings, percentages, or performance claims.",
        "When something was not provided, mention it naturally and frame it as an easy early win to lock down together — never as a cold 'not provided / requires validation' note.",
        "Stay in the owner's language. Turn anything technical into what it means for their customers, their reputation, their time, and their money. No jargon, no system-speak.",
        "Do not include prices, and do not make legal, financial, security, accessibility, or compliance guarantees.",
        "Website observations must trace to the supplied snapshot, and should gently note that only the public homepage was reviewed.",
        "Make the headline (primaryDiagnosis.headline) specific to THIS company and its exact failure point — name the company and the concrete gap, not a generic phrase that could fit any business. Prefer something falsifiable, e.g. 'Acme is losing leads between inquiry and follow-up,' over 'Leads are slipping through.'",
        "Fill evidenceLog with 4-8 concrete findings, each honestly labeled by source: 'Reported' for anything the questionnaire stated, 'Observed' for anything visible on the public homepage snapshot, 'Inferred' for your interpretation of that evidence, and 'Unknown' for things that would need analytics or internal access to confirm. Never label an inference as reported or observed — this is how the reader learns to trust the report.",
        "Be adaptive, not uniform. Deeply expand only the highest-scoring pillar, plus the second-highest when it is within about 15-20 points of the top; treat those as one connected story (primary bottleneck and supporting bottleneck). Give every other pillar just a sentence, and for clearly low-scoring pillars say plainly that it is not a current constraint and is not part of the first 90 days.",
        "Make urbanEyeRecommendation a specific, named first project (projectName), not a service category: a concrete outcome, a clear 'included' list, an honest 'notIncluded' list that sets expectations, a realistic duration, and a firstStep CTA that states the action and the time commitment (a short Blueprint Review).",
        "Make it substantial and genuinely useful, but never repeat the same point across sections. Every line should earn its place and pull them one step closer to working with Urban Eye."
      ].join('\n'),
      input: JSON.stringify(promptPayload(contact, answers, result, snapshot)),
      text: {
        verbosity: 'medium',
        format: {
          type: 'json_schema',
          name: 'urban_eye_blueprint_report',
          strict: true,
          schema: reportSchema
        }
      }
    });

    const parsed = JSON.parse(response.output_text) as AiBlueprintReport;
    return { report: parsed, status: 'generated', model, websiteSnapshotUsed: Boolean(snapshot) };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AI report error';
    console.error('AI report generation failed', message);
    return { report: fallback, status: 'fallback_error', model: 'deterministic-fallback', websiteSnapshotUsed: Boolean(snapshot), error: message.slice(0, 500) };
  }
}
