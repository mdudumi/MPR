-- Workbook-sourced May 2025 drilling wells and drill times.
INSERT INTO public.drilling_wells (
  reporting_period_id, rig, well, primary_target, operation,
  northing, easting, final_depth_md, spud_at, rig_release_at
)
SELECT
  p.id, v.rig, v.well, v.primary_target, v.operation,
  v.northing, v.easting, v.final_depth_md, v.spud_at, v.rig_release_at
FROM public.reporting_periods p
CROSS JOIN (VALUES
  ('QL4002','6002:Drz',NULL,'New Well',4506533.0,380303.0,2468.0,'2025-05-18T00:00:00+00'::timestamptz,'2025-06-22T23:59:00+00'::timestamptz),
  ('QL4002','6189:Drz','D3U','New Well',4506540.0,386281.0,2118.0,'2025-05-04T12:00:00+00'::timestamptz,'2025-05-17T23:59:00+00'::timestamptz)
) AS v(rig,well,primary_target,operation,northing,easting,final_depth_md,spud_at,rig_release_at)
WHERE p.period_date = DATE '2025-05-01'
ON CONFLICT (reporting_period_id, rig, well)
DO UPDATE SET
  primary_target = EXCLUDED.primary_target,
  operation = EXCLUDED.operation,
  northing = EXCLUDED.northing,
  easting = EXCLUDED.easting,
  final_depth_md = EXCLUDED.final_depth_md,
  spud_at = EXCLUDED.spud_at,
  rig_release_at = EXCLUDED.rig_release_at,
  updated_at = NOW();
