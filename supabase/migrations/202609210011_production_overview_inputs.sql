-- Additional workbook fields used to generate the Production Overview narrative.
alter table public.production_monthly
  add column if not exists pep_tonne numeric(16,3),
  add column if not exists gasoil_solar_m3 numeric(16,3),
  add column if not exists sales_total_m3 numeric(16,3),
  add column if not exists export_sales_m3 numeric(16,3),
  add column if not exists pep_asp_deliveries_m3 numeric(16,3),
  add column if not exists global_oil_sales_m3 numeric(16,3),
  add column if not exists rbh_sales_m3 numeric(16,3),
  add column if not exists inventory_start_m3 numeric(16,3),
  add column if not exists inventory_end_m3 numeric(16,3),
  add column if not exists oil_proration_percent numeric(8,4),
  add column if not exists water_proration_percent numeric(8,4),
  add column if not exists m3_to_bbl_factor numeric(12,6) not null default 6.2898;
