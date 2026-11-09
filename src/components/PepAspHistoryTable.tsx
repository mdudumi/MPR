import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
type Period = { id: string; period_date: string }
type PepAspRow = { period: string; monthlyOil: number|null; pep: number|null; afterPep: number|null; asp: number|null; totalTake: number|null }
type HistoricalProduction = { reporting_period_id: string; net_oil_m3: number|null }
type HistoricalPep = { reporting_period_id: string; pep_quantity_tonne: number|null; asp_rate?: number|null; pep_assumed_m3_per_tonne?: number|null }

const importedRows: PepAspRow[] = [
  { period: '2025-01-01', monthlyOil: 40810.6, pep: 798.3, afterPep: 40012.3, asp: 1200.4, totalTake: 1998.7 },
  { period: '2025-02-01', monthlyOil: 39369.7, pep: 788.4, afterPep: 38581.3, asp: 1157.4, totalTake: 1945.8 },
  { period: '2025-03-01', monthlyOil: 42547.4, pep: 778.6, afterPep: 41768.8, asp: 1253.1, totalTake: 2031.7 },
  { period: '2025-04-01', monthlyOil: 40813.9, pep: 768.9, afterPep: 40045.0, asp: 1201.4, totalTake: 1970.3 },
  { period: '2025-05-01', monthlyOil: 42649.4, pep: 759.4, afterPep: 41890.0, asp: 1256.7, totalTake: 2016.1 },
]

const number = (value: number|null|undefined) => value == null ? '—' : new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)

export function PepAspHistoryTable({ periods, activePeriodId, oilM3, pepQuantity, aspRate, locked, onSave, productionHistory = [], pepHistory = [] }: { periods: Period[]; activePeriodId: string; oilM3: number|null; pepQuantity: number|null; aspRate: number|null; locked: boolean; onSave: (field: 'pep_quantity_tonne'|'asp_rate', value: string) => void; productionHistory?: HistoricalProduction[]; pepHistory?: HistoricalPep[] }) {
  const [loadedProduction, setLoadedProduction] = useState<HistoricalProduction[]>(productionHistory)
  const [loadedPep, setLoadedPep] = useState<HistoricalPep[]>(pepHistory)
  useEffect(() => {
    if (productionHistory.length) setLoadedProduction(productionHistory)
    if (pepHistory.length) setLoadedPep(pepHistory)
  }, [productionHistory, pepHistory])
  useEffect(() => {
    if (!supabase || !activePeriodId) return
    let cancelled = false
    Promise.all([
      supabase.from('production_monthly').select('reporting_period_id,net_oil_m3'),
      supabase.from('pep_asp_reporting_monthly').select('reporting_period_id,pep_quantity_tonne,asp_rate,pep_assumed_m3_per_tonne'),
    ]).then(([production, pep]) => {
      if (cancelled) return
      if (!production.error) setLoadedProduction((production.data ?? []) as HistoricalProduction[])
      if (!pep.error) setLoadedPep((pep.data ?? []) as HistoricalPep[])
    })
    return () => { cancelled = true }
  }, [activePeriodId])
  const activeDate = periods.find(period => period.id === activePeriodId)?.period_date
  const effectiveAspRate = 0.03
  const importedByPeriod = new Map(importedRows.map(row => [row.period, row]))
  const rows = periods
    .filter(period => !activeDate || period.period_date <= activeDate)
    .sort((a, b) => a.period_date.localeCompare(b.period_date))
    .map(period => {
      const imported = importedByPeriod.get(period.period_date)
      const production = loadedProduction.find(row => row.reporting_period_id === period.id)
      const pepRecord = loadedPep.find(row => row.reporting_period_id === period.id)
      const isActive = period.id === activePeriodId
      const monthlyOil = isActive ? (oilM3 ?? production?.net_oil_m3 ?? imported?.monthlyOil ?? null) : (production?.net_oil_m3 ?? imported?.monthlyOil ?? null)
      const pep = isActive ? (pepQuantity ?? pepRecord?.pep_quantity_tonne ?? imported?.pep ?? null) : (pepRecord?.pep_quantity_tonne ?? imported?.pep ?? null)
      const rate = pepRecord?.asp_rate ?? effectiveAspRate
      const afterPep = monthlyOil == null || pep == null ? null : monthlyOil - pep * (pepRecord?.pep_assumed_m3_per_tonne ?? 1)
      const asp = afterPep == null ? null : afterPep * rate
      return { period: period.period_date, monthlyOil, pep, afterPep, asp, totalTake: pep == null || asp == null ? null : pep + asp }
    })
  return <div className="pep-asp-history">
    <p className="generated-overview">The table below shows the monthly Albpetrol Pre-Existing (PEP), the net oil remaining after PEP, the Albpetrol Share of Production (ASP), and the total Albpetrol take.</p>
    <table className="report-table pep-asp-table"><thead><tr><th>Period</th><th>Monthly Oil Production<br/>(m³)</th><th>Pre-existing Production (PEP)<br/>(m³)</th><th>Net Oil Production After PEP<br/>(m³)</th><th>Albpetrol Share of Production (ASP)<br/>(R factor &gt;1, m³)</th><th>Total Albpetrol Take (PEP &amp; ASP)<br/>(m³)</th></tr></thead><tbody>{rows.map(row => { const active = row.period === activeDate; const oil = active ? (oilM3 ?? row.monthlyOil) : row.monthlyOil; const pep = active ? (pepQuantity ?? row.pep) : row.pep; const afterPep = oil == null || pep == null ? null : oil - pep; const asp = active && afterPep != null ? afterPep * effectiveAspRate : row.asp; const total = pep == null || asp == null ? null : pep + asp; return <tr key={row.period}><td>{new Intl.DateTimeFormat('en-GB',{month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(`${row.period}T00:00:00Z`))}</td><td className="calculated-cell">{number(oil)}</td><td className={active ? 'entry-cell' : 'calculated-cell'}>{active ? <input type="number" min="0" step="0.001" defaultValue={pepQuantity ?? row.pep ?? ''} disabled={locked} onBlur={event => onSave('pep_quantity_tonne', event.currentTarget.value)} /> : number(pep)}</td><td className="calculated-cell">{number(active ? afterPep : row.afterPep)}</td><td className="calculated-cell">{number(asp)}</td><td className="calculated-cell">{number(active ? total : row.totalTake)}</td></tr> })}</tbody></table>
  </div>
}
