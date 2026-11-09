-- Step 5: the workbook's 2.3–2.7 reporting area.
-- These tables preserve distinct business concepts rather than treating this worksheet as one entity.

create type public.sales_delivery_type as enum ('EXPORT_SALES','DOMESTIC_SALES','PEP_ASP_DELIVERIES');

create table public.crude_oil_inventory_monthly (
  reporting_period_id uuid not null references public.reporting_periods(id) on delete cascade,
  location text not null,
  quantity_m3 numeric(16,3) not null check (quantity_m3 >= 0),
  source_type text not null default 'MANUAL' check (source_type in ('MANUAL','IMPORTED')),
  source_reference text,
  created_at timestamptz not null default now(), created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(), updated_by uuid references public.profiles(id),
  primary key (reporting_period_id, location)
);

create table public.water_inventory_monthly (
  reporting_period_id uuid not null references public.reporting_periods(id) on delete cascade,
  location text not null,
  beginning_quantity_m3 numeric(16,3),
  ending_quantity_m3 numeric(16,3),
  source_type text not null default 'MANUAL' check (source_type in ('MANUAL','IMPORTED')),
  source_reference text,
  created_at timestamptz not null default now(), created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(), updated_by uuid references public.profiles(id),
  primary key (reporting_period_id, location),
  check (beginning_quantity_m3 is null or beginning_quantity_m3 >= 0),
  check (ending_quantity_m3 is null or ending_quantity_m3 >= 0)
);

create table public.sales_delivery_reporting_monthly (
  reporting_period_id uuid not null references public.reporting_periods(id) on delete cascade,
  delivery_type public.sales_delivery_type not null,
  gross_quantity_m3 numeric(16,3),
  average_water_cut_percent numeric(8,3),
  net_oil_tonne numeric(16,3),
  net_oil_m3 numeric(16,3),
  net_oil_bbl numeric(16,3),
  average_api_gravity numeric(8,3),
  source_type text not null default 'MANUAL' check (source_type in ('MANUAL','IMPORTED')),
  source_reference text,
  created_at timestamptz not null default now(), created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(), updated_by uuid references public.profiles(id),
  primary key (reporting_period_id, delivery_type),
  check (gross_quantity_m3 is null or gross_quantity_m3 >= 0), check (net_oil_tonne is null or net_oil_tonne >= 0), check (net_oil_m3 is null or net_oil_m3 >= 0), check (net_oil_bbl is null or net_oil_bbl >= 0)
);

create table public.pep_asp_reporting_monthly (
  reporting_period_id uuid primary key references public.reporting_periods(id) on delete cascade,
  pep_quantity_tonne numeric(16,3),
  asp_rate numeric(9,6) not null default 0.03 check (asp_rate >= 0 and asp_rate <= 1),
  pep_assumed_m3_per_tonne numeric(9,6) not null default 1 check (pep_assumed_m3_per_tonne > 0),
  source_type text not null default 'MANUAL' check (source_type in ('MANUAL','IMPORTED')),
  source_reference text,
  created_at timestamptz not null default now(), created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(), updated_by uuid references public.profiles(id),
  check (pep_quantity_tonne is null or pep_quantity_tonne >= 0)
);

create table public.inventory_activities_sales_pep_narratives (
  reporting_period_id uuid not null references public.reporting_periods(id) on delete cascade,
  section_code text not null check (section_code in ('CRUDE_OIL_INVENTORY','WATER_INVENTORY','PRODUCTION_OPERATION_ACTIVITIES','SALES_DELIVERIES','PEP_ASP')),
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  created_at timestamptz not null default now(), created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(), updated_by uuid references public.profiles(id),
  primary key (reporting_period_id, section_code)
);

create index crude_oil_inventory_monthly_period_idx on public.crude_oil_inventory_monthly(reporting_period_id);
create index water_inventory_monthly_period_idx on public.water_inventory_monthly(reporting_period_id);
create index sales_delivery_reporting_monthly_period_idx on public.sales_delivery_reporting_monthly(reporting_period_id);

alter table public.crude_oil_inventory_monthly enable row level security;
alter table public.water_inventory_monthly enable row level security;
alter table public.sales_delivery_reporting_monthly enable row level security;
alter table public.pep_asp_reporting_monthly enable row level security;
alter table public.inventory_activities_sales_pep_narratives enable row level security;

create policy "crude inventory read" on public.crude_oil_inventory_monthly for select using (public.can_access_department('PRODUCTION'));
create policy "crude inventory edit" on public.crude_oil_inventory_monthly for all using (public.is_department_period_editable(reporting_period_id,'PRODUCTION')) with check (public.is_department_period_editable(reporting_period_id,'PRODUCTION'));
create policy "water inventory read" on public.water_inventory_monthly for select using (public.can_access_department('PRODUCTION'));
create policy "water inventory edit" on public.water_inventory_monthly for all using (public.is_department_period_editable(reporting_period_id,'PRODUCTION')) with check (public.is_department_period_editable(reporting_period_id,'PRODUCTION'));
create policy "sales reporting read" on public.sales_delivery_reporting_monthly for select using (public.can_access_department('PRODUCTION'));
create policy "sales reporting edit" on public.sales_delivery_reporting_monthly for all using (public.is_department_period_editable(reporting_period_id,'PRODUCTION')) with check (public.is_department_period_editable(reporting_period_id,'PRODUCTION'));
create policy "pep asp read" on public.pep_asp_reporting_monthly for select using (public.can_access_department('PRODUCTION'));
create policy "pep asp edit" on public.pep_asp_reporting_monthly for all using (public.is_department_period_editable(reporting_period_id,'PRODUCTION')) with check (public.is_department_period_editable(reporting_period_id,'PRODUCTION'));
create policy "inventory sales pep narrative read" on public.inventory_activities_sales_pep_narratives for select using (public.can_access_department('PRODUCTION'));
create policy "inventory sales pep narrative edit" on public.inventory_activities_sales_pep_narratives for all using (public.is_department_period_editable(reporting_period_id,'PRODUCTION')) with check (public.is_department_period_editable(reporting_period_id,'PRODUCTION'));

-- Existing Step 2 operations storage exactly matches the workbook's rig/category/hour/count structure.
drop policy if exists "operations access" on public.production_operations_monthly;
create policy "operations read" on public.production_operations_monthly for select using (public.can_access_department('PRODUCTION'));
create policy "operations edit" on public.production_operations_monthly for all using (public.is_department_period_editable(reporting_period_id,'PRODUCTION')) with check (public.is_department_period_editable(reporting_period_id,'PRODUCTION'));
