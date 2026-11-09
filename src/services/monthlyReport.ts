import { supabase } from '../lib/supabase'
export async function getMonthlyProgressReport(periodId:string){
  if(!supabase)throw new Error('Supabase is not configured.')
  const [submissions,hseTypes,hseIncidents,hseExposure,hseNarratives,hseDetails,security,securityDetails,environment,environmentDetails,environmentTables,ecopits,csr,grievances,production,plan,inventory,water,operations,sales,pep,facilities,drilling,productionHistory,inventoryHistory,waterHistory,operationsHistory,salesHistory,pepHistory,operationSummary,polymerInjection,formationProduction]=await Promise.all([
    supabase.from('monthly_submissions').select('status,completion_percentage,department:departments!inner(code,name)').eq('reporting_period_id',periodId),
    supabase.from('hse_incident_types').select('id,code,name,display_order,inception_baseline').order('display_order'),
    supabase.from('hse_monthly_incidents').select('reporting_period_id,incident_type_id,incident_count'),
    supabase.from('hse_exposure_hours').select('*'),
    supabase.from('hse_narratives').select('*').eq('reporting_period_id',periodId),supabase.from('hse_incident_details').select('*').eq('reporting_period_id',periodId).order('incident_date'),
    supabase.from('security_monthly_reports').select('*').eq('reporting_period_id',periodId).maybeSingle(),supabase.from('security_incident_details').select('*').eq('reporting_period_id',periodId).order('incident_date'),
    supabase.from('environment_monthly_reports').select('*').eq('reporting_period_id',periodId).maybeSingle(),
    supabase.from('environment_incident_details').select('*').eq('reporting_period_id',periodId).order('incident_date'),
    supabase.from('environment_supporting_tables').select('*').eq('reporting_period_id',periodId).order('table_number'),
    supabase.from('environment_ecopit_monthly_values').select('*').eq('reporting_period_id',periodId),
    supabase.from('csr_monthly_reports').select('*').eq('reporting_period_id',periodId).maybeSingle(),
    supabase.from('csr_grievances').select('*').eq('reporting_period_id',periodId),
    supabase.from('production_monthly').select('*').eq('reporting_period_id',periodId).maybeSingle(),
    supabase.from('production_plan_budget').select('*').eq('reporting_period_id',periodId).maybeSingle(),
    supabase.from('crude_oil_inventory_monthly').select('*').eq('reporting_period_id',periodId),
    supabase.from('water_inventory_monthly').select('*').eq('reporting_period_id',periodId),
    supabase.from('production_operations_monthly').select('*').eq('reporting_period_id',periodId),
    supabase.from('sales_delivery_reporting_monthly').select('*').eq('reporting_period_id',periodId),
    supabase.from('pep_asp_reporting_monthly').select('*').eq('reporting_period_id',periodId).maybeSingle(),
    supabase.from('facilities_monthly_reports').select('*').eq('reporting_period_id',periodId).maybeSingle(),
    supabase.from('drilling_wells').select('*').eq('reporting_period_id',periodId),
    supabase.from('production_monthly').select('*').order('reporting_period_id'),
    supabase.from('crude_oil_inventory_monthly').select('*').order('reporting_period_id'),
    supabase.from('water_inventory_monthly').select('*').order('reporting_period_id'),
    supabase.from('production_operations_monthly').select('*').eq('reporting_period_id',periodId),
    supabase.from('sales_delivery_reporting_monthly').select('*').order('reporting_period_id'),
    supabase.from('pep_asp_reporting_monthly').select('*').order('reporting_period_id'),
    supabase.from('production_operations_summary').select('*').eq('reporting_period_id',periodId).maybeSingle(),
    supabase.from('production_polymer_injection_monthly').select('*').order('reporting_period_id'),
    supabase.from('production_formation_monthly').select('*').eq('reporting_period_id',periodId).order('formation')
  ])
  const error=[submissions,hseTypes,hseIncidents,hseExposure,hseNarratives,hseDetails,security,securityDetails,environment,environmentDetails,environmentTables,ecopits,csr,grievances,production,plan,inventory,water,operations,sales,pep,facilities,drilling,productionHistory,inventoryHistory,waterHistory,operationsHistory,salesHistory,pepHistory,operationSummary,polymerInjection,formationProduction].map(x=>x.error).find(Boolean)
  if(error)throw error
  const optional = await Promise.all([supabase.from('reporting_periods').select('id,period_date').order('period_date'),supabase.from('hse_incident_ytd_baselines').select('*'),supabase.from('hse_exposure_ytd_baselines').select('*'),supabase.from('hse_exposure_inception_baselines').select('*').eq('id',true).maybeSingle()])
  return {periods:optional[0].error?[]:optional[0].data??[],submissions:submissions.data??[],hseTypes:hseTypes.data??[],hseIncidents:hseIncidents.data??[],hseExposure:hseExposure.data??[],hseNarratives:hseNarratives.data??[],hseDetails:hseDetails.data??[],security:security.data,securityDetails:securityDetails.data??[],environment:environment.data,ecopits:ecopits.data??[],environmentDetails:environmentDetails.data??[],environmentTables:environmentTables.data??[],csr:csr.data,grievances:grievances.data??[],production:production.data,plan:plan.data,inventory:inventory.data??[],water:water.data??[],operations:operations.data??[],sales:sales.data??[],pep:pep.data,facilities:facilities.data,drilling:drilling.data??[],productionHistory:productionHistory.data??[],inventoryHistory:inventoryHistory.data??[],waterHistory:waterHistory.data??[],operationsHistory:operationsHistory.data??[],salesHistory:salesHistory.data??[],pepHistory:pepHistory.data??[],operationSummary:operationSummary.data,polymerInjection:polymerInjection.data,formationProduction:formationProduction.data??[],hseIncidentYtdBaselines:optional[1].error?[]:optional[1].data??[],hseExposureYtdBaselines:optional[2].error?[]:optional[2].data??[],hseExposureInceptionBaseline:optional[3].error?null:optional[3].data}
}
