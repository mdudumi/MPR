-- Step 6: Facilities preserves the workbook's three monthly narrative sections.
-- No project/status/progress tables are introduced because the supplied Facilities worksheet contains none.

alter table public.facilities_monthly_reports enable row level security;
drop policy if exists "facilities report access" on public.facilities_monthly_reports;
create policy "facilities report read" on public.facilities_monthly_reports for select using (public.can_access_department('FACILITIES'));
create policy "facilities report edit" on public.facilities_monthly_reports for all using (public.is_department_period_editable(reporting_period_id,'FACILITIES')) with check (public.is_department_period_editable(reporting_period_id,'FACILITIES'));
