alter table public.production_monthly
  add column if not exists crude_oil_used_as_fuel_m3 numeric(16,3);
