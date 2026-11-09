-- Step 7: the existing drilling_wells table already matches the workbook's Wells Drilled and Drill Times tables.
-- Retain it as the monthly report table; do not introduce a duplicate well master without a workbook-supported identifier.
alter table public.drilling_wells enable row level security;
drop policy if exists "drilling wells access" on public.drilling_wells;
create policy "drilling wells read" on public.drilling_wells for select using (public.can_access_department('DRILLING'));
create policy "drilling wells edit" on public.drilling_wells for all using (public.is_department_period_editable(reporting_period_id,'DRILLING')) with check (public.is_department_period_editable(reporting_period_id,'DRILLING'));
drop policy if exists "drilling report access" on public.drilling_monthly_reports;
create policy "drilling report read" on public.drilling_monthly_reports for select using (public.can_access_department('DRILLING'));
create policy "drilling report edit" on public.drilling_monthly_reports for all using (public.is_department_period_editable(reporting_period_id,'DRILLING')) with check (public.is_department_period_editable(reporting_period_id,'DRILLING'));
