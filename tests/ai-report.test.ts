import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFallbackAiReport } from '../lib/ai-report';
import { evaluateBlueprint } from '../lib/assessment';
import { isBlockedHost, normalizeWebsiteUrl } from '../lib/website-snapshot';

const answers = {
  business_model: 'hybrid',
  team_size: '2-10',
  primary_goal: 'sell_online',
  website_state: 'outdated',
  conversion_path: 'weak',
  lead_capture: 'inbox',
  follow_up: 'manual_slow',
  marketing_system: 'fragmented',
  systems_state: 'silos',
  manual_work: 'high',
  sku_count: '500_5000',
  catalog_quality: 'messy',
  product_discovery: 'weak',
  commerce_timing: 'under_3'
};

test('fallback report preserves the fixed service recommendation', () => {
  const result = evaluateBlueprint(answers);
  const report = buildFallbackAiReport(
    { name: 'Test User', company: 'Acme Supply', website: '', role: 'Owner', timeline: '90_days' },
    answers,
    result,
    null
  );

  assert.equal(report.urbanEyeRecommendation.service, result.servicePath);
  assert.equal(report.priorityActions.length, 3);
  assert.equal(report.roadmap.length, 3);
  assert.equal(report.metrics.length, 4);
  assert.ok(report.executiveSummary.includes('Acme Supply'));
});

test('website URL normalization adds HTTPS and rejects non-web schemes', () => {
  assert.equal(normalizeWebsiteUrl('example.com')?.toString(), 'https://example.com/');
  assert.equal(normalizeWebsiteUrl('file:///etc/passwd'), null);
});

test('website snapshot blocks local and internal hosts', () => {
  assert.equal(isBlockedHost('localhost'), true);
  assert.equal(isBlockedHost('service.internal'), true);
  assert.equal(isBlockedHost('example.com'), false);
});
