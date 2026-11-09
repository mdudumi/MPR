-- June 2025 Community Relations import.
insert into public.csr_monthly_reports (reporting_period_id, social_infrastructure_projects, other_activities)
select id,
  '{"html":"<p><strong>Community Investment Projects:</strong> Fier municipality project has been finalized; Roskovec municipality selected contractor and submitted its documentation. Request sent to national authorities to extend deadline of project implementation.</p>"}'::jsonb,
  '{"html":"<ul><li>Conducting Social Risk Assessment for the new wells to be drilled as part of Drilling schedule for 2025.</li><li>Visiting drilling site locations and providing social inputs.</li><li>Delivered medical equipment to Fier hospital as per their request.</li><li>Regular communication with local authorities and residents to address concerns related to operations at pad M37a.</li><li>Submitted for approval of national authorities the request from Mbrostar Administrative Unit to support with improvement of agriculture roads in the area.</li><li>L26a: Regular monitoring of the pad due to complaints from Belina residents on gas smell related to operations at well 5260.</li></ul>"}'::jsonb
from public.reporting_periods
where period_date = '2025-06-01'
on conflict (reporting_period_id) do update set
  social_infrastructure_projects = excluded.social_infrastructure_projects,
  other_activities = excluded.other_activities,
  updated_at = now();

insert into public.csr_grievances (reporting_period_id, grievance_date, project_activity, category, status, validity)
select p.id, '2025-06-12', 'Operations', 'Drainage cleaning/Maintenance', 'Open', 'PENDING'::public.grievance_validity
from public.reporting_periods p
where p.period_date = '2025-06-01'
  and not exists (
    select 1 from public.csr_grievances g
    where g.reporting_period_id = p.id
      and g.grievance_date = '2025-06-12'
      and g.project_activity = 'Operations'
  );
