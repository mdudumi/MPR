-- Step 3: complete HSE, Security, Environment and CSR reporting workspaces.
-- Run only after 202609160001 and 202609160002.

create table public.hse_incident_details (
  id uuid primary key default gen_random_uuid(),
  reporting_period_id uuid not null references public.reporting_periods(id) on delete cascade,
  incident_type_id uuid references public.hse_incident_types(id) on delete restrict,
  incident_date date,
  brief_description text not null,
  classification text,
  status text,
  comments text,
  created_at timestamptz not null default now(), created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(), updated_by uuid references public.profiles(id)
);
create index hse_incident_details_period_idx on public.hse_incident_details(reporting_period_id);

create table public.security_incident_details (
  id uuid primary key default gen_random_uuid(), reporting_period_id uuid not null references public.reporting_periods(id) on delete cascade,
  incident_date date, incident text not null, description text, status text, comments text,
  is_high_importance boolean not null default false,
  created_at timestamptz not null default now(), created_by uuid references public.profiles(id), updated_at timestamptz not null default now(), updated_by uuid references public.profiles(id)
);
create index security_incident_details_period_idx on public.security_incident_details(reporting_period_id);

create table public.environment_incident_details (
  id uuid primary key default gen_random_uuid(), reporting_period_id uuid not null references public.reporting_periods(id) on delete cascade,
  incident_date date, incident text not null, description text, status text, comments text,
  created_at timestamptz not null default now(), created_by uuid references public.profiles(id), updated_at timestamptz not null default now(), updated_by uuid references public.profiles(id)
);
create index environment_incident_details_period_idx on public.environment_incident_details(reporting_period_id);

create table public.csr_social_infrastructure_projects (
  id uuid primary key default gen_random_uuid(), reporting_period_id uuid not null references public.reporting_periods(id) on delete cascade,
  project_activity text not null, description text, status text, created_at timestamptz not null default now(), created_by uuid references public.profiles(id), updated_at timestamptz not null default now(), updated_by uuid references public.profiles(id)
);
create table public.csr_other_activities (
  id uuid primary key default gen_random_uuid(), reporting_period_id uuid not null references public.reporting_periods(id) on delete cascade,
  activity_date date, activity text not null, description text, created_at timestamptz not null default now(), created_by uuid references public.profiles(id), updated_at timestamptz not null default now(), updated_by uuid references public.profiles(id)
);

create or replace function public.submission_is_editable(p_period uuid, p_department uuid) returns boolean language sql stable security definer set search_path = public as $$
  select public.is_editable_period(p_period) and exists (select 1 from public.monthly_submissions where reporting_period_id = p_period and department_id = p_department and status::text in ('NOT_STARTED','IN_PROGRESS','RETURNED'));
$$;
create or replace function public.set_submission_in_progress(p_period uuid, p_department_code text) returns void language plpgsql security definer set search_path = public as $$
declare dep uuid;
begin
  select id into dep from public.departments where code = p_department_code;
  if not public.can_edit_department(p_department_code) or not public.submission_is_editable(p_period, dep) then raise exception 'This department report is not editable'; end if;
  update public.monthly_submissions set status = 'IN_PROGRESS', prepared_by = coalesce(prepared_by, auth.uid()), updated_at = now() where reporting_period_id = p_period and department_id = dep and status::text = 'NOT_STARTED';
end; $$;
create or replace function public.transition_monthly_submission(p_period uuid, p_department_code text, p_action text, p_comment text default null) returns void language plpgsql security definer set search_path = public as $$
declare dep uuid; current_status text;
begin
  select id into dep from public.departments where code = p_department_code;
  select status::text into current_status from public.monthly_submissions where reporting_period_id=p_period and department_id=dep for update;
  if p_action='SUBMIT' then
    if not public.can_edit_department(p_department_code) or current_status not in ('NOT_STARTED','IN_PROGRESS','RETURNED') then raise exception 'This report cannot be submitted'; end if;
    update public.monthly_submissions set status='SUBMITTED', submitted_at=now(), prepared_by=coalesce(prepared_by,auth.uid()), comments=p_comment, updated_at=now() where reporting_period_id=p_period and department_id=dep;
  elsif p_action='RETURN' then
    if not (public.has_role('ADMIN') or public.has_role('REPORTING_MANAGER') or public.has_role('DEPARTMENT_MANAGER')) or coalesce(trim(p_comment),'')='' then raise exception 'A reviewer comment is required to return a report'; end if;
    update public.monthly_submissions set status='RETURNED', reviewed_by=auth.uid(), reviewed_at=now(), comments=p_comment, updated_at=now() where reporting_period_id=p_period and department_id=dep;
  elsif p_action='APPROVE' then
    if not (public.has_role('ADMIN') or public.has_role('REPORTING_MANAGER') or public.has_role('DEPARTMENT_MANAGER')) or current_status <> 'SUBMITTED' then raise exception 'This report cannot be approved'; end if;
    update public.monthly_submissions set status='APPROVED', approved_by=auth.uid(), approved_at=now(), comments=p_comment, updated_at=now() where reporting_period_id=p_period and department_id=dep;
  elsif p_action='LOCK' then
    if not (public.has_role('ADMIN') or public.has_role('REPORTING_MANAGER')) or current_status <> 'APPROVED' then raise exception 'Only an approved report can be locked'; end if;
    update public.monthly_submissions set status='LOCKED', updated_at=now() where reporting_period_id=p_period and department_id=dep;
  else raise exception 'Unknown submission action'; end if;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,changes) values (auth.uid(),lower(p_action)||'_submission','monthly_submissions',p_period||':'||p_department_code,jsonb_build_object('comment',p_comment));
end; $$;

create or replace function public.is_department_period_editable(p_period uuid, p_department_code text) returns boolean language sql stable security definer set search_path = public as $$
 select public.can_edit_department(p_department_code) and exists (select 1 from public.departments d where d.code=p_department_code and public.submission_is_editable(p_period,d.id));
$$;

alter table public.hse_incident_details enable row level security; alter table public.security_incident_details enable row level security; alter table public.environment_incident_details enable row level security; alter table public.csr_social_infrastructure_projects enable row level security; alter table public.csr_other_activities enable row level security;
create policy "hse detail read" on public.hse_incident_details for select using (public.can_access_department('HSE'));
create policy "hse detail edit" on public.hse_incident_details for all using (public.is_department_period_editable(reporting_period_id,'HSE')) with check (public.is_department_period_editable(reporting_period_id,'HSE'));
create policy "security detail read" on public.security_incident_details for select using (public.can_access_department('SECURITY'));
create policy "security detail edit" on public.security_incident_details for all using (public.is_department_period_editable(reporting_period_id,'SECURITY')) with check (public.is_department_period_editable(reporting_period_id,'SECURITY'));
create policy "environment detail read" on public.environment_incident_details for select using (public.can_access_department('ENVIRONMENT'));
create policy "environment detail edit" on public.environment_incident_details for all using (public.is_department_period_editable(reporting_period_id,'ENVIRONMENT')) with check (public.is_department_period_editable(reporting_period_id,'ENVIRONMENT'));
create policy "csr projects read" on public.csr_social_infrastructure_projects for select using (public.can_access_department('CSR'));
create policy "csr projects edit" on public.csr_social_infrastructure_projects for all using (public.is_department_period_editable(reporting_period_id,'CSR')) with check (public.is_department_period_editable(reporting_period_id,'CSR'));
create policy "csr activities read" on public.csr_other_activities for select using (public.can_access_department('CSR'));
create policy "csr activities edit" on public.csr_other_activities for all using (public.is_department_period_editable(reporting_period_id,'CSR')) with check (public.is_department_period_editable(reporting_period_id,'CSR'));

-- Strengthen existing parent records so their writes also respect department submission status.
drop policy if exists "hse data edit" on public.hse_monthly_incidents;
create policy "hse data edit" on public.hse_monthly_incidents for all using (public.is_department_period_editable(reporting_period_id,'HSE')) with check (public.is_department_period_editable(reporting_period_id,'HSE'));
drop policy if exists "hse exposure edit" on public.hse_exposure_hours;
create policy "hse exposure edit" on public.hse_exposure_hours for all using (public.is_department_period_editable(reporting_period_id,'HSE')) with check (public.is_department_period_editable(reporting_period_id,'HSE'));
drop policy if exists "hse narratives edit" on public.hse_narratives;
create policy "hse narratives edit" on public.hse_narratives for all using (public.is_department_period_editable(reporting_period_id,'HSE')) with check (public.is_department_period_editable(reporting_period_id,'HSE'));
drop policy if exists "security access" on public.security_monthly_reports;
create policy "security report read" on public.security_monthly_reports for select using (public.can_access_department('SECURITY'));
create policy "security report edit" on public.security_monthly_reports for all using (public.is_department_period_editable(reporting_period_id,'SECURITY')) with check (public.is_department_period_editable(reporting_period_id,'SECURITY'));
drop policy if exists "environment report access" on public.environment_monthly_reports;
create policy "environment report read" on public.environment_monthly_reports for select using (public.can_access_department('ENVIRONMENT'));
create policy "environment report edit" on public.environment_monthly_reports for all using (public.is_department_period_editable(reporting_period_id,'ENVIRONMENT')) with check (public.is_department_period_editable(reporting_period_id,'ENVIRONMENT'));
drop policy if exists "environment ecopit access" on public.environment_ecopit_monthly_values;
create policy "environment ecopit read" on public.environment_ecopit_monthly_values for select using (public.can_access_department('ENVIRONMENT'));
create policy "environment ecopit edit" on public.environment_ecopit_monthly_values for all using (public.is_department_period_editable(reporting_period_id,'ENVIRONMENT')) with check (public.is_department_period_editable(reporting_period_id,'ENVIRONMENT'));
drop policy if exists "csr report access" on public.csr_monthly_reports;
create policy "csr report read" on public.csr_monthly_reports for select using (public.can_access_department('CSR'));
create policy "csr report edit" on public.csr_monthly_reports for all using (public.is_department_period_editable(reporting_period_id,'CSR')) with check (public.is_department_period_editable(reporting_period_id,'CSR'));
drop policy if exists "csr grievances access" on public.csr_grievances;
create policy "csr grievances read" on public.csr_grievances for select using (public.can_access_department('CSR'));
create policy "csr grievances edit" on public.csr_grievances for all using (public.is_department_period_editable(reporting_period_id,'CSR')) with check (public.is_department_period_editable(reporting_period_id,'CSR'));
