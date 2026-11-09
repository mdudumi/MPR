export type PeriodLike = { id: string; period_date: string }

export function previousReportingPeriod(periods: PeriodLike[], selectedId?: string) {
  const selected = periods.find(period => period.id === selectedId)
  if (!selected) return undefined
  return periods.filter(period => period.period_date < selected.period_date).sort((a, b) => b.period_date.localeCompare(a.period_date))[0]
}

export function yearToDatePeriods(periods: PeriodLike[], selected?: PeriodLike) {
  if (!selected) return []
  const year = selected.period_date.slice(0, 4)
  return periods.filter(period => period.period_date.slice(0, 4) === year && period.period_date <= selected.period_date)
}

export const sumValues = (values: Array<number | null | undefined>) => values.reduce<number>((total, value) => total + (value ?? 0), 0)
export const ltiFrequency = (lti: number, hours: number) => hours > 0 ? lti * 1_000_000 / hours : null
