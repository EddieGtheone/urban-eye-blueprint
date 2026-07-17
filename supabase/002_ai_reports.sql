-- Add AI-assisted detailed report storage to an existing Blueprint installation.

alter table public.blueprint_submissions
  add column if not exists ai_report jsonb,
  add column if not exists ai_status text,
  add column if not exists ai_model text,
  add column if not exists ai_generated_at timestamptz,
  add column if not exists website_snapshot_used boolean not null default false,
  add column if not exists ai_error text;

alter table public.blueprint_submissions
  drop constraint if exists blueprint_submissions_ai_status_check;

alter table public.blueprint_submissions
  add constraint blueprint_submissions_ai_status_check
  check (ai_status is null or ai_status in ('generated','fallback_no_key','fallback_error'));

comment on column public.blueprint_submissions.ai_report is
'Structured AI-assisted 90-day report generated from the questionnaire, deterministic scoring, and optional public website snapshot.';

comment on column public.blueprint_submissions.website_snapshot_used is
'True when a limited public homepage snapshot was supplied to the report generator.';
