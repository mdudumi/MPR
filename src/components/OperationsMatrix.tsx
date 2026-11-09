import { Trash2 } from 'lucide-react'

type Operation = {
  reporting_period_id: string
  rig_name: string
  operation_category: string
  hours_spent: number
  operation_count: number
}

type Props = {
  rows: Operation[]
  amount: (value: number | null | undefined, digits?: number) => string
  onAdd: (rig: string) => void
  onDelete: (row: Operation) => void
  onEdit: (row: Operation, field: 'hours_spent' | 'operation_count', value: string) => void
}

const categories = ['MWO', 'FB', 'REAC', 'WO', 'WIII']

export function OperationsMatrix({ rows, amount, onAdd, onDelete, onEdit }: Props) {
  const matrixRows = Array.from(new Map(rows.map(row => [`${row.rig_name}|${row.operation_category}`, row])).values())
  const rigs = [...new Set(matrixRows.map(row => row.rig_name))]
  const find = (rig: string, category: string) => matrixRows.find(row => row.rig_name === rig && row.operation_category === category)
  const total = (category: string, field: 'hours_spent' | 'operation_count') =>
    matrixRows.filter(row => row.operation_category === category).reduce((sum, row) => sum + (Number(row[field]) || 0), 0)
  const cell = (rig: string, category: string, field: 'hours_spent' | 'operation_count') => {
    const row = find(rig, category) ?? {
      reporting_period_id: matrixRows[0]?.reporting_period_id ?? '',
      rig_name: rig,
      operation_category: category,
      hours_spent: 0,
      operation_count: 0,
    }
    return <input className="matrix-input" type="number" min="0" step={field === 'hours_spent' ? '0.1' : '1'} value={row[field] || ''} onChange={event => onEdit(row, field, event.target.value)} />
  }

  return <>
    <table className="report-table operations-matrix">
      <thead><tr><th>Rigs</th><th>Operation</th>{categories.map(category => <th key={category}>{category}</th>)}<th>Grand Total</th></tr></thead>
      <tbody>
        {rigs.map(rig => {
          const rigRows = matrixRows.filter(row => row.rig_name === rig)
          const hours = rigRows.reduce((sum, row) => sum + (Number(row.hours_spent) || 0), 0)
          const counts = rigRows.reduce((sum, row) => sum + (Number(row.operation_count) || 0), 0)
          return <>
            <tr key={`${rig}-hours`}><th rowSpan={2}>{rig}{' '}<button className="icon-button" title={`Delete ${rig}`} onClick={() => rigRows.forEach(onDelete)}><Trash2 size={13} /></button></th><td>Sum of HrsSpent</td>{categories.map(category => <td key={`${rig}-${category}-hours`}>{cell(rig, category, 'hours_spent')}</td>)}<td>{amount(hours)}</td></tr>
            <tr key={`${rig}-count`}><td>Count Operations</td>{categories.map(category => <td key={`${rig}-${category}-count`}>{cell(rig, category, 'operation_count')}</td>)}<td>{amount(counts, 0)}</td></tr>
          </>
        })}
        <tr className="derived-row"><th colSpan={2}>Total Sum of HrsSpent</th>{categories.map(category => <td key={`${category}-hours-total`}>{amount(total(category, 'hours_spent'))}</td>)}<td>{amount(matrixRows.reduce((sum, row) => sum + (Number(row.hours_spent) || 0), 0))}</td></tr>
        <tr className="derived-row"><th colSpan={2}>Total Count Operations</th>{categories.map(category => <td key={`${category}-count-total`}>{amount(total(category, 'operation_count'), 0)}</td>)}<td>{amount(matrixRows.reduce((sum, row) => sum + (Number(row.operation_count) || 0), 0), 0)}</td></tr>
      </tbody>
    </table>
    <div className="operation-add-row"><input id="new-operation-rig" placeholder="Rig" /><button className="button secondary" onClick={() => { const rig = (document.getElementById('new-operation-rig') as HTMLInputElement).value.trim(); if (rig) onAdd(rig) }}>+ Add rig</button></div>
  </>
}
