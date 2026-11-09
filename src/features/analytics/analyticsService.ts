import { supabase } from '../../lib/supabase'
import type { ReportingPeriod } from '../../types/reporting'
import type { AnalyticsMetricId } from './metricRegistry'

type ValueRow = Record<string, unknown>
export type TrendPoint = { periodId: string; periodDate: string; value: number | null; plan: number | null }
export type DashboardAnalytics = { trend: TrendPoint[]; metricTrends: Record<AnalyticsMetricId, TrendPoint[]>; current: TrendPoint | null; previous: TrendPoint | null; ytdOilBbl: number | null; currentIncidentCount: number | null; securityIncidents: number | null; environmentalIncidents: number | null; grievanceCount: number; crudeInventoryM3: number | null; salesBbl: number | null; pepTonne: number | null; drillingWells: number; submissionCount: number }

const value = (row: ValueRow, key: string): number | null => typeof row[key] === 'number' ? row[key] : null
const sum = (rows: ValueRow[], key: string) => rows.reduce<number>((total, item) => total + (value(item, key) ?? 0), 0)
const historicalCache = new Map<string, { expiresAt: number; data: DashboardAnalytics }>()

export async function getDashboardAnalytics(periods: ReportingPeriod[], selectedId: string): Promise<DashboardAnalytics> {
  if (!supabase) throw new Error('Supabase is not configured.')
  const selected = periods.find(period => period.id === selectedId); if (!selected) throw new Error('The selected reporting period is unavailable.')
  const range = periods.filter(period => period.period_date <= selected.period_date).sort((a, b) => a.period_date.localeCompare(b.period_date)).slice(-12)
  const periodIds = range.map(period => period.id); const cacheKey = `${selectedId}:${periodIds.join(',')}`; const cached = historicalCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.data
  const [production, plans, incidents, security, environment, grievances, inventory, sales, pep, drilling, submissions] = await Promise.all([
    supabase.from('production_monthly').select('reporting_period_id,net_oil_bbl').in('reporting_period_id', periodIds),
    supabase.from('production_plan_budget').select('reporting_period_id,oil_forecast_bbl').in('reporting_period_id', periodIds),
    supabase.from('hse_monthly_incidents').select('reporting_period_id,incident_count').in('reporting_period_id', periodIds),
    supabase.from('security_monthly_reports').select('reporting_period_id,security_incident_count').in('reporting_period_id', periodIds),
    supabase.from('environment_monthly_reports').select('reporting_period_id,environmental_incident_count').in('reporting_period_id', periodIds),
    supabase.from('csr_grievances').select('reporting_period_id').in('reporting_period_id', periodIds),
    supabase.from('crude_oil_inventory_monthly').select('reporting_period_id,quantity_m3').in('reporting_period_id', periodIds),
    supabase.from('sales_delivery_reporting_monthly').select('reporting_period_id,net_oil_bbl').in('reporting_period_id', periodIds),
    supabase.from('pep_asp_reporting_monthly').select('reporting_period_id,pep_quantity_tonne').in('reporting_period_id', periodIds),
    supabase.from('drilling_wells').select('reporting_period_id').eq('reporting_period_id', selectedId),
    supabase.from('monthly_submissions').select('status,completion_percentage').eq('reporting_period_id', selectedId),
  ])
  const resultSet = [production, plans, incidents, security, environment, grievances, inventory, sales, pep, drilling, submissions]
  const failure = resultSet.find(result => result.error)?.error; if (failure) throw failure
  const rows = <T>(result: { data: T[] | null }) => (result.data ?? []) as unknown as ValueRow[]
  const productionByPeriod = new Map(rows(production).map(item => [String(item.reporting_period_id), value(item, 'net_oil_bbl')]))
  const planByPeriod = new Map(rows(plans).map(item => [String(item.reporting_period_id), value(item, 'oil_forecast_bbl')]))
  const series = (source: ValueRow[], property: string) => new Map(range.map(period => { const matching = source.filter(item => item.reporting_period_id === period.id); return [period.id, matching.length ? sum(matching, property) : null] }))
  const incidentByPeriod = series(rows(incidents), 'incident_count'); const inventoryByPeriod = series(rows(inventory), 'quantity_m3'); const salesByPeriod = series(rows(sales), 'net_oil_bbl'); const pepByPeriod = series(rows(pep), 'pep_quantity_tonne')
  const trend = range.map(period => ({ periodId: period.id, periodDate: period.period_date, value: productionByPeriod.get(period.id) ?? null, plan: planByPeriod.get(period.id) ?? null }))
  const metricTrends: Record<AnalyticsMetricId, TrendPoint[]> = { OIL_BBL: trend, HSE_INCIDENTS: range.map(period => ({ periodId: period.id, periodDate: period.period_date, value: incidentByPeriod.get(period.id) ?? null, plan: null })), CRUDE_INVENTORY_M3: range.map(period => ({ periodId: period.id, periodDate: period.period_date, value: inventoryByPeriod.get(period.id) ?? null, plan: null })), SALES_BBL: range.map(period => ({ periodId: period.id, periodDate: period.period_date, value: salesByPeriod.get(period.id) ?? null, plan: null })), PEP_TONNE: range.map(period => ({ periodId: period.id, periodDate: period.period_date, value: pepByPeriod.get(period.id) ?? null, plan: null })) }
  const current = trend.find(point => point.periodId === selectedId) ?? null; const selectedRows = (source: ValueRow[]) => source.filter(item => item.reporting_period_id === selectedId)
  const ytd = trend.filter(point => point.periodDate.slice(0, 4) === selected.period_date.slice(0, 4) && point.periodDate <= selected.period_date)
  const report: DashboardAnalytics = { trend, metricTrends, current, previous: trend[trend.length - 2] ?? null, ytdOilBbl: ytd.some(point => point.value !== null) ? ytd.reduce((total, point) => total + (point.value ?? 0), 0) : null, currentIncidentCount: selectedRows(rows(incidents)).length ? sum(selectedRows(rows(incidents)), 'incident_count') : null, securityIncidents: selectedRows(rows(security))[0] ? value(selectedRows(rows(security))[0], 'security_incident_count') : null, environmentalIncidents: selectedRows(rows(environment))[0] ? value(selectedRows(rows(environment))[0], 'environmental_incident_count') : null, grievanceCount: selectedRows(rows(grievances)).length, crudeInventoryM3: selectedRows(rows(inventory)).length ? sum(selectedRows(rows(inventory)), 'quantity_m3') : null, salesBbl: selectedRows(rows(sales)).length ? sum(selectedRows(rows(sales)), 'net_oil_bbl') : null, pepTonne: selectedRows(rows(pep))[0] ? value(selectedRows(rows(pep))[0], 'pep_quantity_tonne') : null, drillingWells: rows(drilling).length, submissionCount: rows(submissions).length }
  historicalCache.set(cacheKey, { data: report, expiresAt: Date.now() + 30_000 }); return report
}

export function trendForMetric(metric: AnalyticsMetricId, analytics: DashboardAnalytics): TrendPoint[] { return analytics.metricTrends[metric] }
