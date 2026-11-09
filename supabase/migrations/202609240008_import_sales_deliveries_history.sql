insert into public.reporting_periods (period_date)
values ('2024-12-01'),('2025-01-01'),('2025-02-01'),('2025-03-01'),('2025-04-01'),('2025-05-01')
on conflict (period_date) do nothing;

with source(period_date, delivery_type, gross_quantity_m3, average_water_cut_percent, net_oil_tonne, net_oil_m3, net_oil_bbl, average_api_gravity) as (values
 ('2024-12-01'::date,'EXPORT_SALES',494114.0,1.4,490784.0,487075.4,3064646.5,8.6),
 ('2025-01-01','EXPORT_SALES',43309.0,1.6,42877.4,42624.2,268189.1,8.9),('2025-02-01','EXPORT_SALES',43267.1,1.2,43047.4,42754.5,269009.1,8.8),('2025-03-01','EXPORT_SALES',41315.4,1.4,40995.6,40732.9,256289.2,8.8),('2025-04-01','EXPORT_SALES',40590.9,1.4,40017.5,39760.9,250173.6,8.8),('2025-05-01','EXPORT_SALES',40168.2,1.3,39934.5,39643.3,249433.7,8.7),
 ('2024-12-01','DOMESTIC_SALES',2578.9,2.1,4160.1,NULL,25976.7,8.7),
 ('2024-12-01','PEP_ASP_DELIVERIES',33316.8,2.0,32941.5,32647.5,205641.6,8.6),('2025-01-01','PEP_ASP_DELIVERIES',2272.9,1.9,2247.5,2229.7,14044.9,8.8),('2025-02-01','PEP_ASP_DELIVERIES',2230.8,1.5,2218.2,2197.3,13840.5,8.6),('2025-03-01','PEP_ASP_DELIVERIES',3449.3,2.0,3409.6,3380.4,21293.3,8.7),('2025-04-01','PEP_ASP_DELIVERIES',3452.8,2.1,3406.3,3381.6,21300.0,8.9),('2025-05-01','PEP_ASP_DELIVERIES',3437.9,1.9,3400.6,3371.4,21236.7,8.7)
)
insert into public.sales_delivery_reporting_monthly (reporting_period_id, delivery_type, gross_quantity_m3, average_water_cut_percent, net_oil_tonne, net_oil_m3, net_oil_bbl, average_api_gravity, source_type)
select p.id,s.delivery_type::public.sales_delivery_type,s.gross_quantity_m3,s.average_water_cut_percent,s.net_oil_tonne,s.net_oil_m3,s.net_oil_bbl,s.average_api_gravity,'IMPORTED'
from source s join public.reporting_periods p on p.period_date=s.period_date
on conflict (reporting_period_id, delivery_type) do update set gross_quantity_m3=excluded.gross_quantity_m3, average_water_cut_percent=excluded.average_water_cut_percent, net_oil_tonne=excluded.net_oil_tonne, net_oil_m3=excluded.net_oil_m3, net_oil_bbl=excluded.net_oil_bbl, average_api_gravity=excluded.average_api_gravity, source_type=excluded.source_type;
