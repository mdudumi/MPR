-- Monthly Progress Report foundation. Run in Supabase SQL editor or via Supabase CLI.
create extension if not exists pgcrypto;

create type public.app_role as enum ('ADMIN', 'REPORTING_MANAGER', 'DEPARTMENT_EDITOR', 'VIEWER');
create type public.period_status as enum ('OPEN', 'CLOSED');
create type public.section_status as enum ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED', 'LOCKED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  primary key (user_id, role)
);

create table public.user_section_access (
  user_id uuid not null references public.profiles(id) on delete cascade,
  section_code text not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  primary key (user_id, section_code)
);

create table public.reporting_periods (
  id uuid primary key default gen_random_uuid(),
  period_date date not null unique check (period_date = date_trunc('month', period_date)::date),
  status public.period_status not null default 'OPEN',
  initialized_from_period_id uuid references public.reporting_periods(id),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

create table public.report_sections (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  parent_id uuid references public.report_sections(id),
  display_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.report_section_status (
  reporting_period_id uuid not null references public.reporting_periods(id) on delete cascade,
  report_section_id uuid not null references public.report_sections(id) on delete restrict,
  status public.section_status not null default 'NOT_STARTED',
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id),
  primary key (reporting_period_id, report_section_id)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  changes jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  insert into public.user_roles (user_id, role) values (new.id, 'VIEWER');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.has_role(required_role public.app_role) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = required_role);
$$;
create or replace function public.can_access_section(section_code_input text) returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role('ADMIN') or public.has_role('REPORTING_MANAGER') or exists (select 1 from public.user_section_access where user_id = auth.uid() and section_code = section_code_input);
$$;
create or replace function public.set_audit_fields() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then new.created_by = coalesce(new.created_by, auth.uid()); end if;
  new.updated_at = now(); new.updated_by = auth.uid(); return new;
end; $$;
create trigger reporting_periods_audit before insert or update on public.reporting_periods for each row execute procedure public.set_audit_fields();
create trigger section_status_audit before insert or update on public.report_section_status for each row execute procedure public.set_audit_fields();

create or replace function public.create_reporting_period(p_period_date date, p_copy_from uuid default null) returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if not (public.has_role('ADMIN') or public.has_role('REPORTING_MANAGER')) then raise exception 'You do not have permission to create reporting periods'; end if;
  if p_period_date <> date_trunc('month', p_period_date)::date then raise exception 'Reporting period must be the first day of its month'; end if;
  insert into public.reporting_periods (period_date, initialized_from_period_id) values (p_period_date, p_copy_from) returning id into new_id;
  insert into public.report_section_status (reporting_period_id, report_section_id)
    select new_id, id from public.report_sections where is_active;
  return new_id;
end; $$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_section_access enable row level security;
alter table public.reporting_periods enable row level security;
alter table public.report_sections enable row level security;
alter table public.report_section_status enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles: users view their own" on public.profiles for select using (id = auth.uid() or public.has_role('ADMIN'));
create policy "profiles: admins manage" on public.profiles for all using (public.has_role('ADMIN')) with check (public.has_role('ADMIN'));
create policy "roles: users view their own" on public.user_roles for select using (user_id = auth.uid() or public.has_role('ADMIN'));
create policy "roles: admins manage" on public.user_roles for all using (public.has_role('ADMIN')) with check (public.has_role('ADMIN'));
create policy "access: users view their own" on public.user_section_access for select using (user_id = auth.uid() or public.has_role('ADMIN'));
create policy "access: admins manage" on public.user_section_access for all using (public.has_role('ADMIN')) with check (public.has_role('ADMIN'));
create policy "periods: authenticated users view" on public.reporting_periods for select using (auth.uid() is not null);
create policy "sections: authenticated users view" on public.report_sections for select using (auth.uid() is not null);
create policy "sections: admins manage" on public.report_sections for all using (public.has_role('ADMIN')) with check (public.has_role('ADMIN'));
create policy "section status: authorized users view" on public.report_section_status for select using (auth.uid() is not null and public.can_access_section((select code from public.report_sections where id = report_section_id)));
create policy "section status: authorized editors update" on public.report_section_status for update using (public.can_access_section((select code from public.report_sections where id = report_section_id)) and (public.has_role('ADMIN') or public.has_role('REPORTING_MANAGER') or public.has_role('DEPARTMENT_EDITOR'))) with check (public.can_access_section((select code from public.report_sections where id = report_section_id)));
create policy "audit: admins view" on public.audit_logs for select using (public.has_role('ADMIN'));

insert into public.report_sections (code, name, display_order) values
('HSSE', 'HSSC&E', 10), ('PRODUCTION', 'Production', 20), ('FACILITIES', 'Facilities Construction', 30), ('DRILLING', 'Drilling', 40), ('ANNEXES', 'Annexes', 50);
insert into public.report_sections (code, name, parent_id, display_order)
select v.code, v.name, parent.id, v.display_order from (values
  ('HSSE_INCIDENTS','1.1 Incident Overview','HSSE',11), ('HSSE_HEALTH_SAFETY','1.2 Health & Safety','HSSE',12), ('HSSE_SECURITY','1.3 Security','HSSE',13), ('HSSE_ENVIRONMENT','1.4 Environmental','HSSE',14), ('HSSE_CSR','1.5 Corporate Social Responsibility','HSSE',15),
  ('PROD_OVERVIEW','2.1 Overview','PRODUCTION',21), ('PROD_FIGURES','2.2 Production Figures','PRODUCTION',22), ('PROD_CRUDE_INVENTORY','2.3 Crude Oil Inventory','PRODUCTION',23), ('PROD_WATER_INVENTORY','2.4 Water Inventory','PRODUCTION',24), ('PROD_OPERATIONS','2.5 Production Operation Activities','PRODUCTION',25), ('PROD_SALES','2.6 Sales Deliveries','PRODUCTION',26), ('PROD_PEP_ASP','2.7 PEP / ASP','PRODUCTION',27),
  ('FAC_CIVIL','3.1 Civil & General Activity','FACILITIES',31), ('FAC_MECHANICAL','3.2 Mechanical','FACILITIES',32), ('FAC_ELECTRICAL','3.3 Electrical','FACILITIES',33), ('DRILLING_PROGRAM','4.1 Drilling Program','DRILLING',41)
) as v(code,name,parent_code,display_order) join public.report_sections parent on parent.code = v.parent_code;
