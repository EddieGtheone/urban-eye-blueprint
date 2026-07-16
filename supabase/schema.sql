-- Urban Eye Business Modernization Blueprint
-- Apply in a dedicated migration. Public clients never write directly to this table.

create extension if not exists pgcrypto;

create table if not exists public.blueprint_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source text not null default 'business-modernization-blueprint',
  status text not null default 'new' check (status in ('new','reviewed','contacted','qualified','nurture','converted','closed')),

  name text not null,
  email text not null,
  company text not null,
  website text,
  role text,
  timeline text not null,
  business_model text,
  primary_goal text,

  primary_service text not null,
  primary_pillar text not null check (primary_pillar in ('website','commerce','marketing','technology')),
  secondary_pillar text not null check (secondary_pillar in ('website','commerce','marketing','technology')),
  urgency text not null check (urgency in ('Focused','Important','Immediate')),
  fit_score integer not null default 0 check (fit_score between 0 and 100),
  lead_temperature text not null default 'nurture' check (lead_temperature in ('hot','warm','nurture')),

  answers jsonb not null default '{}'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  blueprint_result jsonb not null default '{}'::jsonb,
  utm jsonb not null default '{}'::jsonb,

  page_url text,
  referrer text,
  consent_at timestamptz not null,
  ip_hash text,
  user_agent text,

  owner_id uuid references auth.users(id) on delete set null,
  lead_id uuid,
  quote_submission_id uuid,
  notes text
);

create index if not exists blueprint_submissions_created_at_idx on public.blueprint_submissions (created_at desc);
create index if not exists blueprint_submissions_status_idx on public.blueprint_submissions (status);
create index if not exists blueprint_submissions_service_idx on public.blueprint_submissions (primary_service);
create index if not exists blueprint_submissions_temperature_idx on public.blueprint_submissions (lead_temperature, fit_score desc);
create index if not exists blueprint_submissions_email_idx on public.blueprint_submissions (lower(email));

alter table public.blueprint_submissions enable row level security;

-- Intentionally no anon or authenticated policies in the lead-magnet project.
-- The Next.js Route Handler writes with the server-only service role.
-- Read access should be added only from Urban Eye Admin using role-aware policies.

revoke all on table public.blueprint_submissions from anon, authenticated;

create or replace function public.set_blueprint_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_blueprint_submissions_updated_at on public.blueprint_submissions;
create trigger set_blueprint_submissions_updated_at
before update on public.blueprint_submissions
for each row execute function public.set_blueprint_updated_at();

comment on table public.blueprint_submissions is
'Qualified lead and deterministic recommendation record created by the Urban Eye Business Modernization Blueprint.';
