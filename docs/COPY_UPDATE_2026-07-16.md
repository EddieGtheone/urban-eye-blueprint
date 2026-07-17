# Copy Update — July 16, 2026

## Goal

Make the Blueprint easier to understand in two seconds and easier to complete without changing its scoring, database fields, or service routing.

## Copy rules used

- Lead with the result, not the category.
- Use concrete words: leads, sales, time, products, website, tools.
- Keep one idea per heading.
- Prefer short questions and short answer choices.
- Tell the user what happens next.
- Remove internal language such as “modernization opportunity,” “workstream,” and “implementation path” from customer-facing screens.

## Main changes

- “Business Modernization Blueprint” becomes “90-Day Business Plan” in customer-facing navigation and metadata.
- Hero: “Find what your business should fix next.”
- CTA: “Get My 90-Day Plan.”
- Results identify a concrete bottleneck, such as:
  - “Your website is the bottleneck”
  - “Product data is slowing sales”
  - “Leads are slipping through”
  - “Manual work is costing time”
- Questions and answer choices were shortened across all service and product-business paths.
- Result sections now use plain labels:
  - Where to focus
  - Your next three moves
  - Start this week
  - Your 90-day plan
  - How Urban Eye can help
- PDF and error copy were updated to match the web experience.

## Unchanged

- Assessment answer values
- Scoring weights
- Conditional product-catalog questions
- API payload and Supabase schema
- Lead qualification rules
- Urban Eye service names

## Validation

- `npm test`: 3/3 passing
- `npm run lint`: passing
- `npm run build`: passing
- Local homepage smoke test: passing
- API validation response: passing

## Deploy

Replace the four changed files in the deployed repository and push to the production branch:

- `components/BlueprintExperience.tsx`
- `lib/assessment.ts`
- `app/layout.tsx`
- `app/api/blueprints/route.ts`

Vercel should build and deploy automatically after the push.
