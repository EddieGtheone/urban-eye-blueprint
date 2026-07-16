# Adversarial Review Fixes — r2 (July 16, 2026)

Independent review of the Blueprint MVP package. All original validation claims
were re-run and reproduced (3/3 tests, strict TS, clean build, 0 vulnerabilities,
smoke checks). The fixes below were applied on top and are pending Eddie's
re-verification before deploy.

## BLOCKER fixes

1. **`package-lock.json` regenerated against the public npm registry.**
   The shipped lockfile resolved every package from an OpenAI-internal
   Artifactory mirror (`packages.applied-caas-gateway1.internal.api.openai.org`),
   which fails outside that build sandbox — including on Vercel. Installs and
   deploys would break. The r2 lockfile resolves from `registry.npmjs.org`.

2. **`_redirects` ordering fixed; retired page removed from the deploy.**
   The original file rewrote `/review → /review.html 200` *before* the
   `/review.html → blueprint 301!` rule. Netlify matches top-down, so the
   pretty URL `/review` kept serving the retired $50 Clarity Check page.
   r2 force-redirects `/review.html`, `/review`, and `/blueprint` first and
   deletes `review.html` from the folder.

3. **Prohibited public wording removed.** `contact.html` shipped a
   "Digital Growth Retainer" option ("retainer" is prohibited in public-facing
   use). Renamed to the canonical "Digital Growth Support". The
   "$50 Website Clarity Check" dropdown option was replaced with
   "Business Modernization Blueprint Review" per the project-master delta.

## WARNING fixes

4. **Production guard against silent lead loss.** `route.ts` previously fell
   back to demo mode (201, `saved:false`) whenever Supabase credentials were
   missing — in a misconfigured production deploy, every lead would vanish
   while the visitor saw success. r2 returns 503 and logs loudly when
   `NODE_ENV=production` and credentials are absent. Local demo mode is
   unchanged; `ALLOW_DEMO_MODE=true` is an explicit escape hatch.
   Verified: 503 without creds in prod; 201 `demo:true` with the flag.

5. **Runtime Clarity Check leak on the new homepage.** `script.js`'s scale
   switcher injected "Use a $50 Website Clarity Check…" copy into the patched
   `index.html` at runtime (invisible to static grep). Copy now leads with the
   free Blueprint.

6. **Dead CTA parameter.** Both "Review My Blueprint" CTAs link to
   `contact.html?project=blueprint`, but the param map had no `blueprint` key,
   so nothing was preselected. Added `blueprint` (and `support`) mappings;
   `review`/`retainer` now map to their replacements for old links.

7. **`IP_HASH_SALT` documented.** The route hashes visitor IPs with this salt
   but it was missing from `.env.example` (default fell back to a hardcoded
   string, making hashes trivially reversible). Now documented; the launch
   checklist already requires a strong value.

## NOTE fixes

8. `thanks.html` secondary button pointed at the retired `review.html`; now
   points at the Blueprint.
9. `sitemap.xml` used the placeholder domain `example.com` and listed the
   retired `/review` path; rewritten with real URLs.
10. The landing preview card now shows a visible "Sample" tag (it was labeled
    only for screen readers).
11. Removed the stray `tsconfig.tsbuildinfo` build artifact from the package.

## Not changed — needs Eddie's decision

- **The project-master delta retires the $50 Clarity Check as the primary
  entry service.** That reverses a locked master decision (§17) and affects the
  Stripe payment-link task, branded email template #2, and the "starting
  deposit" entry economics. The code now implements the delta consistently,
  but the business decision itself needs explicit sign-off.
- **Which Supabase project hosts `blueprint_submissions`.** The docs imply the
  Urban Eye Admin project will add role-aware read policies; that only works
  if the table lives in the *same* Supabase project as the Phase 2 schema.
  Pin this before applying `schema.sql`.
- Deferred launch items remain as documented: Turnstile, distributed rate
  limiting, transactional email, booking, analytics, DNS.
