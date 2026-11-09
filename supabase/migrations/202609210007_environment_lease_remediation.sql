alter table public.environment_monthly_reports
  add column if not exists lease_remediation_material_reuse jsonb not null default '{"type":"doc","content":[]}'::jsonb;

update public.environment_monthly_reports r
set lease_remediation_material_reuse = '{"html":"<p>11332 m³ of clean soil stored near Pad D was reused during photovoltaics lease construction.</p>"}'::jsonb
where r.reporting_period_id = (select id from public.reporting_periods where period_date = '2025-05-01');

update public.environment_monthly_reports r
set lease_remediation_material_reuse = '{"html":"<p>6472 m³ of clean soil stored near Pad D was reused during photovoltaics lease construction.</p>"}'::jsonb
where r.reporting_period_id = (select id from public.reporting_periods where period_date = '2025-06-01');
