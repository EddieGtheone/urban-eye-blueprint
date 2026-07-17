# AI-Generated Detailed Blueprint Reports

## Purpose

The questionnaire scoring remains deterministic. AI does not choose the primary pillar, urgency, service path, or score. It expands the approved assessment into a detailed company report.

## Generation flow

```text
Questionnaire submission
-> server validates contact and answers
-> deterministic scoring selects the priority and service
-> lead is written to Supabase
-> optional public homepage snapshot is collected
-> OpenAI Responses API returns strict structured JSON
-> structured report is stored in Supabase
-> browser renders the branded detailed PDF
```

## Grounding rules

- The model receives only questionnaire answers, fixed scoring output, contact context, and an optional limited public homepage snapshot.
- The model is told not to invent revenue, customers, staff, tools, products, performance metrics, or website findings.
- The fixed scoring output is authoritative and cannot be changed by AI.
- Missing evidence must be identified as missing or requiring validation.
- A deterministic fallback report is returned when the API key is absent or generation fails.

## Data and security

- `OPENAI_API_KEY` is server-only.
- OpenAI requests use `store: false`.
- Website fetching blocks local, private, link-local, and internal network destinations.
- Only a limited homepage snapshot is used; no login, crawling, or internal system access occurs.
- The consent text explains that the public website may be reviewed to personalize the report.

## Required environment variables

```text
OPENAI_API_KEY
OPENAI_MODEL=gpt-5-mini
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
IP_HASH_SALT
```

## Existing Supabase projects

Apply:

```text
supabase/002_ai_reports.sql
```

## Report sections

1. Cover page
2. Executive summary
3. Company snapshot and website observations
4. Four-pillar scores
5. Primary diagnosis and evidence
6. Three detailed priority actions
7. 30/60/90-day roadmap
8. Four metrics to track
9. Recommended Urban Eye engagement
10. Assumptions and disclaimer

## Failure behavior

The lead remains saved even when AI generation fails. The visitor receives the deterministic report and the database records `fallback_error` or `fallback_no_key` after the AI migration is installed.
