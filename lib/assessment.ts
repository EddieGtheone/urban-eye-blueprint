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
    title: "What does your business sell?",
    options: [
      { value: "services", label: "Services", help: "Professional, local, creative, technical, or field work" },
      { value: "products", label: "Products", help: "Physical or digital products" },
      { value: "hybrid", label: "Products and services", help: "Both" },
      { value: "other", label: "Something else", help: "Membership, nonprofit, marketplace, or still evolving" }
    ]
  },
  {
    id: "team_size",
    eyebrow: "Your business",
    title: "How many people work in the business?",
    options: [
      { value: "solo", label: "Just me" },
      { value: "2-10", label: "2–10 people" },
      { value: "11-50", label: "11–50 people" },
      { value: "51-250", label: "51–250 people" },
      { value: "250+", label: "250+ people" }
    ]
  },
  {
    id: "primary_goal",
    eyebrow: "Your business",
    title: "What matters most in the next 90 days?",
    options: [
      { value: "look_credible", label: "Look more professional" },
      { value: "more_leads", label: "Get more leads" },
      { value: "sell_online", label: "Make it easier to buy" },
      { value: "launch", label: "Launch or replace a site or tool" },
      { value: "save_time", label: "Cut manual work" },
      { value: "connect_systems", label: "Connect tools and data" }
    ]
  },
  {
    id: "website_state",
    eyebrow: "Website",
    title: "Which best describes your website?",
    options: [
      { value: "strong", label: "It works well and brings in business" },
      { value: "adequate", label: "It works, but feels basic" },
      { value: "outdated", label: "It looks outdated" },
      { value: "confusing", label: "People do not understand what we offer" },
      { value: "missing", label: "We need a new website" }
    ]
  },
  {
    id: "conversion_path",
    eyebrow: "Website",
    title: "Do visitors know what to do next?",
    options: [
      { value: "clear", label: "Yes, and we track it" },
      { value: "somewhat", label: "Usually, but the path is uneven" },
      { value: "weak", label: "Not really" },
      { value: "unknown", label: "We do not know" }
    ]
  },
  {
    id: "lead_capture",
    eyebrow: "Sales & marketing",
    title: "Where do new leads go?",
    options: [
      { value: "connected", label: "Forms and CRM, with tracking" },
      { value: "forms", label: "Website forms or booking tools" },
      { value: "inbox", label: "Email, phone, social, or spreadsheets" },
      { value: "inconsistent", label: "There is no set process" }
    ]
  },
  {
    id: "follow_up",
    eyebrow: "Sales & marketing",
    title: "How fast do leads get a reply?",
    options: [
      { value: "automated", label: "Right away, with tracking" },
      { value: "manual_good", label: "A person replies on time" },
      { value: "manual_slow", label: "It depends on who is available" },
      { value: "lost", label: "Some leads get missed" }
    ]
  },
  {
    id: "marketing_system",
    eyebrow: "Sales & marketing",
    title: "Do your website, email, ads, and sales materials say the same thing?",
    options: [
      { value: "coordinated", label: "Yes" },
      { value: "partial", label: "Mostly" },
      { value: "fragmented", label: "Not really" },
      { value: "inactive", label: "We market only when needed" }
    ]
  },
  {
    id: "systems_state",
    eyebrow: "Technology & AI",
    title: "Do your tools share data?",
    options: [
      { value: "connected", label: "Yes, reliably" },
      { value: "some", label: "Some do; some do not" },
      { value: "silos", label: "No, data sits in separate tools" },
      { value: "unclear", label: "We are not sure" }
    ]
  },
  {
    id: "manual_work",
    eyebrow: "Technology & AI",
    title: "How much time goes to repeat work?",
    options: [
      { value: "low", label: "Almost none" },
      { value: "some", label: "A few hours a week" },
      { value: "high", label: "Many hours a week" },
      { value: "critical", label: "It limits growth or service" }
    ]
  },
  {
    id: "sku_count",
    eyebrow: "Commerce",
    title: "How many products or SKUs do you manage?",
    showWhen: (answers) => ["products", "hybrid"].includes(answers.business_model),
    options: [
      { value: "under_100", label: "Under 100" },
      { value: "100_500", label: "100–500" },
      { value: "500_5000", label: "500–5,000" },
      { value: "5000_20000", label: "5,000–20,000" },
      { value: "20000_plus", label: "20,000+" }
    ]
  },
  {
    id: "catalog_quality",
    eyebrow: "Commerce",
    title: "How clean is your product data?",
    showWhen: (answers) => ["products", "hybrid"].includes(answers.business_model),
    options: [
      { value: "clean", label: "Clean and consistent" },
      { value: "mixed", label: "Mixed by brand or category" },
      { value: "messy", label: "Titles, specs, and images are inconsistent" },
      { value: "vendor_only", label: "We mostly use vendor files or PDFs" }
    ]
  },
  {
    id: "product_discovery",
    eyebrow: "Commerce",
    title: "Can buyers find the right product?",
    showWhen: (answers) => ["products", "hybrid"].includes(answers.business_model),
    options: [
      { value: "strong", label: "Yes, search and filters work" },
      { value: "uneven", label: "Only in some categories" },
      { value: "weak", label: "No, search or filters often fail" },
      { value: "unknown", label: "We have not tested it" }
    ]
  },
  {
    id: "commerce_timing",
    eyebrow: "Commerce",
    title: "Is a catalog launch or cleanup coming?",
    showWhen: (answers) => ["products", "hybrid"].includes(answers.business_model),
    options: [
      { value: "none", label: "No" },
      { value: "6_plus", label: "More than 6 months away" },
      { value: "3_6", label: "Within 3–6 months" },
      { value: "under_3", label: "Within 3 months or underway" }
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
    if (answers.website_state === "missing") return { pillar, title: "Build the website customers need", detail: "Create a site that explains what you sell, proves you can deliver, and gives visitors one clear next step." };
    if (answers.website_state === "confusing") return { pillar, title: "Make the offer easy to understand", detail: "Rewrite the message and page order so visitors know what you do and what to do next." };
    return { pillar, title: "Make the website match the business", detail: "Update the design, mobile experience, content, and conversion path to fit the company you run today." };
  }
  if (pillar === "commerce") {
    if (["messy", "vendor_only"].includes(answers.catalog_quality)) return { pillar, title: "Clean the product data first", detail: "Standardize titles, descriptions, specs, categories, and images before adding more products." };
    if (["weak", "unknown"].includes(answers.product_discovery)) return { pillar, title: "Help buyers find the right product", detail: "Fix search, categories, filters, product families, and comparison details using real buyer terms." };
    return { pillar, title: "Make products easier to buy", detail: "Connect product data, navigation, merchandising, and checkout into one clear buying path." };
  }
  if (pillar === "marketing") {
    if (["lost", "manual_slow"].includes(answers.follow_up)) return { pillar, title: "Stop losing leads", detail: "Give every lead an owner, response deadline, source, and next step." };
    if (["fragmented", "inactive"].includes(answers.marketing_system)) return { pillar, title: "Use one message everywhere", detail: "Align the website, email, ads, and sales materials around one offer and one customer action." };
    return { pillar, title: "Turn attention into leads", detail: "Connect lead capture, follow-up, campaigns, and reporting so you can see what creates revenue." };
  }
  if (["silos", "unclear"].includes(answers.systems_state)) return { pillar, title: "Connect the tools you already use", detail: "Map how forms, email, CRM, projects, and reports should pass information before buying more software." };
  return { pillar, title: "Automate the work that repeats", detail: "Start with one workflow where automation can remove duplicate entry, delays, or missed steps." };
}

const QUICK_WINS: Record<Pillar, { title: string; detail: string }> = {
  website: { title: "Rewrite the top of your homepage", detail: "State who you help, what result you create, one proof point, and one action visitors should take." },
  commerce: { title: "Clean one important product family", detail: "Set the title format, required specs, description, images, and category path. Use it as the model for the rest." },
  marketing: { title: "Set one lead-response rule", detail: "Give every new lead an owner, a reply deadline, a source, and a next step." },
  technology: { title: "Map one manual workflow", detail: "List the trigger, people, tools, decisions, and repeat entries. Then choose what to automate." }
};

const IMPLEMENTATION: Record<Pillar, { title: string; detail: string; service: string }> = {
  website: { title: "Website redesign", detail: "A clearer message, better design, mobile-ready pages, stronger calls to action, forms, analytics, and launch support.", service: "Website Redesign" },
  commerce: { title: "PIM and eCommerce cleanup", detail: "Clean product data, categories, attributes, search, product families, buyer-facing content, and migration-ready exports.", service: "PIM & eCommerce Optimization" },
  marketing: { title: "Sales and marketing system", detail: "A clear offer, stronger lead capture, faster follow-up, useful sales assets, CRM workflow, and simple reporting.", service: "Sales & Marketing Systems" },
  technology: { title: "Technology and AI implementation", detail: "Connected workflows, integrations, dashboards, portals, automation, and practical AI built around real work.", service: "Technology & AI Implementation" }
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

  let profile = "Too many priorities, no clear first move";
  let profileSummary = "Your needs are spread across several areas. Pick one bottleneck, fix it, then move to the next.";
  if (primaryPillar === "website") {
    profile = "Your website is the bottleneck";
    profileSummary = "Visitors need a clearer reason to trust you and a clearer next step. Fix the website before adding more campaigns or tools.";
  } else if (primaryPillar === "commerce") {
    profile = "Product data is slowing sales";
    profileSummary = "Buyers cannot reliably find, compare, or trust the right products. Clean the catalog and search experience first.";
  } else if (primaryPillar === "marketing") {
    profile = "Leads are slipping through";
    profileSummary = "Interest is not turning into a reliable pipeline. Fix the message, lead capture, follow-up, and tracking.";
  } else if (primaryPillar === "technology") {
    profile = "Manual work is costing time";
    profileSummary = "Repeat work and disconnected tools are limiting capacity. Map the workflow, then automate the right steps.";
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
      { period: "30 days", title: "Fix the first bottleneck", actions: [first.detail, QUICK_WINS[primaryPillar].detail, "Assign one owner and choose one number to improve."] },
      { period: "60 days", title: "Connect the next pieces", actions: [second.detail, "Write down the content, data, workflow, and tool decisions.", "Test the riskiest part with real users or real records."] },
      { period: "90 days", title: "Launch and measure", actions: [third.detail, implementation.detail, "Track one result: leads, sales, time saved, or data quality."] }
    ],
    servicePath: implementation.service,
    serviceReason: `Start with ${PILLAR_LABELS[primaryPillar]}. Then address ${PILLAR_LABELS[secondaryPillar].toLowerCase()}.`,
    urgency
  };
}

export function getVisibleQuestions(answers: Answers) {
  return QUESTIONS.filter((question) => !question.showWhen || question.showWhen(answers));
}

export function isAssessmentComplete(answers: Answers) {
  return getVisibleQuestions(answers).every((question) => Boolean(answers[question.id]));
}
