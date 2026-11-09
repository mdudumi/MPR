-- May 2025 H&S correction from the user-approved report text and incident register.
-- Run after migration 024.
begin;

insert into public.hse_narratives(reporting_period_id,section_code,content)
select id,'OPERATIONS_SUPPORT',jsonb_build_object('html',$operations$<ul><li>Attend contractors Weekly safety meetings.</li><li>Held monthly safety meetings with all department of BPAL.</li><li>Ongoing support including Acid jobs, Work over processes, hot works permits, confined space entry and tank cleaning, air monitoring for confined space entry, BPAL site works, lease and contractor inspections, non-conformities noted, reported and rectified.</li><li>Conducted work site, truck, rig and lease inspections throughout the Patos-Marinza field.</li><li>Ensuring fluid hauling contractors, driver’s ADR’s and truck inspections are up to date. Tank trucks with issues identified during inspections have been taken out of service.</li><li>Gas readings/field survey and H2S support including air trailer support, gas testing on wells, scrubbers, equipment calibration and testing. There were 323 gas readings and 26 Safety Supports done by H&amp;S during May.</li><li>Continue with the fire extinguishers 9 and Fire suppression system inspections 21, safety support with Fire truck 5. Annual Servicing of Fire Extinguishers was carried out by contracting company.</li></ul>$operations$)
from public.reporting_periods where period_date='2025-05-01'
on conflict(reporting_period_id,section_code) do update set content=excluded.content,updated_at=now();

insert into public.hse_narratives(reporting_period_id,section_code,content)
select id,'HS_TRAINING',jsonb_build_object('html',$training$<ul><li>H2S training for BPAL and Contractors employees for new employees and refresher training.</li><li>Conducted 100 safety inductions/orientations for Visitors and Contractors’ employees.</li><li>Ongoing work with contractor HSE representatives to improve competency.</li><li>ERT – 3 Emergency responses, 3 Fires and 3 SCBA drill.</li><li>SCBA refill and inspections - 9.</li><li>H2S awareness training – 40 hours.</li><li>WAH training – 24 hours.</li><li>Firefighting training – 6 hours.</li><li>Fire suppression systems inspection – 21.</li><li>Fire extinguishers inspected – 9 (ABC&amp;CO2).</li><li>eGSO Inductions – 10.</li><li>Safety Orientations – 100.</li><li>Defensive driving training – 2.</li><li>Work site inspections – 77.</li><li>Lease inspections – 0.</li><li>Facility/Safety Inspections - 7.</li><li>Truck inspections – 16 (including tank trucks, pickers, buses).</li><li>Work at Height equipment inspection - 0.</li><li>Rig inspections – 6.</li><li>Hot Work permits - 81.</li></ul>$training$)
from public.reporting_periods where period_date='2025-05-01'
on conflict(reporting_period_id,section_code) do update set content=excluded.content,updated_at=now();

insert into public.hse_narratives(reporting_period_id,section_code,content)
select id,'HEALTH',jsonb_build_object('html',$health$<ul><li>Continue health monitoring by BPAL/MRDC medical staff in Patos Marinza.</li><li>There were 70 visits; 59 first visits and 11 follow up, at the CTF medical facility by BPAL and Contractor employees in the May reporting period as per the monthly report from the MRDC. A breakdown of the visits is available in the MRDC monthly report.</li></ul>$health$)
from public.reporting_periods where period_date='2025-05-01'
on conflict(reporting_period_id,section_code) do update set content=excluded.content,updated_at=now();

delete from public.hse_incident_details where reporting_period_id=(select id from public.reporting_periods where period_date='2025-05-01');
with source(type_code,incident_date,incident_code,brief_description) as (values
('PROPERTY_DAMAGE','2025-05-02'::date,'ALB0525PDI005',$d1$While running in hole with Petrosolution Co-rod with the injector mounted on Rig RSS18, when the co-rod was 900 m down the hole, the guide arm spool (welded on the injector frame) failed at the welding point, and it got stuck between the chains of the injector. The co-rod was twisted between the reel and the guiding arm. No injuries reported.$d1$),
('MOTOR_VEHICLE_ACCIDENTS','2025-05-17','ALB0525MVI006',$d2$Night shift operator fell asleep while driving BPAL Toyota pickup truck. As a result the truck ended up in the ditch. No injury reported.$d2$),
('PROPERTY_DAMAGE','2025-05-26','ALB0525PDI006',$d3$While SIA Kalandra was cleaning PadM30D (adjacent to the south berm of weigh scale site), the excavator bucket made contact and broke a power line running from the power panel box on the boundary barrier of weigh scale area to one of the floodlight poles approximately 20m east to the box. The power cable was on the ground, on the outer steep embankment, covered by vegetation. At the time of the incident, the power cable was not live, as during the day the light sensor switch is off. No injuries or other damage reported.$d3$)
)
insert into public.hse_incident_details(reporting_period_id,incident_type_id,incident_date,brief_description,classification)
select p.id,t.id,s.incident_date,s.brief_description,s.incident_code from source s join public.reporting_periods p on p.period_date='2025-05-01' join public.hse_incident_types t on t.code=s.type_code;

commit;
