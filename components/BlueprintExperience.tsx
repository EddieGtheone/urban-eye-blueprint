"use client";

import Image from "next/image";
import { FormEvent, useMemo, useRef, useState } from "react";
import {
  Answers,
  BlueprintResult,
  PILLAR_LABELS,
  Pillar,
  evaluateBlueprint,
  getVisibleQuestions,
  isAssessmentComplete
} from "@/lib/assessment";

type Stage = "intro" | "assessment" | "capture" | "results";

type Contact = {
  name: string;
  email: string;
  company: string;
  website: string;
  role: string;
  timeline: string;
  deliveryConsent: boolean;
  marketingConsent: boolean;
  company_site: string;
};

const initialContact: Contact = {
  name: "",
  email: "",
  company: "",
  website: "",
  role: "",
  timeline: "",
  deliveryConsent: false,
  marketingConsent: false,
  company_site: ""
};

const pillarOrder: Pillar[] = ["website", "commerce", "marketing", "technology"];

function ScoreBars({ scores }: { scores: BlueprintResult["scores"] }) {
  return (
    <div className="score-grid" aria-label="Business priority scores">
      {pillarOrder.map((pillar) => (
        <article className="score-card" key={pillar}>
          <div className="score-card-heading">
            <span>{PILLAR_LABELS[pillar]}</span>
            <strong>{scores[pillar]}</strong>
          </div>
          <div className="score-track" aria-hidden="true">
            <span style={{ width: `${Math.max(6, scores[pillar])}%` }} />
          </div>
          <small>{scores[pillar] >= 70 ? "Fix now" : scores[pillar] >= 45 ? "Fix next" : "Lower priority"}</small>
        </article>
      ))}
    </div>
  );
}

export default function BlueprintExperience() {
  const [stage, setStage] = useState<Stage>("intro");
  const [answers, setAnswers] = useState<Answers>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [contact, setContact] = useState<Contact>(initialContact);
  const [result, setResult] = useState<BlueprintResult | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const startedAt = useRef(Date.now());

  const visibleQuestions = useMemo(() => getVisibleQuestions(answers), [answers]);
  const currentQuestion = visibleQuestions[Math.min(questionIndex, Math.max(visibleQuestions.length - 1, 0))];
  // The branch total is only stable once the business model is chosen (it
  // determines the 10- vs 14-question path). Until then we hide the total.
  const branchTotalKnown = Boolean(answers.business_model);
  const progress = branchTotalKnown && visibleQuestions.length
    ? Math.round(((questionIndex + 1) / visibleQuestions.length) * 100)
    : 0;

  function begin() {
    startedAt.current = Date.now();
    setStage("assessment");
    setQuestionIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Returning to the introduction intentionally clears the in-progress path so
  // a fresh start always re-derives the question total from scratch.
  function returnToIntro() {
    setAnswers({});
    setQuestionIndex(0);
    setResult(null);
    setError("");
    setStage("intro");
  }

  function chooseAnswer(value: string) {
    if (!currentQuestion) return;
    const updated = { ...answers, [currentQuestion.id]: value };
    setAnswers(updated);
    const nextQuestions = getVisibleQuestions(updated);
    if (questionIndex >= nextQuestions.length - 1) {
      setStage("capture");
    } else {
      setQuestionIndex((index) => index + 1);
    }
  }

  function goBack() {
    if (questionIndex === 0) {
      returnToIntro();
      return;
    }
    setQuestionIndex((index) => Math.max(0, index - 1));
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!isAssessmentComplete(answers)) {
      setError("Answer the remaining question before continuing.");
      setStage("assessment");
      return;
    }
    if (!contact.name || !contact.email || !contact.company || !contact.timeline || !contact.deliveryConsent) {
      setError("Add the required information below to view your Blueprint.");
      return;
    }

    const nextResult = evaluateBlueprint(answers);
    setSubmitting(true);
    try {
      const response = await fetch("/api/blueprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact,
          answers,
          result: nextResult,
          startedAt: startedAt.current,
          source: "urban-eye-business-modernization-blueprint",
          pageUrl: window.location.href,
          referrer: document.referrer || null,
          utm: Object.fromEntries(new URLSearchParams(window.location.search))
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The blueprint could not be saved.");
      setSubmissionId(data.id || null);
      setResult(nextResult);
      setStage("results");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The blueprint could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  async function downloadPdf() {
    if (!result) return;
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "pt", format: "letter" });
    const margin = 54;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let y = 56;

    const addText = (text: string, size = 10, weight: "normal" | "bold" = "normal", gap = 6) => {
      pdf.setFont("helvetica", weight);
      pdf.setFontSize(size);
      const lines = pdf.splitTextToSize(text, pageWidth - margin * 2);
      const lineHeight = size * 1.35;
      if (y + lines.length * lineHeight > pageHeight - 54) {
        pdf.addPage();
        y = 54;
      }
      pdf.text(lines, margin, y);
      y += lines.length * lineHeight + gap;
    };

    pdf.setFillColor(11, 12, 14);
    pdf.rect(0, 0, pageWidth, 150, "F");
    pdf.setTextColor(224, 182, 111);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text("URBAN EYE · COMMERCE · CREATIVE · TECHNOLOGY", margin, 46);
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.text("Your 90-Day", margin, 82);
    pdf.text("Business Plan", margin, 110);
    pdf.setFontSize(9);
    pdf.text(`Prepared for ${contact.company} · ${new Date().toLocaleDateString()}`, margin, 134);
    y = 184;
    pdf.setTextColor(11, 12, 14);

    addText(result.profile, 18, "bold", 4);
    addText(result.profileSummary, 11, "normal", 16);
    addText(`Priority: ${result.urgency} · Recommended path: ${result.servicePath}`, 11, "bold", 18);

    addText("WHERE TO FOCUS", 9, "bold", 8);
    pillarOrder.forEach((pillar) => addText(`${PILLAR_LABELS[pillar]}: ${result.scores[pillar]}/100`, 10, "normal", 2));
    y += 12;

    addText("YOUR NEXT THREE MOVES", 9, "bold", 8);
    result.priorities.forEach((priority, index) => {
      addText(`${index + 1}. ${priority.title}`, 12, "bold", 2);
      addText(priority.detail, 10, "normal", 9);
    });

    addText("START THIS WEEK", 9, "bold", 6);
    addText(result.quickWin.title, 12, "bold", 2);
    addText(result.quickWin.detail, 10, "normal", 14);

    addText("YOUR 30 / 60 / 90 DAY PLAN", 9, "bold", 8);
    result.roadmap.forEach((phase) => {
      addText(`${phase.period.toUpperCase()} — ${phase.title}`, 12, "bold", 2);
      phase.actions.forEach((action) => addText(`• ${action}`, 10, "normal", 3));
      y += 6;
    });

    addText("HOW URBAN EYE CAN HELP", 9, "bold", 6);
    addText(result.implementationOpportunity.title, 12, "bold", 2);
    addText(result.implementationOpportunity.detail, 10, "normal", 10);
    addText(result.serviceReason, 10, "bold", 12);
    addText("Urban Eye designs and builds better websites, product systems, sales workflows, and automation. Review your plan with us at urbaneyebybrooks.com.", 10, "normal", 8);
    if (submissionId) addText(`Blueprint reference: ${submissionId}`, 8, "normal", 0);

    pdf.save(`urban-eye-blueprint-${contact.company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`);
  }

  if (stage === "assessment" && currentQuestion) {
    return (
      <main className="assessment-shell">
        <header className="compact-header">
          <button className="brand-button" onClick={returnToIntro} aria-label="Return to Blueprint introduction">
            <Image src="/assets/urban-eye-logo-black.png" alt="Urban Eye by Brooks & Co." width={182} height={52} priority />
          </button>
          <span>Business Modernization Blueprint</span>
        </header>
        <section className="question-panel">
          <div className="progress-meta" aria-live="polite">
            <span>
              {branchTotalKnown
                ? `Question ${questionIndex + 1} of ${visibleQuestions.length}`
                : `Question ${questionIndex + 1}`}
            </span>
            {branchTotalKnown && <strong>{progress}%</strong>}
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={branchTotalKnown ? visibleQuestions.length : undefined}
            aria-valuenow={branchTotalKnown ? questionIndex + 1 : undefined}
            aria-valuetext={
              branchTotalKnown
                ? `Question ${questionIndex + 1} of ${visibleQuestions.length}`
                : `Question ${questionIndex + 1}`
            }
          >
            <span style={{ width: `${branchTotalKnown ? progress : 0}%` }} />
          </div>
          <p className="eyebrow dark">{currentQuestion.eyebrow}</p>
          <h1>{currentQuestion.title}</h1>
          {currentQuestion.description && <p className="question-description">{currentQuestion.description}</p>}
          <div className="option-grid">
            {currentQuestion.options.map((option) => (
              <button className={answers[currentQuestion.id] === option.value ? "option selected" : "option"} key={option.value} onClick={() => chooseAnswer(option.value)}>
                <span>{option.label}</span>
                {option.help && <small>{option.help}</small>}
                <b aria-hidden="true">→</b>
              </button>
            ))}
          </div>
          <button className="back-link" onClick={goBack}>← Back</button>
        </section>
      </main>
    );
  }

  if (stage === "capture") {
    return (
      <main className="capture-page">
        <header className="compact-header light-header">
          <Image src="/assets/urban-eye-logo-white.png" alt="Urban Eye by Brooks & Co." width={182} height={52} priority />
          <span>Questions complete</span>
        </header>
        <section className="capture-layout">
          <div className="capture-copy">
            <p className="eyebrow">Your plan is ready</p>
            <h1>Get your 90-day plan.</h1>
            <p>Enter your details to see what to fix first, your next three moves, and a plan you can download.</p>
            <ul>
              <li>Your biggest bottleneck</li>
              <li>Your next three moves</li>
              <li>A 30/60/90-day plan</li>
              <li>The best Urban Eye service for the job</li>
            </ul>
          </div>
          <form className="lead-form" onSubmit={submitLead} noValidate>
            <div className="form-heading"><span>Free personalized plan</span><h2>Where should we send it?</h2></div>
            <label>Full name *<input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} autoComplete="name" required /></label>
            <label>Work email *<input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} autoComplete="email" required /></label>
            <label>Company *<input value={contact.company} onChange={(e) => setContact({ ...contact, company: e.target.value })} autoComplete="organization" required /></label>
            <div className="form-row">
              <label>Website<input type="url" placeholder="https://" value={contact.website} onChange={(e) => setContact({ ...contact, website: e.target.value })} autoComplete="url" /></label>
              <label>Your role<input value={contact.role} onChange={(e) => setContact({ ...contact, role: e.target.value })} autoComplete="organization-title" /></label>
            </div>
            <label>When do you want to start? *
              <select value={contact.timeline} onChange={(e) => setContact({ ...contact, timeline: e.target.value })} required>
                <option value="">Select a timeline</option>
                <option value="now">Now</option>
                <option value="30_days">Within 30 days</option>
                <option value="90_days">Within 90 days</option>
                <option value="6_months">Within 6 months</option>
                <option value="exploring">Just exploring</option>
              </select>
            </label>
            <label className="honeypot" aria-hidden="true">Company site<input tabIndex={-1} autoComplete="off" value={contact.company_site} onChange={(e) => setContact({ ...contact, company_site: e.target.value })} /></label>
            <label className="check-label"><input type="checkbox" checked={contact.deliveryConsent} onChange={(e) => setContact({ ...contact, deliveryConsent: e.target.checked })} required /><span>I agree to receive my Blueprint by email and accept the <a href="https://www.urbaneyebybrooks.com/privacy.html">Privacy Policy</a>. *</span></label>
            <label className="check-label"><input type="checkbox" checked={contact.marketingConsent} onChange={(e) => setContact({ ...contact, marketingConsent: e.target.checked })} /><span>Send me occasional Urban Eye guidance and service updates. I can unsubscribe at any time.</span></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-gold full" disabled={submitting}>{submitting ? "Building your plan…" : "View My Blueprint"}</button>
            <p className="privacy-note">We use this information to generate and send your Blueprint. Urban Eye will only send ongoing marketing if you opt in. Read the <a href="https://www.urbaneyebybrooks.com/privacy.html">Privacy Policy</a>.</p>
            <button type="button" className="back-link light" onClick={() => { setStage("assessment"); setQuestionIndex(Math.max(0, visibleQuestions.length - 1)); }}>← Change an answer</button>
          </form>
        </section>
      </main>
    );
  }

  if (stage === "results" && result) {
    return (
      <main className="results-page">
        <header className="results-header">
          <Image src="/assets/urban-eye-logo-white.png" alt="Urban Eye by Brooks & Co." width={190} height={54} priority />
          <div className="results-actions"><button className="button button-outline" onClick={downloadPdf}>Download Plan</button><a className="button button-gold" href="https://www.urbaneyebybrooks.com/contact.html?project=blueprint">Review My Plan →</a></div>
        </header>
        <section className="result-hero">
          <p className="eyebrow">Prepared for {contact.company}</p>
          <span className="result-chip">{result.urgency} priority</span>
          <h1>{result.profile}</h1>
          <p>{result.profileSummary}</p>
          <div className="primary-path"><span>Best place to start</span><strong>{result.servicePath}</strong><small>{result.serviceReason}</small></div>
        </section>
        <section className="results-content">
          <div className="section-title"><p className="eyebrow dark">Where to focus</p><h2>What needs attention first.</h2></div>
          <ScoreBars scores={result.scores} />

          <div className="section-title"><p className="eyebrow dark">Your next three moves</p><h2>Do them in this order.</h2></div>
          <div className="priority-grid">
            {result.priorities.map((priority, index) => <article key={priority.title}><span>0{index + 1}</span><small>{PILLAR_LABELS[priority.pillar]}</small><h3>{priority.title}</h3><p>{priority.detail}</p></article>)}
          </div>

          <div className="quick-win"><div><p className="eyebrow">Start this week</p><h2>{result.quickWin.title}</h2></div><p>{result.quickWin.detail}</p></div>

          <div className="section-title"><p className="eyebrow dark">Your 90-day plan</p><h2>Now. Next. Then.</h2></div>
          <div className="roadmap-grid">
            {result.roadmap.map((phase) => <article key={phase.period}><span>{phase.period}</span><h3>{phase.title}</h3><ul>{phase.actions.map((action) => <li key={action}>{action}</li>)}</ul></article>)}
          </div>

          <section className="implementation-card">
            <div><p className="eyebrow">How Urban Eye can help</p><h2>{result.implementationOpportunity.title}</h2><p>{result.implementationOpportunity.detail}</p></div>
            <div className="implementation-actions"><button className="button button-light" onClick={downloadPdf}>Download Plan</button><a className="button button-gold" href="https://www.urbaneyebybrooks.com/contact.html?project=blueprint">Review My Plan</a></div>
          </section>
          <p className="result-reference">Blueprint reference: {submissionId || "local preview"}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="landing-page">
      <header className="landing-header">
        <Image src="/assets/urban-eye-logo-white.png" alt="Urban Eye by Brooks & Co." width={192} height={55} priority />
        <a href="https://www.urbaneyebybrooks.com">Visit Urban Eye</a>
      </header>
      <section className="blueprint-hero">
        <div className="hero-copy">
          <p className="eyebrow">Free 5-minute business planner</p>
          <h1>Find what your business should <em>fix next.</em></h1>
          <p>Answer a few questions. Get a clear 90-day plan for your website, sales, product data, and operations.</p>
          <div className="hero-actions"><button className="button button-gold" onClick={begin}>Get My 90-Day Plan →</button><span>About 5 minutes · Free PDF</span></div>
        </div>
        <div className="blueprint-preview" aria-label="Example blueprint preview">
          <div className="preview-top"><Image src="/assets/urban-eye-mark-white.png" alt="" width={44} height={44} /><span>90-Day Plan</span></div>
          <div className="preview-profile"><small>Your biggest bottleneck</small><strong>Manual work is slowing growth</strong><p>One problem. Three next moves.</p></div>
          <div className="preview-bars"><span style={{ width: "78%" }} /><span style={{ width: "61%" }} /><span style={{ width: "48%" }} /><span style={{ width: "35%" }} /></div>
          <div className="preview-footer"><span>30 days</span><span>60 days</span><span>90 days</span></div>
        </div>
      </section>
      <section className="trust-strip"><span>Website</span><b>+</b><span>Product Data</span><b>+</b><span>Sales</span><b>+</b><span>Automation</span></section>
      <section className="what-you-get">
        <div className="section-title light-title"><p className="eyebrow">What you get</p><h2>Know what to fix first.</h2></div>
        <div className="benefit-grid">
          <article><span>01</span><h3>Your biggest bottleneck</h3><p>See where leads, sales, or time are being lost.</p></article>
          <article><span>02</span><h3>Your next three moves</h3><p>Get the steps in the right order.</p></article>
          <article><span>03</span><h3>A 90-day plan</h3><p>Know what to do now, next month, and by day 90.</p></article>
          <article><span>04</span><h3>A PDF you can share</h3><p>Save it, send it to your team, or review it with Urban Eye.</p></article>
        </div>
      </section>
      <section className="how-it-works">
        <div className="section-title"><p className="eyebrow dark">How it works</p><h2>Answer. Prioritize. Act.</h2></div>
        <ol><li><span>1</span><div><h3>Answer</h3><p>Tell us what is working and what is not.</p></div></li><li><span>2</span><div><h3>Rank</h3><p>We identify the issue costing you the most.</p></div></li><li><span>3</span><div><h3>Plan</h3><p>Get three next moves and a 90-day timeline.</p></div></li><li><span>4</span><div><h3>Build</h3><p>Use the plan yourself or build it with Urban Eye.</p></div></li></ol>
        <button className="button button-dark" onClick={begin}>Get My Free Plan →</button>
      </section>
      <footer className="blueprint-footer"><Image src="/assets/urban-eye-mark-white.png" alt="" width={48} height={48} /><div><strong>Urban Eye by Brooks & Co.</strong><span>Commerce · Creative · Technology</span></div><p>Vision Made Real.</p></footer>
    </main>
  );
}
