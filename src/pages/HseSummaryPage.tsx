import { Save } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { EmptyState, LoadingState } from '../components/AsyncState'
import { reportingMonthLabel } from '../components/ReportingMonthSelector'
import { SubmissionControls } from '../components/SubmissionControls'
import { incidentRows, numberText, total, type IncidentType } from '../features/hse/hseSummary'
import { useReportingPeriod } from '../features/reporting/ReportingPeriodContext'
import { supabase } from '../lib/supabase'
import { setReportSectionStatus } from '../features/reporting/sectionStatus'

type Hours = { bankers_hours: number; contractor_hours: number }
type RecordableBaseline = { ytd_total_recordable: number; inception_total_recordable: number }
const emptyHours: Hours = { bankers_hours: 0, contractor_hours: 0 }

export function HseSummaryPage() {
  const { periods, activePeriod, loading: periodLoading } = useReportingPeriod()
  const [types, setTypes] = useState<IncidentType[]>([])
  const [month, setMonth] = useState<Record<string, number>>({})
  const [history, setHistory] = useState<Record<string, Record<string, number>>>({})
  const [hours, setHours] = useState<Record<string, Hours>>({})
  const [incidentYtdBaseline, setIncidentYtdBaseline] = useState<Record<string, number>>({})
  const [exposureYtdBaseline, setExposureYtdBaseline] = useState<Hours>(emptyHours)
  const [inceptionExposure, setInceptionExposure] = useState<Hours>(emptyHours)
  const [recordables, setRecordables] = useState<Record<string, number>>({})
  const [recordableBaseline, setRecordableBaseline] = useState<RecordableBaseline>({ ytd_total_recordable: 0, inception_total_recordable: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const exposureSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!supabase || !activePeriod) { setLoading(false); return }
      setLoading(true); setMessage(null)
      const [{ data: incidentTypes, error: typeError }, { data: incidents, error: incidentError }, { data: exposure, error: exposureError }, { data: exposureItD, error: exposureItDError }, { data: incidentYtd, error: incidentYtdError }, { data: exposureYtd, error: exposureYtdError }, { data: monthlyRecordables, error: recordablesError }, { data: recordableBase, error: recordableBaseError }] = await Promise.all([
        supabase.from('hse_incident_types').select('id,code,name,display_order,inception_baseline').eq('is_active', true).order('display_order'),
        supabase.from('hse_monthly_incidents').select('reporting_period_id,incident_type_id,incident_count'),
        supabase.from('hse_exposure_hours').select('reporting_period_id,bankers_hours,contractor_hours'),
        supabase.from('hse_exposure_inception_baselines').select('bankers_hours,contractor_hours').eq('id', true).maybeSingle(),
        supabase.from('hse_incident_ytd_baselines').select('reporting_year,incident_type_id,incident_count').eq('reporting_year', Number(activePeriod.period_date.slice(0, 4))),
        supabase.from('hse_exposure_ytd_baselines').select('bankers_hours,contractor_hours').eq('reporting_year', Number(activePeriod.period_date.slice(0, 4))).maybeSingle(),
        supabase.from('hse_monthly_recordables').select('reporting_period_id,total_recordable'),
        supabase.from('hse_recordable_baselines').select('ytd_total_recordable,inception_total_recordable').eq('reporting_year', Number(activePeriod.period_date.slice(0, 4))).maybeSingle(),
      ])
      if (cancelled) return
      const error = typeError || incidentError || exposureError || exposureItDError || incidentYtdError || exposureYtdError || recordablesError || recordableBaseError
      if (error) { setMessage(error.message ?? 'Unable to load HSSC&E Summary. Apply migration 020 if the new history tables are unavailable.'); setLoading(false); return }
      const typeList = (incidentTypes ?? []) as IncidentType[]
      const byId = Object.fromEntries(typeList.map(type => [type.id, type.code]))
      const historical: Record<string, Record<string, number>> = {}
      for (const row of incidents ?? []) { const code = byId[row.incident_type_id]; if (code) { historical[row.reporting_period_id] ??= {}; historical[row.reporting_period_id][code] = Number(row.incident_count) } }
      const ytdBase: Record<string, number> = {}
      for (const row of incidentYtd ?? []) { const code = byId[row.incident_type_id]; if (code) ytdBase[code] = Number(row.incident_count) }
      const allHours: Record<string, Hours> = {}
      for (const row of exposure ?? []) allHours[row.reporting_period_id] = { bankers_hours: Number(row.bankers_hours), contractor_hours: Number(row.contractor_hours) }
      setTypes(typeList); setHistory(historical); setMonth(historical[activePeriod.id] ?? {}); setHours(allHours); setIncidentYtdBaseline(ytdBase)
      setInceptionExposure({ bankers_hours: Number(exposureItD?.bankers_hours ?? 0), contractor_hours: Number(exposureItD?.contractor_hours ?? 0) })
      setExposureYtdBaseline({ bankers_hours: Number(exposureYtd?.bankers_hours ?? 0), contractor_hours: Number(exposureYtd?.contractor_hours ?? 0) })
      setRecordables(Object.fromEntries((monthlyRecordables ?? []).map(row => [row.reporting_period_id, Number(row.total_recordable)])))
      setRecordableBaseline({ ytd_total_recordable: Number(recordableBase?.ytd_total_recordable ?? 0), inception_total_recordable: Number(recordableBase?.inception_total_recordable ?? 0) })
      setLoading(false)
    }
    load(); return () => { cancelled = true }
  }, [activePeriod?.id])

  const previous = useMemo(() => periods.filter(p => p.period_date < (activePeriod?.period_date ?? '')).sort((a, b) => b.period_date.localeCompare(a.period_date))[0], [periods, activePeriod])
  const ytdPeriods = useMemo(() => periods.filter(p => activePeriod && p.period_date.slice(0, 4) === activePeriod.period_date.slice(0, 4) && p.period_date <= activePeriod.period_date), [periods, activePeriod])
  const periodsThroughSelectedMonth = useMemo(() => periods.filter(p => p.period_date <= (activePeriod?.period_date ?? '')), [periods, activePeriod])
  const isLocked = activePeriod?.status === 'FINALIZED' || activePeriod?.status === 'CLOSED'
  const typeByCode = Object.fromEntries(types.map(type => [type.code, type]))
  const currentHours = hours[activePeriod?.id ?? ''] ?? emptyHours
  const prior = (code: string) => history[previous?.id ?? '']?.[code] ?? 0
  const incidentForPeriod = (periodId: string, code: string) => periodId === activePeriod?.id ? (month[code] ?? 0) : (history[periodId]?.[code] ?? 0)
  const ytd = (code: string) => (incidentYtdBaseline[code] ?? 0) + ytdPeriods.reduce((sum, period) => sum + incidentForPeriod(period.id, code), 0)
  const inception = (code: string) => (typeByCode[code]?.inception_baseline ?? 0) + periodsThroughSelectedMonth.reduce((sum, period) => sum + incidentForPeriod(period.id, code), 0)
  const hoursYtd = (key: keyof Hours) => exposureYtdBaseline[key] + ytdPeriods.reduce((sum, period) => sum + (hours[period.id]?.[key] ?? 0), 0)
  const hoursInception = (key: keyof Hours) => inceptionExposure[key] + periodsThroughSelectedMonth.reduce((sum, period) => sum + (hours[period.id]?.[key] ?? 0), 0)
  const frequency = (incidents: number, exposure: number) => exposure ? incidents * 1_000_000 / exposure : 0
  const totalCodes = incidentRows.map(([code]) => code)
  const recordableValue = (mode: 'last' | 'this' | 'ytd' | 'inception') => {
    if (mode === 'last') return recordables[previous?.id ?? ''] ?? 0
    if (mode === 'this') return recordables[activePeriod?.id ?? ''] ?? 0
    if (mode === 'ytd') return recordableBaseline.ytd_total_recordable + ytdPeriods.reduce((sum, period) => sum + (recordables[period.id] ?? 0), 0)
    return recordableBaseline.inception_total_recordable + periodsThroughSelectedMonth.reduce((sum, period) => sum + (recordables[period.id] ?? 0), 0)
  }
  const value = (code: string, mode: 'last' | 'this' | 'ytd' | 'inception') => {
    if (code === 'TOTALS') return total(Object.fromEntries(totalCodes.map(item => [item, mode === 'last' ? prior(item) : mode === 'this' ? month[item] ?? 0 : mode === 'ytd' ? ytd(item) : inception(item)])))
    if (code === 'TOTAL_RECORDABLE') return recordableValue(mode)
    if (code === 'TOTAL_RECORDABLE_FREQUENCY_INDEX') return frequency(recordableValue(mode), mode === 'last' ? (hours[previous?.id ?? '']?.bankers_hours ?? 0) + (hours[previous?.id ?? '']?.contractor_hours ?? 0) : mode === 'this' ? currentHours.bankers_hours + currentHours.contractor_hours : mode === 'ytd' ? hoursYtd('bankers_hours') + hoursYtd('contractor_hours') : hoursInception('bankers_hours') + hoursInception('contractor_hours'))
    return mode === 'last' ? prior(code) : mode === 'this' ? month[code] ?? 0 : mode === 'ytd' ? ytd(code) : inception(code)
  }

  async function save() {
    if (!supabase || !activePeriod) return
    setSaving(true); setMessage(null)
    const rows = incidentRows.map(([code]) => ({ reporting_period_id: activePeriod.id, incident_type_id: typeByCode[code]?.id, incident_count: month[code] ?? 0 })).filter(row => row.incident_type_id)
    const { error: incidentsError } = await supabase.from('hse_monthly_incidents').upsert(rows, { onConflict: 'reporting_period_id,incident_type_id' })
    const { error: exposureError } = await supabase.from('hse_exposure_hours').upsert({ reporting_period_id: activePeriod.id, ...currentHours }, { onConflict: 'reporting_period_id' })
    setSaving(false)
    if (incidentsError || exposureError) {
      const errorText = (incidentsError || exposureError)?.message ?? 'Save failed.'
      setMessage(errorText.toLowerCase().includes('row-level security') || errorText.toLowerCase().includes('not editable') ? 'This HSSC&E report is marked COMPLETE. Click Reopen in Monthly Completion before saving corrections.' : errorText)
      return
    }
    await supabase.rpc('set_submission_in_progress', { p_period: activePeriod.id, p_department_code: 'HSE' })
    await setReportSectionStatus(activePeriod.id, 'HSSE_INCIDENTS')
    setHistory(current => ({ ...current, [activePeriod.id]: month })); setMessage('HSSC&E Summary saved.')
  }

  if (periodLoading || loading) return <LoadingState label="Loading HSSC&E Summary…" />
  if (!activePeriod) return <EmptyState title="No reporting period selected" detail="Select or create a reporting period to use the HSSC&E Summary." />
  if (!types.length) return <EmptyState title="HSSC&E Summary is not configured" detail="Apply the Supabase foundation migrations to load the existing incident types." />
  const summaryCompletion = incidentRows.every(([code]) => Object.prototype.hasOwnProperty.call(month, code)) && Boolean(hours[activePeriod.id]) ? 100 : 0
  const editNumber = (code: string, text: string) => setMonth(current => ({ ...current, [code]: Math.max(0, Number(text) || 0) }))
  const editHours = (key: keyof Hours, text: string) => {
    const nextHours = { ...currentHours, [key]: Math.max(0, Number(text) || 0) }
    setHours(current => ({ ...current, [activePeriod.id]: nextHours }))
    if (exposureSaveTimer.current) clearTimeout(exposureSaveTimer.current)
    if (supabase && activePeriod && !isLocked) {
      exposureSaveTimer.current = setTimeout(async () => {
        let result = await supabase.from('hse_exposure_hours').update(nextHours).eq('reporting_period_id', activePeriod.id).select('reporting_period_id')
        if (!result.error && !(result.data?.length)) {
          result = await supabase.from('hse_exposure_hours').insert({ reporting_period_id: activePeriod.id, ...nextHours }).select('reporting_period_id')
        }
        if (result.error) setMessage(`Exposure hours could not be saved: ${result.error.message}`)
        else setHours(current => ({ ...current, [activePeriod.id]: nextHours }))
      }, 500)
    }
  }
  const summaryRows = [...incidentRows, ['TOTALS', 'Totals'] as const, ['TOTAL_RECORDABLE', 'Total Recordable'] as const, ['TOTAL_RECORDABLE_FREQUENCY_INDEX', 'Total Recordable Frequency Index (per million exposure hours)'] as const]
  const ltiRows = [['BANKERS_LTI', 'Bankers'], ['CONTRACTOR_LTI', 'Contractors']] as const

  return <>
    <section className="page-heading"><div><p className="eyebrow">1.1 HEALTH, SAFETY, SECURITY AND ENVIRONMENT INCIDENTS OVERVIEW</p><h1>HSSC&E Summary</h1><p>{reportingMonthLabel(activePeriod.period_date)} · pale columns are calculated from the workbook-backed reporting history.</p></div><button className="button primary" data-section-save-for="HSSC&E Summary,Incidents" onClick={save} disabled={saving || isLocked}>{saving ? 'Saving…' : <><Save size={16} /> Save summary</>}</button></section>
    <SubmissionControls periodId={activePeriod.id} departmentCode="HSE" sectionCode="HSSE_INCIDENTS" completion={summaryCompletion} disabled={isLocked} />
    {message && <div className={`notice ${message.includes('saved') ? 'success' : 'error'}`}>{message}</div>}
    {isLocked && <div className="notice locked">This reporting period is locked. All monthly values are read-only.</div>}
    <section className="table-section"><h2>Incidents</h2><p>Enter only This Month. Last Month, Year to Date, Inception to Date, Totals, Total Recordable and its Frequency Index are calculated.</p><SummaryTable rows={summaryRows} value={value} editable={!isLocked} onChange={editNumber} onCommit={() => { void save() }} /></section>
    <section className="two-table-grid">
      <section className="table-section"><h2>Lost Time Incidents</h2><p>Derived from the incident summary.</p><table className="report-table"><thead><tr><th>Lost Time Incidents</th><th>Last Month</th><th>This Month</th><th>Year to Date</th><th>Inception to Date</th></tr></thead><tbody>{[...ltiRows, ['TOTAL_LTI', 'Total LTI'] as const].map(([code, name]) => <tr key={code} className={code === 'TOTAL_LTI' ? 'derived-row' : ''}><td>{name}</td>{(['last', 'this', 'ytd', 'inception'] as const).map(mode => <td key={mode} className="calculated-cell">{numberText(code === 'TOTAL_LTI' ? ltiRows.reduce((sum, [ltiCode]) => sum + value(ltiCode, mode), 0) : value(code, mode))}</td>)}</tr>)}</tbody></table></section>
      <section className="table-section"><h2>LTI Frequency</h2><p>Calculated per million exposure hours.</p><table className="report-table"><thead><tr><th>LTI Frequency</th><th>Frequency Year to Date</th><th>Frequency Inception to Date</th></tr></thead><tbody>{ltiRows.map(([code, name,]) => <tr key={code}><td>{name}</td><td className="calculated-cell">{numberText(frequency(value(code, 'ytd'), hoursYtd(code === 'BANKERS_LTI' ? 'bankers_hours' : 'contractor_hours')), 3)}</td><td className="calculated-cell">{numberText(frequency(value(code, 'inception'), hoursInception(code === 'BANKERS_LTI' ? 'bankers_hours' : 'contractor_hours')), 3)}</td></tr>)}<tr className="derived-row"><td>Total Frequency</td><td className="calculated-cell">{numberText(frequency(value('BANKERS_LTI', 'ytd') + value('CONTRACTOR_LTI', 'ytd'), hoursYtd('bankers_hours') + hoursYtd('contractor_hours')), 3)}</td><td className="calculated-cell">{numberText(frequency(value('BANKERS_LTI', 'inception') + value('CONTRACTOR_LTI', 'inception'), hoursInception('bankers_hours') + hoursInception('contractor_hours')), 3)}</td></tr></tbody></table></section>
    </section>
    <section className="table-section"><h2>Exposure Hours</h2><p>Enter this month’s Bankers and Contractor exposure hours. Totals, Year to Date and Inception to Date are calculated.</p><table className="report-table"><thead><tr><th>Exposure Hours</th><th>Last Month</th><th>This Month</th><th>Year to Date</th><th>Inception to Date</th></tr></thead><tbody>{[['Bankers', 'bankers_hours'], ['Contractor', 'contractor_hours']].map(([name, key]) => <tr key={key}><td>{name}</td><td className="calculated-cell">{numberText(hours[previous?.id ?? '']?.[key as keyof Hours] ?? 0)}</td><td className="entry-cell"><input type="number" min="0" value={currentHours[key as keyof Hours]} disabled={isLocked} onChange={event => editHours(key as keyof Hours, event.target.value)} /></td><td className="calculated-cell">{numberText(hoursYtd(key as keyof Hours))}</td><td className="calculated-cell">{numberText(hoursInception(key as keyof Hours))}</td></tr>)}<tr className="derived-row"><td>Totals</td><td className="calculated-cell">{numberText((hours[previous?.id ?? '']?.bankers_hours ?? 0) + (hours[previous?.id ?? '']?.contractor_hours ?? 0))}</td><td className="calculated-cell">{numberText(currentHours.bankers_hours + currentHours.contractor_hours)}</td><td className="calculated-cell">{numberText(hoursYtd('bankers_hours') + hoursYtd('contractor_hours'))}</td><td className="calculated-cell">{numberText(hoursInception('bankers_hours') + hoursInception('contractor_hours'))}</td></tr></tbody></table></section>
  </>
}

function SummaryTable({ rows, value, editable, onChange, onCommit }: { rows: readonly (readonly [string, string])[]; value: (code: string, mode: 'last' | 'this' | 'ytd' | 'inception') => number; editable: boolean; onChange: (code: string, value: string) => void; onCommit: () => void }) {
  return <table className="report-table summary-table"><colgroup><col style={{ width: '40%' }} /><col style={{ width: '15%' }} /><col style={{ width: '15%' }} /><col style={{ width: '15%' }} /><col style={{ width: '15%' }} /></colgroup><thead><tr><th>Incident</th><th>Last Month</th><th>This Month</th><th>Year to Date</th><th>Inception to Date</th></tr></thead><tbody>{rows.map(([code, name]) => { const isDerived = code === 'TOTALS' || code === 'TOTAL_RECORDABLE' || code === 'TOTAL_RECORDABLE_FREQUENCY_INDEX'; const decimalPlaces = code === 'TOTAL_RECORDABLE_FREQUENCY_INDEX' ? 3 : 0; return <tr key={code} className={isDerived ? 'derived-row' : ''}><td>{name}</td><td className="calculated-cell">{numberText(value(code, 'last'), decimalPlaces)}</td><td className={isDerived ? 'calculated-cell' : 'entry-cell'}>{isDerived ? numberText(value(code, 'this'), decimalPlaces) : <input type="number" min="0" value={value(code, 'this')} disabled={!editable} onChange={event => onChange(code, event.target.value)} onBlur={onCommit} />}</td><td className="calculated-cell">{numberText(value(code, 'ytd'), decimalPlaces)}</td><td className="calculated-cell">{numberText(value(code, 'inception'), decimalPlaces)}</td></tr> })}</tbody></table>
}
