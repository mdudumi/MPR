import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NarrativeEditor } from '../components/NarrativeEditor'
import { SubmissionControls } from '../components/SubmissionControls'
import { EmptyState, LoadingState } from '../components/AsyncState'
import { useReportingPeriod } from '../features/reporting/ReportingPeriodContext'
import { supabase } from '../lib/supabase'

type Grievance = { id: string; grievance_date: string; project_activity: string; category: string; status: string; validity: string }

export function CsrPage() {
  const { activePeriod } = useReportingPeriod()
  const [report, setReport] = useState<any>({})
  const [grievances, setGrievances] = useState<Grievance[]>([])
  const [draft, setDraft] = useState({ grievance_date: '', project_activity: '', category: '', status: '', validity: 'PENDING' })
  const [loading, setLoading] = useState(true)
  const locked = activePeriod?.status === 'CLOSED' || activePeriod?.status === 'FINALIZED'

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!supabase || !activePeriod) { setLoading(false); return }
      setLoading(true)
      const [monthly, grievanceRows] = await Promise.all([
        supabase.from('csr_monthly_reports').select('*').eq('reporting_period_id', activePeriod.id).maybeSingle(),
        supabase.from('csr_grievances').select('*').eq('reporting_period_id', activePeriod.id).order('grievance_date'),
      ])
      if (cancelled) return
      setReport(monthly.data ?? {}); setGrievances((grievanceRows.data ?? []) as Grievance[]); setLoading(false)
    }
    load(); return () => { cancelled = true }
  }, [activePeriod?.id])

  async function saveNarrative(field: string, html: string) {
    if (!supabase || !activePeriod) return
    const record = { ...report, reporting_period_id: activePeriod.id, [field]: { html } }
    const { error } = await supabase.from('csr_monthly_reports').upsert(record, { onConflict: 'reporting_period_id' })
    if (error) throw error
    setReport(record)
    await supabase.rpc('set_submission_in_progress', { p_period: activePeriod.id, p_department_code: 'CSR' })
  }
  async function addGrievance() {
    if (!supabase || !activePeriod || !draft.project_activity || !draft.category || !draft.status) return
    const { data, error } = await supabase.from('csr_grievances').insert({ reporting_period_id: activePeriod.id, ...draft, grievance_date: draft.grievance_date || new Date().toISOString().slice(0, 10) }).select().single()
    if (!error) { setGrievances(current => [...current, data as Grievance]); setDraft({ grievance_date: '', project_activity: '', category: '', status: '', validity: 'PENDING' }) }
  }
  async function removeGrievance(id: string) {
    if (!supabase || locked) return
    const { error } = await supabase.from('csr_grievances').delete().eq('id', id)
    if (!error) setGrievances(current => current.filter(item => item.id !== id))
  }
  if (loading) return <LoadingState label="Loading Corporate Social Responsibility report…" />
  if (!activePeriod) return <EmptyState title="No reporting period selected" detail="Select a reporting period to work on CSR." />
  const completion = (report.social_infrastructure_projects?.html ? 40 : 0) + (report.other_activities?.html ? 30 : 0) + (grievances.length ? 30 : 0)
  const validityLabel = (value: string) => value === 'PENDING' ? 'Need investigation' : value.replace('_', ' ')
  return <>
    <section className="page-heading"><div><p className="eyebrow">1.5 CORPORATE SOCIAL RESPONSIBILITY</p><h1>Corporate Social Responsibility</h1><p>Social Infrastructure Projects, Other Activities, and Grievances.</p></div></section>
    <SubmissionControls periodId={activePeriod.id} departmentCode="CSR" sectionCode="HSSE_CSR" completion={completion} disabled={locked} />
    <div className="narrative-grid"><NarrativeEditor label="Social Infrastructure Projects" initialValue={report.social_infrastructure_projects?.html} onSave={html => saveNarrative('social_infrastructure_projects', html)} disabled={locked} /><NarrativeEditor label="Other Activities" initialValue={report.other_activities?.html} onSave={html => saveNarrative('other_activities', html)} disabled={locked} /></div>
    <section className="table-section"><h2>Grievances</h2><table className="report-table"><thead><tr><th>Date</th><th>Project Activity</th><th>Category</th><th>Status</th><th>Valid / Not Valid</th><th /></tr></thead><tbody>{grievances.map(item => <tr key={item.id}><td>{item.grievance_date}</td><td>{item.project_activity}</td><td>{item.category}</td><td>{item.status}</td><td>{validityLabel(item.validity)}</td><td><button className="icon-button" disabled={locked} onClick={() => removeGrievance(item.id)}><Trash2 size={15} /></button></td></tr>)}</tbody></table><div className="detail-entry"><input type="date" value={draft.grievance_date} onChange={event => setDraft({ ...draft, grievance_date: event.target.value })} /><input placeholder="Project Activity" value={draft.project_activity} onChange={event => setDraft({ ...draft, project_activity: event.target.value })} /><input placeholder="Category" value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value })} /><input placeholder="Status" value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value })} /><select value={draft.validity} onChange={event => setDraft({ ...draft, validity: event.target.value })}><option value="PENDING">Need investigation</option><option value="VALID">Valid</option><option value="NOT_VALID">Not Valid</option></select><button className="button secondary" disabled={locked || !draft.project_activity || !draft.category || !draft.status} onClick={addGrievance}><Plus size={15} /> Add grievance</button></div></section>
  </>
}
