# Urban Eye Business Modernization Blueprint

A Vercel-ready Next.js MVP for Urban Eye’s primary lead magnet and qualification experience.

## What is included

- Adaptive assessment
- Deterministic four-pillar scoring
- Personalized result and roadmap
- Downloadable PDF
- Server-side lead validation
- Supabase REST persistence using a server-only service role
- RLS-first database migration
- Marketing-site integration patch
- Product, admin, and launch documentation

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app runs in demo mode when Supabase variables are absent. A valid submission still generates a result, but the record is not persisted.

## Validate

```bash
npm test
npm run lint
npm run build
```

## Configure Supabase

1. Apply `supabase/schema.sql` through a migration.
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel.
3. Do not expose the service-role key with a `NEXT_PUBLIC_` prefix.
4. Add production anti-spam protection and rate limiting before launch.

## Architecture

```text
blueprint.urbaneyebybrooks.com
└── Vercel / Next.js
    ├── Public assessment UI
    ├── Server Route Handler
    ├── Deterministic scoring
    └── PDF generation in browser

Supabase
└── blueprint_submissions
    ├── RLS enabled
    ├── no public table policies
    └── server-only writes
```

See `docs/BUILD_PLAN.md` and `docs/LAUNCH_CHECKLIST.md` before production deployment.
