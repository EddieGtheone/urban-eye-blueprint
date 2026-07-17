import { test, expect, Page } from "@playwright/test";

// Contract acceptance criteria (Blueprint Copy Contract §2, §5, §6, §8, §13):
//  - both start CTAs open the same questionnaire state;
//  - the question total is hidden before business-model selection and stable after;
//  - returning to the introduction clears the in-progress path;
//  - delivery consent and optional marketing consent are separate controls.

async function answerCurrentQuestion(page: Page, optionText?: string) {
  const option = optionText
    ? page.locator(".option", { hasText: optionText })
    : page.locator(".option").first();
  await option.first().click();
}

async function completeAssessment(page: Page) {
  // Click through every visible question until the contact form appears.
  for (let i = 0; i < 20; i += 1) {
    if (await page.locator(".lead-form").isVisible().catch(() => false)) return;
    await answerCurrentQuestion(page);
    await page.waitForTimeout(120);
  }
  throw new Error("Assessment did not reach the contact form within 20 steps");
}

test("both start CTAs open the questionnaire", async ({ page }) => {
  // Hero CTA
  await page.goto("/");
  await page.locator(".hero-actions button").first().click();
  await expect(page.locator(".question-panel")).toBeVisible();
  await expect(page.locator(".progress-meta")).toContainText("Question 1");

  // Lower CTA
  await page.goto("/");
  const lower = page.locator(".button-dark");
  await lower.scrollIntoViewIfNeeded();
  await lower.click();
  await expect(page.locator(".question-panel")).toBeVisible();
  await expect(page.locator(".progress-meta")).toContainText("Question 1");
});

test("question total is hidden before business model, stable after (14-question path)", async ({ page }) => {
  await page.goto("/");
  await page.locator(".hero-actions button").first().click();

  // Before choosing a business model, no total is shown.
  await expect(page.locator(".progress-meta")).toContainText("Question 1");
  await expect(page.locator(".progress-meta")).not.toContainText("of");

  // Choosing a mixed model reveals the stable 14-question total.
  await answerCurrentQuestion(page, "Products and services");
  await expect(page.locator(".progress-meta")).toContainText("of 14");
  await expect(page.locator('.progress-track[role="progressbar"]')).toHaveAttribute("aria-valuemax", "14");
});

test("services path shows a stable 10-question total", async ({ page }) => {
  await page.goto("/");
  await page.locator(".hero-actions button").first().click();
  await answerCurrentQuestion(page, "Services");
  await expect(page.locator(".progress-meta")).toContainText("of 10");
});

test("returning to the introduction clears the branch path", async ({ page }) => {
  await page.goto("/");
  await page.locator(".hero-actions button").first().click();
  await answerCurrentQuestion(page, "Products and services");
  await expect(page.locator(".progress-meta")).toContainText("of 14");

  // The logo control returns to the intro and must reset the path.
  await page.locator(".brand-button").click();
  await expect(page.locator(".blueprint-hero")).toBeVisible();

  // Starting again shows no total until a business model is chosen again.
  await page.locator(".hero-actions button").first().click();
  await expect(page.locator(".progress-meta")).toContainText("Question 1");
  await expect(page.locator(".progress-meta")).not.toContainText("of");
});

test("delivery and marketing consent are separate controls", async ({ page }) => {
  await page.goto("/");
  await page.locator(".hero-actions button").first().click();
  await completeAssessment(page);

  const checkboxes = page.locator('.lead-form .check-label input[type="checkbox"]');
  await expect(checkboxes).toHaveCount(2);

  const delivery = checkboxes.nth(0);
  const marketing = checkboxes.nth(1);

  // Both start unchecked; marketing must never be pre-selected.
  await expect(delivery).not.toBeChecked();
  await expect(marketing).not.toBeChecked();

  await expect(page.locator(".lead-form")).toContainText("accept the Privacy Policy");
  await expect(page.locator(".lead-form")).toContainText("occasional Urban Eye guidance");
});
