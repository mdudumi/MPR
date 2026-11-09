-- June 2025 H&S correction from the user-approved report text and incident register.
-- Run after migration 024.
begin;

insert into public.hse_narratives(reporting_period_id,section_code,content)
select id,'OPERATIONS_SUPPORT',jsonb_build_object('html',$operations$<ul><li>Attend contractors Weekly safety meetings.</li><li>Held monthly safety meetings with all department of BPAL.</li><li>Ongoing support including Acid jobs, Work over processes, hot works permits, confined space entry and tank cleaning, air monitoring for confined space entry, BPAL site works, lease and contractor inspections, non-conformities noted, reported and rectified.</li><li>Conducted work site, truck, rig and lease inspections throughout the Patos-Marinza field.</li><li>Ensuring fluid hauling contractors, driver’s ADR’s and truck inspections are up to date. Tank trucks with issues identified during inspections have been taken out of service.</li><li>Gas readings/field survey and H2S support including air trailer support, gas testing on wells, scrubbers, equipment calibration and testing. There were 1093 gas readings and 2 Safety Supports done by H&amp;S during June.</li><li>Continue with the fire extinguishers inspection 25 and Fire suppression system inspections 26, safety support with Fire truck 16. Annual Servicing of Fire Extinguishers was carried out by contracting company.</li></ul>$operations$)
from public.reporting_periods where period_date='2025-06-01'
on conflict(reporting_period_id,section_code) do update set content=excluded.content,updated_at=now();

insert into public.hse_narratives(reporting_period_id,section_code,content)
select id,'HS_TRAINING',jsonb_build_object('html',$training$<ul><li>H2S Awareness training for BPAL and Contractors employees for new employees and refresher training – 84 Hours.</li><li>Conducted 34 safety inductions/orientations for Visitors and Contractors’ employees.</li><li>Ongoing work with contractor HSE representatives to improve competency.</li><li>ERT – 3 Emergency responses, 3 Fires and 3 SCBA drill.</li><li>SCBA refill and inspections - 9.</li><li>WAH training – 24 hours.</li><li>Firefighting training – 22 hours.</li><li>Fire suppression systems inspection – 21.</li><li>Fire extinguishers inspected – 9 (ABC&amp;CO2).</li><li>eGSO Inductions – 08.</li><li>Safety Orientations – 34.</li><li>Defensive driving training – 2.</li><li>Work site inspections – 77.</li><li>Lease inspections – 0.</li><li>Facility/Safety Inspections - 7.</li><li>Truck inspections – 16 (including tank trucks, pickers, buses).</li><li>Work at Height equipment inspection - 0.</li><li>Rig inspections – 6.</li><li>Hot Work permits - 68.</li></ul>$training$)
from public.reporting_periods where period_date='2025-06-01'
on conflict(reporting_period_id,section_code) do update set content=excluded.content,updated_at=now();

insert into public.hse_narratives(reporting_period_id,section_code,content)
select id,'HEALTH',jsonb_build_object('html',$health$<ul><li>Continue health monitoring by BPAL/MRDC medical staff in Patos Marinza.</li><li>There were 100 visits; 75 first visits and 25 follow up, at the CTF medical facility by BPAL and Contractor employees in the June reporting period as per the monthly report from the ASCENDISMED INTERNATIONAL. A breakdown of the visits is available in the ASCENDISMED INTERNATIONAL monthly report.</li></ul>$health$)
from public.reporting_periods where period_date='2025-06-01'
on conflict(reporting_period_id,section_code) do update set content=excluded.content,updated_at=now();

delete from public.hse_incident_details where reporting_period_id=(select id from public.reporting_periods where period_date='2025-06-01');
with source(type_code,incident_date,incident_code,brief_description) as (values
('NEAR_MISS','2025-06-02'::date,'ALB0625NM001',$d1$A technical support employee left the main road and drove toward J29A. Then he stopped and reversed. The rear tires of his vehicle with number plate AA968JP ended up to the side of the road. No injuries reported of damages to the vehicle.$d1$),
('PERSONNEL_INJURY_MT','2025-06-18','ALB0625MTI001',$d2$After the lunch break a pipe inspection assistant - Gear 77 employee, was going to his workplace. Walking near a crane not operating with the outriggers open, he lost balance and hit his forehead against the outrigger. As a result he suffered a cut on the upper part of the forehead, and a slight laceration on the top of the head. He was taken to CTF clinic, and after that to the Fier Regional Hospital for further treatment. The hospital medics sutured the cut and after keeping the patient for few hours, released him to go home in the evening.$d2$),
('MOTOR_VEHICLE_ACCIDENTS','2025-06-20','ALB0625MVI007',$d3$At approximately 1615 hours, Q. Sinaj tank truck AA961BP went to Pad N24A to unload water into tank No 3. While reversing the tank truck made contact with the loading box. As a result the line of the ESD valve was pushed back and a 4×2 spool was broken and little water was spilt (dripped) on the ground. No injuries or other damage reported.$d3$),
('PERSONNEL_INJURY_FA','2025-06-24','ALB0625FAI001',$d4$Albdrilling crew was trying to break off the connection of the drilling pipe with tongs. While one of the floorman was moving for the safe distance, the driller started pulling the tongs without torque because hadn’t gripped and the tongs slightly hit the floorman on the left side of his body. The first aid was administered and employee was in good condition.$d4$)
)
insert into public.hse_incident_details(reporting_period_id,incident_type_id,incident_date,brief_description,classification)
select p.id,t.id,s.incident_date,s.brief_description,s.incident_code from source s join public.reporting_periods p on p.period_date='2025-06-01' join public.hse_incident_types t on t.code=s.type_code;

commit;
