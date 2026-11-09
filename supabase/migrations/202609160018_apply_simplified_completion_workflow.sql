-- V1 workflow correction, phase 2. Run after migration 016 has committed.
-- Historical approval fields are retained for compatibility but are no longer used by the application.
update public.monthly_submissions set status = 'COMPLETE' where status::text in ('SUBMITTED', 'RETURNED', 'APPROVED');

create or replace function public.submission_is_editable(p_period uuid, p_department uuid) returns boolean language sql stable security definer set search_path = public as $$
  select public.is_editable_period(p_period) and exists (select 1 from public.monthly_submissions where reporting_period_id = p_period and department_id = p_department and status::text in ('NOT_STARTED','IN_PROGRESS'));
$$;
create or replace function public.set_submission_in_progress(p_period uuid, p_department_code text) returns void language plpgsql security definer set search_path = public as $$
declare dep uuid;
begin
  select id into dep from public.departments where code = p_department_code;
  if not public.can_edit_department(p_department_code) or not public.submission_is_editable(p_period, dep) then raise exception 'This department report is not editable'; end if;
  update public.monthly_submissions set status = 'IN_PROGRESS', prepared_by = coalesce(prepared_by, auth.uid()), updated_at = now() where reporting_period_id = p_period and department_id = dep and status::text = 'NOT_STARTED';
end; $$;
create or replace function public.complete_monthly_submission(p_period uuid, p_department_code text) returns void language plpgsql security definer set search_path = public as $$
declare dep uuid; current_status text;
begin
  select id into dep from public.departments where code = p_department_code;
  select status::text into current_status from public.monthly_submissions where reporting_period_id = p_period and department_id = dep for update;
  if not public.can_edit_department(p_department_code) or current_status not in ('NOT_STARTED','IN_PROGRESS') then raise exception 'This department report cannot be marked complete'; end if;
  update public.monthly_submissions set status = 'COMPLETE', prepared_by = coalesce(prepared_by, auth.uid()), submitted_at = now(), updated_at = now() where reporting_period_id = p_period and department_id = dep;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id) values (auth.uid(),'complete_submission','monthly_submissions',p_period||':'||p_department_code);
end; $$;
create or replace function public.reopen_monthly_submission(p_period uuid, p_department_code text, p_reason text default null) returns void language plpgsql security definer set search_path = public as $$
declare dep uuid; current_status text;
begin
  select id into dep from public.departments where code = p_department_code;
  select status::text into current_status from public.monthly_submissions where reporting_period_id = p_period and department_id = dep for update;
  if not (public.has_role('ADMIN') or public.has_role('REPORTING_MANAGER') or public.can_edit_department(p_department_code)) or current_status <> 'COMPLETE' then raise exception 'This department report cannot be reopened'; end if;
  update public.monthly_submissions set status = 'IN_PROGRESS', comments = p_reason, updated_at = now() where reporting_period_id = p_period and department_id = dep;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,changes) values (auth.uid(),'reopen_submission','monthly_submissions',p_period||':'||p_department_code,jsonb_build_object('reason',p_reason));
end; $$;
create or replace function public.is_department_period_editable(p_period uuid, p_department_code text) returns boolean language sql stable security definer set search_path = public as $$
 select public.can_edit_department(p_department_code) and exists (select 1 from public.departments d where d.code=p_department_code and public.submission_is_editable(p_period,d.id));
$$;
comment on column public.monthly_submissions.reviewed_by is 'Deprecated by V1 simplified completion workflow.';
comment on column public.monthly_submissions.reviewed_at is 'Deprecated by V1 simplified completion workflow.';
comment on column public.monthly_submissions.approved_by is 'Deprecated by V1 simplified completion workflow.';
comment on column public.monthly_submissions.approved_at is 'Deprecated by V1 simplified completion workflow.';
