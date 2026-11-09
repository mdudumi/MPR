create table if not exists public.production_formation_monthly (
  reporting_period_id uuid not null references public.reporting_periods(id) on delete cascade,
  formation text not null,
  active_wells numeric(16,3),
  average_oil_rate_m3_day numeric(16,3),
  total_production_percent numeric(16,4),
  primary key (reporting_period_id, formation)
);
alter table public.production_formation_monthly enable row level security;
drop policy if exists "production formation access" on public.production_formation_monthly;
create policy "production formation access" on public.production_formation_monthly for all using (public.can_access_department('PRODUCTION')) with check (public.can_edit_department('PRODUCTION'));

insert into public.production_formation_monthly (reporting_period_id, formation, active_wells, average_oil_rate_m3_day, total_production_percent)
select p.id, v.formation, v.active_wells, v.average_oil_rate_m3_day, v.total_production_percent
from public.reporting_periods p
join (values
  ('Driza',266,5.90,62.99),('Marinza 1',53,3.68,14.17),('Goran',61,4.17,18.50),('Marinza 2',2,2.92,0.43),('Bubullima',9,5.90,3.86),('Kuçova',1,0.69,0.050)
) v(formation,active_wells,average_oil_rate_m3_day,total_production_percent) on true
where p.period_date = '2025-05-01'
on conflict (reporting_period_id, formation) do update set active_wells=excluded.active_wells, average_oil_rate_m3_day=excluded.average_oil_rate_m3_day, total_production_percent=excluded.total_production_percent;
