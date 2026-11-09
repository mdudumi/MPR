import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { SectionStatus } from '../../types/reporting'

export function useSectionStatuses(periodId?: string) {
  const [statuses, setStatuses] = useState<Record<string, SectionStatus>>({}); const [loading, setLoading] = useState(Boolean(periodId))
  useEffect(() => { let cancelled = false; async function load() { if (!periodId || !supabase) { setLoading(false); return }; setLoading(true); const { data } = await supabase.from('report_section_status').select('report_section:report_sections(code),status').eq('reporting_period_id', periodId); if (!cancelled) { setStatuses(Object.fromEntries((data ?? []).map((row: any) => [row.report_section.code, row.status]))); setLoading(false) } }; load(); return () => { cancelled = true } }, [periodId])
  return { statuses, loading }
}

/** Keep the official report hierarchy synchronized with a workspace save. */
export async function setReportSectionStatus(periodId: string, sectionCode: string, status: SectionStatus = 'IN_PROGRESS') {
  if (!supabase) return
  const { data: section } = await supabase.from('report_sections').select('id').eq('code', sectionCode).maybeSingle()
  if (!section) return
  await supabase.from('report_section_status').update({ status }).eq('reporting_period_id', periodId).eq('report_section_id', section.id)
}
