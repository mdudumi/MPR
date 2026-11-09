create table if not exists public.production_operations_summary (
  reporting_period_id uuid primary key references public.reporting_periods(id) on delete cascade,
  producing_wells integer, horizontal_wells integer, vertical_wells integer,
  waiting_workover_wells text, wells_down_water_space text,
  produced_water_total_m3 numeric(16,3), produced_water_production_wells_m3 numeric(16,3), produced_water_source_wells_m3 numeric(16,3),
  disposed_water_total_m3 numeric(16,3), limestone_disposed_m3 numeric(16,3), sandstone_disposed_m3 numeric(16,3),
  polymer_wells_converted text, water_intrusion_identification text, polymer_injection_note text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.production_operations_summary enable row level security;
drop policy if exists "production operations summary access" on public.production_operations_summary;
create policy "production operations summary access" on public.production_operations_summary for all using (public.can_access_department('PRODUCTION')) with check (public.can_edit_department('PRODUCTION'));
