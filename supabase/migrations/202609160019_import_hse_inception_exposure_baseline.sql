-- Workbook-backed inception exposure baseline for the May 2025 HSSC&E frequency calculation.
-- The value is separate from monthly source hours so the system does not ask staff to re-enter history.
create table public.hse_exposure_inception_baselines (
  id boolean primary key default true check (id),
  bankers_hours numeric(16,2) not null check (bankers_hours >= 0),
  contractor_hours numeric(16,2) not null check (contractor_hours >= 0),
  source_reference text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.hse_exposure_inception_baselines enable row level security;
create policy "hse exposure baseline read" on public.hse_exposure_inception_baselines for select using (public.can_access_department('HSE'));
create policy "hse exposure baseline administer" on public.hse_exposure_inception_baselines for all using (public.has_role('ADMIN')) with check (public.has_role('ADMIN'));

-- Workbook ITD (May 2025): Bankers 17,715,553 and Contractors 46,933,338.
-- Subtract the already-imported April and May monthly hours so the application adds each monthly value exactly once.
insert into public.hse_exposure_inception_baselines(id,bankers_hours,contractor_hours,source_reference)
values(true,17565993,46657763,'Health and Safety Summary May 2025 — Table 1.1-4 Exposure Hours')
on conflict (id) do update set bankers_hours=excluded.bankers_hours,contractor_hours=excluded.contractor_hours,source_reference=excluded.source_reference,updated_at=now();
