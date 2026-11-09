-- June 2025 Security report import from the Monthly Progress Report workbook.
with period as (select id from public.reporting_periods where period_date = '2025-06-01')
insert into public.security_monthly_reports (
  reporting_period_id, security_incident_count, mobile_patrol_spot_checks,
  geofence_dispatches, gps_operator_spot_checks, storage_yard_spot_checks,
  inventory_checks, security_investigations, static_sites,
  operations_support, incidents_high_importance
)
select id, 0, 645, 129, 1233, 0, 0, 0, 27,
  '{"html":"<ul><li>There were 00 security incidents this month.</li><li>645 documented spot checks were carried out by the security mobile patrols on contractor tanker trucks. In addition there were numerous spot checks carried out on various types of contractor vehicles.</li><li>The six Mobile Patrols were dispatched 129 times this month for lease geo fence breaches.</li><li>1233 documented spot checks were conducted by the GPS operators.</li><li>0 documentation spot check was conducted at the New Storage Yard.</li><li>0 BPAL NSY Inventory checks were conducted this month.</li><li>0 security investigations were conducted this month.</li><li>The guard force provided security at 27 static sites.</li></ul>"}'::jsonb,
  '{"html":"<p>None</p>"}'::jsonb
from period
on conflict (reporting_period_id) do update set
  security_incident_count = excluded.security_incident_count,
  mobile_patrol_spot_checks = excluded.mobile_patrol_spot_checks,
  geofence_dispatches = excluded.geofence_dispatches,
  gps_operator_spot_checks = excluded.gps_operator_spot_checks,
  storage_yard_spot_checks = excluded.storage_yard_spot_checks,
  inventory_checks = excluded.inventory_checks,
  security_investigations = excluded.security_investigations,
  static_sites = excluded.static_sites,
  operations_support = excluded.operations_support,
  incidents_high_importance = excluded.incidents_high_importance;
