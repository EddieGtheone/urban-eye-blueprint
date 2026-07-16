import assert from "node:assert/strict";
import test from "node:test";
import { evaluateBlueprint, getVisibleQuestions } from "../lib/assessment";

test("product catalog distress routes to commerce", () => {
  const result = evaluateBlueprint({
    business_model: "products",
    team_size: "11-50",
    primary_goal: "sell_online",
    website_state: "adequate",
    conversion_path: "somewhat",
    lead_capture: "forms",
    follow_up: "manual_good",
    marketing_system: "partial",
    systems_state: "some",
    manual_work: "some",
    sku_count: "5000_20000",
    catalog_quality: "messy",
    product_discovery: "weak",
    commerce_timing: "under_3"
  });
  assert.equal(result.primaryPillar, "commerce");
  assert.equal(result.servicePath, "PIM & eCommerce Optimization");
  assert.equal(result.urgency, "Immediate");
});

test("service businesses do not receive catalog questions", () => {
  const visible = getVisibleQuestions({ business_model: "services" });
  assert.equal(visible.some((question) => question.id === "sku_count"), false);
  assert.equal(visible.some((question) => question.id === "catalog_quality"), false);
});

test("manual operations distress routes to technology", () => {
  const result = evaluateBlueprint({
    business_model: "services",
    team_size: "2-10",
    primary_goal: "save_time",
    website_state: "strong",
    conversion_path: "clear",
    lead_capture: "forms",
    follow_up: "manual_good",
    marketing_system: "coordinated",
    systems_state: "silos",
    manual_work: "critical"
  });
  assert.equal(result.primaryPillar, "technology");
  assert.equal(result.servicePath, "Technology & AI Implementation");
});
