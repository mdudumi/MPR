create table if not exists public.production_polymer_injection_monthly (
  reporting_period_id uuid primary key references public.reporting_periods(id) on delete cascade,
  volume_polymer_solution_injected_m3 numeric(16,3),
  number_injector_wells numeric(16,3),
  average_injection_pressure_psi numeric(16,3),
  average_viscosity_cp numeric(16,3),
  number_offset_production_wells numeric(16,3),
  oil_produced_offset_wells_m3 numeric(16,3),
  water_produced_offset_wells_m3 numeric(16,3),
  gas_produced_offset_wells_m3 numeric(16,3),
  avg_oil_produced_offset_well_m3 numeric(16,3),
  average_water_cut_offset_wells_percent numeric(16,3),
  wells_using_source_water text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.production_polymer_injection_monthly enable row level security;
drop policy if exists "production polymer injection access" on public.production_polymer_injection_monthly;
create policy "production polymer injection access" on public.production_polymer_injection_monthly for all using (public.can_access_department('PRODUCTION')) with check (public.can_edit_department('PRODUCTION'));
