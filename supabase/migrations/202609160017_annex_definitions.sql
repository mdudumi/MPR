-- V1 Annex architecture. Definitions describe presentation only; operational data remains in its source module.
create type public.annex_orientation as enum ('PORTRAIT','LANDSCAPE','AUTO');
create table public.annex_definitions (
  id uuid primary key default gen_random_uuid(), code text not null unique, title text not null, description text,
  source_module text not null, display_order integer not null, active boolean not null default true,
  required boolean not null default false, include_in_pdf boolean not null default true, include_in_excel boolean not null default true,
  orientation public.annex_orientation not null default 'AUTO', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.annex_definitions enable row level security;
create policy "annex definitions read" on public.annex_definitions for select using (auth.uid() is not null);
create policy "annex definitions administer" on public.annex_definitions for all using (public.has_role('ADMIN')) with check (public.has_role('ADMIN'));
insert into public.annex_definitions(code,title,description,source_module,display_order,required,orientation) values
('A','HSSC&E Incident Details','Detailed incident records when reported.','HSE',10,false,'PORTRAIT'),
('B','Environmental Ecopit Monthly Quantities','Reported Ecopit waste quantities in m³.','ENVIRONMENT',20,false,'PORTRAIT'),
('C','CSR Grievance Register','Detailed monthly CSR grievance register.','CSR',30,false,'PORTRAIT'),
('D','Drilling Well Details','Wells, rigs, coordinates and final depth reported for the period.','DRILLING',40,false,'LANDSCAPE')
on conflict (code) do update set title=excluded.title,description=excluded.description,source_module=excluded.source_module,display_order=excluded.display_order,orientation=excluded.orientation;
