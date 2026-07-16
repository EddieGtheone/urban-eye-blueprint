# Launch Checklist

## Product and copy

- [ ] Approve all assessment questions and answer labels.
- [ ] Confirm the four service names.
- [ ] Verify every recommendation is useful and does not overpromise.
- [ ] Test at least three profiles per primary service path.
- [ ] Approve consent and privacy language.

## Supabase

- [ ] Create or select the production project.
- [ ] Apply `supabase/schema.sql` as a migration.
- [ ] Confirm RLS is enabled.
- [ ] Confirm anon and authenticated roles cannot select or insert.
- [ ] Store the service-role key only in Vercel server environment variables.
- [ ] Add backup, retention, access, and deletion procedures.

## Vercel

- [ ] Create a project from this repository.
- [ ] Add `SUPABASE_URL`.
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` as sensitive.
- [ ] Add a strong `IP_HASH_SALT`.
- [ ] Set `NEXT_PUBLIC_SITE_URL=https://blueprint.urbaneyebybrooks.com`.
- [ ] Deploy to Preview and test before Production.
- [ ] Attach `blueprint.urbaneyebybrooks.com`.

## Abuse and privacy

- [ ] Add Cloudflare Turnstile or equivalent server-verified protection.
- [ ] Add rate limiting that works across serverless instances.
- [ ] Confirm privacy policy names the collected fields and purposes.
- [ ] Confirm consent timestamp and source are stored.
- [ ] Test malicious HTML, oversized payloads, rapid submissions, and invalid emails.

## Delivery and notifications

- [ ] Connect the email provider.
- [ ] Send a branded confirmation with the blueprint or secure result URL.
- [ ] Route hot-lead notifications to the correct Urban Eye inbox.
- [ ] Add a calendar link or booking integration.
- [ ] Test email authentication and deliverability.

## Analytics

- [ ] Track assessment start.
- [ ] Track each completed section without recording sensitive free text.
- [ ] Track lead-form view and submit.
- [ ] Track PDF download.
- [ ] Track Blueprint Review click and booking.
- [ ] Track qualification, proposal, and closed-won in Urban Eye Admin.

## Website

- [ ] Deploy the included marketing-site patch.
- [ ] Replace the old `/review.html` entry path with the Blueprint redirect.
- [ ] Verify mobile navigation and every CTA.
- [ ] Update sitemap and canonical URLs.
- [ ] Smoke-test Netlify and Vercel custom domains.
