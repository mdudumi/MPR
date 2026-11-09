-- Workbook-sourced May 2025 Drilling Update. Apply after 202609160012.
with p as (select id from public.reporting_periods where period_date='2025-05-01')
insert into public.drilling_wells(reporting_period_id,rig,well,primary_target,operation,northing,easting,final_depth_md,spud_at,rig_release_at)
select p.id,v.rig,v.well,v.primary_target,v.operation,v.northing,v.easting,v.final_depth_md,v.spud_at,v.rig_release_at from p cross join (values
 ('QL4002','6002:Drz','De','New Well',4506533.3::numeric,386302.9::numeric,2468::numeric,'2025-05-18 00:00:00+00'::timestamptz,'2025-06-02 23:59:00+00'::timestamptz),
 ('QL4002','6189:Drz','D3U','New Well',4506540::numeric,386280.8::numeric,2118::numeric,'2025-05-04 12:00:00+00'::timestamptz,'2025-05-17 23:59:00+00'::timestamptz)
) as v(rig,well,primary_target,operation,northing,easting,final_depth_md,spud_at,rig_release_at)
on conflict (reporting_period_id,rig,well) do update set primary_target=excluded.primary_target,operation=excluded.operation,northing=excluded.northing,easting=excluded.easting,final_depth_md=excluded.final_depth_md,spud_at=excluded.spud_at,rig_release_at=excluded.rig_release_at,updated_at=now();
