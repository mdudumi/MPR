-- May 2025 2.5 Production Operation Activities from the workbook.
with p as (select id from public.reporting_periods where period_date='2025-05-01')
insert into public.production_operations_monthly(reporting_period_id,rig_name,operation_category,hours_spent,operation_count)
select p.id,v.rig_name,v.operation_category,v.hours_spent,v.operation_count
from p cross join (values
  ('R80-1','MWO',480.5::numeric,8),
  ('R80-1','REAC',94.5,1),
  ('R80-1','WO',120.5,1),
  ('R80-2','MWO',177,2),
  ('R80-3','MWO',417,8),
  ('R80-3','REAC',36,1),
  ('RCT','MWO',18.8,4),
  ('RIGL','MWO',2,1),
  ('RSS17','MWO',200.5,27),
  ('RSS17','FB',88.5,8),
  ('RSS18','MWO',348,16)
) as v(rig_name,operation_category,hours_spent,operation_count)
on conflict (reporting_period_id,rig_name,operation_category)
do update set hours_spent=excluded.hours_spent, operation_count=excluded.operation_count, updated_at=now();
