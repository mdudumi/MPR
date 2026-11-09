-- Step 4: Production reporting. Extends the dedicated production tables from 202609160002.
-- The workbook uses monthly Net Oil (tonne, m3, bbl), Water, Sand, Gas and Days on Production.
-- Raw Data Production is retained as a monthly source dataset, never exposed as a routine entry form.

alter table public.production_monthly
  add column if not exists source_type text not null default 'MANUAL' check (source_type in ('MANUAL','IMPORTED','CALCULATED')),
  add column if not exists source_reference text,
  add column if not exists official_override_reason text,
  add column if not exists official_override_by uuid references public.profiles(id),
  add column if not exists official_override_at timestamptz;

alter table public.production_monthly
  add constraint production_monthly_net_oil_tonne_nonnegative check (net_oil_tonne is null or net_oil_tonne >= 0),
  add constraint production_monthly_net_oil_m3_nonnegative check (net_oil_m3 is null or net_oil_m3 >= 0),
  add constraint production_monthly_net_oil_bbl_nonnegative check (net_oil_bbl is null or net_oil_bbl >= 0),
  add constraint production_monthly_water_m3_nonnegative check (water_m3 is null or water_m3 >= 0),
  add constraint production_monthly_sand_m3_nonnegative check (sand_m3 is null or sand_m3 >= 0),
  add constraint production_monthly_gas_nm3_nonnegative check (gas_nm3 is null or gas_nm3 >= 0),
  add constraint production_monthly_days_nonnegative check (days_on_production is null or days_on_production >= 0);

create table public.production_narratives (
  reporting_period_id uuid not null references public.reporting_periods(id) on delete cascade,
  section_code text not null check (section_code in ('OVERVIEW')),
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id),
  primary key (reporting_period_id, section_code)
);

create index if not exists production_history_period_date_idx on public.production_history(period_date desc);
create index if not exists production_monthly_updated_idx on public.production_monthly(updated_at desc);

-- A safe import destination for Raw Data Production. `period_date` is one row per reporting month,
-- which is the actual granularity of the source worksheet. Formula-derived fields remain calculated.
alter table public.production_history
  add column if not exists source_reference text,
  add column if not exists source_type text not null default 'IMPORTED' check (source_type in ('IMPORTED','MANUAL'));

alter table public.production_history enable row level security;
alter table public.production_monthly enable row level security;
alter table public.production_plan_budget enable row level security;
alter table public.production_narratives enable row level security;

drop policy if exists "production access" on public.production_monthly;
create policy "production monthly read" on public.production_monthly for select using (public.can_access_department('PRODUCTION'));
create policy "production monthly edit" on public.production_monthly for all using (public.is_department_period_editable(reporting_period_id,'PRODUCTION')) with check (public.is_department_period_editable(reporting_period_id,'PRODUCTION'));
drop policy if exists "production plan access" on public.production_plan_budget;
create policy "production plan read" on public.production_plan_budget for select using (public.can_access_department('PRODUCTION'));
create policy "production plan edit" on public.production_plan_budget for all using (public.is_department_period_editable(reporting_period_id,'PRODUCTION')) with check (public.is_department_period_editable(reporting_period_id,'PRODUCTION'));
create policy "production narrative read" on public.production_narratives for select using (public.can_access_department('PRODUCTION'));
create policy "production narrative edit" on public.production_narratives for all using (public.is_department_period_editable(reporting_period_id,'PRODUCTION')) with check (public.is_department_period_editable(reporting_period_id,'PRODUCTION'));
drop policy if exists "production history access" on public.production_history;
create policy "production history read" on public.production_history for select using (public.can_access_department('PRODUCTION'));
create policy "production history import" on public.production_history for insert with check (public.has_role('ADMIN') or public.has_role('REPORTING_MANAGER'));
create policy "production history update" on public.production_history for update using (public.has_role('ADMIN') or public.has_role('REPORTING_MANAGER')) with check (public.has_role('ADMIN') or public.has_role('REPORTING_MANAGER'));

create or replace function public.set_production_submission_in_progress(p_period uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  -- Workbook values labelled "Days on Prod." are not limited to calendar days and may
  -- represent accumulated producing-well days. Preserve the source methodology.
  perform public.set_submission_in_progress(p_period, 'PRODUCTION');
end; $$;

insert into public.audit_logs(actor_id, action, entity_type, entity_id, changes)
select null, 'production_step4_schema', 'migration', '202609160006', jsonb_build_object('source','Monthly Progress Report May 2025.xlsx')
where not exists (select 1 from public.audit_logs where entity_id = '202609160006');
