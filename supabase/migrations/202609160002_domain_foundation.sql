-- Step 2: department ownership, monthly submission control, and initial dedicated domain tables.
-- This migration extends 202609160001_foundation.sql; it does not replace workbook terminology with generic metrics.

alter type public.app_role add value if not exists 'DEPARTMENT_MANAGER';
alter type public.app_role add value if not exists 'CONTRIBUTOR';
alter type public.period_status add value if not exists 'IN_PROGRESS';
alter type public.period_status add value if not exists 'UNDER_REVIEW';
alter type public.period_status add value if not exists 'FINALIZED';

create type public.submission_status as enum ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'RETURNED', 'APPROVED', 'LOCKED');
create type public.grievance_validity as enum ('VALID', 'NOT_VALID', 'PENDING');

alter table public.reporting_periods add column if not exists year integer generated always as (extract(year from period_date)::integer) stored;
alter table public.reporting_periods add column if not exists month integer generated always as (extract(month from period_date)::integer) stored;
alter table public.reporting_periods add column if not exists submission_deadline date;
alter table public.reporting_periods add constraint reporting_periods_year_month_unique unique (year, month);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  display_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.user_departments (
  user_id uuid not null references public.profiles(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  primary key (user_id, department_id)
);
create table public.monthly_submissions (
  id uuid primary key default gen_random_uuid(),
  reporting_period_id uuid not null references public.reporting_periods(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete restrict,
  status public.submission_status not null default 'NOT_STARTED',
  prepared_by uuid references public.profiles(id),
  submitted_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  completion_percentage numeric(5,2) not null default 0 check (completion_percentage between 0 and 100),
  comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reporting_period_id, department_id)
);

-- HSE: values entered each month, with report display columns calculated from historical records.
create table public.hse_incident_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  display_order integer not null,
  is_recordable boolean not null default false,
  inception_baseline integer not null default 0 check (inception_baseline >= 0),
  is_active boolean not null default true
);
create table public.hse_monthly_incidents (
  reporting_period_id uuid not null references public.reporting_periods(id) on delete cascade,
  incident_type_id uuid not null references public.hse_incident_types(id) on delete restrict,
  incident_count integer not null default 0 check (incident_count >= 0),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id),
  primary key (reporting_period_id, incident_type_id)
);
create table public.hse_exposure_hours (
  reporting_period_id uuid primary key references public.reporting_periods(id) on delete cascade,
  bankers_hours numeric(14,2) not null default 0 check (bankers_hours >= 0),
  contractor_hours numeric(14,2) not null default 0 check (contractor_hours >= 0),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);
create table public.hse_narratives (
  reporting_period_id uuid not null references public.reporting_periods(id) on delete cascade,
  section_code text not null check (section_code in ('OPERATIONS_SUPPORT', 'INCIDENT_INVESTIGATIONS', 'INCIDENT_BREAKDOWN', 'BRIEF_DESCRIPTION', 'HS_TRAINING', 'HEALTH')),
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  created_at timestamptz not null default now(), created_by uuid references public.profiles(id), updated_at timestamptz not null default now(), updated_by uuid references public.profiles(id),
  primary key (reporting_period_id, section_code)
);

-- Security: distinct numeric operational counts and narratives.
create table public.security_monthly_reports (
  reporting_period_id uuid primary key references public.reporting_periods(id) on delete cascade,
  security_incident_count integer not null default 0 check (security_incident_count >= 0),
  mobile_patrol_spot_checks integer not null default 0 check (mobile_patrol_spot_checks >= 0),
  geofence_dispatches integer not null default 0 check (geofence_dispatches >= 0),
  gps_operator_spot_checks integer not null default 0 check (gps_operator_spot_checks >= 0),
  storage_yard_spot_checks integer not null default 0 check (storage_yard_spot_checks >= 0),
  inventory_checks integer not null default 0 check (inventory_checks >= 0), security_investigations integer not null default 0 check (security_investigations >= 0), static_sites integer not null default 0 check (static_sites >= 0),
  operations_support jsonb not null default '{"type":"doc","content":[]}'::jsonb, security_incidents jsonb not null default '{"type":"doc","content":[]}'::jsonb, incidents_high_importance jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  created_at timestamptz not null default now(), created_by uuid references public.profiles(id), updated_at timestamptz not null default now(), updated_by uuid references public.profiles(id)
);

-- Environment: ecology-pit quantities retain m3 as their explicit operational unit.
create table public.environment_monthly_reports (
  reporting_period_id uuid primary key references public.reporting_periods(id) on delete cascade,
  environmental_incident_count integer not null default 0 check (environmental_incident_count >= 0),
  operations_support jsonb not null default '{"type":"doc","content":[]}'::jsonb, incidents_breakdown jsonb not null default '{"type":"doc","content":[]}'::jsonb, environmental_incidents jsonb not null default '{"type":"doc","content":[]}'::jsonb, monitoring_program jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  created_at timestamptz not null default now(), created_by uuid references public.profiles(id), updated_at timestamptz not null default now(), updated_by uuid references public.profiles(id)
);
create table public.environment_ecopit_monthly_values (
  id uuid primary key default gen_random_uuid(), reporting_period_id uuid not null references public.reporting_periods(id) on delete cascade,
  ecopit text not null, waste_type text not null check (waste_type in ('CONTAMINATED_GRAVEL_SOIL','EMULSION','WATER','DRILLING_CUTTINGS','DRILLING_MUD','PRODUCED_SAND','SOLIDS','SLUDGE','BOTTOM_TANK_SLUDGE')),
  quantity_m3 numeric(14,3) not null default 0 check (quantity_m3 >= 0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (reporting_period_id, ecopit, waste_type)
);

create table public.csr_monthly_reports (
  reporting_period_id uuid primary key references public.reporting_periods(id) on delete cascade,
  social_infrastructure_projects jsonb not null default '{"type":"doc","content":[]}'::jsonb, other_activities jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  created_at timestamptz not null default now(), created_by uuid references public.profiles(id), updated_at timestamptz not null default now(), updated_by uuid references public.profiles(id)
);
create table public.csr_grievances (
  id uuid primary key default gen_random_uuid(), reporting_period_id uuid not null references public.reporting_periods(id) on delete cascade,
  grievance_date date not null, project_activity text not null, category text not null, status text not null, validity public.grievance_validity not null default 'PENDING',
  created_at timestamptz not null default now(), created_by uuid references public.profiles(id), updated_at timestamptz not null default now(), updated_by uuid references public.profiles(id)
);

-- Production stays dedicated and explicitly unit-aware; raw history is an import source, not a normal monthly form.
create table public.production_monthly (
  reporting_period_id uuid primary key references public.reporting_periods(id) on delete cascade,
  net_oil_tonne numeric(16,3), net_oil_m3 numeric(16,3), net_oil_bbl numeric(16,3), water_m3 numeric(16,3), sand_m3 numeric(16,3), gas_nm3 numeric(16,3), days_on_production numeric(8,2),
  created_at timestamptz not null default now(), created_by uuid references public.profiles(id), updated_at timestamptz not null default now(), updated_by uuid references public.profiles(id)
);
create table public.production_history (
  id uuid primary key default gen_random_uuid(), period_date date not null unique check (period_date = date_trunc('month', period_date)::date),
  oil_actual_bbl numeric(16,3), oil_forecast_bbl numeric(16,3), import_source text, imported_at timestamptz not null default now(), imported_by uuid references public.profiles(id)
);
create table public.production_plan_budget (
  reporting_period_id uuid primary key references public.reporting_periods(id) on delete cascade, oil_forecast_bbl numeric(16,3), oil_forecast_m3 numeric(16,3), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.inventory_monthly (
  id uuid primary key default gen_random_uuid(), reporting_period_id uuid not null references public.reporting_periods(id) on delete cascade,
  inventory_type text not null check (inventory_type in ('CRUDE_OIL','WATER')), location_or_category text not null, quantity numeric(16,3) not null default 0, unit text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (reporting_period_id, inventory_type, location_or_category)
);
create table public.production_operations_monthly (
  id uuid primary key default gen_random_uuid(), reporting_period_id uuid not null references public.reporting_periods(id) on delete cascade, rig_name text not null, operation_category text not null check (operation_category in ('MWO','FB','REAC','WO','WIII')), hours_spent numeric(14,2) not null default 0, operation_count integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (reporting_period_id, rig_name, operation_category)
);
create table public.sales_deliveries_monthly (id uuid primary key default gen_random_uuid(), reporting_period_id uuid not null references public.reporting_periods(id) on delete cascade, delivery_date date, description text not null, quantity numeric(16,3), unit text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.pep_asp_monthly (reporting_period_id uuid primary key references public.reporting_periods(id) on delete cascade, pep_bbl numeric(16,3), asp_percentage numeric(8,4), created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table public.facilities_monthly_reports (reporting_period_id uuid primary key references public.reporting_periods(id) on delete cascade, civil_general_activity jsonb not null default '{"type":"doc","content":[]}'::jsonb, mechanical jsonb not null default '{"type":"doc","content":[]}'::jsonb, electrical jsonb not null default '{"type":"doc","content":[]}'::jsonb, created_at timestamptz not null default now(), created_by uuid references public.profiles(id), updated_at timestamptz not null default now(), updated_by uuid references public.profiles(id));
create table public.facility_activities (id uuid primary key default gen_random_uuid(), reporting_period_id uuid not null references public.reporting_periods(id) on delete cascade, activity_group text not null check (activity_group in ('CIVIL_GENERAL','MECHANICAL','ELECTRICAL')), description text not null, status text, progress_text text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.drilling_monthly_reports (reporting_period_id uuid primary key references public.reporting_periods(id) on delete cascade, drilling_program jsonb not null default '{"type":"doc","content":[]}'::jsonb, created_at timestamptz not null default now(), created_by uuid references public.profiles(id), updated_at timestamptz not null default now(), updated_by uuid references public.profiles(id));
create table public.drilling_wells (id uuid primary key default gen_random_uuid(), reporting_period_id uuid not null references public.reporting_periods(id) on delete cascade, rig text not null, well text not null, primary_target text, operation text, northing numeric(16,3), easting numeric(16,3), final_depth_md numeric(16,3), spud_at timestamptz, rig_release_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (reporting_period_id, rig, well));

create or replace function public.can_access_department(p_department_code text) returns boolean language sql stable security definer set search_path = public as $$
 select public.has_role('ADMIN') or public.has_role('REPORTING_MANAGER') or exists (select 1 from public.user_departments ud join public.departments d on d.id = ud.department_id where ud.user_id = auth.uid() and d.code = p_department_code);
$$;
create or replace function public.can_edit_department(p_department_code text) returns boolean language sql stable security definer set search_path = public as $$
 select public.can_access_department(p_department_code) and exists (select 1 from public.user_roles where user_id = auth.uid() and role::text in ('ADMIN','REPORTING_MANAGER','DEPARTMENT_MANAGER','CONTRIBUTOR','DEPARTMENT_EDITOR'));
$$;
create or replace function public.is_editable_period(p_period_id uuid) returns boolean language sql stable security definer set search_path = public as $$
 select exists (select 1 from public.reporting_periods where id = p_period_id and status::text not in ('FINALIZED','CLOSED'));
$$;

alter table public.departments enable row level security; alter table public.user_departments enable row level security; alter table public.monthly_submissions enable row level security;
alter table public.hse_incident_types enable row level security; alter table public.hse_monthly_incidents enable row level security; alter table public.hse_exposure_hours enable row level security; alter table public.hse_narratives enable row level security;
alter table public.security_monthly_reports enable row level security; alter table public.environment_monthly_reports enable row level security; alter table public.environment_ecopit_monthly_values enable row level security; alter table public.csr_monthly_reports enable row level security; alter table public.csr_grievances enable row level security;
alter table public.production_monthly enable row level security; alter table public.production_history enable row level security; alter table public.production_plan_budget enable row level security; alter table public.inventory_monthly enable row level security; alter table public.production_operations_monthly enable row level security; alter table public.sales_deliveries_monthly enable row level security; alter table public.pep_asp_monthly enable row level security; alter table public.facilities_monthly_reports enable row level security; alter table public.facility_activities enable row level security; alter table public.drilling_monthly_reports enable row level security; alter table public.drilling_wells enable row level security;
create policy "departments view" on public.departments for select using (auth.uid() is not null); create policy "departments admin" on public.departments for all using (public.has_role('ADMIN')) with check (public.has_role('ADMIN'));
create policy "user departments view" on public.user_departments for select using (user_id = auth.uid() or public.has_role('ADMIN') or public.has_role('REPORTING_MANAGER')); create policy "user departments admin" on public.user_departments for all using (public.has_role('ADMIN')) with check (public.has_role('ADMIN'));
create policy "submissions department access" on public.monthly_submissions for select using (public.can_access_department((select code from public.departments where id = department_id))); create policy "submissions department edit" on public.monthly_submissions for all using (public.can_edit_department((select code from public.departments where id = department_id)) and public.is_editable_period(reporting_period_id)) with check (public.can_edit_department((select code from public.departments where id = department_id)));
create policy "hse incident types access" on public.hse_incident_types for select using (public.can_access_department('HSE')); create policy "hse incident types admin" on public.hse_incident_types for all using (public.has_role('ADMIN')) with check (public.has_role('ADMIN'));
create policy "hse data read" on public.hse_monthly_incidents for select using (public.can_access_department('HSE')); create policy "hse data edit" on public.hse_monthly_incidents for all using (public.can_edit_department('HSE') and public.is_editable_period(reporting_period_id)) with check (public.can_edit_department('HSE') and public.is_editable_period(reporting_period_id));
create policy "hse exposure read" on public.hse_exposure_hours for select using (public.can_access_department('HSE')); create policy "hse exposure edit" on public.hse_exposure_hours for all using (public.can_edit_department('HSE') and public.is_editable_period(reporting_period_id)) with check (public.can_edit_department('HSE') and public.is_editable_period(reporting_period_id));
create policy "hse narratives read" on public.hse_narratives for select using (public.can_access_department('HSE')); create policy "hse narratives edit" on public.hse_narratives for all using (public.can_edit_department('HSE') and public.is_editable_period(reporting_period_id)) with check (public.can_edit_department('HSE') and public.is_editable_period(reporting_period_id));

-- Remaining domain policy pairs follow their report owner; management has cross-department access.
create policy "security access" on public.security_monthly_reports for all using (public.can_access_department('SECURITY')) with check (public.can_edit_department('SECURITY'));
create policy "environment report access" on public.environment_monthly_reports for all using (public.can_access_department('ENVIRONMENT')) with check (public.can_edit_department('ENVIRONMENT'));
create policy "environment ecopit access" on public.environment_ecopit_monthly_values for all using (public.can_access_department('ENVIRONMENT')) with check (public.can_edit_department('ENVIRONMENT'));
create policy "csr report access" on public.csr_monthly_reports for all using (public.can_access_department('CSR')) with check (public.can_edit_department('CSR'));
create policy "csr grievances access" on public.csr_grievances for all using (public.can_access_department('CSR')) with check (public.can_edit_department('CSR'));
create policy "production access" on public.production_monthly for all using (public.can_access_department('PRODUCTION')) with check (public.can_edit_department('PRODUCTION'));
create policy "production history access" on public.production_history for all using (public.can_access_department('PRODUCTION')) with check (public.has_role('ADMIN') or public.has_role('REPORTING_MANAGER'));
create policy "production plan access" on public.production_plan_budget for all using (public.can_access_department('PRODUCTION')) with check (public.can_edit_department('PRODUCTION'));
create policy "inventory access" on public.inventory_monthly for all using (public.can_access_department('PRODUCTION')) with check (public.can_edit_department('PRODUCTION'));
create policy "operations access" on public.production_operations_monthly for all using (public.can_access_department('PRODUCTION')) with check (public.can_edit_department('PRODUCTION'));
create policy "sales access" on public.sales_deliveries_monthly for all using (public.can_access_department('PRODUCTION')) with check (public.can_edit_department('PRODUCTION'));
create policy "pep access" on public.pep_asp_monthly for all using (public.can_access_department('PRODUCTION')) with check (public.can_edit_department('PRODUCTION'));
create policy "facilities report access" on public.facilities_monthly_reports for all using (public.can_access_department('FACILITIES')) with check (public.can_edit_department('FACILITIES'));
create policy "facilities activities access" on public.facility_activities for all using (public.can_access_department('FACILITIES')) with check (public.can_edit_department('FACILITIES'));
create policy "drilling report access" on public.drilling_monthly_reports for all using (public.can_access_department('DRILLING')) with check (public.can_edit_department('DRILLING'));
create policy "drilling wells access" on public.drilling_wells for all using (public.can_access_department('DRILLING')) with check (public.can_edit_department('DRILLING'));

insert into public.departments (code, name, display_order) values ('HSE','Health and Safety',10),('SECURITY','Security',20),('ENVIRONMENT','Environment',30),('CSR','Corporate Social Responsibility',40),('PRODUCTION','Production',50),('FACILITIES','Facilities',60),('DRILLING','Drilling',70) on conflict (code) do nothing;
insert into public.monthly_submissions (reporting_period_id, department_id)
select p.id, d.id from public.reporting_periods p cross join public.departments d on conflict (reporting_period_id, department_id) do nothing;
create or replace function public.create_reporting_period(p_period_date date, p_copy_from uuid default null) returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if not (public.has_role('ADMIN') or public.has_role('REPORTING_MANAGER')) then raise exception 'You do not have permission to create reporting periods'; end if;
  if p_period_date <> date_trunc('month', p_period_date)::date then raise exception 'Reporting period must be the first day of its month'; end if;
  insert into public.reporting_periods (period_date, initialized_from_period_id) values (p_period_date, p_copy_from) returning id into new_id;
  insert into public.report_section_status (reporting_period_id, report_section_id) select new_id, id from public.report_sections where is_active;
  insert into public.monthly_submissions (reporting_period_id, department_id) select new_id, id from public.departments where is_active;
  return new_id;
end; $$;
insert into public.hse_incident_types (code, name, display_order, is_recordable, inception_baseline) values
('BANKERS_LTI','Bankers Lost Time Incident',10,true,20),('CONTRACTOR_LTI','Contractor Lost Time Incident',20,true,62),('RESTRICTED_WORK_CASE','Restricted Work Case',30,true,29),('PERSONNEL_INJURY_FA','Personnel Injury FA',40,true,158),('PERSONNEL_INJURY_MT','Personnel Injury MT',50,true,65),('PROPERTY_DAMAGE','Property Damage',60,false,233),('NEAR_MISS','Near Miss',70,false,331),('ENVIRONMENTAL','Environmental',80,false,737),('SECURITY','Security',90,false,4373),('MOTOR_VEHICLE_ACCIDENTS','Motor Vehicle Accidents',100,false,505),('FATALITY','Fatality',110,false,1),('FIRES','Fires',120,false,60),('NON_TABULATED','Non Tabulated',130,false,30) on conflict (code) do nothing;
