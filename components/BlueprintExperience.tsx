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
  consent: boolean;
  company_site: string;
};

const initialContact: Contact = {
  name: "",
  email: "",
  company: "",
  website: "",
  role: "",
  timeline: "",
  consent: false,
  company_site: ""
};

const pillarOrder: Pillar[] = ["website", "commerce", "marketing", "technology"];

function ScoreBars({ scores }: { scores: BlueprintResult["scores"] }) {
  return (
    <div className="score-grid" aria-label="Modernization opportunity scores">
      {pillarOrder.map((pillar) => (
        <article className="score-card" key={pillar}>
          <div className="score-card-heading">
            <span>{PILLAR_LABELS[pillar]}</span>
            <strong>{scores[pillar]}</strong>
          </div>
          <div className="score-track" aria-hidden="true">
            <span style={{ width: `${Math.max(6, scores[pillar])}%` }} />
          </div>
          <small>{scores[pillar] >= 70 ? "Immediate opportunity" : scores[pillar] >= 45 ? "Important opportunity" : "Focused opportunity"}</small>
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
  const progress = visibleQuestions.length ? Math.round(((questionIndex + 1) / visibleQuestions.length) * 100) : 0;

  function begin() {
    startedAt.current = Date.now();
    setStage("assessment");
    setQuestionIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      setStage("intro");
      return;
    }
    setQuestionIndex((index) => Math.max(0, index - 1));
  }

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!isAssessmentComplete(answers)) {
      setError("One or more assessment questions still need an answer.");
      setStage("assessment");
      return;
    }
    if (!contact.name || !contact.email || !contact.company || !contact.timeline || !contact.consent) {
      setError("Complete the required fields and confirm permission to receive your blueprint.");
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
    pdf.text("Your 90-Day Business", margin, 82);
    pdf.text("Modernization Blueprint", margin, 110);
    pdf.setFontSize(9);
    pdf.text(`Prepared for ${contact.company} · ${new Date().toLocaleDateString()}`, margin, 134);
    y = 184;
    pdf.setTextColor(11, 12, 14);

    addText(result.profile, 18, "bold", 4);
    addText(result.profileSummary, 11, "normal", 16);
    addText(`Priority: ${result.urgency} · Recommended path: ${result.servicePath}`, 11, "bold", 18);

    addText("MODERNIZATION PROFILE", 9, "bold", 8);
    pillarOrder.forEach((pillar) => addText(`${PILLAR_LABELS[pillar]}: ${result.scores[pillar]}/100`, 10, "normal", 2));
    y += 12;

    addText("TOP THREE PRIORITIES", 9, "bold", 8);
    result.priorities.forEach((priority, index) => {
      addText(`${index + 1}. ${priority.title}`, 12, "bold", 2);
      addText(priority.detail, 10, "normal", 9);
    });

    addText("IMMEDIATE QUICK WIN", 9, "bold", 6);
    addText(result.quickWin.title, 12, "bold", 2);
    addText(result.quickWin.detail, 10, "normal", 14);

    addText("30 / 60 / 90 DAY ROADMAP", 9, "bold", 8);
    result.roadmap.forEach((phase) => {
      addText(`${phase.period.toUpperCase()} — ${phase.title}`, 12, "bold", 2);
      phase.actions.forEach((action) => addText(`• ${action}`, 10, "normal", 3));
      y += 6;
    });

    addText("RECOMMENDED IMPLEMENTATION OPPORTUNITY", 9, "bold", 6);
    addText(result.implementationOpportunity.title, 12, "bold", 2);
    addText(result.implementationOpportunity.detail, 10, "normal", 10);
    addText(result.serviceReason, 10, "bold", 12);
    addText("Urban Eye helps businesses modernize how they look, sell, market, and operate. Review this blueprint with us at urbaneyebybrooks.com.", 10, "normal", 8);
    if (submissionId) addText(`Blueprint reference: ${submissionId}`, 8, "normal", 0);

    pdf.save(`urban-eye-blueprint-${contact.company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`);
  }

  if (stage === "assessment" && currentQuestion) {
    return (
      <main className="assessment-shell">
        <header className="compact-header">
          <button className="brand-button" onClick={() => setStage("intro")} aria-label="Return to blueprint introduction">
            <Image src="/assets/urban-eye-logo-black.png" alt="Urban Eye by Brooks & Co." width={182} height={52} priority />
          </button>
          <span>Business Modernization Blueprint</span>
        </header>
        <section className="question-panel">
          <div className="progress-meta"><span>Question {questionIndex + 1} of {visibleQuestions.length}</span><strong>{progress}%</strong></div>
          <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
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
          <span>Assessment complete</span>
        </header>
        <section className="capture-layout">
          <div className="capture-copy">
            <p className="eyebrow">Your blueprint is ready</p>
            <h1>See what your business should modernize next.</h1>
            <p>Enter your details to unlock the full scorecard, top three priorities, immediate quick win, and personalized 30/60/90-day roadmap.</p>
            <ul>
              <li>Four-part modernization profile</li>
              <li>Prioritized action sequence</li>
              <li>Downloadable PDF blueprint</li>
              <li>Recommended Urban Eye implementation path</li>
            </ul>
          </div>
          <form className="lead-form" onSubmit={submitLead} noValidate>
            <div className="form-heading"><span>Free personalized result</span><h2>Where should we send your blueprint?</h2></div>
            <label>Full name *<input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} autoComplete="name" required /></label>
            <label>Work email *<input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} autoComplete="email" required /></label>
            <label>Company *<input value={contact.company} onChange={(e) => setContact({ ...contact, company: e.target.value })} autoComplete="organization" required /></label>
            <div className="form-row">
              <label>Website<input type="url" placeholder="https://" value={contact.website} onChange={(e) => setContact({ ...contact, website: e.target.value })} autoComplete="url" /></label>
              <label>Your role<input value={contact.role} onChange={(e) => setContact({ ...contact, role: e.target.value })} autoComplete="organization-title" /></label>
            </div>
            <label>When do you want meaningful progress? *
              <select value={contact.timeline} onChange={(e) => setContact({ ...contact, timeline: e.target.value })} required>
                <option value="">Select a timeline</option>
                <option value="now">Now / already underway</option>
                <option value="30_days">Within 30 days</option>
                <option value="90_days">Within 90 days</option>
                <option value="6_months">Within six months</option>
                <option value="exploring">Exploring for later</option>
              </select>
            </label>
            <label className="honeypot" aria-hidden="true">Company site<input tabIndex={-1} autoComplete="off" value={contact.company_site} onChange={(e) => setContact({ ...contact, company_site: e.target.value })} /></label>
            <label className="check-label"><input type="checkbox" checked={contact.consent} onChange={(e) => setContact({ ...contact, consent: e.target.checked })} /><span>I agree to receive this blueprint and relevant follow-up from Urban Eye. I can unsubscribe at any time. *</span></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-gold full" disabled={submitting}>{submitting ? "Building your blueprint…" : "Unlock My Blueprint →"}</button>
            <p className="privacy-note">Your information is used to deliver the blueprint and evaluate whether Urban Eye may be useful. See the <a href="https://www.urbaneyebybrooks.com/privacy.html">privacy policy</a>.</p>
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
          <div className="results-actions"><button className="button button-outline" onClick={downloadPdf}>Download PDF</button><a className="button button-gold" href="https://www.urbaneyebybrooks.com/contact.html?project=blueprint">Review My Blueprint →</a></div>
        </header>
        <section className="result-hero">
          <p className="eyebrow">Prepared for {contact.company}</p>
          <span className="result-chip">{result.urgency} priority</span>
          <h1>{result.profile}</h1>
          <p>{result.profileSummary}</p>
          <div className="primary-path"><span>Recommended Urban Eye path</span><strong>{result.servicePath}</strong><small>{result.serviceReason}</small></div>
        </section>
        <section className="results-content">
          <div className="section-title"><p className="eyebrow dark">Your modernization profile</p><h2>Where the next opportunity is concentrated.</h2></div>
          <ScoreBars scores={result.scores} />

          <div className="section-title"><p className="eyebrow dark">Your priorities</p><h2>Do these in sequence—not all at once.</h2></div>
          <div className="priority-grid">
            {result.priorities.map((priority, index) => <article key={priority.title}><span>0{index + 1}</span><small>{PILLAR_LABELS[priority.pillar]}</small><h3>{priority.title}</h3><p>{priority.detail}</p></article>)}
          </div>

          <div className="quick-win"><div><p className="eyebrow">Start this week</p><h2>{result.quickWin.title}</h2></div><p>{result.quickWin.detail}</p></div>

          <div className="section-title"><p className="eyebrow dark">90-day sequence</p><h2>Stabilize, connect, then implement.</h2></div>
          <div className="roadmap-grid">
            {result.roadmap.map((phase) => <article key={phase.period}><span>{phase.period}</span><h3>{phase.title}</h3><ul>{phase.actions.map((action) => <li key={action}>{action}</li>)}</ul></article>)}
          </div>

          <section className="implementation-card">
            <div><p className="eyebrow">Where Urban Eye can help</p><h2>{result.implementationOpportunity.title}</h2><p>{result.implementationOpportunity.detail}</p></div>
            <div className="implementation-actions"><button className="button button-light" onClick={downloadPdf}>Download the PDF</button><a className="button button-gold" href="https://www.urbaneyebybrooks.com/contact.html?project=blueprint">Review My Blueprint</a></div>
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
          <p className="eyebrow">Free interactive planning tool</p>
          <h1>See what your business should <em>modernize next.</em></h1>
          <p>Answer a focused set of questions about your website, buying journey, marketing, and operations. Get a practical 90-day blueprint built around the business you operate today.</p>
          <div className="hero-actions"><button className="button button-gold" onClick={begin}>Build My Blueprint →</button><span>About 5 minutes · No generic scorecard</span></div>
        </div>
        <div className="blueprint-preview" aria-label="Example blueprint preview">
          <div className="preview-top"><Image src="/assets/urban-eye-mark-white.png" alt="" width={44} height={44} /><span>90-Day Blueprint · Sample</span></div>
          <div className="preview-profile"><small>Modernization profile</small><strong>Connected Growth Foundation</strong><p>One clear priority. Three sequenced workstreams.</p></div>
          <div className="preview-bars"><span style={{ width: "78%" }} /><span style={{ width: "61%" }} /><span style={{ width: "48%" }} /><span style={{ width: "35%" }} /></div>
          <div className="preview-footer"><span>30 days</span><span>60 days</span><span>90 days</span></div>
        </div>
      </section>
      <section className="trust-strip"><span>Website</span><b>+</b><span>Commerce</span><b>+</b><span>Sales & Marketing</span><b>+</b><span>Technology & AI</span></section>
      <section className="what-you-get">
        <div className="section-title light-title"><p className="eyebrow">What you receive</p><h2>Direction you can use—even before hiring anyone.</h2></div>
        <div className="benefit-grid">
          <article><span>01</span><h3>Your primary constraint</h3><p>See which part of the business is currently creating the most drag or missed opportunity.</p></article>
          <article><span>02</span><h3>Three sequenced priorities</h3><p>A practical order of operations so the team does not try to redesign, automate, and market everything at once.</p></article>
          <article><span>03</span><h3>A 30/60/90-day roadmap</h3><p>Immediate stabilization, the decisions to connect, and the implementation work that should follow.</p></article>
          <article><span>04</span><h3>A downloadable blueprint</h3><p>Keep the plan, share it internally, or review it with Urban Eye when the business is ready to move.</p></article>
        </div>
      </section>
      <section className="how-it-works">
        <div className="section-title"><p className="eyebrow dark">How it works</p><h2>From scattered concerns to one actionable plan.</h2></div>
        <ol><li><span>1</span><div><h3>Assess</h3><p>Answer focused questions that adapt to a product, service, or hybrid business.</p></div></li><li><span>2</span><div><h3>Prioritize</h3><p>The engine weighs the four Urban Eye service pillars and identifies the strongest opportunity.</p></div></li><li><span>3</span><div><h3>Plan</h3><p>Receive a personalized scorecard, priorities, quick win, and 90-day roadmap.</p></div></li><li><span>4</span><div><h3>Build</h3><p>Use the blueprint independently or ask Urban Eye to design and implement the right solution.</p></div></li></ol>
        <button className="button button-dark" onClick={begin}>Build My Free Blueprint →</button>
      </section>
      <footer className="blueprint-footer"><Image src="/assets/urban-eye-mark-white.png" alt="" width={48} height={48} /><div><strong>Urban Eye by Brooks & Co.</strong><span>Commerce · Creative · Technology</span></div><p>Vision Made Real.</p></footer>
    </main>
  );
}
