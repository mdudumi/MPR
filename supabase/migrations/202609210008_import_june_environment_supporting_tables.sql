-- June 2025 supporting tables. May was seeded separately, so June needs its own rows.
with period as (select id from public.reporting_periods where period_date = '2025-06-01')
insert into public.environment_supporting_tables (reporting_period_id, table_number, table_title, table_data)
select period.id, v.table_number, v.table_title, v.table_data::jsonb
from period cross join (values
  (1, 'Inputs to active Ecology Pits', '[
    {"ecopit":"Ecopit 3","chemical_m3":0,"emulsion_m3":351.16,"bottom_tank_sludge_m3":58.73},
    {"ecopit":"Ecopit 7","emulsion_m3":4.71},
    {"ecopit":"Ecopit 8","chemical_m3":4.27,"emulsion_m3":1360.22,"produced_sand_m3":58.59,"bottom_tank_sludge_m3":986.81,"sludge_m3":687.30}
  ]'),
  (2, 'Recorded Inputs/Outputs to all Ecology Pit locations', '[
    {"ecopit":"Ecopit 3","liquid_material_m3":351.16,"mixed_liquid_m3":58.73,"water_emulsion_m3":1109.01,"water_emulsion_destination":"Dust Control / Sludge treatment"},
    {"ecopit":"Ecopit 4","water_emulsion_m3":328,"water_emulsion_destination":"Ecopit 3"},
    {"ecopit":"Ecopit 7","liquid_material_m3":4.71},
    {"ecopit":"Ecopit 8","liquid_material_m3":1544.49,"mixed_liquid_m3":1858.70,"water_emulsion_m3":160.87,"water_emulsion_destination":"Ecopit 3"}
  ]'),
  (3, 'Recorded Inputs of Waste Processed at Waste Management Facilities', '[
    {"equipment":"Sludge treatment BPAL","method":"","waste":"Sludge + Oily waste","unit":"m³","volume_treated":1352.09,"ash_solid_weight_ton":0,"destination":"N/A"},
    {"equipment":"Recycling and incineration facility","method":"Burned","waste":"Incinerator","unit":"t","volume_treated":21.49,"ash_solid_weight_ton":0,"destination":"N/A"},
    {"equipment":"Recycling and incineration facility","method":"Recycled","waste":"Cardboard","unit":"m³","volume_treated":0,"ash_solid_weight_ton":0,"destination":"N/A"},
    {"equipment":"Recycling and incineration facility","method":"Recycled","waste":"Cement bags","unit":"m³","volume_treated":0,"ash_solid_weight_ton":0,"destination":"N/A"},
    {"equipment":"Recycling and incineration facility","method":"Recycled","waste":"Plastic","unit":"m³","volume_treated":0,"ash_solid_weight_ton":0,"destination":"N/A"},
    {"equipment":"Antea Cement Sludge Treatment","method":"","waste":"Sludge and Oily waste","unit":"m³","volume_treated":25.25,"ash_solid_weight_ton":0,"destination":"N/A"},
    {"equipment":"BPAL sewage treatment plant","method":"","waste":"Sewage","unit":"t","volume_treated":200.46,"ash_solid_weight_ton":0,"destination":"N/A"}
  ]'),
  (4, 'Sum of Drilling Mud and Cuttings to Ecopits', '[{"period":"June 2025","volume_m3":0}]'),
  (5, 'Recorded Inputs and Waste Processed at BPAL Dewatering facility', '[{"period":"June 2025","delivered_to_drying_area_m3":299,"delivered_to_centrifuge_m3":0,"water_out_of_centrifuge_to_drilling_m3":0}]'),
  (6, 'Calculated gaseous emissions in the oilfield for June 2025', '[{"total_quantity_generated_m3":3568212.0,"produce_energy_m3":1313325.8,"free_up_spaces_m3":406650.0,"vented_gases_m3":1752835.1,"biologically_treated_gases_m3":0,"gases_transferred_other_subjects_m3":0,"CH4_tonnes":10.35,"NOx_tonnes":18.40,"SOx_tonnes":202.45,"PM10_tonnes":0.19,"PM2.5_tonnes":0.14,"CO_tonnes":16.22,"Benzene_tonnes":57.23,"Toluene_tonnes":57.30,"Ethyl_benzene_tonnes":57.14,"Xylenes_tonnes":58.26,"H2S_tonnes":56.97,"Mercaptans_tonnes":56.99,"CO2_tonnes":3677.31}]')
) v(table_number, table_title, table_data)
on conflict (reporting_period_id, table_number)
do update set table_title = excluded.table_title, table_data = excluded.table_data, updated_at = now();
