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
  urbanEyeRecommendation: {
    service: string;
    engagement: string;
    scope: string[];
    deliverables: string[];
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
    'primaryDiagnosis', 'priorityActions', 'roadmap', 'metrics', 'urbanEyeRecommendation',
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
    urbanEyeRecommendation: {
      type: 'object', additionalProperties: false,
      required: ['service', 'engagement', 'scope', 'deliverables', 'firstStep'],
      properties: {
        service: { type: 'string' },
        engagement: { type: 'string' },
        scope: { type: 'array', minItems: 3, maxItems: 5, items: { type: 'string' } },
        deliverables: { type: 'array', minItems: 3, maxItems: 5, items: { type: 'string' } },
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
    urbanEyeRecommendation: {
      service: result.servicePath,
      engagement: result.implementationOpportunity.title,
      scope: [result.implementationOpportunity.detail, ...result.priorities.slice(0, 2).map((priority) => priority.detail)].slice(0, 5),
      deliverables: [
        'Current-state review and prioritized implementation scope',
        'Approved content, data, workflow, or technical requirements',
        'Built and tested first-phase solution',
        'Launch checklist and measurement plan'
      ],
      firstStep: `Bring this plan to Urban Eye and let's map out your first ${PILLAR_LABELS[result.primaryPillar].toLowerCase()} win together — who owns it, what it looks like, and how we get there in the first 30 days.`
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
