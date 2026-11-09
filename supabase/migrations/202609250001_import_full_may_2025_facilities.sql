-- Full workbook-sourced Facilities narratives for May 2025.
INSERT INTO public.facilities_monthly_reports (
  reporting_period_id,
  civil_general_activity,
  mechanical,
  electrical
)
SELECT
  p.id,
  jsonb_build_object('html', $civil$
<ul>
<li>Road maintenance and landscaping around the P-M field.</li>
<li>Lease repair and maintenance on various leases around the P-M field (Pad-H: repair the lease around the tanks).</li>
<li>Road cleaning and repair around the P-M field (clean up the road from Boilv oil bridge to 24H section, P28a to N27b, and Belina bridge-J29a).</li>
<li>Clean contamination in these pads: M30a, 1357, Ecopit 8, push the material at Ecopit 8, and well site 2182.</li>
<li>Thermal desorption unit is in commissioning phase. Ongoing work to complete the fire suppression system (civil work).</li>
<li>Connect well 6081 with tank and flow line (civil work).</li>
<li>Production cellar at thermal well 6111/N29a (civil work).</li>
<li>M32a: remove the soils from the pad (civil work).</li>
<li>Expose the corroded section at the intersection between M30c and 719P (civil work).</li>
<li>At well site 104S, prepare the site to install the flare system and the GOR. This well will be tested for production (civil work).</li>
<li>Clean the canal at 764M (service rig base) (civil work).</li>
<li>Start sludge cleaning at the three sites near the scale and near N31b. This work was finished with cleaning and leveling (PV Project) (civil work).</li>
<li>Production cellar at well 6189/M37a (civil work).</li>
<li>Install the pump jack at well 5790/M30a (civil work).</li>
<li>Prepare the basement for tanks at M37a for the corrosion inhibitor project (civil work).</li>
<li>Connect thermal well 5790/M30a with the flowline and tanks (civil work).</li>
<li>Dig a canal to connect the Ningbo pump with the injection well at I28a, as part of the project to install the Ningbo pump at I28a (civil work).</li>
<li>Transport soil from soil piles to N31b and M30d for the PV project (civil work).</li>
<li>Repair pad entrances and construct the concrete part to protect the paved road at O30c and Scale.</li>
</ul>
$civil$),
  jsonb_build_object('html', $mechanical$
<p>Pipelines and other mechanical works:</p>
<ul>
<li>Repair the corroded section near M30c and well 719P (mechanical works).</li>
<li>Tie in well 6081/O24a with tank and flow line (mechanical works).</li>
<li>Install the Ningbo pump at I28a and push piles (mechanical works).</li>
<li>Tie in thermal well 5790/M30a with the tanks and flowline (mechanical works).</li>
<li>Install hydrants for the fire suppression project at the thermal desorption unit (mechanical works).</li>
<li>Supply materials for tank 300 and patch the corroded spots as part of the annual inspection (mechanical connections).</li>
<li>Repair the shelter at the 764M service rig base and supply the materials (mechanical connections).</li>
</ul>
<p>Insulating team (sandblasting, internal coating, metallic insulating):</p>
<ul>
<li>Clean the sand around tank 300.</li>
<li>Insulate the buried insulated lines (new underground lines) at 5790/M30a.</li>
<li>Finish sandblasting tank 300/CTF.</li>
<li>Repair the paint of the gas scrubbers for the May inspection list.</li>
</ul>
$mechanical$),
  jsonb_build_object('html', $electrical$
<p>Electrical works:</p>
<ul>
<li>M37a: push piles for the electric cable and lights (civil and electrical works).</li>
<li>O30c: level crushed limestone for the electrical department (civil and electrical works).</li>
</ul>
$electrical$)
FROM public.reporting_periods p
WHERE p.period_date = DATE '2025-05-01'
ON CONFLICT (reporting_period_id)
DO UPDATE SET
  civil_general_activity = EXCLUDED.civil_general_activity,
  mechanical = EXCLUDED.mechanical,
  electrical = EXCLUDED.electrical,
  updated_at = NOW();
