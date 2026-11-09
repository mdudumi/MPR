-- Complete Table 3 rows from the May and June environmental worksheets.
update public.environment_supporting_tables t
set table_data = '[
  {"equipment":"Sludge treatment BPAL","method":"","waste":"Sludge + Oily waste","unit":"m³","volume_treated":1563.52,"ash_solid_weight_ton":0,"destination":"N/A"},
  {"equipment":"Recycling and incineration facility","method":"Burned","waste":"Incinerator","unit":"t","volume_treated":19.6,"ash_solid_weight_ton":0,"destination":"N/A"},
  {"equipment":"Recycling and incineration facility","method":"Recycled","waste":"Cardboard","unit":"m³","volume_treated":0,"ash_solid_weight_ton":0,"destination":"N/A"},
  {"equipment":"Recycling and incineration facility","method":"Recycled","waste":"Cement bags","unit":"m³","volume_treated":0,"ash_solid_weight_ton":0,"destination":"N/A"},
  {"equipment":"Recycling and incineration facility","method":"Recycled","waste":"Plastic","unit":"m³","volume_treated":0,"ash_solid_weight_ton":0,"destination":"N/A"},
  {"equipment":"Antea Cement Sludge Treatment","method":"","waste":"Sludge and Oily waste","unit":"m³","volume_treated":25.25,"ash_solid_weight_ton":0,"destination":"N/A"},
  {"equipment":"BPAL sewage treatment plant","method":"","waste":"Sewage","unit":"t","volume_treated":214,"ash_solid_weight_ton":0,"destination":"N/A"}
]'::jsonb
where t.reporting_period_id = (select id from public.reporting_periods where period_date = '2025-05-01') and t.table_number = 3;

update public.environment_supporting_tables t
set table_data = '[
  {"equipment":"Sludge treatment BPAL","method":"","waste":"Sludge + Oily waste","unit":"m³","volume_treated":1352.09,"ash_solid_weight_ton":0,"destination":"N/A"},
  {"equipment":"Recycling and incineration facility","method":"Burned","waste":"Incinerator","unit":"t","volume_treated":21.49,"ash_solid_weight_ton":0,"destination":"N/A"},
  {"equipment":"Recycling and incineration facility","method":"Recycled","waste":"Cardboard","unit":"m³","volume_treated":0,"ash_solid_weight_ton":0,"destination":"N/A"},
  {"equipment":"Recycling and incineration facility","method":"Recycled","waste":"Cement bags","unit":"m³","volume_treated":0,"ash_solid_weight_ton":0,"destination":"N/A"},
  {"equipment":"Recycling and incineration facility","method":"Recycled","waste":"Plastic","unit":"m³","volume_treated":0,"ash_solid_weight_ton":0,"destination":"N/A"},
  {"equipment":"Antea Cement Sludge Treatment","method":"","waste":"Sludge and Oily waste","unit":"m³","volume_treated":25.25,"ash_solid_weight_ton":0,"destination":"N/A"},
  {"equipment":"BPAL sewage treatment plant","method":"","waste":"Sewage","unit":"t","volume_treated":200.46,"ash_solid_weight_ton":0,"destination":"N/A"}
]'::jsonb
where t.reporting_period_id = (select id from public.reporting_periods where period_date = '2025-06-01') and t.table_number = 3;
