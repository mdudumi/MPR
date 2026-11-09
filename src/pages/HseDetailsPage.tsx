import { Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NarrativeEditor } from '../components/NarrativeEditor'
import { SubmissionControls } from '../components/SubmissionControls'
import { EmptyState, LoadingState } from '../components/AsyncState'
import { useReportingPeriod } from '../features/reporting/ReportingPeriodContext'
import { supabase } from '../lib/supabase'
import { setReportSectionStatus } from '../features/reporting/sectionStatus'

const sections = [
  ['OPERATIONS_SUPPORT', 'Operations Support'],
  ['HS_TRAINING', 'H&S Training'],
  ['HEALTH', 'Health'],
] as const
type IncidentDetail = { id: string; incident_date: string | null; brief_description: string; classification: string | null }

export function HseDetailsPage() {
  const { activePeriod } = useReportingPeriod()
  const [narratives, setNarratives] = useState<Record<string, string>>({})
  const [incidentDetails, setIncidentDetails] = useState<IncidentDetail[]>([])
  const [draft, setDraft] = useState({ classification: '', incident_date: '', brief_description: '' })
  const [loading, setLoading] = useState(true)
  const locked = activePeriod?.status === 'CLOSED' || activePeriod?.status === 'FINALIZED'

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!supabase || !activePeriod) { setLoading(false); return }
      setLoading(true)
      const [narrativeResult, detailsResult] = await Promise.all([
        supabase.from('hse_narratives').select('section_code,content').eq('reporting_period_id', activePeriod.id),
        supabase.from('hse_incident_details').select('id,incident_date,brief_description,classification').eq('reporting_period_id', activePeriod.id).order('incident_date'),
      ])
      if (cancelled) return
      setNarratives(Object.fromEntries((narrativeResult.data ?? []).map(item => [item.section_code, (item.content as { html?: string })?.html ?? ''])))
      setIncidentDetails((detailsResult.data ?? []) as IncidentDetail[])
      setLoading(false)
    }
    load(); return () => { cancelled = true }
  }, [activePeriod?.id])

  async function saveNarrative(sectionCode: string, html: string) {
    if (!supabase || !activePeriod) return
    const { error } = await supabase.from('hse_narratives').upsert({ reporting_period_id: activePeriod.id, section_code: sectionCode, content: { html } }, { onConflict: 'reporting_period_id,section_code' })
    if (error) throw error
    await supabase.rpc('set_submission_in_progress', { p_period: activePeriod.id, p_department_code: 'HSE' })
    await setReportSectionStatus(activePeriod.id, 'HSSE_HEALTH_SAFETY')
    setNarratives(current => ({ ...current, [sectionCode]: html }))
  }

  async function saveIncident(item: IncidentDetail) {
    if (!supabase || locked) return
    const { data, error } = await supabase.from('hse_incident_details').update({ classification: item.classification || null, incident_date: item.incident_date || null, brief_description: item.brief_description }).eq('id', item.id).select('id,incident_date,brief_description,classification').single()
    if (!error && data) { setIncidentDetails(current => current.map(row => row.id === item.id ? data as IncidentDetail : row)); await supabase.rpc('set_submission_in_progress', { p_period: activePeriod?.id, p_department_code: 'HSE' }) }
  }
  async function addIncident() {
    if (!supabase || !activePeriod || locked || !draft.classification.trim() || !draft.brief_description.trim()) return
    const { data, error } = await supabase.from('hse_incident_details').insert({ reporting_period_id: activePeriod.id, classification: draft.classification.trim(), incident_date: draft.incident_date || null, brief_description: draft.brief_description.trim() }).select('id,incident_date,brief_description,classification').single()
    if (!error && data) { setIncidentDetails(current => [...current, data as IncidentDetail]); setDraft({ classification: '', incident_date: '', brief_description: '' }); await supabase.rpc('set_submission_in_progress', { p_period: activePeriod.id, p_department_code: 'HSE' }) }
  }
  async function deleteIncident(id: string) {
    if (!supabase || locked) return
    const { error } = await supabase.from('hse_incident_details').delete().eq('id', id)
    if (!error) { setIncidentDetails(current => current.filter(row => row.id !== id)); await supabase.rpc('set_submission_in_progress', { p_period: activePeriod?.id, p_department_code: 'HSE' }) }
  }

  if (loading) return <LoadingState label="Loading Health & Safety workspace…" />
  if (!activePeriod) return <EmptyState title="No reporting period selected" detail="Select a reporting period to work on Health & Safety." />
  const completion = sections.filter(([code]) => Boolean(narratives[code])).length / sections.length * 100
  return <>
    <section className="page-heading"><div><p className="eyebrow">1.2 HEALTH & SAFETY</p><h1>Health & Safety workspace</h1><p>Operations Support, H&amp;S Training, Health, and the monthly H&amp;S Incidents register.</p></div></section>
    <SubmissionControls periodId={activePeriod.id} departmentCode="HSE" sectionCode="HSSE_HEALTH_SAFETY" completion={completion} disabled={locked} />
    <div className="narrative-grid">{sections.map(([code, label]) => <NarrativeEditor key={code} label={label} initialValue={narratives[code]} onSave={html => saveNarrative(code, html)} disabled={locked} />)}</div>
    <section className="table-section"><h2>H &amp; S Incidents</h2><p>Edit cells directly, like Excel. Save or delete a row using the controls at the right.</p><table className="report-table hse-incident-table"><colgroup><col className="incident-code-column" /><col className="incident-date-column" /><col className="incident-description-column" /><col className="incident-actions-column" /></colgroup><thead><tr><th>Incident Code</th><th>Date</th><th>Brief Description</th><th /></tr></thead><tbody>{incidentDetails.length ? incidentDetails.map(item => <tr key={item.id}><td><input value={item.classification ?? ''} disabled={locked} onChange={event => setIncidentDetails(current => current.map(row => row.id === item.id ? { ...row, classification: event.target.value } : row))} /></td><td><input type="date" value={item.incident_date ?? ''} disabled={locked} onChange={event => setIncidentDetails(current => current.map(row => row.id === item.id ? { ...row, incident_date: event.target.value } : row))} /></td><td><textarea value={item.brief_description} disabled={locked} onChange={event => setIncidentDetails(current => current.map(row => row.id === item.id ? { ...row, brief_description: event.target.value } : row))} /></td><td className="table-actions"><button className="icon-button" title="Save incident" disabled={locked} onClick={() => saveIncident(item)}><Save size={15} /></button><button className="icon-button" title="Delete incident" disabled={locked} onClick={() => deleteIncident(item.id)}><Trash2 size={15} /></button></td></tr>) : <tr><td colSpan={4} className="calculated-cell">No H&amp;S incidents recorded for this reporting month.</td></tr>}</tbody></table><div className="detail-entry hse-incident-entry"><input placeholder="Incident Code" value={draft.classification} disabled={locked} onChange={event => setDraft({ ...draft, classification: event.target.value })} /><input type="date" value={draft.incident_date} disabled={locked} onChange={event => setDraft({ ...draft, incident_date: event.target.value })} /><textarea placeholder="Brief Description" value={draft.brief_description} disabled={locked} onChange={event => setDraft({ ...draft, brief_description: event.target.value })} /><button className="button secondary" disabled={locked || !draft.classification.trim() || !draft.brief_description.trim()} onClick={addIncident}><Plus size={15} /> Add incident</button></div></section>
  </>
}
