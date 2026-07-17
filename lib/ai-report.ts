import OpenAI from 'openai';
import { Answers, BlueprintResult, PILLAR_LABELS, QUESTIONS } from '@/lib/assessment';
import { WebsiteSnapshot } from '@/lib/website-snapshot';

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
      'No usable public website snapshot was available, so website-specific observations require a live review.',
      'The recommendations below rely on the questionnaire and the scored business priorities.'
    ];
  }
  const observations = [];
  if (snapshot.title) observations.push(`Homepage title: ${snapshot.title}`);
  if (snapshot.description) observations.push(`Homepage description: ${snapshot.description}`);
  if (snapshot.headings.length) observations.push(`Visible page themes include: ${snapshot.headings.slice(0, 4).join('; ')}`);
  observations.push('Only the public homepage snapshot was reviewed; deeper pages, analytics, and internal systems were not inspected.');
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
    whyNow: index === 0 ? 'This is the highest-scoring constraint in the assessment and should be addressed before adding more complexity.' : 'This supports the primary fix and reduces the chance that gains are lost elsewhere in the customer journey.',
    actions: [
      priority.detail,
      index === 0 ? result.quickWin.detail : `Document the current ${PILLAR_LABELS[priority.pillar].toLowerCase()} process and assign one owner.`,
      'Choose one measurable result and review it every week.'
    ],
    expectedOutcome: index === 0 ? 'A clearer first priority, less wasted effort, and a stronger base for the next phase.' : 'A more consistent customer and team experience with fewer gaps between systems.',
    suggestedOwner: contact.role || (answers.team_size === 'solo' ? contact.name : 'Business owner or functional lead'),
    timeframe: index === 0 ? 'Start in the first 30 days' : index === 1 ? 'Begin by day 45' : 'Complete or validate by day 90'
  }));

  return {
    reportTitle: `${contact.company} 90-Day Business Plan`,
    reportSubtitle: 'A practical plan for what to fix first, what to do next, and how to measure progress.',
    generatedFor: contact.company,
    executiveSummary: `${contact.company}'s assessment points to ${PILLAR_LABELS[result.primaryPillar].toLowerCase()} as the first constraint to fix. ${result.profileSummary} The plan below keeps the work sequenced: solve the primary bottleneck, connect the supporting systems, then launch and measure the result.`,
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
        'Time and budget can be spread across too many disconnected fixes.',
        'Prospects may receive an uneven experience between the website, follow-up, product information, and internal process.',
        `The strongest near-term opportunity is to improve ${PILLAR_LABELS[result.primaryPillar].toLowerCase()} before scaling activity.`
      ],
      riskOfDelay: 'Waiting adds more leads, content, product records, and manual work to the same weak foundation, making the eventual cleanup larger.'
    },
    priorityActions,
    roadmap: result.roadmap.map((phase, index) => ({
      period: index === 0 ? 'Days 1-30' : index === 1 ? 'Days 31-60' : 'Days 61-90',
      objective: phase.title,
      actions: phase.actions,
      proofOfProgress: index === 0 ? 'One owner, one baseline metric, and one approved first-phase scope.' : index === 1 ? 'The revised workflow or experience is tested with real users, leads, or records.' : 'The improvement is live and its first performance review is complete.'
    })),
    metrics: [
      { name: 'Qualified actions from the website', whyItMatters: 'Shows whether visitors understand the offer and take the intended next step.', startingPoint: 'Measure the current monthly count before changes.', targetDirection: 'Increase qualified form submissions, calls, bookings, or purchases.' },
      { name: 'Lead response time', whyItMatters: 'Fast, consistent follow-up reduces lost opportunities.', startingPoint: 'Measure median time from inquiry to first useful reply.', targetDirection: 'Reduce the median and the number of leads with no response.' },
      { name: 'Manual hours per week', whyItMatters: 'Reveals where disconnected tools and repeated entry consume capacity.', startingPoint: 'Estimate hours for the selected workflow.', targetDirection: 'Reduce repeat entry, handoffs, and status checking.' },
      { name: result.primaryPillar === 'commerce' ? 'Catalog completeness' : 'Primary project outcome', whyItMatters: 'Keeps the first 90-day effort tied to a visible business result.', startingPoint: result.primaryPillar === 'commerce' ? 'Sample the percentage of records with required titles, attributes, images, and categories.' : 'Set a baseline tied to leads, sales, time saved, or customer completion.', targetDirection: 'Improve the selected measure every review cycle.' }
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
      firstStep: `Review this plan with Urban Eye and confirm the first ${PILLAR_LABELS[result.primaryPillar].toLowerCase()} outcome, owner, and 30-day scope.`
    },
    assumptions: [
      'Recommendations are based on questionnaire responses and a limited public homepage snapshot when available.',
      'No analytics, CRM records, financial data, customer interviews, or internal system access were reviewed.',
      'Targets should be finalized after baseline data and technical constraints are confirmed.'
    ],
    disclaimer: 'This AI-assisted planning report is a directional business document, not a guarantee of results. Validate priorities, costs, timing, compliance, and technical feasibility before implementation.'
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
        'You are Urban Eye, a practical business modernization consultancy.',
        'Create a detailed, useful 90-day report for the named company.',
        'The fixedAssessment scores, ranking, urgency, and recommended service are authoritative. Do not change them.',
        'Use only the questionnaire and website snapshot supplied. Never invent customers, revenue, staff, products, technology, performance data, or website findings.',
        'When evidence is missing, state that it was not provided or requires validation.',
        'Write in direct plain English. Use concrete actions, owners, timing, and measures. Avoid hype, jargon, and vague claims.',
        'Do not include prices. Do not make legal, financial, security, accessibility, or compliance guarantees.',
        'Website observations must be traceable to the supplied snapshot and must acknowledge that only a limited public snapshot was reviewed.',
        'Make the report substantial enough to be useful, but do not repeat the same point across sections.'
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
