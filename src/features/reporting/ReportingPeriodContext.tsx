import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { ReportingPeriod } from '../../types/reporting'

type Context = { periods: ReportingPeriod[]; activePeriod: ReportingPeriod | null; setActivePeriodId: (id: string) => void; loading: boolean; refresh: () => Promise<void> }
const ReportingPeriodContext = createContext<Context | undefined>(undefined)

export function ReportingPeriodProvider({ children }: { children: React.ReactNode }) {
  const [periods, setPeriods] = useState<ReportingPeriod[]>([]); const [activeId, setActiveId] = useState(''); const [loading, setLoading] = useState(true)
  async function refresh() {
    if (!supabase) { setLoading(false); return }
    setLoading(true); const { data } = await supabase.from('reporting_periods').select('id,period_date,status').order('period_date', { ascending: false })
    const next = (data ?? []) as ReportingPeriod[]; setPeriods(next); setActiveId(current => current && next.some(p => p.id === current) ? current : next[0]?.id ?? ''); setLoading(false)
  }
  useEffect(() => { refresh() }, [])
  const value = useMemo(() => ({ periods, activePeriod: periods.find(p => p.id === activeId) ?? null, setActivePeriodId: setActiveId, loading, refresh }), [periods, activeId, loading])
  return <ReportingPeriodContext.Provider value={value}>{children}</ReportingPeriodContext.Provider>
}
export function useReportingPeriod() { const value = useContext(ReportingPeriodContext); if (!value) throw new Error('ReportingPeriodProvider missing'); return value }
