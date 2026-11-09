import { Check, CornerUpLeft, Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { StatusBadge } from './StatusBadge'
import { setReportSectionStatus } from '../features/reporting/sectionStatus'

type Status = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE' | 'LOCKED'
type Props = { periodId?: string; departmentCode: string; sectionCode?: string; completion?: number; disabled?: boolean; onStatusChange?: (status: Status) => void }

export function SubmissionControls({ periodId, departmentCode, sectionCode, completion = 0, disabled = false, onStatusChange }: Props) {
  const [status, setStatus] = useState<Status>('NOT_STARTED')
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const notify = (next: Status) => { setStatus(next); onStatusChange?.(next) }

  useEffect(() => {
    async function load() {
      if (!supabase || !periodId) return
      const { data } = await supabase.from('monthly_submissions').select('status,comments,department:departments!inner(code)').eq('reporting_period_id', periodId).eq('department.code', departmentCode).maybeSingle()
      if (!data) return
      let nextStatus = data.status as Status
      if (departmentCode === 'HSE' && sectionCode) {
        const { data: section } = await supabase.from('report_section_status').select('status,report_section:report_sections!inner(code)').eq('reporting_period_id', periodId).eq('report_section.code', sectionCode).maybeSingle()
        if (section && ['COMPLETED', 'REVIEWED', 'LOCKED'].includes(section.status)) nextStatus = 'COMPLETE'
      }
      setStatus(nextStatus); onStatusChange?.(nextStatus); setComment(data.comments ?? '')
    }
    load()
  }, [periodId, departmentCode, sectionCode])

  useEffect(() => {
    const fields = Array.from(document.querySelectorAll<HTMLElement>('.table-section input, .table-section textarea, .table-section select, .table-section button, .narrative-grid input, .narrative-grid textarea, .narrative-grid select, .narrative-grid button, .facilities-section input, .facilities-section textarea, .facilities-section select, .facilities-section button, .detail-entry input, .detail-entry textarea, .detail-entry select, .detail-entry button')).filter(element => !element.closest('.submission-controls') && !(element.tagName === 'BUTTON' && /expand|collapse/i.test(element.textContent ?? '')))
    fields.forEach(element => {
      const control = element as HTMLInputElement
      if (['COMPLETE', 'LOCKED'].includes(status)) {
        if (!element.hasAttribute('data-completion-disabled')) element.setAttribute('data-completion-disabled', 'true')
        control.disabled = true
      } else if (element.hasAttribute('data-completion-disabled')) {
        element.removeAttribute('data-completion-disabled')
        control.disabled = false
      }
    })
  }, [status])

  async function complete() {
    if (!supabase || !periodId) return
    setBusy(true); setMessage(null)
    const sectionOnly = departmentCode === 'HSE' && Boolean(sectionCode)
    if (sectionOnly) { await setReportSectionStatus(periodId, sectionCode!, 'COMPLETED'); notify('COMPLETE'); setMessage('This HSE section was marked complete.'); setBusy(false); return }
    const required: Record<string, string[]> = { HSE: ['HSSE_INCIDENTS', 'HSSE_HEALTH_SAFETY', 'HSSE_SECURITY', 'HSSE_ENVIRONMENT', 'HSSE_CSR'], SECURITY: ['HSSE_SECURITY'], ENVIRONMENT: ['HSSE_ENVIRONMENT'], CSR: ['HSSE_CSR'], PRODUCTION: ['PROD_OVERVIEW', 'PROD_FIGURES', 'PROD_CRUDE_INVENTORY', 'PROD_WATER_INVENTORY', 'PROD_OPERATIONS', 'PROD_SALES', 'PROD_PEP_ASP'], FACILITIES: ['FAC_CIVIL', 'FAC_MECHANICAL', 'FAC_ELECTRICAL'], DRILLING: ['DRILLING_PROGRAM'] }
    const codes = departmentCode === 'PRODUCTION' ? [] : required[departmentCode]
    if ((departmentCode === 'PRODUCTION' || departmentCode === 'FACILITIES') && completion < 100) { setMessage(`${departmentCode} cannot be completed until all required fields are entered.`); setBusy(false); return }
    if (codes && codes.length > 1 && departmentCode !== 'FACILITIES') {
      const { data } = await supabase.from('report_section_status').select('status,report_section:report_sections!inner(code)').eq('reporting_period_id', periodId).in('report_section.code', codes)
      const completeCount = (data ?? []).filter((row: any) => ['COMPLETED', 'REVIEWED', 'LOCKED'].includes(row.status)).length
      if (completeCount < codes.length) { setMessage(`${departmentCode} cannot be completed yet. Complete all required subsections first (${completeCount}/${codes.length} complete).`); setBusy(false); return }
    }
    const { error } = await supabase.rpc('complete_monthly_submission', { p_period: periodId, p_department_code: departmentCode })
    if (error) setMessage(error.message)
    else { if (sectionCode) await setReportSectionStatus(periodId, sectionCode, 'COMPLETED'); if (codes?.length) for (const code of codes) await setReportSectionStatus(periodId, code, 'COMPLETED'); notify('COMPLETE'); setMessage('Department report marked complete.') }
    setBusy(false)
  }

  async function reopen() {
    if (!supabase || !periodId) return
    setBusy(true); setMessage(null)
    const sectionOnly = departmentCode === 'HSE' && Boolean(sectionCode)
    if (sectionOnly) { await setReportSectionStatus(periodId, sectionCode!, 'IN_PROGRESS'); notify('IN_PROGRESS'); setMessage('This HSE section was reopened.'); setBusy(false); return }
    const { error } = await supabase.rpc('reopen_monthly_submission', { p_period: periodId, p_department_code: departmentCode, p_reason: comment || null })
    if (error) setMessage(error.message); else { notify('IN_PROGRESS'); setMessage('Department report reopened.') }
    setBusy(false)
  }

  const readOnly = disabled || ['COMPLETE', 'LOCKED'].includes(status)
  return <section className="submission-controls"><div><p className="eyebrow">MONTHLY COMPLETION</p><StatusBadge status={status}/><small>{completion}% complete</small></div><div className="submission-actions">{(status === 'NOT_STARTED' || status === 'IN_PROGRESS') && <button className="button primary" disabled={busy || disabled} onClick={complete}><Check size={15}/> Mark complete</button>}{status === 'COMPLETE' && <><input value={comment} onChange={e => setComment(e.target.value)} placeholder="Optional correction reason"/><button className="button secondary" disabled={busy || disabled} onClick={reopen}><CornerUpLeft size={15}/> Reopen</button></>}{status === 'LOCKED' && <button className="button secondary" disabled><Lock size={15}/> Locked</button>}</div>{message && <p className="form-message">{message}</p>}{readOnly && <p className="readonly-note">This department report is {status.toLowerCase()}. Reopen it before finalization to make a correction.</p>}</section>
}
