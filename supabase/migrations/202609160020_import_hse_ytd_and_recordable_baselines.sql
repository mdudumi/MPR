-- Workbook-backed January–March 2025 HSSC&E history.
-- These values make the May 2025 Year-to-Date columns match the existing report
-- without asking staff to recreate historical monthly source data.

create table public.hse_incident_ytd_baselines (
  reporting_year integer not null check (reporting_year >= 2000),
  incident_type_id uuid not null references public.hse_incident_types(id) on delete cascade,
  incident_count integer not null default 0 check (incident_count >= 0),
  source_reference text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (reporting_year, incident_type_id)
);

create table public.hse_exposure_ytd_baselines (
  reporting_year integer primary key check (reporting_year >= 2000),
  bankers_hours numeric(16,2) not null check (bankers_hours >= 0),
  contractor_hours numeric(16,2) not null check (contractor_hours >= 0),
  source_reference text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Total Recordable is a distinct workbook measure, not the sum of the displayed
-- incident categories. It is retained independently so its historical basis and
-- frequency index remain consistent with the Excel report.
create table public.hse_monthly_recordables (
  reporting_period_id uuid primary key references public.reporting_periods(id) on delete cascade,
  total_recordable integer not null default 0 check (total_recordable >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hse_recordable_baselines (
  reporting_year integer primary key check (reporting_year >= 2000),
  ytd_total_recordable integer not null default 0 check (ytd_total_recordable >= 0),
  inception_total_recordable integer not null default 0 check (inception_total_recordable >= 0),
  source_reference text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hse_incident_ytd_baselines enable row level security;
alter table public.hse_exposure_ytd_baselines enable row level security;
alter table public.hse_monthly_recordables enable row level security;
alter table public.hse_recordable_baselines enable row level security;

create policy "hse incident ytd baseline read" on public.hse_incident_ytd_baselines for select using (public.can_access_department('HSE'));
create policy "hse incident ytd baseline administer" on public.hse_incident_ytd_baselines for all using (public.has_role('ADMIN')) with check (public.has_role('ADMIN'));
create policy "hse exposure ytd baseline read" on public.hse_exposure_ytd_baselines for select using (public.can_access_department('HSE'));
create policy "hse exposure ytd baseline administer" on public.hse_exposure_ytd_baselines for all using (public.has_role('ADMIN')) with check (public.has_role('ADMIN'));
create policy "hse monthly recordables read" on public.hse_monthly_recordables for select using (public.can_access_department('HSE'));
create policy "hse monthly recordables manage" on public.hse_monthly_recordables for all using (public.can_edit_department('HSE') and public.is_editable_period(reporting_period_id)) with check (public.can_edit_department('HSE') and public.is_editable_period(reporting_period_id));
create policy "hse recordable baseline read" on public.hse_recordable_baselines for select using (public.can_access_department('HSE'));
create policy "hse recordable baseline administer" on public.hse_recordable_baselines for all using (public.has_role('ADMIN')) with check (public.has_role('ADMIN'));

-- May workbook YTD less the already imported April and May monthly values.
insert into public.hse_incident_ytd_baselines(reporting_year, incident_type_id, incident_count, source_reference)
select 2025, id,
  case code when 'ENVIRONMENTAL' then 5 when 'SECURITY' then 2 when 'MOTOR_VEHICLE_ACCIDENTS' then 2 else 0 end,
  'Health and Safety Summary May 2025 — Table 1.1-1 HSSE Incident Summary'
from public.hse_incident_types
on conflict (reporting_year, incident_type_id) do update set incident_count=excluded.incident_count, source_reference=excluded.source_reference, updated_at=now();

-- Workbook YTD: Bankers 296,920 and Contractors 556,084.
-- Less April and May already stored: 149,560 and 275,575 respectively.
insert into public.hse_exposure_ytd_baselines(reporting_year, bankers_hours, contractor_hours, source_reference)
values (2025, 147360, 280509, 'Health and Safety Summary May 2025 — Table 1.1-4 Exposure Hours')
on conflict (reporting_year) do update set bankers_hours=excluded.bankers_hours, contractor_hours=excluded.contractor_hours, source_reference=excluded.source_reference, updated_at=now();

insert into public.hse_recordable_baselines(reporting_year, ytd_total_recordable, inception_total_recordable, source_reference)
values (2025, 0, 177, 'Health and Safety Summary May 2025 — Table 1.1-1 HSSE Incident Summary')
on conflict (reporting_year) do update set ytd_total_recordable=excluded.ytd_total_recordable, inception_total_recordable=excluded.inception_total_recordable, source_reference=excluded.source_reference, updated_at=now();

insert into public.hse_monthly_recordables(reporting_period_id, total_recordable)
select id, 0 from public.reporting_periods where period_date = '2025-05-01'
on conflict (reporting_period_id) do update set total_recordable=excluded.total_recordable, updated_at=now();
