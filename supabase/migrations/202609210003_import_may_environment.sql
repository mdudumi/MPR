-- May 2025 Environmental report import.
with period as (select id from public.reporting_periods where period_date = '2025-05-01')
insert into public.environment_monthly_reports (reporting_period_id, environmental_incident_count, operations_support, incidents_breakdown, environmental_incidents, monitoring_program)
select id, 3,
  '{"html":"<ul><li>Ongoing site audits and inspections, including water, noise and air monitoring and sampling, environmental compliance audits, lease and well site inspections.</li><li>Monitoring of fluid levels in ecopits and wet mud facility.</li><li>The Ecology pits receiving waste this month were Ecopit 3 and 8.</li><li>The value for all other pits was zero.</li><li>Ongoing monitoring and response to environmental incidents, spills and community grievances.</li><li>Supervision and management of ongoing regulatory requests for information.</li><li>Communication with the National Environmental Agency for permitting matters.</li><li>Lease remediation and material reuse: 11332 m³ of clean soil stored near Pad D was reused during photovoltaics lease construction.</li></ul>"}'::jsonb,
  '{"html":"See imported Environmental incident detail records for May 2025."}'::jsonb,
  '{"html":"There were 03 reportable environmental incidents this month."}'::jsonb,
  '{"html":"<ul><li>Environmental monitoring programme ongoing.</li><li>Completed monitoring programme with third parties.</li><li>Continued work for the 3, 6 monthly and yearly reports to the regulators.</li></ul>"}'::jsonb
from period on conflict (reporting_period_id) do update set environmental_incident_count=excluded.environmental_incident_count, operations_support=excluded.operations_support, incidents_breakdown=excluded.incidents_breakdown, environmental_incidents=excluded.environmental_incidents, monitoring_program=excluded.monitoring_program;

with period as (select id from public.reporting_periods where period_date = '2025-05-01')
insert into public.environment_incident_details (reporting_period_id, incident_date, incident, description)
select id, v.incident_date, v.incident, v.description from period cross join (values
 ('2025-05-07'::date,'ALB0525ENV009','200 liters of emulsion spilt on lease M30A following the failure due to corrosion of emulsion line.'),
 ('2025-05-07'::date,'ALB0525ENV010','Approximately 300 liters of emulsion spilt near lease 753-M following the failure of an emulsion line.'),
 ('2025-05-27'::date,'ALB0525ENV011','Approximately 1000 liters of emulsion spilt on lease 2182-M. Apparently the incident was connected with cementing process taking place at well 6002.')
) v(incident_date,incident,description) where not exists (select 1 from public.environment_incident_details d where d.reporting_period_id=period.id and d.incident=v.incident);

with period as (select id from public.reporting_periods where period_date = '2025-05-01')
insert into public.environment_ecopit_monthly_values (reporting_period_id, ecopit, waste_type, quantity_m3)
select period.id, v.ecopit, v.waste_type, v.quantity_m3 from period cross join (values
 ('Ecopit 3','EMULSION',345.63::numeric), ('Ecopit 3','BOTTOM_TANK_SLUDGE',137.84::numeric),
 ('Ecopit 8','EMULSION',1616.84::numeric), ('Ecopit 8','PRODUCED_SAND',44::numeric), ('Ecopit 8','SLUDGE',478.13::numeric), ('Ecopit 8','BOTTOM_TANK_SLUDGE',1521.07::numeric)
) v(ecopit,waste_type,quantity_m3) on conflict (reporting_period_id,ecopit,waste_type) do update set quantity_m3=excluded.quantity_m3;
