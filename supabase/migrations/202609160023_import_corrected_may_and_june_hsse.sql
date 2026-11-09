-- Source of truth: 05 Monthly HSSE May.docx and 06 Monthly HSSE June.docx.
-- Replaces earlier May import values where the Word HSSE reports differ, and adds June 2025.
-- Run after migration 022.

insert into public.reporting_periods(period_date) values ('2025-06-01') on conflict (period_date) do nothing;
insert into public.report_section_status(reporting_period_id, report_section_id)
select p.id, s.id from public.reporting_periods p cross join public.report_sections s
where p.period_date = '2025-06-01' and s.is_active
on conflict (reporting_period_id, report_section_id) do nothing;
insert into public.monthly_submissions(reporting_period_id, department_id)
select p.id, d.id from public.reporting_periods p cross join public.departments d
where p.period_date = '2025-06-01' and d.is_active
on conflict (reporting_period_id, department_id) do nothing;

-- Correct historical base so April, May and June reproduce the supplied HSSE reports.
update public.hse_incident_types set inception_baseline = case code
  when 'BANKERS_LTI' then 20 when 'CONTRACTOR_LTI' then 63 when 'RESTRICTED_WORK_CASE' then 29
  when 'PERSONNEL_INJURY_FA' then 158 when 'PERSONNEL_INJURY_MT' then 65 when 'PROPERTY_DAMAGE' then 230
  when 'NEAR_MISS' then 331 when 'ENVIRONMENTAL' then 737 when 'SECURITY' then 4372
  when 'MOTOR_VEHICLE_ACCIDENTS' then 503 when 'FATALITY' then 1 when 'FIRES' then 60 when 'NON_TABULATED' then 30
  else inception_baseline end;

-- Jan-Mar 2025 baseline from the May report's YTD less the corrected April and May source values.
insert into public.hse_incident_ytd_baselines(reporting_year, incident_type_id, incident_count, source_reference)
select 2025, id, case code
  when 'CONTRACTOR_LTI' then 1 when 'PROPERTY_DAMAGE' then 1 when 'ENVIRONMENTAL' then 8
  when 'SECURITY' then 2 when 'MOTOR_VEHICLE_ACCIDENTS' then 3 else 0 end,
  '05 Monthly HSSE May.docx — Table 1.1-1'
from public.hse_incident_types
on conflict (reporting_year, incident_type_id) do update set incident_count=excluded.incident_count, source_reference=excluded.source_reference, updated_at=now();
insert into public.hse_exposure_ytd_baselines(reporting_year, bankers_hours, contractor_hours, source_reference)
values (2025, 222380, 419261, '05 Monthly HSSE May.docx — Table 1.1-4')
on conflict (reporting_year) do update set bankers_hours=excluded.bankers_hours, contractor_hours=excluded.contractor_hours, source_reference=excluded.source_reference, updated_at=now();
insert into public.hse_exposure_inception_baselines(id, bankers_hours, contractor_hours, source_reference)
values (true, 17641013, 46796515, '05 Monthly HSSE May.docx — Table 1.1-4')
on conflict (id) do update set bankers_hours=excluded.bankers_hours, contractor_hours=excluded.contractor_hours, source_reference=excluded.source_reference, updated_at=now();
insert into public.hse_recordable_baselines(reporting_year, ytd_total_recordable, inception_total_recordable, source_reference)
values (2025, 1, 178, '05 Monthly HSSE May.docx — Table 1.1-1')
on conflict (reporting_year) do update set ytd_total_recordable=excluded.ytd_total_recordable, inception_total_recordable=excluded.inception_total_recordable, source_reference=excluded.source_reference, updated_at=now();

-- Corrected April comparison values and the May/June monthly source values.
with source(period_date, code, incident_count) as (values
 ('2025-04-01'::date,'BANKERS_LTI',0),('2025-04-01','CONTRACTOR_LTI',0),('2025-04-01','RESTRICTED_WORK_CASE',0),('2025-04-01','PERSONNEL_INJURY_FA',0),('2025-04-01','PERSONNEL_INJURY_MT',0),('2025-04-01','PROPERTY_DAMAGE',3),('2025-04-01','NEAR_MISS',0),('2025-04-01','ENVIRONMENTAL',0),('2025-04-01','SECURITY',1),('2025-04-01','MOTOR_VEHICLE_ACCIDENTS',2),('2025-04-01','FATALITY',0),('2025-04-01','FIRES',0),('2025-04-01','NON_TABULATED',0),
 ('2025-05-01','BANKERS_LTI',0),('2025-05-01','CONTRACTOR_LTI',0),('2025-05-01','RESTRICTED_WORK_CASE',0),('2025-05-01','PERSONNEL_INJURY_FA',0),('2025-05-01','PERSONNEL_INJURY_MT',0),('2025-05-01','PROPERTY_DAMAGE',2),('2025-05-01','NEAR_MISS',0),('2025-05-01','ENVIRONMENTAL',3),('2025-05-01','SECURITY',1),('2025-05-01','MOTOR_VEHICLE_ACCIDENTS',1),('2025-05-01','FATALITY',0),('2025-05-01','FIRES',0),('2025-05-01','NON_TABULATED',0),
 ('2025-06-01','BANKERS_LTI',0),('2025-06-01','CONTRACTOR_LTI',0),('2025-06-01','RESTRICTED_WORK_CASE',0),('2025-06-01','PERSONNEL_INJURY_FA',1),('2025-06-01','PERSONNEL_INJURY_MT',1),('2025-06-01','PROPERTY_DAMAGE',0),('2025-06-01','NEAR_MISS',1),('2025-06-01','ENVIRONMENTAL',2),('2025-06-01','SECURITY',0),('2025-06-01','MOTOR_VEHICLE_ACCIDENTS',1),('2025-06-01','FATALITY',0),('2025-06-01','FIRES',0),('2025-06-01','NON_TABULATED',0)
)
insert into public.hse_monthly_incidents(reporting_period_id, incident_type_id, incident_count)
select p.id, t.id, s.incident_count from source s join public.reporting_periods p on p.period_date=s.period_date join public.hse_incident_types t on t.code=s.code
on conflict (reporting_period_id, incident_type_id) do update set incident_count=excluded.incident_count, updated_at=now();
with source(period_date, bankers_hours, contractor_hours) as (values ('2025-04-01'::date,74540,136823),('2025-05-01',74720,131915),('2025-06-01',72050,127093))
insert into public.hse_exposure_hours(reporting_period_id, bankers_hours, contractor_hours)
select p.id,s.bankers_hours,s.contractor_hours from source s join public.reporting_periods p on p.period_date=s.period_date
on conflict (reporting_period_id) do update set bankers_hours=excluded.bankers_hours, contractor_hours=excluded.contractor_hours, updated_at=now();
with source(period_date, total_recordable) as (values ('2025-04-01'::date,0),('2025-05-01',0),('2025-06-01',1))
insert into public.hse_monthly_recordables(reporting_period_id,total_recordable)
select p.id,s.total_recordable from source s join public.reporting_periods p on p.period_date=s.period_date
on conflict (reporting_period_id) do update set total_recordable=excluded.total_recordable,updated_at=now();

-- HSE monthly narratives. Existing May text is replaced with the actual May Word report.
delete from public.hse_narratives where reporting_period_id in (select id from public.reporting_periods where period_date in ('2025-05-01','2025-06-01'));
with source(period_date, section_code, html) as (values
('2025-05-01'::date,'OPERATIONS_SUPPORT',$html$<ul><li>Attend contractors Weekly safety meetings.</li><li>Held monthly safety meetings with all department of BPAL.</li><li>Ongoing support including Acid jobs, Work over processes, hot works permits, confined space entry and tank cleaning, air monitoring for confined space entry, BPAL site works, lease and contractor inspections, non-conformities noted, reported and rectified.</li><li>Conducted work site, truck, rig and lease inspections throughout the Patos-Marinza field.</li><li>Ensuring fluid hauling contractors, driver’s ADR’s and truck inspections are up to date. Tank trucks with issues identified during inspections have been taken out of service.</li><li>Gas readings/field survey and H2S support including air trailer support, gas testing on wells, scrubbers, equipment calibration and testing. There were 323 gas readings and 26 Safety Supports done by H&amp;S during May.</li><li>Continue with the fire extinguishers 9 and Fire suppression system inspections 21, safety support with Fire truck 5. Annual Servicing of Fire Extinguishers was carried out by contracting company.</li></ul>$html$),
('2025-05-01','INCIDENT_INVESTIGATIONS',$html$<p>Completed incident investigations and reports as required. There were 03 Incidents reported in May. The incident breakdown is as follows.</p>$html$),
('2025-05-01','INCIDENT_BREAKDOWN',$html$<p>See the imported H&amp;S incident detail records for May 2025.</p>$html$),
('2025-05-01','HS_TRAINING',$html$<ul><li>H2S training for BPAL and Contractors employees for new employees and refresher training.</li><li>Conducted 100 safety inductions/orientations for Visitors and Contractors’ employees.</li><li>Ongoing work with contractor HSE representatives to improve competency.</li><li>ERT – 3 Emergency responses, 3 Fires and 3 SCBA drill.</li><li>SCBA refill and inspections - 9.</li><li>H2S awareness training – 40 hours.</li><li>WAH training – 24 hours.</li><li>Firefighting training – 6 hours.</li><li>Fire suppression systems inspection – 21.</li><li>Fire extinguishers inspected – 9 (ABC&amp;CO2).</li><li>eGSO Inductions – 10.</li><li>Safety Orientations – 100.</li><li>Defensive driving training – 2.</li><li>Work site inspections – 77.</li><li>Lease inspections – 0.</li><li>Facility/Safety Inspections - 7.</li><li>Truck inspections – 16 (including tank trucks, pickers, buses).</li><li>Work at Height equipment inspection - 0.</li><li>Rig inspections – 6.</li><li>Hot Work permits - 81.</li></ul>$html$),
('2025-05-01','HEALTH',$html$<p>Continue health monitoring by BPAL/MRDC medical staff in Patos Marinza.</p><p>There were 70 visits; 59 first visits and 11 follow up, at the CTF medical facility by BPAL and Contractor employees in the May reporting period as per the monthly report from the MRDC. A breakdown of the visits is available in the MRDC monthly report.</p>$html$),
('2025-06-01','OPERATIONS_SUPPORT',$html$<ul><li>Attend contractors Weekly safety meetings.</li><li>Held monthly safety meetings with all department of BPAL.</li><li>Ongoing support including Acid jobs, Work over processes, hot works permits, confined space entry and tank cleaning, air monitoring for confined space entry, BPAL site works, lease and contractor inspections, non-conformities noted, reported and rectified.</li><li>Conducted work site, truck, rig and lease inspections throughout the Patos-Marinza field.</li><li>Ensuring fluid hauling contractors, driver’s ADR’s and truck inspections are up to date. Tank trucks with issues identified during inspections have been taken out of service.</li><li>Gas readings/field survey and H2S support including air trailer support, gas testing on wells, scrubbers, equipment calibration and testing. There were 1093 gas readings and 2 Safety Supports done by H&amp;S during June.</li><li>Continue with the fire extinguishers inspection 25 and Fire suppression system inspections 26, safety support with Fire truck 16. Annual Servicing of Fire Extinguishers was carried out by contracting company.</li></ul>$html$),
('2025-06-01','INCIDENT_INVESTIGATIONS',$html$<p>Completed incident investigations and reports as required. There were 04 Incidents reported in June. The incident breakdown is as follows.</p>$html$),
('2025-06-01','INCIDENT_BREAKDOWN',$html$<p>See the imported H&amp;S incident detail records for June 2025.</p>$html$),
('2025-06-01','HS_TRAINING',$html$<ul><li>H2S Awareness training for BPAL and Contractors employees for new employees and refresher training – 84 Hours.</li><li>Conducted 34 safety inductions/orientations for Visitors and Contractors’ employees.</li><li>Ongoing work with contractor HSE representatives to improve competency.</li><li>ERT – 3 Emergency responses, 3 Fires and 3 SCBA drill.</li><li>SCBA refill and inspections - 9.</li><li>WAH training – 24 hours.</li><li>Firefighting training – 22 hours.</li><li>Fire suppression systems inspection – 21.</li><li>Fire extinguishers inspected – 9 (ABC&amp;CO2).</li><li>eGSO Inductions – 08.</li><li>Safety Orientations – 34.</li><li>Defensive driving training – 2.</li><li>Work site inspections – 77.</li><li>Lease inspections – 0.</li><li>Facility/Safety Inspections - 7.</li><li>Truck inspections – 16 (including tank trucks, pickers, buses).</li><li>Work at Height equipment inspection - 0.</li><li>Rig inspections – 6.</li><li>Hot Work permits - 68.</li></ul>$html$),
('2025-06-01','HEALTH',$html$<p>Continue health monitoring by BPAL/MRDC medical staff in Patos Marinza.</p><p>There were 100 visits; 75 first visits and 25 follow up, at the CTF medical facility by BPAL and Contractor employees in the June reporting period as per the monthly report from the ASCENDISMED INTERNATIONAL. A breakdown of the visits is available in the ASCENDISMED INTERNATIONAL monthly report.</p>$html$)
)
insert into public.hse_narratives(reporting_period_id, section_code, content)
select p.id,s.section_code,jsonb_build_object('html',s.html) from source s join public.reporting_periods p on p.period_date=s.period_date;

-- Security values and narratives from the two supplied reports.
with source(period_date, security_incident_count, mobile_patrol_spot_checks, geofence_dispatches, gps_operator_spot_checks, storage_yard_spot_checks, inventory_checks, security_investigations, static_sites, operations_support, security_incidents, incidents_high_importance) as (values
('2025-05-01'::date,1,732,94,1242,0,0,1,41,$html$<ul><li>There was 01 security incidents this month.</li><li>732 documented spot checks were carried out by the security mobile patrols on contractor tanker trucks. In addition there were numerous spot checks carried out on various types of contractor’s vehicles.</li><li>The six Mobile Patrols were dispatched 94 times this month for lease geo fence breaches.</li><li>1242 documented spot checks were conducted by the GPS operators.</li><li>0 documentation spot check was conducted at the New Storage Yard.</li><li>0 BPAL NSY Inventory checks were conducted this month.</li><li>1 security investigations were conducted this month.</li><li>The guard force provided security at 41 static sites.</li></ul>$html$,$html$<p>ALB0525SI004 — Theft and recovery of 2 water hoses and 2 water nozzles stolen from the hydrant cassette at O29A.</p>$html$,$html$<p>None</p>$html$),
('2025-06-01',0,645,129,1233,0,0,0,27,$html$<ul><li>There were 00 security incidents this month.</li><li>645 documented spot checks were carried out by the security mobile patrols on contractor tanker trucks. In addition there were numerous spot checks carried out on various types of contractor’s vehicles.</li><li>The 6 Mobile Patrols were dispatched 129 times this month for lease geo fence breaches.</li><li>1233 documented spot checks were conducted by the GPS operators.</li><li>0 documentation spot check was conducted at the New Storage Yard.</li><li>0 BPAL NSY Inventory checks were conducted this month.</li><li>0 security investigations were conducted this month.</li><li>The guard force provided security at 27 static sites.</li></ul>$html$,$html$<p>No security incidents recorded.</p>$html$,$html$<p>None</p>$html$)
)
insert into public.security_monthly_reports(reporting_period_id,security_incident_count,mobile_patrol_spot_checks,geofence_dispatches,gps_operator_spot_checks,storage_yard_spot_checks,inventory_checks,security_investigations,static_sites,operations_support,security_incidents,incidents_high_importance)
select p.id,s.security_incident_count,s.mobile_patrol_spot_checks,s.geofence_dispatches,s.gps_operator_spot_checks,s.storage_yard_spot_checks,s.inventory_checks,s.security_investigations,s.static_sites,jsonb_build_object('html',s.operations_support),jsonb_build_object('html',s.security_incidents),jsonb_build_object('html',s.incidents_high_importance) from source s join public.reporting_periods p on p.period_date=s.period_date
on conflict (reporting_period_id) do update set security_incident_count=excluded.security_incident_count,mobile_patrol_spot_checks=excluded.mobile_patrol_spot_checks,geofence_dispatches=excluded.geofence_dispatches,gps_operator_spot_checks=excluded.gps_operator_spot_checks,storage_yard_spot_checks=excluded.storage_yard_spot_checks,inventory_checks=excluded.inventory_checks,security_investigations=excluded.security_investigations,static_sites=excluded.static_sites,operations_support=excluded.operations_support,security_incidents=excluded.security_incidents,incidents_high_importance=excluded.incidents_high_importance,updated_at=now();

-- Environment reports and Ecopit inputs. CHEMICAL is an additional June workbook material.
alter table public.environment_ecopit_monthly_values drop constraint if exists environment_ecopit_monthly_values_waste_type_check;
alter table public.environment_ecopit_monthly_values add constraint environment_ecopit_monthly_values_waste_type_check check (waste_type in ('CONTAMINATED_GRAVEL_SOIL','CHEMICAL','EMULSION','WATER','DRILLING_CUTTINGS','DRILLING_MUD','PRODUCED_SAND','SOLIDS','SLUDGE','BOTTOM_TANK_SLUDGE'));
insert into public.environment_monthly_reports(reporting_period_id,environmental_incident_count,operations_support,incidents_breakdown,environmental_incidents,monitoring_program)
select id,3,
jsonb_build_object('html',$may_ops$<ul><li>Ongoing site audits and inspections, including water, noise and air monitoring and sampling, environmental compliance audits, lease and well site inspections.</li><li>Monitoring of fluid levels in ecopits and wet mud facility.</li><li>The Ecology pits receiving waste this month were Ecopit 3 and 8.</li><li>The value for all other pits was zero.</li><li>Ongoing monitoring and response to environmental incidents, spills and community grievances.</li><li>Supervision and management of ongoing regulatory requests for information.</li><li>Communication with the National Environmental Agency for permitting matters.</li><li>Lease remediation and material reuse: 11332 m3 of clean soil stored near Pad D was reused during photovoltaics lease construction.</li></ul>$may_ops$),
jsonb_build_object('html',$may_breakdown$<p>See imported environmental incident detail records for May 2025.</p>$may_breakdown$),
jsonb_build_object('html',$may_incidents$<p>There were 03 reportable environmental incidents this month.</p>$may_incidents$),
jsonb_build_object('html',$may_monitoring$<ul><li>Environmental monitoring programme ongoing.</li><li>Completed monitoring programme with third parties.</li><li>Continued work for the 3, 6 monthly and yearly reports to the regulators.</li></ul>$may_monitoring$)
from public.reporting_periods where period_date='2025-05-01'
on conflict (reporting_period_id) do update set environmental_incident_count=excluded.environmental_incident_count,operations_support=excluded.operations_support,incidents_breakdown=excluded.incidents_breakdown,environmental_incidents=excluded.environmental_incidents,monitoring_program=excluded.monitoring_program,updated_at=now();

insert into public.environment_monthly_reports(reporting_period_id,environmental_incident_count,operations_support,incidents_breakdown,environmental_incidents,monitoring_program)
select id,2,
jsonb_build_object('html',$june_ops$<ul><li>Ongoing site audits and inspections, including water, noise and air monitoring and sampling, environmental compliance audits, lease and well site inspections.</li><li>Monitoring of fluid levels in ecopits and wet mud facility.</li><li>The Ecology pits receiving waste this month were Ecopit 3 and 8.</li><li>The value for all other pits was zero.</li><li>Ongoing monitoring and response to environmental incidents, spills and community grievances.</li><li>Supervision and management of ongoing regulatory requests for information.</li><li>Communication with the National Environmental Agency for permitting matters.</li><li>Lease remediation and material reuse: 6472 m3 of clean soil stored near Pad D was reused during photovoltaics lease construction.</li></ul>$june_ops$),
jsonb_build_object('html',$june_breakdown$<p>See imported environmental incident detail records for June 2025.</p>$june_breakdown$),
jsonb_build_object('html',$june_incidents$<p>There were 02 reportable environmental incidents this month.</p>$june_incidents$),
jsonb_build_object('html',$june_monitoring$<ul><li>Environmental monitoring programme ongoing.</li><li>Completed monitoring programme with third parties.</li><li>Continued work for the 3, 6 monthly and yearly reports to the regulators.</li></ul>$june_monitoring$)
from public.reporting_periods where period_date='2025-06-01'
on conflict (reporting_period_id) do update set environmental_incident_count=excluded.environmental_incident_count,operations_support=excluded.operations_support,incidents_breakdown=excluded.incidents_breakdown,environmental_incidents=excluded.environmental_incidents,monitoring_program=excluded.monitoring_program,updated_at=now();

delete from public.environment_ecopit_monthly_values where reporting_period_id in (select id from public.reporting_periods where period_date in ('2025-05-01','2025-06-01'));
with source(period_date,ecopit,waste_type,quantity_m3) as (values
('2025-05-01'::date,'Ecopit 3','EMULSION',345.63),('2025-05-01','Ecopit 3','BOTTOM_TANK_SLUDGE',137.84),('2025-05-01','Ecopit 8','EMULSION',1616.84),('2025-05-01','Ecopit 8','PRODUCED_SAND',44),('2025-05-01','Ecopit 8','SLUDGE',478.13),('2025-05-01','Ecopit 8','BOTTOM_TANK_SLUDGE',1521.07),
('2025-06-01','Ecopit 3','EMULSION',351.16),('2025-06-01','Ecopit 3','BOTTOM_TANK_SLUDGE',58.73),('2025-06-01','Ecopit 7','EMULSION',4.71),('2025-06-01','Ecopit 8','CHEMICAL',4.27),('2025-06-01','Ecopit 8','EMULSION',1360.22),('2025-06-01','Ecopit 8','PRODUCED_SAND',58.59),('2025-06-01','Ecopit 8','SLUDGE',687.30),('2025-06-01','Ecopit 8','BOTTOM_TANK_SLUDGE',986.81)
)
insert into public.environment_ecopit_monthly_values(reporting_period_id,ecopit,waste_type,quantity_m3)
select p.id,s.ecopit,s.waste_type,s.quantity_m3 from source s join public.reporting_periods p on p.period_date=s.period_date;

-- Traceable detailed incidents from the source reports; these support the narrative/report record.
delete from public.hse_incident_details where reporting_period_id in (select id from public.reporting_periods where period_date in ('2025-05-01','2025-06-01'));
delete from public.security_incident_details where reporting_period_id in (select id from public.reporting_periods where period_date in ('2025-05-01','2025-06-01'));
delete from public.environment_incident_details where reporting_period_id in (select id from public.reporting_periods where period_date in ('2025-05-01','2025-06-01'));
with source(period_date,type_code,incident_date,brief_description,classification) as (values
('2025-05-01'::date,'PROPERTY_DAMAGE','2025-05-02'::date,$txt$While running in hole with Petrosolution Co-rod with the injector mounted on Rig RSS18, when the co-rod was 900 m down the hole, the guide arm spool (welded on the injector frame) failed at the welding point, and it got stuck between the chains of the injector. The co-rod was twisted between the reel and the guiding arm. No injuries reported.$txt$,'ALB0525PDI005'),
('2025-05-01','MOTOR_VEHICLE_ACCIDENTS','2025-05-17',$txt$Night shift operator fell asleep while driving BPAL Toyota pickup truck. As a result the truck ended up in the ditch. No injury reported.$txt$,'ALB0525MVI006'),
('2025-05-01','PROPERTY_DAMAGE','2025-05-26',$txt$While SIA Kalandra was cleaning PadM30D (adjacent to the south berm of weigh scale site), the excavator bucket made contact and broke a power line running from the power panel box on the boundary barrier of weigh scale area to one of the floodlight poles approximately 20m east to the box. The power cable was on the ground, on the outer steep embankment, covered by vegetation. At the time of the incident, the power cable was not live, as during the day the light sensor switch is off. No injuries or other damage reported.$txt$,'ALB0525PDI006'),
('2025-06-01','NEAR_MISS','2025-06-02',$txt$A technical support employee left the main road and drove toward J29A. Then he stopped and reversed. The rear tires of his vehicle with number plate AA968JP ended up to the side of the road. No injuries reported of damages to the vehicle.$txt$,'ALB0625NM001'),
('2025-06-01','PERSONNEL_INJURY_MT','2025-06-18',$txt$After the lunch break a pipe inspection assistant - Gear 77 employee, was going to his workplace. Walking near a crane not operating with the outriggers open, he lost balance and hit his forehead against the outrigger. As a result he suffered a cut on the upper part of the forehead, and a slight laceration on the top of the head. He was taken to CTF clinic, and after that to the Fier Regional Hospital for further treatment. The hospital medics sutured the cut and after keeping the patient for few hours, released him to go home in the evening.$txt$,'ALB0625MTI001'),
('2025-06-01','MOTOR_VEHICLE_ACCIDENTS','2025-06-20',$txt$At approximately 1615 hours, Q. Sinaj tank truck AA961BP went to Pad N24A to unload water into tank No 3. While reversing the tank truck made contact with the loading box. As a result the line of the ESD valve was pushed back and a 4×2 spool was broken and little water was spilt (dripped) on the ground. No injuries or other damage reported.$txt$,'ALB0625MVI007'),
('2025-06-01','PERSONNEL_INJURY_FA','2025-06-24',$txt$Albdrilling crew was trying to break off the connection of the drilling pipe with tongs. While one of the floorman was moving for the safe distance, the driller started pulling the tongs without torque because hadn’t gripped and the tongs slightly hit the floorman on the left side of his body. The first aid was administered and employee was in good condition.$txt$,'ALB0625FAI001')
)
insert into public.hse_incident_details(reporting_period_id,incident_type_id,incident_date,brief_description,classification)
select p.id,t.id,s.incident_date,s.brief_description,s.classification from source s join public.reporting_periods p on p.period_date=s.period_date join public.hse_incident_types t on t.code=s.type_code;
insert into public.security_incident_details(reporting_period_id,incident_date,incident,description)
select p.id,'2025-05-31','ALB0525SI004','Theft and recovery of 2 water hoses and 2 water nozzles stolen from the hydrant cassette at O29A.' from public.reporting_periods p where p.period_date='2025-05-01';
with source(period_date,incident_date,incident,description) as (values
('2025-05-01'::date,'2025-05-07'::date,'ALB0525ENV009','200 liters of emulsion spilt on lease M30A following the failure due to corrosion of emulsion line.'),
('2025-05-01','2025-05-07','ALB0525ENV010','Approximately 300 liters of emulsion spilt near lease 753-M following the failure of an emulsion line.'),
('2025-05-01','2025-05-27','ALB0525ENV011','Approximately 1000 liters of emulsion spilt on lease 2182-M. Apparently the incident was connected with cementing process taking place at well 6002.'),
('2025-06-01','2025-06-18','ALB0625ENV012','A spill of approximately 8000 liters of emulsion occurred off lease 735-M. The reason of incident was the failure due to corrosion of an 8 inch emulsion line.'),
('2025-06-01','2025-06-30','ALB0625ENV013','A volume of approximately 2000 liters of emulsion was released off lease 719-M. 50 liters out of that volume is oil. The reason of incident was failure due to corrosion of an underground 6 inch emulsion line.')
)
insert into public.environment_incident_details(reporting_period_id,incident_date,incident,description)
select p.id,s.incident_date,s.incident,s.description from source s join public.reporting_periods p on p.period_date=s.period_date;
