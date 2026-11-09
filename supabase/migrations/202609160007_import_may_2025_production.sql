-- Workbook-sourced initial Production data for May 2025, with January-April retained for correct YTD/previous-month views.
-- Apply after 202609160001 through 202609160006.

insert into public.reporting_periods (period_date)
values ('2025-01-01'),('2025-02-01'),('2025-03-01'),('2025-04-01'),('2025-05-01')
on conflict (period_date) do nothing;

insert into public.monthly_submissions (reporting_period_id, department_id)
select p.id, d.id from public.reporting_periods p cross join public.departments d
where p.period_date between '2025-01-01' and '2025-05-01'
on conflict (reporting_period_id, department_id) do nothing;

with source(period_date, net_oil_tonne, net_oil_m3, net_oil_bbl, water_m3, sand_m3, gas_nm3, days_on_production) as (
  values
  ('2025-01-01'::date,41347.9,40810.6,256792.3,426369.3,210.8,3674249.9,12063.7),
  ('2025-02-01'::date,39903.7,39369.7,247725.5,390256.2,189.6,2943321.6,10993.2),
  ('2025-03-01'::date,43036.0,42547.4,267729.4,425973.0,195.4,3173038.3,11974.145833333334),
  ('2025-04-01'::date,41456.8,40813.9,256821.0,406006.7,185.3,3108363.8,11569.5),
  ('2025-05-01'::date,43124.7,42649.4,268372.0,366978.7,208.8,3646814.0,12197.2)
)
insert into public.production_monthly (reporting_period_id,net_oil_tonne,net_oil_m3,net_oil_bbl,water_m3,sand_m3,gas_nm3,days_on_production,source_type,source_reference)
select p.id,s.net_oil_tonne,s.net_oil_m3,s.net_oil_bbl,s.water_m3,s.sand_m3,s.gas_nm3,s.days_on_production,'IMPORTED','Production Overview 2.2 Production 2025 Figures'
from source s join public.reporting_periods p on p.period_date=s.period_date
on conflict (reporting_period_id) do update set net_oil_tonne=excluded.net_oil_tonne,net_oil_m3=excluded.net_oil_m3,net_oil_bbl=excluded.net_oil_bbl,water_m3=excluded.water_m3,sand_m3=excluded.sand_m3,gas_nm3=excluded.gas_nm3,days_on_production=excluded.days_on_production,source_type=excluded.source_type,source_reference=excluded.source_reference,updated_at=now();

with source(period_date, oil_actual_bbl) as (
  values ('2025-01-01'::date,256792.3446476066),('2025-02-01'::date,247725.5),('2025-03-01'::date,267729.4),('2025-04-01'::date,256821.0),('2025-05-01'::date,268372.0341452994)
)
insert into public.production_history(period_date,oil_actual_bbl,import_source,source_reference,source_type)
select period_date,oil_actual_bbl,'Monthly Progress Report May 2025.xlsx','Raw Data Production','IMPORTED' from source
on conflict (period_date) do update set oil_actual_bbl=excluded.oil_actual_bbl,import_source=excluded.import_source,source_reference=excluded.source_reference,source_type=excluded.source_type;

insert into public.production_narratives (reporting_period_id,section_code,content)
select p.id,'OVERVIEW',jsonb_build_object('html','<p>Net oil production for the month was 42,649.4 m³ (268,372.0 bbl), which equates to an average of 8,657.2 bopd average oil.</p><p>Pre-existing production (PEP) for the month was 751.1 tonne.</p><p>Total gasoil/solar, only solar used during this month, was 958.98 m³ (6,034.4 bbl), which is 2.24% of net oil production.</p><p>The net oil inventory in the month increased from 31,612.7 m³ to 31,719.4 m³.</p><p>Oil proration factor for this month was 91.029%, while water proration was 105.688%.</p>')
from public.reporting_periods p where p.period_date='2025-05-01'
on conflict (reporting_period_id,section_code) do update set content=excluded.content,updated_at=now();
