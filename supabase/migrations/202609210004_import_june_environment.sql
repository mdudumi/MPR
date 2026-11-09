-- June 2025 Environmental report import.
with period as (select id from public.reporting_periods where period_date = '2025-06-01')
insert into public.environment_monthly_reports (reporting_period_id, environmental_incident_count, operations_support, incidents_breakdown, environmental_incidents, monitoring_program)
select id, 2,
  '{"html":"<ul><li>Ongoing site audits and inspections, including water, noise and air monitoring and sampling, environmental compliance audits, lease and well site inspections.</li><li>Monitoring of fluid levels in ecopits and wet mud facility.</li><li>The Ecology pits receiving waste this month were Ecopit 3 and 8.</li><li>The value for all other pits was zero.</li><li>Ongoing monitoring and response to environmental incidents, spills and community grievances.</li><li>Supervision and management of ongoing regulatory requests for information.</li><li>Communication with the National Environmental Agency for permitting matters.</li><li>Lease remediation and material reuse: 6472 m³ of clean soil stored near Pad D was reused during photovoltaics lease construction.</li></ul>"}'::jsonb,
  '{"html":"See imported Environmental incident detail records for June 2025."}'::jsonb,
  '{"html":"There were 02 reportable environmental incidents this month."}'::jsonb,
  '{"html":"<ul><li>Environmental monitoring programme ongoing.</li><li>Completed monitoring programme with third parties.</li><li>Continued work for the 3, 6 monthly and yearly reports to the regulators.</li></ul>"}'::jsonb
from period on conflict (reporting_period_id) do update set environmental_incident_count=excluded.environmental_incident_count, operations_support=excluded.operations_support, incidents_breakdown=excluded.incidents_breakdown, environmental_incidents=excluded.environmental_incidents, monitoring_program=excluded.monitoring_program;

with period as (select id from public.reporting_periods where period_date = '2025-06-01')
insert into public.environment_incident_details (reporting_period_id, incident_date, incident, description)
select id, v.incident_date, v.incident, v.description from period cross join (values
 ('2025-06-18'::date,'ALB0625ENV012','A spill of approximately 8000 liters of emulsion occurred off lease 735-M. The reason of incident was the failure due to corrosion of an 8" emulsion line.'),
 ('2025-06-30'::date,'ALB0625ENV013','A volume of approximately 2000 liters of emulsion was released off lease 719-M. 50 liters out of that volume is oil. The reason of incident was failure due to corrosion of an underground 6" emulsion line.')
) v(incident_date,incident,description) where not exists (select 1 from public.environment_incident_details d where d.reporting_period_id=period.id and d.incident=v.incident);

with period as (select id from public.reporting_periods where period_date = '2025-06-01')
insert into public.environment_ecopit_monthly_values (reporting_period_id, ecopit, waste_type, quantity_m3)
select period.id, v.ecopit, v.waste_type, v.quantity_m3 from period cross join (values
 ('Ecopit 3','EMULSION',351.16::numeric), ('Ecopit 3','BOTTOM_TANK_SLUDGE',58.73::numeric),
 ('Ecopit 7','EMULSION',4.71::numeric),
 ('Ecopit 8','CHEMICAL',4.27::numeric), ('Ecopit 8','EMULSION',1360.22::numeric), ('Ecopit 8','PRODUCED_SAND',58.59::numeric), ('Ecopit 8','SLUDGE',687.30::numeric), ('Ecopit 8','BOTTOM_TANK_SLUDGE',986.81::numeric)
) v(ecopit,waste_type,quantity_m3) on conflict (reporting_period_id,ecopit,waste_type) do update set quantity_m3=excluded.quantity_m3;
