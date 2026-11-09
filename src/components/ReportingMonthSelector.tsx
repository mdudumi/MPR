import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { useReportingPeriod } from '../features/reporting/ReportingPeriodContext'

const label = (date: string) => new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))
export function ReportingMonthSelector() {
  const { periods, activePeriod, setActivePeriodId } = useReportingPeriod(); const index = periods.findIndex(p => p.id === activePeriod?.id)
  const changeMonth = (id: string) => { setActivePeriodId(id); window.dispatchEvent(new Event('reporting-month-changed')) }
  const navigate = (step: number) => { const target = periods[index + step]; if (target) changeMonth(target.id) }
  return <div className="month-selector"><CalendarDays size={17}/><button aria-label="Newer reporting month" onClick={() => navigate(-1)} disabled={index <= 0}><ChevronLeft size={18}/></button><select aria-label="Reporting month" value={activePeriod?.id ?? ''} onChange={e => changeMonth(e.target.value)}><option value="">Select reporting month</option>{periods.map(p => <option key={p.id} value={p.id}>{label(p.period_date)}</option>)}</select><button aria-label="Older reporting month" onClick={() => navigate(1)} disabled={index < 0 || index >= periods.length - 1}><ChevronRight size={18}/></button></div>
}
export const reportingMonthLabel = (date?: string) => date ? label(date) : 'No reporting month selected'
