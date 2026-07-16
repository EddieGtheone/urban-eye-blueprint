# Urban Eye Business Modernization Blueprint — Build Plan

## Product decision

The Blueprint replaces the retired “Website Clarity Check” as Urban Eye’s primary free entry path. It is not framed as an audit. It is an interactive planning product that demonstrates how Urban Eye connects customer experience, commerce, growth systems, and operations.

## Canonical promise

**See what your business should modernize next.**

The visitor completes an adaptive assessment and receives:

- A four-pillar modernization profile
- One primary constraint
- Three sequenced priorities
- One immediate quick win
- A 30/60/90-day roadmap
- A recommended Urban Eye implementation path
- A downloadable PDF

## Service routing

1. Website Redesign
2. PIM & eCommerce Optimization
3. Sales & Marketing Systems
4. Technology & AI Implementation

## MVP scope — built in this package

- Branded landing page
- Adaptive product/service/hybrid assessment
- Deterministic scoring and recommendation engine
- Lead capture with consent, honeypot, and minimum-completion timing
- Server-side validation and scoring
- Supabase persistence through a server-only Route Handler
- Downloadable client-generated PDF
- UTM, referrer, source, fit-score, urgency, and service-path capture
- Vercel-ready Next.js project
- Supabase migration with RLS enabled and no public table policies
- Existing marketing-site patch and redirect contract
- Automated scoring tests

## Deliberately deferred from MVP

- Branded transactional email delivery
- Calendar booking API integration
- Turnstile verification
- Urban Eye Admin UI
- Supabase Auth and role-aware admin policies
- Lead-to-company/contact/lead deduplication
- Proposal or quote auto-generation
- Analytics provider implementation
- A/B testing

## Build sequence

### Phase 1 — Product contract

- Lock assessment questions and answer labels.
- Test service routing against at least 12 realistic company profiles.
- Approve headline, CTA, consent language, and PDF copy.

### Phase 2 — Data and security

- Create the Supabase table with the included migration.
- Configure server-only environment variables in Vercel.
- Add production anti-spam protection.
- Confirm privacy policy coverage, retention, and deletion workflow.

### Phase 3 — Delivery

- Connect a transactional email provider.
- Send a result link or attached PDF after a successful submission.
- Add the Blueprint Review booking path.
- Add notification routing for hot leads.

### Phase 4 — Urban Eye Admin

- Add a Blueprint queue to Leads.
- Show fit score, service pillar, urgency, timeline, company, source, and result summary.
- Convert a qualified submission into company/contact/lead records without duplicate entry.
- Create an activity event for submission, review, contact, booking, qualification, and conversion.

### Phase 5 — Optimization

- Measure start, question completion, lead-form view, submission, PDF download, review booking, qualification, proposal, and win.
- Compare conversion by source and service path.
- Develop focused campaign variants only after the parent engine has enough traffic.

## Definition of done

A production visitor can complete the assessment, submit valid contact information, receive and download a deterministic blueprint, and create one secure, reviewable lead record that can later enter Urban Eye Admin without rekeying the same information.
