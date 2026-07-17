# Deploy the AI-Generated Detailed PDF

## 1. Apply the Supabase migration

Run this file in the Supabase SQL Editor:

```text
supabase/002_ai_reports.sql
```

Confirm these columns exist on `blueprint_submissions`:

```text
ai_report
ai_status
ai_model
ai_generated_at
website_snapshot_used
ai_error
```

## 2. Create an OpenAI API key

Create a project API key in the OpenAI platform. Do not put it in source code, GitHub, or a `NEXT_PUBLIC_` variable.

## 3. Add Vercel environment variables

Add the following to Production and Preview:

```text
OPENAI_API_KEY=<server-only key>
OPENAI_MODEL=gpt-5-mini
```

Keep the existing Supabase variables:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
IP_HASH_SALT
NEXT_PUBLIC_SITE_URL
```

## 4. Deploy the code

Commit the updated project or replace the files from the patch. Vercel should build the Next.js application and redeploy automatically.

## 5. Complete a production test

Use a real company name and a public website URL. Confirm:

- The loading button reads `Writing your detailed plan...`.
- The result page shows `AI-personalized report ready`.
- `Website reviewed` appears when a usable homepage snapshot was collected.
- `Download Detailed PDF` produces the multi-page report.
- The report uses the company name, answers, scored priority, and website observations.
- The recommended service matches the deterministic on-screen result.

## 6. Verify Supabase

Open the new submission and confirm:

```text
ai_status = generated
ai_model = gpt-5-mini
ai_report = populated JSON
ai_generated_at = populated
website_snapshot_used = true or false
```

A value of `fallback_error` means the lead was saved but the model call failed. The visitor still received a deterministic report.

## 7. Review production logs

Check Vercel Function logs for:

```text
AI report generation failed
Website snapshot unavailable
Supabase AI report update failed
```

The last message usually means the Supabase migration has not been applied.

## 8. Update privacy language

Before promoting the tool, ensure the public privacy policy states that:

- questionnaire and contact data are used to generate the requested report;
- a limited public snapshot of the submitted website may be reviewed;
- an AI provider may process the supplied information to generate the report;
- the user can unsubscribe from marketing follow-up.

## Rollback

Remove `OPENAI_API_KEY` from Vercel and redeploy. The app will continue working with the deterministic detailed report while the AI integration is disabled.
