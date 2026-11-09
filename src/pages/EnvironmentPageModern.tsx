import { useEffect, useState } from 'react'
import { EmptyState, LoadingState } from '../components/AsyncState'
import { NarrativeEditor } from '../components/NarrativeEditor'
import { SubmissionControls } from '../components/SubmissionControls'
import { reportingMonthLabel } from '../components/ReportingMonthSelector'
import { SupportingDataTable } from '../components/SupportingDataTable'
import { EcologyPitTable } from '../components/EcologyPitTable'
import { EcologyOutputsTable } from '../components/EcologyOutputsTable'
import { EnvironmentIncidentsTable } from '../components/EnvironmentIncidentsTable'
import { useReportingPeriod } from '../features/reporting/ReportingPeriodContext'
import { supabase } from '../lib/supabase'

type Row = { id: string; table_number: number; table_title: string; table_data: any[] }
type Incident = { id?: string; incident_date: string | null; incident: string; description: string | null }

const defaultTables = (periodDate: string): Row[] => {
  const month = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${periodDate}T00:00:00Z`))
  return [
    { id: '', table_number: 1, table_title: 'Inputs to active Ecology Pits', table_data: [] },
    { id: '', table_number: 2, table_title: 'Recorded Inputs/Outputs to all Ecology Pit locations', table_data: [] },
    { id: '', table_number: 3, table_title: 'Recorded Inputs of Waste Processed at Waste Management Facilities', table_data: [] },
    { id: '', table_number: 4, table_title: 'Sum of Drilling Mud and Cuttings to Ecopits', table_data: [{ period: month, volume_m3: 0 }] },
    { id: '', table_number: 5, table_title: 'Recorded Inputs and Waste Processed at BPAL Dewatering facility', table_data: [{ period: month, delivered_to_drying_area_m3: 0, delivered_to_centrifuge_m3: 0, water_out_of_centrifuge_to_drilling_m3: 0 }] },
    { id: '', table_number: 6, table_title: `Calculated gaseous emissions in the oilfield for ${month}`, table_data: [{ total_quantity_generated_m3: 0, produce_energy_m3: 0, free_up_spaces_m3: 0, vented_gases_m3: 0, biologically_treated_gases_m3: 0, gases_transferred_other_subjects_m3: 0 }] },
  ]
}

export function EnvironmentPageModern() {
  const { activePeriod } = useReportingPeriod()
  const [report, setReport] = useState<any>({})
  const [tables, setTables] = useState<Row[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [saveNotice, setSaveNotice] = useState<string | null>(null)
  const locked = activePeriod?.status === 'CLOSED' || activePeriod?.status === 'FINALIZED'

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!supabase || !activePeriod) { setLoading(false); return }
      setLoading(true); setMessage(null)
      const reportResult = await supabase.from('environment_monthly_reports').select('operations_support,monitoring_program,lease_remediation_material_reuse').eq('reporting_period_id', activePeriod.id).maybeSingle()
      const tablesResult = await supabase.from('environment_supporting_tables').select('id,table_number,table_title,table_data').eq('reporting_period_id', activePeriod.id).order('table_number')
      // Keep this separate so an incident-query failure is not silently turned into an empty table.
      const incidentsResult = await supabase.from('environment_incident_details').select('id,incident_date,incident,description').eq('reporting_period_id', activePeriod.id).order('incident_date', { ascending: true })
      if (cancelled) return
      const firstError = reportResult.error ?? tablesResult.error ?? incidentsResult.error
      if (firstError) setMessage(`Environment data could not be loaded: ${firstError.message}`)
      setReport(reportResult.data ?? {})
      const loadedTables = (tablesResult.data ?? []) as Row[]
      const defaults = defaultTables(activePeriod.period_date)
      const byNumber = new Map(loadedTables.map(table => [table.table_number, table]))
      setTables(defaults.map(fallback => {
        const existing = byNumber.get(fallback.table_number)
        return existing ? { ...fallback, ...existing, table_title: fallback.table_title } : fallback
      }))
      setIncidents((incidentsResult.data ?? []) as Incident[])
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [activePeriod?.id])

  if (loading) return <LoadingState label="Loading Environment report…" />
  if (!activePeriod) return <EmptyState title="No reporting period selected" detail="Select a reporting period to work with Environment." />

  async function save(field: string, html: string) {
    if (!supabase) return
    const { error } = await supabase.from('environment_monthly_reports').upsert({ reporting_period_id: activePeriod.id, [field]: { html } }, { onConflict: 'reporting_period_id' })
    if (error) { setMessage(`Could not save Environment narrative: ${error.message}`); return }
    setReport((current: any) => ({ ...current, [field]: { html } }))
  }
  async function saveTable(row: Row, data: any[]) {
    if (!supabase) return
    const result = row.id
      ? await supabase.from('environment_supporting_tables').update({ table_data: data }).eq('id', row.id).select('id,table_number,table_title,table_data').single()
      : await supabase.from('environment_supporting_tables').upsert({ reporting_period_id: activePeriod.id, table_number: row.table_number, table_title: row.table_title, table_data: data }, { onConflict: 'reporting_period_id,table_number' }).select('id,table_number,table_title,table_data').single()
    if (result.error) { setMessage(`Could not save Table ${row.table_number}: ${result.error.message}`); throw result.error }
    setTables(current => current.map(item => item.table_number === row.table_number ? (result.data as Row) : item))
    setSaveNotice(`Table ${row.table_number} saved successfully.`)
    window.setTimeout(() => setSaveNotice(null), 3500)
  }
  async function addIncident(row: Incident) {
    if (!supabase) return
    const { data, error } = await supabase.from('environment_incident_details').insert({ reporting_period_id: activePeriod.id, incident_date: row.incident_date || null, incident: row.incident, description: row.description || null }).select('id,incident_date,incident,description').single()
    if (error) { setMessage(`Could not add environmental incident: ${error.message}`); return }
    if (data) setIncidents(current => [...current, data as Incident].sort((a, b) => (a.incident_date ?? '').localeCompare(b.incident_date ?? '')))
  }
  async function saveIncident(row: Incident) {
    if (!supabase || !row.id) return
    const { error } = await supabase.from('environment_incident_details').update({ incident_date: row.incident_date, incident: row.incident, description: row.description }).eq('id', row.id)
    if (error) setMessage(`Could not save environmental incident: ${error.message}`)
  }
  async function deleteIncident(id: string) {
    if (!supabase) return
    const { error } = await supabase.from('environment_incident_details').delete().eq('id', id)
    if (error) { setMessage(`Could not delete environmental incident: ${error.message}`); return }
    setIncidents(current => current.filter(row => row.id !== id))
  }

  return <>
    <section className="page-heading"><div><p className="eyebrow">1.4 ENVIRONMENTAL</p><h1>Environment</h1><p>{reportingMonthLabel(activePeriod.period_date)} · Workbook supporting tables.</p></div></section>
    {message && <div className="notice error">{message}</div>}
    <SubmissionControls periodId={activePeriod.id} departmentCode="ENVIRONMENT" sectionCode="HSSE_ENVIRONMENT" completion={tables.length ? 100 : 0} disabled={locked} />
    <div className="narrative-grid"><NarrativeEditor label="Operations Support" initialValue={report.operations_support?.html} onSave={html => save('operations_support', html)} disabled={locked} /><NarrativeEditor label="Environmental Monitoring Program" initialValue={report.monitoring_program?.html} onSave={html => save('monitoring_program', html)} disabled={locked} /><NarrativeEditor label="Lease remediation and material reuse" initialValue={report.lease_remediation_material_reuse?.html} onSave={html => save('lease_remediation_material_reuse', html)} disabled={locked} /></div>
    <section className="table-section"><h2>Environmental Incidents</h2><EnvironmentIncidentsTable rows={incidents} onSave={saveIncident} onAdd={addIncident} onDelete={deleteIncident} /></section>
    {tables.map(table => <section className="table-section" key={table.id}><h2>Table {table.table_number}: {table.table_title}</h2>{table.table_number === 1 ? <EcologyPitTable rows={table.table_data} onSave={data => saveTable(table, data)} /> : table.table_number === 2 ? <EcologyOutputsTable rows={table.table_data} onSave={data => saveTable(table, data)} /> : <SupportingDataTable tableNumber={table.table_number} rows={table.table_data} onSave={data => saveTable(table, data)} />}{saveNotice === `Table ${table.table_number} saved successfully.` && <span className="save-feedback success">Saved</span>}</section>)}
  </>
}
