type Sales = { reporting_period_id: string; delivery_type: string; gross_quantity_m3: number|null; average_water_cut_percent: number|null; net_oil_tonne: number|null; net_oil_m3: number|null; net_oil_bbl: number|null; average_api_gravity: number|null }
type Period = { id: string; period_date: string }
type NumericField = 'gross_quantity_m3'|'average_water_cut_percent'|'net_oil_tonne'|'net_oil_m3'|'net_oil_bbl'|'average_api_gravity'
const names: Record<string,string> = { EXPORT_SALES: 'Export Sales', DOMESTIC_SALES: 'Domestic Sales', PEP_ASP_DELIVERIES: 'PEP & ASP Deliveries' }
const fields: [NumericField,string,string][] = [['gross_quantity_m3','Gross Quantity Delivered','m³'],['average_water_cut_percent','Avg Wcut','%'],['net_oil_tonne','Net Oil Quantity','tonnes'],['net_oil_m3','Net Oil Quantity','m³'],['net_oil_bbl','Net Oil Quantity','bbl'],['average_api_gravity','Average API Gravity of Delivered Oil','° API']]
const importedSales: Sales[] = [
  { reporting_period_id:'2024-12-01', delivery_type:'EXPORT_SALES', gross_quantity_m3:494114, average_water_cut_percent:1.4, net_oil_tonne:490784, net_oil_m3:487075.4, net_oil_bbl:3064646.5, average_api_gravity:8.6 },
  { reporting_period_id:'2025-01-01', delivery_type:'EXPORT_SALES', gross_quantity_m3:43309, average_water_cut_percent:1.6, net_oil_tonne:42877.4, net_oil_m3:42624.2, net_oil_bbl:268189.1, average_api_gravity:8.9 },
  { reporting_period_id:'2025-02-01', delivery_type:'EXPORT_SALES', gross_quantity_m3:43267.1, average_water_cut_percent:1.2, net_oil_tonne:43047.4, net_oil_m3:42754.5, net_oil_bbl:269009.1, average_api_gravity:8.8 },
  { reporting_period_id:'2025-03-01', delivery_type:'EXPORT_SALES', gross_quantity_m3:41315.4, average_water_cut_percent:1.4, net_oil_tonne:40995.6, net_oil_m3:40732.9, net_oil_bbl:256289.2, average_api_gravity:8.8 },
  { reporting_period_id:'2025-04-01', delivery_type:'EXPORT_SALES', gross_quantity_m3:40590.9, average_water_cut_percent:1.4, net_oil_tonne:40017.5, net_oil_m3:39760.9, net_oil_bbl:250173.6, average_api_gravity:8.8 },
  { reporting_period_id:'2025-05-01', delivery_type:'EXPORT_SALES', gross_quantity_m3:40168.2, average_water_cut_percent:1.3, net_oil_tonne:39934.5, net_oil_m3:39643.3, net_oil_bbl:249433.7, average_api_gravity:8.7 },
  { reporting_period_id:'2024-12-01', delivery_type:'DOMESTIC_SALES', gross_quantity_m3:2578.9, average_water_cut_percent:2.1, net_oil_tonne:4160.1, net_oil_m3:null, net_oil_bbl:25976.7, average_api_gravity:8.7 },
  { reporting_period_id:'2024-12-01', delivery_type:'PEP_ASP_DELIVERIES', gross_quantity_m3:33316.8, average_water_cut_percent:2, net_oil_tonne:32941.5, net_oil_m3:32647.5, net_oil_bbl:205641.6, average_api_gravity:8.6 },
  { reporting_period_id:'2025-01-01', delivery_type:'PEP_ASP_DELIVERIES', gross_quantity_m3:2272.9, average_water_cut_percent:1.9, net_oil_tonne:2247.5, net_oil_m3:2229.7, net_oil_bbl:14044.9, average_api_gravity:8.8 },
  { reporting_period_id:'2025-02-01', delivery_type:'PEP_ASP_DELIVERIES', gross_quantity_m3:2230.8, average_water_cut_percent:1.5, net_oil_tonne:2218.2, net_oil_m3:2197.3, net_oil_bbl:13840.5, average_api_gravity:8.6 },
  { reporting_period_id:'2025-03-01', delivery_type:'PEP_ASP_DELIVERIES', gross_quantity_m3:3449.3, average_water_cut_percent:2, net_oil_tonne:3409.6, net_oil_m3:3380.4, net_oil_bbl:21293.3, average_api_gravity:8.7 },
  { reporting_period_id:'2025-04-01', delivery_type:'PEP_ASP_DELIVERIES', gross_quantity_m3:3452.8, average_water_cut_percent:2.1, net_oil_tonne:3406.3, net_oil_m3:3381.6, net_oil_bbl:21300, average_api_gravity:8.9 },
  { reporting_period_id:'2025-05-01', delivery_type:'PEP_ASP_DELIVERIES', gross_quantity_m3:3437.9, average_water_cut_percent:1.9, net_oil_tonne:3400.6, net_oil_m3:3371.4, net_oil_bbl:21236.7, average_api_gravity:8.7 },
]
export function SalesDeliveriesTables({ rows, periods, activePeriodId, locked, amount, onEdit, globalOilSalesM3 = null, rbhSalesM3 = null }: { rows: Sales[]; periods: Period[]; activePeriodId: string; locked: boolean; amount: (value:number|null|undefined,digits?:number)=>string; onEdit: (row: Sales, field:NumericField, value:string)=>void; globalOilSalesM3?: number|null; rbhSalesM3?: number|null }) {
  // Prefer live/database rows so edits remain visible; use the imported history only
  // to fill periods that are not present yet in the database.
  const effectiveRows = [...rows, ...importedSales].filter((row,index,all)=>all.findIndex(item=>item.reporting_period_id===row.reporting_period_id&&item.delivery_type===row.delivery_type)===index)
  const activeDate = periods.find(period => period.id === activePeriodId)?.period_date
  // Keep the history up to the active reporting month; future periods must not appear.
  const ordered = [...periods]
    .filter(period => !activeDate || period.period_date <= activeDate)
    .sort((a,b)=>a.period_date.localeCompare(b.period_date))
  const current = (type:string) => effectiveRows.find(r=>r.reporting_period_id===activePeriodId&&r.delivery_type===type)
  const display = (row:Sales|undefined, field:NumericField): number|null => row ? row[field] : null
  const netOilM3 = (type: string) => current(type)?.net_oil_m3 ?? 0
  const totalNetOilM3 = netOilM3('EXPORT_SALES') + netOilM3('DOMESTIC_SALES') + netOilM3('PEP_ASP_DELIVERIES')
  return <div className="sales-deliveries-subsection"><p className="generated-overview">Total Sales and Deliveries were {amount(totalNetOilM3)} m³ during this month. {amount(netOilM3('EXPORT_SALES'))} m³ were export sales and {amount(netOilM3('PEP_ASP_DELIVERIES'))} m³ were deliveries to Albpetrol as PEP&amp;ASP. Meanwhile, sales at Al Global Oil were {amount(globalOilSalesM3)} m³ and {amount(rbhSalesM3)} m³ at R.B.H. Beline.</p>{(['EXPORT_SALES','DOMESTIC_SALES','PEP_ASP_DELIVERIES'] as const).map(type=><section className="production-subsection sales-history-subsection" key={type}><h3>{names[type]}</h3><table className="report-table sales-history-table"><thead><tr><th>Period</th>{fields.map(([field,label,unit])=><th key={String(field)}>{label}<br/>({unit})</th>)}</tr></thead><tbody>{ordered.map(period=>{const row=effectiveRows.find(r=>r.reporting_period_id===period.id&&r.delivery_type===type);const editableRow=row??{reporting_period_id:activePeriodId,delivery_type:type,gross_quantity_m3:null,average_water_cut_percent:null,net_oil_tonne:null,net_oil_m3:null,net_oil_bbl:null,average_api_gravity:null};return <tr key={period.id}><td>{new Intl.DateTimeFormat('en-GB',{month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(`${period.period_date}T00:00:00Z`))}</td>{fields.map(([field,,])=><td key={String(field)} className={period.id===activePeriodId?'entry-cell':'calculated-cell'}>{period.id===activePeriodId?<input type="number" min="0" step="0.001" disabled={locked} defaultValue={editableRow[field]??''} onBlur={e=>onEdit(editableRow,field,e.target.value)}/>:amount(display(row,field),1)}</td>)}</tr>})}</tbody></table></section>)}</div>
}
