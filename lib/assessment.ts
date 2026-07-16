export type Pillar = "website" | "commerce" | "marketing" | "technology";

export type Answers = Record<string, string>;

export type Option = {
  value: string;
  label: string;
  help?: string;
};

export type Question = {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  options: Option[];
  showWhen?: (answers: Answers) => boolean;
};

export type BlueprintResult = {
  profile: string;
  profileSummary: string;
  primaryPillar: Pillar;
  secondaryPillar: Pillar;
  scores: Record<Pillar, number>;
  priorities: Array<{ pillar: Pillar; title: string; detail: string }>;
  quickWin: { title: string; detail: string };
  implementationOpportunity: { title: string; detail: string };
  roadmap: Array<{ period: "30 days" | "60 days" | "90 days"; title: string; actions: string[] }>;
  servicePath: string;
  serviceReason: string;
  urgency: "Focused" | "Important" | "Immediate";
};

export const PILLAR_LABELS: Record<Pillar, string> = {
  website: "Website",
  commerce: "Commerce",
  marketing: "Sales & Marketing",
  technology: "Technology & AI"
};

export const QUESTIONS: Question[] = [
  {
    id: "business_model",
    eyebrow: "Your business",
    title: "How does your business primarily create revenue?",
    description: "This changes which questions and recommendations matter most.",
    options: [
      { value: "services", label: "Services", help: "Professional, local, creative, technical, or field services" },
      { value: "products", label: "Products", help: "Physical or digital products sold through a catalog" },
      { value: "hybrid", label: "Products and services", help: "A mixed model with both offers" },
      { value: "other", label: "Another model", help: "Membership, nonprofit, marketplace, or still evolving" }
    ]
  },
  {
    id: "team_size",
    eyebrow: "Your business",
    title: "What best describes the team operating the business?",
    options: [
      { value: "solo", label: "Owner-operated" },
      { value: "2-10", label: "2–10 people" },
      { value: "11-50", label: "11–50 people" },
      { value: "51-250", label: "51–250 people" },
      { value: "250+", label: "More than 250 people" }
    ]
  },
  {
    id: "primary_goal",
    eyebrow: "Your business",
    title: "What would make the next 90 days feel meaningfully better?",
    options: [
      { value: "look_credible", label: "Present the business more professionally" },
      { value: "more_leads", label: "Generate and convert more leads" },
      { value: "sell_online", label: "Make products or services easier to buy" },
      { value: "launch", label: "Launch or replace a digital experience" },
      { value: "save_time", label: "Reduce repetitive work and manual handoffs" },
      { value: "connect_systems", label: "Connect tools, data, and reporting" }
    ]
  },
  {
    id: "website_state",
    eyebrow: "Website",
    title: "Which statement is closest to your current website?",
    options: [
      { value: "strong", label: "It represents us well and supports growth" },
      { value: "adequate", label: "It works, but feels generic or underdeveloped" },
      { value: "outdated", label: "It looks outdated or no longer fits the business" },
      { value: "confusing", label: "Visitors struggle to understand what we offer" },
      { value: "missing", label: "We do not have a useful website yet" }
    ]
  },
  {
    id: "conversion_path",
    eyebrow: "Website",
    title: "How clear is the next step for a visitor?",
    options: [
      { value: "clear", label: "Very clear, measurable, and tested" },
      { value: "somewhat", label: "There is a CTA, but the path is inconsistent" },
      { value: "weak", label: "Visitors mostly have to figure it out themselves" },
      { value: "unknown", label: "We do not know what visitors do after arriving" }
    ]
  },
  {
    id: "lead_capture",
    eyebrow: "Sales & marketing",
    title: "How are new inquiries and leads captured today?",
    options: [
      { value: "connected", label: "Forms, CRM, source tracking, and ownership are connected" },
      { value: "forms", label: "Website forms or booking tools capture most inquiries" },
      { value: "inbox", label: "Email, phone, social messages, or spreadsheets" },
      { value: "inconsistent", label: "There is no consistent lead-capture process" }
    ]
  },
  {
    id: "follow_up",
    eyebrow: "Sales & marketing",
    title: "What happens after someone shows interest?",
    options: [
      { value: "automated", label: "They receive timely, tracked follow-up" },
      { value: "manual_good", label: "A person follows up reliably" },
      { value: "manual_slow", label: "Follow-up depends on availability" },
      { value: "lost", label: "Some opportunities are missed or forgotten" }
    ]
  },
  {
    id: "marketing_system",
    eyebrow: "Sales & marketing",
    title: "How coordinated are your website, campaigns, email, and sales materials?",
    options: [
      { value: "coordinated", label: "They share one strategy, message, and measurement system" },
      { value: "partial", label: "Some pieces work together" },
      { value: "fragmented", label: "The message and execution vary by channel" },
      { value: "inactive", label: "Marketing is mostly inactive or reactive" }
    ]
  },
  {
    id: "systems_state",
    eyebrow: "Technology & AI",
    title: "How well do your core tools and business data work together?",
    options: [
      { value: "connected", label: "Core systems share reliable data and workflows" },
      { value: "some", label: "A few integrations exist, with manual gaps" },
      { value: "silos", label: "Information lives in separate tools and spreadsheets" },
      { value: "unclear", label: "We are not sure what should connect" }
    ]
  },
  {
    id: "manual_work",
    eyebrow: "Technology & AI",
    title: "How much time is lost to repetitive work or duplicate data entry?",
    options: [
      { value: "low", label: "Very little" },
      { value: "some", label: "A few hours each week" },
      { value: "high", label: "A meaningful amount every week" },
      { value: "critical", label: "It actively limits capacity or customer service" }
    ]
  },
  {
    id: "sku_count",
    eyebrow: "Commerce",
    title: "Approximately how many products or SKUs do you manage?",
    showWhen: (answers) => ["products", "hybrid"].includes(answers.business_model),
    options: [
      { value: "under_100", label: "Under 100" },
      { value: "100_500", label: "100–500" },
      { value: "500_5000", label: "500–5,000" },
      { value: "5000_20000", label: "5,000–20,000" },
      { value: "20000_plus", label: "More than 20,000" }
    ]
  },
  {
    id: "catalog_quality",
    eyebrow: "Commerce",
    title: "How consistent is your product or catalog information?",
    showWhen: (answers) => ["products", "hybrid"].includes(answers.business_model),
    options: [
      { value: "clean", label: "Structured, complete, and governed" },
      { value: "mixed", label: "Quality varies by brand or category" },
      { value: "messy", label: "Titles, descriptions, attributes, and images are inconsistent" },
      { value: "vendor_only", label: "We depend heavily on vendor files or PDFs" }
    ]
  },
  {
    id: "product_discovery",
    eyebrow: "Commerce",
    title: "Can buyers reliably find and compare the right products?",
    showWhen: (answers) => ["products", "hybrid"].includes(answers.business_model),
    options: [
      { value: "strong", label: "Search, categories, filters, and comparison work well" },
      { value: "uneven", label: "Some categories work better than others" },
      { value: "weak", label: "Search or filters frequently produce poor results" },
      { value: "unknown", label: "We have not tested the buying journey" }
    ]
  },
  {
    id: "commerce_timing",
    eyebrow: "Commerce",
    title: "Is a catalog launch, migration, or major cleanup approaching?",
    showWhen: (answers) => ["products", "hybrid"].includes(answers.business_model),
    options: [
      { value: "none", label: "No major initiative is planned" },
      { value: "6_plus", label: "More than six months away" },
      { value: "3_6", label: "Within three to six months" },
      { value: "under_3", label: "Within three months or already underway" }
    ]
  }
];

const SCORE_MAP: Record<string, Partial<Record<Pillar, number>>> = {
  look_credible: { website: 4, marketing: 1 },
  more_leads: { marketing: 4, website: 2, technology: 1 },
  sell_online: { commerce: 4, website: 2 },
  launch: { website: 3, commerce: 2, technology: 2 },
  save_time: { technology: 4, marketing: 1 },
  connect_systems: { technology: 4, marketing: 1, commerce: 1 },
  adequate: { website: 2 }, outdated: { website: 4 }, confusing: { website: 4, marketing: 1 }, missing: { website: 5 },
  somewhat: { website: 2, marketing: 1 }, weak: { website: 4, marketing: 2 }, unknown: { website: 3, marketing: 2 },
  forms: { marketing: 2, technology: 1 }, inbox: { marketing: 4, technology: 2 }, inconsistent: { marketing: 5, technology: 2 },
  manual_good: { marketing: 1 }, manual_slow: { marketing: 3, technology: 2 }, lost: { marketing: 5, technology: 3 },
  partial: { marketing: 2 }, fragmented: { marketing: 4 }, inactive: { marketing: 4 },
  some: { technology: 2 }, silos: { technology: 5 }, unclear: { technology: 3 },
  low: { technology: 0 }, high: { technology: 4 }, critical: { technology: 5 },
  under_100: { commerce: 1 }, "100_500": { commerce: 2 }, "500_5000": { commerce: 3 }, "5000_20000": { commerce: 4 }, "20000_plus": { commerce: 5 },
  clean: { commerce: 0 }, mixed: { commerce: 2 }, messy: { commerce: 5 }, vendor_only: { commerce: 4 },
  strong: {}, uneven: { commerce: 2 }, weak_product: { commerce: 4 }, unknown_product: { commerce: 3 },
  none: {}, "6_plus": { commerce: 1 }, "3_6": { commerce: 3 }, under_3: { commerce: 5, technology: 1 }
};

function addScore(scores: Record<Pillar, number>, value: string, questionId: string) {
  let key = value;
  if (questionId === "product_discovery" && value === "weak") key = "weak_product";
  if (questionId === "product_discovery" && value === "unknown") key = "unknown_product";
  const additions = SCORE_MAP[key] || {};
  (Object.keys(additions) as Pillar[]).forEach((pillar) => {
    scores[pillar] += additions[pillar] || 0;
  });
}

function normalize(scores: Record<Pillar, number>): Record<Pillar, number> {
  const maxes: Record<Pillar, number> = { website: 15, commerce: 19, marketing: 18, technology: 19 };
  return Object.fromEntries(
    (Object.keys(scores) as Pillar[]).map((pillar) => [pillar, Math.min(100, Math.round((scores[pillar] / maxes[pillar]) * 100))])
  ) as Record<Pillar, number>;
}

function priorityFor(pillar: Pillar, answers: Answers) {
  if (pillar === "website") {
    if (answers.website_state === "missing") return { pillar, title: "Establish the digital foundation", detail: "Create a focused website that explains the offer, builds trust, and gives every visitor a clear next step." };
    if (answers.website_state === "confusing") return { pillar, title: "Clarify the customer journey", detail: "Restructure the message, page hierarchy, and calls to action around what customers need to understand and do." };
    return { pillar, title: "Modernize the website experience", detail: "Bring the visual presentation, mobile experience, conversion path, and content structure in line with the business you operate today." };
  }
  if (pillar === "commerce") {
    if (["messy", "vendor_only"].includes(answers.catalog_quality)) return { pillar, title: "Build a governed product-data foundation", detail: "Standardize titles, descriptions, attributes, categories, images, and source verification before scaling the storefront." };
    if (["weak", "unknown"].includes(answers.product_discovery)) return { pillar, title: "Improve product discovery", detail: "Test search, category paths, filters, product families, and comparison details against real buyer language." };
    return { pillar, title: "Strengthen the digital buying experience", detail: "Connect product information, navigation, merchandising, and conversion requirements into one reliable commerce journey." };
  }
  if (pillar === "marketing") {
    if (["lost", "manual_slow"].includes(answers.follow_up)) return { pillar, title: "Create a reliable lead-response system", detail: "Define ownership, response expectations, automated confirmations, source tracking, and a visible follow-up pipeline." };
    if (["fragmented", "inactive"].includes(answers.marketing_system)) return { pillar, title: "Unify the growth message", detail: "Connect the website, campaigns, email, sales materials, and reporting around one offer and measurable customer path." };
    return { pillar, title: "Turn attention into measurable opportunities", detail: "Improve lead capture, campaign alignment, follow-up, and conversion reporting instead of treating each channel as separate work." };
  }
  if (["silos", "unclear"].includes(answers.systems_state)) return { pillar, title: "Connect the operating system", detail: "Map the handoffs between forms, inboxes, CRM, project tools, reporting, and customer communication before choosing new software." };
  return { pillar, title: "Automate the highest-friction work", detail: "Prioritize repeatable workflows where automation or practical AI can remove duplicate entry, delays, and inconsistent execution." };
}

const QUICK_WINS: Record<Pillar, { title: string; detail: string }> = {
  website: { title: "Rewrite the first screen around one customer action", detail: "Use one clear audience, one business outcome, one proof point, and one primary call to action before adding more pages or features." },
  commerce: { title: "Standardize one high-value product family", detail: "Choose a representative category and define the title pattern, required attributes, description structure, images, and category path that every related SKU should follow." },
  marketing: { title: "Create one visible lead-response rule", detail: "Assign every inquiry an owner, expected response time, source label, and next action so promising conversations cannot disappear into an inbox." },
  technology: { title: "Document one manual workflow end to end", detail: "List each trigger, person, tool, decision, and duplicate entry. Automate only after the real process and exceptions are visible." }
};

const IMPLEMENTATION: Record<Pillar, { title: string; detail: string; service: string }> = {
  website: { title: "Website redesign and conversion system", detail: "Strategy, messaging, UX, responsive design, development, forms, analytics, and launch support organized around a clearer customer journey.", service: "Website Redesign" },
  commerce: { title: "PIM and eCommerce modernization", detail: "Product-data cleanup, taxonomy, attributes, search, product-family organization, buyer-facing content, migration readiness, and storefront improvements.", service: "PIM & eCommerce Optimization" },
  marketing: { title: "Sales and marketing system", detail: "Offer positioning, campaign assets, lead capture, lifecycle follow-up, sales enablement, CRM workflow, and practical performance reporting.", service: "Sales & Marketing Systems" },
  technology: { title: "Technology and AI implementation", detail: "Workflow design, integrations, dashboards, portals, automation, and controlled AI assistance tied to an actual operating need.", service: "Technology & AI Implementation" }
};

export function evaluateBlueprint(answers: Answers): BlueprintResult {
  const raw: Record<Pillar, number> = { website: 0, commerce: 0, marketing: 0, technology: 0 };
  QUESTIONS.forEach((question) => {
    const value = answers[question.id];
    if (value) addScore(raw, value, question.id);
  });

  if (!["products", "hybrid"].includes(answers.business_model)) raw.commerce = Math.min(raw.commerce, 4);
  const scores = normalize(raw);
  const ranked = (Object.keys(scores) as Pillar[]).sort((a, b) => scores[b] - scores[a]);
  const [primaryPillar, secondaryPillar] = ranked;
  const priorities = ranked.slice(0, 3).map((pillar) => priorityFor(pillar, answers));
  const implementation = IMPLEMENTATION[primaryPillar];
  const topScore = scores[primaryPillar];
  const urgency: BlueprintResult["urgency"] = topScore >= 70 || answers.commerce_timing === "under_3" ? "Immediate" : topScore >= 45 ? "Important" : "Focused";

  let profile = "Connected Growth Foundation";
  let profileSummary = "The business will benefit most from aligning its customer experience, growth process, and internal systems around a shared 90-day priority.";
  if (primaryPillar === "website") {
    profile = "Customer Experience Reset";
    profileSummary = "The website is the highest-leverage constraint. Improving how the business is understood and how visitors move toward action should come before adding more disconnected tactics.";
  } else if (primaryPillar === "commerce") {
    profile = "Commerce Modernization";
    profileSummary = "The largest opportunity sits between product information and the buying experience. Clean structure and stronger discovery should lead the modernization sequence.";
  } else if (primaryPillar === "marketing") {
    profile = "Growth System Alignment";
    profileSummary = "Demand may exist, but capture, messaging, follow-up, or measurement is not operating as one dependable system.";
  } else if (primaryPillar === "technology") {
    profile = "Connected Operations";
    profileSummary = "Manual work and disconnected tools are limiting capacity. The next step is to design the operating workflow before introducing more automation or AI.";
  }

  const first = priorities[0];
  const second = priorities[1];
  const third = priorities[2];
  return {
    profile,
    profileSummary,
    primaryPillar,
    secondaryPillar,
    scores,
    priorities,
    quickWin: QUICK_WINS[primaryPillar],
    implementationOpportunity: { title: implementation.title, detail: implementation.detail },
    roadmap: [
      { period: "30 days", title: "Define and stabilize", actions: [first.detail, QUICK_WINS[primaryPillar].detail, "Choose one owner and one measurable outcome for the modernization effort."] },
      { period: "60 days", title: "Design and connect", actions: [second.detail, "Document the required content, data, workflow, and integration decisions before implementation.", "Prototype or pilot the highest-risk part with real users or records."] },
      { period: "90 days", title: "Implement and measure", actions: [third.detail, implementation.detail, "Track adoption, conversion, time saved, data quality, or another outcome tied to the original constraint."] }
    ],
    servicePath: implementation.service,
    serviceReason: `${PILLAR_LABELS[primaryPillar]} is currently the strongest opportunity, with ${PILLAR_LABELS[secondaryPillar].toLowerCase()} as the most important supporting workstream.`,
    urgency
  };
}

export function getVisibleQuestions(answers: Answers) {
  return QUESTIONS.filter((question) => !question.showWhen || question.showWhen(answers));
}

export function isAssessmentComplete(answers: Answers) {
  return getVisibleQuestions(answers).every((question) => Boolean(answers[question.id]));
}
