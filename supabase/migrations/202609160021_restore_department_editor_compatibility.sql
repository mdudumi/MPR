-- Compatibility function for an earlier HSE baseline migration.
-- It delegates to the existing department-role permission function; it does not grant extra access.
create or replace function public.is_department_editor(p_department_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_edit_department(p_department_code);
$$;
