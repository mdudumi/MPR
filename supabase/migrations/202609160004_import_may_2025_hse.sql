-- Source import: Monthly Progress Report May 2025.xlsx
-- Scope: Health & Safety Summary and Health & Safety narrative sheet.
-- Source narrative text that refers to April is preserved verbatim for auditability.
-- Run after migrations 001–003. This migration is idempotent for May 2025.

insert into public.reporting_periods (period_date)
values ('2025-05-01')
on conflict (period_date) do nothing;

-- The initial baseline in migration 002 represented May ITD values. Convert it to the pre-May baseline
-- before inserting May source values, so ITD in the application exactly matches the workbook after import.
update public.hse_incident_types set inception_baseline = case code
  when 'BANKERS_LTI' then 20 when 'CONTRACTOR_LTI' then 62 when 'RESTRICTED_WORK_CASE' then 29
  when 'PERSONNEL_INJURY_FA' then 158 when 'PERSONNEL_INJURY_MT' then 65 when 'PROPERTY_DAMAGE' then 230
  when 'NEAR_MISS' then 331 when 'ENVIRONMENTAL' then 737 when 'SECURITY' then 4372
  when 'MOTOR_VEHICLE_ACCIDENTS' then 503 when 'FATALITY' then 1 when 'FIRES' then 60 when 'NON_TABULATED' then 30
  else inception_baseline end;

with source(code, incident_count) as (values
  ('BANKERS_LTI',0),('CONTRACTOR_LTI',0),('RESTRICTED_WORK_CASE',0),('PERSONNEL_INJURY_FA',0),('PERSONNEL_INJURY_MT',0),
  ('PROPERTY_DAMAGE',3),('NEAR_MISS',0),('ENVIRONMENTAL',0),('SECURITY',1),('MOTOR_VEHICLE_ACCIDENTS',2),('FATALITY',0),('FIRES',0),('NON_TABULATED',0)
)
insert into public.hse_monthly_incidents (reporting_period_id, incident_type_id, incident_count)
select p.id, t.id, s.incident_count from source s join public.hse_incident_types t on t.code=s.code cross join public.reporting_periods p where p.period_date='2025-05-01'
on conflict (reporting_period_id,incident_type_id) do update set incident_count=excluded.incident_count, updated_at=now();

insert into public.hse_exposure_hours (reporting_period_id, bankers_hours, contractor_hours)
select id,74540,136823 from public.reporting_periods where period_date='2025-05-01'
on conflict (reporting_period_id) do update set bankers_hours=excluded.bankers_hours, contractor_hours=excluded.contractor_hours, updated_at=now();

with source(section_code, html) as (values
('OPERATIONS_SUPPORT',$html$<ul><li>Attend contractors Weekly safety meetings</li><li>Held monthly safety meetings with all department of BPAL.</li><li>Ongoing support including Acid jobs, Work over processes, hot works permits, confined space entry and tank cleaning, air monitoring for confined space entry, BPAL site works, lease and contractor inspections, non-conformities noted, reported and rectified.</li><li>Conducted work site, truck, rig and lease inspections throughout the Patos-Marinza field.</li><li>Ensuring fluid hauling contractors, driver’s ADR’s and truck inspections are up to date. Tank trucks with issues identified during inspections have been taken out of service.</li><li>Gas readings and H2S support including air trailer support, gas testing on wells, scrubbers, equipment calibration and testing. There were 121 gas readings and 27 Safety Supports done by H&amp;S during April.</li><li>Continue with the fire extinguishers 26 and Fire suppression system inspections 21. Annual Servicing of Fire Extinguishers was carried out by contracting company.</li></ul>$html$),
('INCIDENT_INVESTIGATIONS',$html$<p>Completed incident investigations and reports as required. There were 05 Incidents reported in April. The incident breakdown is as follows</p>$html$),
('INCIDENT_BREAKDOWN',$html$<ul><li>Property Damage Incidents - A bent 3&quot; pipe was notified at Ecopit 8. Indefinite time of incident, unknown actor</li><li>Property Damage Incidents - A grounding strap was removed from its original place at Thermal Desorption Facility by a Bloom forklift moving over it.</li><li>Motor Vehicle Incidents - A V.Bistika driver was going from pad N28-A to Dispatcher. He lost his attention trying to get an insect (wasp) out of cabin an ended up to a drainage ditch. No injury reported.</li><li>Motor Vehicle Incidents - The BPAL Toyota with number plate FR 5903D, was noticed with totally broken signal and minor dent. The incident occurred while vehicle was being driven by an IGT employee.</li><li>Property Damage Incidents - While grass cutting crew was working on Pad L34A, a chip rock thrown by the grass cutter broke the rear right side window of the Toyota AA229ER. No injuries or other damages reported</li></ul>$html$),
('BRIEF_DESCRIPTION',$html$<p>See Incident Breakdown.</p>$html$),
('HS_TRAINING',$html$<ul><li>H2S training for BPAL and Contractors employees for new employees and refresher training</li><li>Conducted 8 safety inductions/orientations for Visitors and Contractors’ new employees</li><li>Ongoing work with contractor HSE representatives to improve competency</li><li>ERT – 2 Emergency responses, 2 Fires and 1 SCBA drill.</li><li>SCBA refill and inspections - 4</li><li>H2S awareness training – 8 hours</li><li>WAH training – 0 hours</li><li>Firefighting training – 2 hours</li><li>Fire suppression systems inspection – 21</li><li>Fire extinguishers inspected – 26 (ABC&amp;CO2)</li><li>eGSO Inductions – 3</li><li>Safety Orientations – 8</li><li>Defensive driving training – 3</li><li>Work site inspections – 102</li><li>Lease inspections – 3</li><li>Facility/Safety Inspections - 0</li><li>Truck inspections – 11 (including tank trucks, pickers, buses)</li><li>Work at Height equipment inspection - 0</li><li>Rig inspections – 6</li><li>Hot Work permits - 95</li></ul>$html$),
('HEALTH',$html$<ul><li>Continue health monitoring by BPAL/MRDC medical staff in Patos Marinza.</li><li>There were 68 visits; 56 first visits and 12 follow up, at the CTF medical facility by BPAL and Contractor employees in the April reporting period as per the monthly report from the MRDC. A breakdown of the visits is available in the MRDC monthly report.</li></ul>$html$)
)
insert into public.hse_narratives (reporting_period_id,section_code,content)
select p.id,s.section_code,jsonb_build_object('html',s.html) from source s cross join public.reporting_periods p where p.period_date='2025-05-01'
on conflict (reporting_period_id,section_code) do update set content=excluded.content,updated_at=now();
