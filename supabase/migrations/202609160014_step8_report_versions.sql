-- Step 8: immutable composed-report versions. Operational values remain in their owning tables.
create table public.monthly_report_versions (
  id uuid primary key default gen_random_uuid(),
  reporting_period_id uuid not null references public.reporting_periods(id) on delete restrict,
  version_number integer not null check (version_number > 0),
  status text not null default 'DRAFT' check (status in ('DRAFT','FINALIZED','LOCKED')),
  snapshot jsonb not null,
  revision_reason text,
  created_by uuid references public.profiles(id), created_at timestamptz not null default now(),
  finalized_by uuid references public.profiles(id), finalized_at timestamptz,
  unique(reporting_period_id,version_number)
);
create table public.monthly_report_comments (
  id uuid primary key default gen_random_uuid(), reporting_period_id uuid not null references public.reporting_periods(id) on delete cascade,
  comment_type text not null default 'REPORT_NOTE', content text not null, created_by uuid references public.profiles(id), created_at timestamptz not null default now()
);
alter table public.monthly_report_versions enable row level security;
alter table public.monthly_report_comments enable row level security;
create policy "report versions read" on public.monthly_report_versions for select using (public.has_role('ADMIN') or public.has_role('REPORTING_MANAGER'));
create policy "report versions manage" on public.monthly_report_versions for all using (public.has_role('ADMIN') or public.has_role('REPORTING_MANAGER')) with check (public.has_role('ADMIN') or public.has_role('REPORTING_MANAGER'));
create policy "report comments read" on public.monthly_report_comments for select using (public.has_role('ADMIN') or public.has_role('REPORTING_MANAGER'));
create policy "report comments manage" on public.monthly_report_comments for all using (public.has_role('ADMIN') or public.has_role('REPORTING_MANAGER')) with check (public.has_role('ADMIN') or public.has_role('REPORTING_MANAGER'));
