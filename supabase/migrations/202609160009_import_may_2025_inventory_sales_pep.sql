-- Workbook-sourced May 2025 values for sections 2.3–2.7. Apply after migration 008.
with p as (select id from public.reporting_periods where period_date='2025-05-01')
insert into public.crude_oil_inventory_monthly(reporting_period_id,location,quantity_m3,source_type,source_reference)
select p.id,v.location,v.quantity_m3,'IMPORTED','Inventory,Activities,Sales,PEP 2.3 Crude Oil Inventory' from p cross join (values
 ('Pad D',2948.9266666666663::numeric),('New Pads',1672.68),('Pad H, CTF',14665.926666666666),('Re-Active Wells',897.37),('Fieri Hub',1458.27),('PIA',5658.41),('In hole to be Recovered',371.0424342818951),('Sludge, Sat 3',3579.9966666666664),('Diluent',466.78)
) as v(location,quantity_m3)
on conflict (reporting_period_id,location) do update set quantity_m3=excluded.quantity_m3,source_type=excluded.source_type,source_reference=excluded.source_reference,updated_at=now();

with p as (select id from public.reporting_periods where period_date='2025-05-01')
insert into public.water_inventory_monthly(reporting_period_id,location,beginning_quantity_m3,ending_quantity_m3,source_type,source_reference)
select p.id,v.location,v.beginning_quantity_m3,v.ending_quantity_m3,'IMPORTED','Inventory,Activities,Sales,PEP 2.4 Water Inventory' from p cross join (values
 ('Pad D',5128.7367::numeric,4967.5::numeric),('New Pads',3221.204,3099.15),('Pad H, CTF',11253.0997,11326.5),('Re-Active Wells Inventory',1173.94216682225,783.17),('Fieri Hub Inventory',16.305,31.73),('Petrolifera Inventory',146.737,109.59),('In hole to be recovered',28566.810064102356,26041.36),('Sludge Inventory + Sat3',6425.2207,6275.5),('Diluent',0,null),('Injection Wells',4910,3496.76),('Polymer Injection',4530.5,4235.5),('Sludge Desorption',327,319),('Source Wells',1113,1292)
) as v(location,beginning_quantity_m3,ending_quantity_m3)
on conflict (reporting_period_id,location) do update set beginning_quantity_m3=excluded.beginning_quantity_m3,ending_quantity_m3=excluded.ending_quantity_m3,source_type=excluded.source_type,source_reference=excluded.source_reference,updated_at=now();

with p as (select id from public.reporting_periods where period_date='2025-05-01')
insert into public.production_operations_monthly(reporting_period_id,rig_name,operation_category,hours_spent,operation_count)
select p.id,v.rig_name,v.operation_category,v.hours_spent,v.operation_count from p cross join (values
 ('R80-1','MWO',480.5::numeric,8),('R80-1','REAC',94.5,1),('R80-1','WO',120.5,1),('R80-2','MWO',177,2),('R80-3','MWO',417,8),('R80-3','REAC',36,1),('RCT','MWO',18.8,4),('RIGL','MWO',2,1),('RSS17','MWO',200.5,27),('RSS17','FB',88.5,8),('RSS18','MWO',348,16)
) as v(rig_name,operation_category,hours_spent,operation_count)
on conflict (reporting_period_id,rig_name,operation_category) do update set hours_spent=excluded.hours_spent,operation_count=excluded.operation_count,updated_at=now();

with p as (select id from public.reporting_periods where period_date='2025-05-01')
insert into public.sales_delivery_reporting_monthly(reporting_period_id,delivery_type,gross_quantity_m3,average_water_cut_percent,net_oil_tonne,net_oil_m3,net_oil_bbl,average_api_gravity,source_type,source_reference)
select p.id,v.delivery_type::public.sales_delivery_type,v.gross_quantity_m3,v.average_water_cut_percent,v.net_oil_tonne,v.net_oil_m3,v.net_oil_bbl,v.average_api_gravity,'IMPORTED','Inventory,Activities,Sales,PEP 2.6 Sales Deliveries' from p cross join (values
 ('EXPORT_SALES',40168.191::numeric,1.31,39934.526,39643.302,249433.67,8.73),('DOMESTIC_SALES',null,null,null,null,null,null),('PEP_ASP_DELIVERIES',3437.886,1.93,3400.568,3371.359,21236.7,8.73)
) as v(delivery_type,gross_quantity_m3,average_water_cut_percent,net_oil_tonne,net_oil_m3,net_oil_bbl,average_api_gravity)
on conflict (reporting_period_id,delivery_type) do update set gross_quantity_m3=excluded.gross_quantity_m3,average_water_cut_percent=excluded.average_water_cut_percent,net_oil_tonne=excluded.net_oil_tonne,net_oil_m3=excluded.net_oil_m3,net_oil_bbl=excluded.net_oil_bbl,average_api_gravity=excluded.average_api_gravity,source_type=excluded.source_type,source_reference=excluded.source_reference,updated_at=now();

with p as (select id from public.reporting_periods where period_date='2025-05-01')
insert into public.pep_asp_reporting_monthly(reporting_period_id,pep_quantity_tonne,asp_rate,pep_assumed_m3_per_tonne,source_type,source_reference)
select p.id,759.4,0.03,1,'IMPORTED','Inventory,Activities,Sales,PEP 2.7 Albpetrol Pre-Existing PEP & Share of Production ASP' from p
on conflict (reporting_period_id) do update set pep_quantity_tonne=excluded.pep_quantity_tonne,asp_rate=excluded.asp_rate,pep_assumed_m3_per_tonne=excluded.pep_assumed_m3_per_tonne,source_type=excluded.source_type,source_reference=excluded.source_reference,updated_at=now();
