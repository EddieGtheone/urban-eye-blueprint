import { jsPDF } from 'jspdf';
import type { AiBlueprintReport, ReportContact } from '@/lib/ai-report';
import { PILLAR_LABELS } from '@/lib/assessment';
import type { BlueprintResult, Pillar } from '@/lib/assessment';

export type BlueprintPdfInput = {
  contact: ReportContact;
  result: BlueprintResult;
  aiReport: AiBlueprintReport;
  submissionId: string | null;
};

const pillarOrder: Pillar[] = ['website', 'commerce', 'marketing', 'technology'];

function safeText(value: string) {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u2022/g, '-')
    .replace(/\u00a0/g, ' ')
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, '');
}

export function createBlueprintPdf({ contact, result, aiReport, submissionId }: BlueprintPdfInput) {
  const pdf = new jsPDF({ unit: 'pt', format: 'letter', compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 54;
  const contentWidth = pageWidth - margin * 2;
  const snapshotUrl = (contact.website || '').trim();
  let y = 54;

  const addPage = () => {
    pdf.addPage();
    y = 60;
  };

  const ensureSpace = (height: number) => {
    if (y + height > pageHeight - 64) addPage();
  };

  const addText = (text: string, size = 10, weight: 'normal' | 'bold' = 'normal', gap = 7, width = contentWidth) => {
    const clean = safeText(text);
    pdf.setFont('helvetica', weight);
    pdf.setFontSize(size);
    pdf.setTextColor(20, 22, 25);
    const lines = pdf.splitTextToSize(clean, width) as string[];
    const lineHeight = size * 1.42;
    ensureSpace(lines.length * lineHeight + gap);
    pdf.text(lines, margin, y);
    y += lines.length * lineHeight + gap;
  };

  const addSection = (label: string, title: string) => {
    ensureSpace(72);
    pdf.setTextColor(145, 102, 46);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.text(safeText(label.toUpperCase()), margin, y);
    y += 19;
    pdf.setTextColor(11, 12, 14);
    pdf.setFontSize(19);
    const lines = pdf.splitTextToSize(safeText(title), contentWidth) as string[];
    pdf.text(lines, margin, y);
    y += lines.length * 24 + 12;
    pdf.setDrawColor(224, 182, 111);
    pdf.setLineWidth(1.5);
    pdf.line(margin, y, margin + 54, y);
    y += 18;
  };

  const addBullets = (items: string[], size = 10, gap = 6) => {
    items.forEach((item) => {
      const clean = safeText(item);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(size);
      const lines = pdf.splitTextToSize(clean, contentWidth - 22) as string[];
      const lineHeight = size * 1.42;
      ensureSpace(lines.length * lineHeight + gap);
      pdf.setFillColor(224, 182, 111);
      pdf.circle(margin + 4, y - 3, 2.2, 'F');
      pdf.setTextColor(20, 22, 25);
      pdf.text(lines, margin + 18, y);
      y += lines.length * lineHeight + gap;
    });
  };

  const addCallout = (title: string, body: string) => {
    const bodyLines = pdf.splitTextToSize(safeText(body), contentWidth - 34) as string[];
    const height = 46 + bodyLines.length * 14;
    ensureSpace(height + 16);
    pdf.setFillColor(246, 241, 232);
    pdf.roundedRect(margin, y, contentWidth, height, 8, 8, 'F');
    pdf.setTextColor(119, 80, 31);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text(safeText(title), margin + 17, y + 22);
    pdf.setTextColor(20, 22, 25);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(bodyLines, margin + 17, y + 42);
    y += height + 16;
  };

  // Cover
  pdf.setFillColor(11, 12, 14);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  pdf.setFillColor(224, 182, 111);
  pdf.rect(margin, 74, 72, 5, 'F');
  pdf.setTextColor(224, 182, 111);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('URBAN EYE - COMMERCE - CREATIVE - TECHNOLOGY', margin, 118);
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(31);
  const titleLines = pdf.splitTextToSize(safeText(aiReport.reportTitle), contentWidth) as string[];
  pdf.text(titleLines, margin, 184);
  let coverY = 184 + titleLines.length * 39;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(13);
  const subtitleLines = pdf.splitTextToSize(safeText(aiReport.reportSubtitle), contentWidth - 36) as string[];
  pdf.setTextColor(220, 222, 225);
  pdf.text(subtitleLines, margin, coverY + 22);
  coverY += subtitleLines.length * 19 + 70;
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(`Prepared for ${safeText(contact.company)}`, margin, coverY);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(190, 192, 196);
  pdf.text(`Prepared ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, coverY + 24);
  pdf.text(`Recommended path: ${safeText(result.servicePath)}`, margin, coverY + 43);
  if (submissionId) pdf.text(`Blueprint reference: ${safeText(submissionId)}`, margin, coverY + 62);
  pdf.setTextColor(224, 182, 111);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('VISION MADE REAL.', margin, pageHeight - 70);

  addPage();
  addSection('Executive view', aiReport.primaryDiagnosis.headline);
  addText(aiReport.executiveSummary, 11, 'normal', 16);
  addCallout('Why this comes first', aiReport.primaryDiagnosis.summary);

  addSection('Company snapshot', 'What the assessment tells us');
  addText(`Business model: ${aiReport.companySnapshot.whatTheySell}`, 10, 'bold', 5);
  addText(`90-day goal: ${aiReport.companySnapshot.statedGoal}`, 10, 'bold', 5);
  addText(`Current context: ${aiReport.companySnapshot.currentState}`, 10, 'normal', 15);
  addText('Public website observations', 11, 'bold', 8);
  addBullets(aiReport.companySnapshot.websiteObservations);

  addSection('What we saw', 'The evidence behind this plan');
  aiReport.evidenceLog.forEach((item) => {
    addText(`${item.source} — ${item.finding}`, 9.7, 'normal', 6);
  });
  if (snapshotUrl) addText(`Source: ${snapshotUrl} · Captured ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 8.5, 'normal', 14);

  ensureSpace(72 + pillarOrder.length * 39);
  addSection('Priority scores', 'Where attention is needed');
  pillarOrder.forEach((pillar) => {
    ensureSpace(39);
    const score = result.scores[pillar];
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(20, 22, 25);
    pdf.text(PILLAR_LABELS[pillar], margin, y);
    pdf.text(`${score}/100`, pageWidth - margin - 42, y);
    y += 10;
    pdf.setFillColor(229, 230, 232);
    pdf.roundedRect(margin, y, contentWidth, 8, 4, 4, 'F');
    pdf.setFillColor(224, 182, 111);
    pdf.roundedRect(margin, y, Math.max(10, contentWidth * (score / 100)), 8, 4, 4, 'F');
    y += 23;
  });

  addSection('Primary diagnosis', aiReport.primaryDiagnosis.headline);
  addText(aiReport.primaryDiagnosis.summary, 11, 'normal', 15);
  addText('Evidence from the questionnaire and website snapshot', 11, 'bold', 8);
  addBullets(aiReport.primaryDiagnosis.evidence);
  addText('Likely business impact', 11, 'bold', 8);
  addBullets(aiReport.primaryDiagnosis.businessImpact);
  addCallout('Risk of waiting', aiReport.primaryDiagnosis.riskOfDelay);

  aiReport.priorityActions.forEach((priority) => {
    addPage();
    addSection(`Priority ${priority.rank}`, priority.title);
    addText(priority.whyNow, 11, 'normal', 14);
    addText('Actions', 11, 'bold', 8);
    addBullets(priority.actions);
    addCallout('Expected outcome', priority.expectedOutcome);
    addText(`Suggested owner: ${priority.suggestedOwner}`, 10, 'bold', 5);
    addText(`Timing: ${priority.timeframe}`, 10, 'bold', 10);
  });

  addPage();
  addSection('90-day roadmap', 'Now, next, then');
  aiReport.roadmap.forEach((phase) => {
    ensureSpace(115);
    pdf.setTextColor(145, 102, 46);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(safeText(phase.period), margin, y);
    y += 19;
    addText(phase.objective, 13, 'bold', 8);
    addBullets(phase.actions, 9.7, 5);
    addText(`Proof of progress: ${phase.proofOfProgress}`, 9.7, 'bold', 17);
  });

  addPage();
  addSection('Measurement', 'Four numbers to watch');
  aiReport.metrics.forEach((metric) => {
    ensureSpace(105);
    addText(metric.name, 12, 'bold', 3);
    addText(metric.whyItMatters, 9.7, 'normal', 4);
    addText(`Starting point: ${metric.startingPoint}`, 9.4, 'normal', 3);
    addText(`Target direction: ${metric.targetDirection}`, 9.4, 'bold', 13);
  });

  addPage();
  addSection('Recommended first project', aiReport.urbanEyeRecommendation.projectName);
  addText(`Best-fit service: ${aiReport.urbanEyeRecommendation.service}`, 11, 'bold', 8);
  addText(aiReport.urbanEyeRecommendation.outcome, 11, 'normal', 14);
  addText('Included', 11, 'bold', 8);
  addBullets(aiReport.urbanEyeRecommendation.included);
  addText('Not included', 11, 'bold', 8);
  addBullets(aiReport.urbanEyeRecommendation.notIncluded);
  addText(`Estimated duration: ${aiReport.urbanEyeRecommendation.duration}`, 10.5, 'bold', 12);
  addCallout('Next step', aiReport.urbanEyeRecommendation.firstStep);
  addText('Book your Blueprint Review with Urban Eye at urbaneyebybrooks.com.', 10.5, 'bold', 18);

  addSection('Assumptions', 'What should be validated');
  addBullets(aiReport.assumptions, 9.4, 5);
  addText(aiReport.disclaimer, 8.5, 'normal', 8);

  const pages = pdf.getNumberOfPages();
  for (let page = 2; page <= pages; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(224, 182, 111);
    pdf.line(margin, pageHeight - 43, pageWidth - margin, pageHeight - 43);
    pdf.setTextColor(110, 112, 116);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.text('Urban Eye by Brooks & Co. - Confidential planning document', margin, pageHeight - 25);
    pdf.text(`${page - 1}`, pageWidth - margin - 6, pageHeight - 25);
  }

  return pdf;
}

export function downloadBlueprintPdf(input: BlueprintPdfInput) {
  const pdf = createBlueprintPdf(input);
  const slug = input.contact.company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'company';
  pdf.save(`urban-eye-90-day-plan-${slug}.pdf`);
}
