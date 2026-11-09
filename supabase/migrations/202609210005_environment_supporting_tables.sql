-- Supporting environmental tables retain the workbook structure while remaining
-- separate from the monthly incident and narrative report.
create table if not exists public.environment_supporting_tables (
  id uuid primary key default gen_random_uuid(),
  reporting_period_id uuid not null references public.reporting_periods(id) on delete cascade,
  table_number smallint not null check (table_number between 1 and 6),
  table_title text not null,
  table_data jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reporting_period_id, table_number)
);
alter table public.environment_supporting_tables enable row level security;
drop policy if exists "environment supporting tables view" on public.environment_supporting_tables;
drop policy if exists "environment supporting tables edit" on public.environment_supporting_tables;
create policy "environment supporting tables view" on public.environment_supporting_tables for select using (auth.uid() is not null);
create policy "environment supporting tables edit" on public.environment_supporting_tables for all using (public.can_edit_department('ENVIRONMENT')) with check (public.can_edit_department('ENVIRONMENT'));

with period as (select id from public.reporting_periods where period_date='2025-05-01')
insert into public.environment_supporting_tables (reporting_period_id,table_number,table_title,table_data)
select period.id, v.table_number, v.table_title, v.table_data::jsonb from period cross join (values
 (1,'Inputs to active Ecology Pits','[{"ecopit":"Ecopit 3","emulsion_m3":345.63,"mixed_liquid_m3":137.84},{"ecopit":"Ecopit 8","emulsion_m3":1616.84,"produced_sand_m3":44,"bottom_tank_sludge_m3":1521.07,"sludge_m3":478.13}]'),
 (2,'Recorded Inputs/Outputs to all Ecology Pit locations','[{"ecopit":"Ecopit 3","liquid_material_m3":345.63,"mixed_liquid_m3":137.84,"water_emulsion_m3":1265.56},{"ecopit":"Ecopit 8","liquid_material_m3":1616.84,"mixed_liquid_m3":2043.20,"sludge_m3":25.25,"water_emulsion_m3":846.71}]'),
 (3,'Recorded Inputs of Waste Processed at Waste Management Facilities','[{"equipment":"Sludge treatment BPAL","waste":"Sludge + Oily waste","unit":"m³","volume_treated":1563.52},{"equipment":"Recycling and incineration facility","waste":"Incinerator","unit":"t","volume_treated":19.6},{"equipment":"Antea Cement Sludge Treatment","waste":"Sludge and Oily waste","unit":"m³","volume_treated":25.25},{"equipment":"BPAL sewage treatment plant","waste":"Sewage","unit":"t","volume_treated":214}]'),
 (4,'Sum of Drilling Mud and Cuttings to Ecopits','[{"period":"May 2025","volume_m3":0}]'),
 (5,'Recorded Inputs and Waste Processed at BPAL Dewatering facility','[{"period":"May 2025","delivered_to_drying_area_m3":671,"water_out_of_centrifuge_to_drilling_m3":0}]'),
 (6,'Calculated gaseous emissions in the oilfield for May 2025','[{"total_quantity_generated_m3":2849608.6,"produced_energy_m3":1368341.2,"free_up_spaces_m3":520163,"vented_gases_m3":961103.4,"CH4_tonnes":10.78,"NOx_tonnes":18.40,"SOx_tonnes":202.45,"PM10_tonnes":0.20,"PM2.5_tonnes":0.14,"CO_tonnes":16.24,"Benzene_tonnes":57.23,"Toluene_tonnes":57.30,"Ethyl_benzene_tonnes":57.14,"Xylenes_tonnes":58.26,"H2S_tonnes":56.97,"Mercaptans_tonnes":56.99,"CO2_tonnes":3831.36}]')
) v(table_number,table_title,table_data) on conflict (reporting_period_id,table_number) do update set table_title=excluded.table_title,table_data=excluded.table_data,updated_at=now();
