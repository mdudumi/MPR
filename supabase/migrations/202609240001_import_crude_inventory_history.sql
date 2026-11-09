-- Historical rows used by the 2.3 Crude Oil Inventory table.
insert into public.reporting_periods (period_date)
values ('2024-12-01'),('2025-01-01'),('2025-02-01'),('2025-03-01'),('2025-04-01')
on conflict (period_date) do nothing;

with source(period_date, location, quantity_m3) as (values
 ('2024-12-01'::date,'Pad D',2987.2),('2024-12-01','New Pads',1757.5),('2024-12-01','Pad H, CTF',15003.4),('2024-12-01','Re-Active Wells',713.8),('2024-12-01','Fieri Hub',1431.7),('2024-12-01','PIA',12411.8),('2024-12-01','In hole to be Recovered',1003.7),('2024-12-01','Sludge, Sat 3',3785.6),('2024-12-01','Diluent',526.5),
 ('2025-01-01','Pad D',3019.6),('2025-01-01','New Pads',1702.7),('2025-01-01','Pad H, CTF',12998.6),('2025-01-01','Re-Active Wells',788.7),('2025-01-01','Fieri Hub',947.6),('2025-01-01','PIA',11955.4),('2025-01-01','In hole to be Recovered',981.4),('2025-01-01','Sludge, Sat 3',3994.0),('2025-01-01','Diluent',482.7),
 ('2025-02-01','Pad D',2992.9),('2025-02-01','New Pads',1715.8),('2025-02-01','Pad H, CTF',14262.4),('2025-02-01','Re-Active Wells',820.2),('2025-02-01','Fieri Hub',1069.8),('2025-02-01','PIA',6494.2),('2025-02-01','In hole to be Recovered',1005.1),('2025-02-01','Sludge, Sat 3',3678.9),('2025-02-01','Diluent',533.4),
 ('2025-03-01','Pad D',2998.6),('2025-03-01','New Pads',1778.8),('2025-03-01','Pad H, CTF',13266.4),('2025-03-01','Re-Active Wells',742.4),('2025-03-01','Fieri Hub',612.5),('2025-03-01','PIA',7645.9),('2025-03-01','In hole to be Recovered',956.3),('2025-03-01','Sludge, Sat 3',3856.7),('2025-03-01','Diluent',115.1),
 ('2025-04-01','Pad D',2962.5),('2025-04-01','New Pads',1722.1),('2025-04-01','Pad H, CTF',12369.2),('2025-04-01','Re-Active Wells',702.6),('2025-04-01','Fieri Hub',583.7),('2025-04-01','PIA',7576.3),('2025-04-01','In hole to be Recovered',1032.8),('2025-04-01','Sludge, Sat 3',3745.1),('2025-04-01','Diluent',918.5)
)
insert into public.crude_oil_inventory_monthly(reporting_period_id,location,quantity_m3,source_type,source_reference)
select p.id,s.location,s.quantity_m3,'IMPORTED','Crude Oil Inventory Summary 2.3' from source s join public.reporting_periods p on p.period_date=s.period_date
on conflict (reporting_period_id,location) do update set quantity_m3=excluded.quantity_m3,source_type=excluded.source_type,source_reference=excluded.source_reference,updated_at=now();
