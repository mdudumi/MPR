alter table public.production_operations_summary
  add column if not exists produced_oil_density_g_cm3 numeric(16,6),
  add column if not exists produced_oil_api numeric(16,4),
  add column if not exists delivery_oil_density_g_cm3 numeric(16,6),
  add column if not exists delivery_oil_api numeric(16,4),
  add column if not exists diluent_density_g_cm3 numeric(16,6),
  add column if not exists diluent_api numeric(16,4),
  add column if not exists completed_production_wells text;
