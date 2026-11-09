import { useState } from 'react'
import type { TrendPoint } from '../features/analytics/analyticsService'
import { reportingMonthLabel } from './ReportingMonthSelector'

export function TrendChart({ title, unit, points }: { title: string; unit: string; points: TrendPoint[] }) {
  const [active, setActive] = useState<number | null>(null)
  const valid = points.filter(point => point.value !== null)
  if (valid.length < 2) return <div className="chart-empty">At least two reporting periods with reported values are required to display this trend.</div>
  const max = Math.max(...points.flatMap(point => [point.value, point.plan]).filter((item): item is number => item !== null), 1)
  return <section className="trend-chart"><div className="chart-title"><h3>{title}</h3><span>{unit}</span></div><div className="bar-chart" role="img" aria-label={`${title} historical bar chart`}>{points.map((point, index) => { const height = point.value == null ? 0 : Math.max(4, point.value / max * 170); return <div className="bar-chart-item" key={point.periodId} onMouseEnter={() => setActive(index)} onMouseLeave={() => setActive(null)}><div className="bar-chart-value">{point.value == null ? '—' : new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(point.value)}</div><div className="bar-chart-bar" style={{ height: `${height}px` }}/><span>{reportingMonthLabel(point.periodDate).slice(0, 3)}</span></div>})}</div>{active !== null && <div className="chart-tooltip">{reportingMonthLabel(points[active].periodDate)}: {points[active].value == null ? 'Not reported' : `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(points[active].value)} ${unit}`}</div>}<details><summary>Data table</summary><table><thead><tr><th>Reporting period</th><th>Actual ({unit})</th></tr></thead><tbody>{points.map(point => <tr key={point.periodId}><td>{reportingMonthLabel(point.periodDate)}</td><td>{point.value == null ? 'Not reported' : point.value.toLocaleString()}</td></tr>)}</tbody></table></details></section>
}
