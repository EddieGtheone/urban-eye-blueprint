import { writeFile } from 'node:fs/promises';
import { buildFallbackAiReport } from '../lib/ai-report';
import { evaluateBlueprint } from '../lib/assessment';
import { createBlueprintPdf } from '../lib/pdf-report';

async function main() {
  const answers = {
    business_model: 'hybrid', team_size: '2-10', primary_goal: 'sell_online',
    website_state: 'outdated', conversion_path: 'weak', lead_capture: 'inbox',
    follow_up: 'manual_slow', marketing_system: 'fragmented', systems_state: 'silos',
    manual_work: 'high', sku_count: '500_5000', catalog_quality: 'messy',
    product_discovery: 'weak', commerce_timing: 'under_3'
  };
  const contact = { name: 'Jordan Lee', company: 'Acme Industrial Supply', website: 'https://example.com', role: 'Owner', timeline: '90_days' };
  const result = evaluateBlueprint(answers);
  const report = buildFallbackAiReport(contact, answers, result, {
    url: 'https://example.com/',
    title: 'Acme Industrial Supply',
    description: 'Industrial supplies for maintenance and operations teams.',
    headings: ['Industrial supplies', 'Request a quote', 'Featured categories'],
    text: 'Industrial supplies for maintenance and operations teams. Request a quote. Browse featured categories.'
  });
  const pdf = createBlueprintPdf({ contact, result, aiReport: report, submissionId: '00000000-0000-4000-8000-000000000001' });
  const bytes = Buffer.from(pdf.output('arraybuffer'));
  const outPath = process.argv[2] || 'urban-eye-ai-report-sample.pdf';
  await writeFile(outPath, bytes);
  console.log(`Wrote ${bytes.length} bytes to ${outPath}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
