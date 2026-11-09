import type { jsPDF } from 'jspdf'
import type * as XLSX from 'xlsx'
import { getMonthlyProgressReport } from './monthlyReport'
import type { DashboardAnalytics, TrendPoint } from '../features/analytics/analyticsService'
import type { AnalyticsMetric } from '../features/analytics/metricRegistry'

type ReportData = Awaited<ReturnType<typeof getMonthlyProgressReport>>
type Row = Record<string, unknown>
export type ExportSource = 'WORKING_REPORT' | 'FINALIZED_VERSION'
const row = (value: unknown): Row => value && typeof value === 'object' ? value as Row : {}
const number = (value: unknown, decimals = 1) => typeof value === 'number' ? value.toLocaleString('en-US', { maximumFractionDigits: decimals }) : '—'
const text = (value: unknown) => typeof value === 'string' ? value : ''
const filenamePeriod = (periodDate: string) => periodDate.slice(0, 7)
const save = (content: BlobPart, name: string, type: string) => { const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000) }
const narrativeText = (value: unknown) => { const html = typeof value === 'object' && value && 'html' in value && typeof value.html === 'string' ? value.html : ''; if (!html) return 'No narrative reported.'; const doc = new DOMParser().parseFromString(html, 'text/html'); const items = Array.from(doc.querySelectorAll('li')).map(item => (item.textContent ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean); if (items.length) return items.map(item => '- ' + item).join('\n'); return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim() || 'No narrative reported.' }
const assetDataUrl = async (path: string) => { try { const response = await fetch(path); if (!response.ok) return null; const blob = await response.blob(); return await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob) }) } catch { return null } }

/** Exports are representations of the report model. Official versions must come from an immutable snapshot. */
export async function exportMonthlyReport(options: { periodDate: string; source: ExportSource; format: 'PDF' | 'XLSX'; report?: ReportData; version?: number }) {
  if (options.source === 'FINALIZED_VERSION') throw new Error('Official exports are unavailable until a finalized immutable snapshot and trusted export service are deployed.')
  if (!options.report) throw new Error('Working report data is required for export.')
  if (options.format === 'PDF') await exportWorkingPdf(options.report, options.periodDate)
  else await exportWorkingWorkbook(options.report, options.periodDate)
}

function pdfHeading(pdf: jsPDF, title: string, page: { y: number }) { if (page.y > 255) { pdf.addPage(); page.y = 22 } pdf.setTextColor(25, 25, 25); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(14); const lines = pdf.splitTextToSize(title, 174); lines.forEach((line: string) => { pdf.text(line, 18, Number(page.y)); page.y += 6 }); pdf.setDrawColor(127, 29, 29); pdf.line(18, Number(page.y), 192, Number(page.y)); page.y += 7; pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9) }
function pdfLines(pdf: jsPDF, content: string, page: { y: number }) { const lines = pdf.splitTextToSize(content || '—', 174); for (const line of lines) { if (page.y > 276) { pdf.addPage(); page.y = 22 } pdf.text(line, 18, page.y); page.y += 5 } page.y += 4 }
function pdfTable(pdf: jsPDF, headers: string[], rows: string[][], page: { y: number }, compact = false, columnWidths?: number[]) { const margin = 18; const totalWidth = 174; const widths = columnWidths && columnWidths.length === headers.length ? columnWidths : headers.map(() => totalWidth / Math.max(headers.length, 1)); const dense = compact || ['Incident', 'Lost Time Incidents', 'LTI Frequency', 'Exposure Hours'].includes(headers[0]); const normalize = (value: unknown) => String(value ?? '—').replace(/₄/g, '4').replace(/₂/g, '2').replace(/₅/g, '5').replace(/₃/g, '3').replace(/₁/g, '1'); const draw = (items: string[], bold = false) => { const isTotal = /^total\b/i.test(normalize(items[0])); const rowBold = bold || isTotal; const lines = items.map((item, index) => pdf.splitTextToSize(normalize(item), Math.max(widths[index] - (dense ? 3 : 10), 8))); const height = Math.max(...lines.map(value => value.length), 1) * (dense ? 3.35 : 4) + (dense ? 3.8 : 4); if (page.y + height > 280) { pdf.addPage(); page.y = 22; if (!bold) draw(headers, true) } pdf.setLineWidth(.2); let x = margin; pdf.setFont('helvetica', rowBold ? 'bold' : 'normal'); pdf.setFontSize(rowBold ? (compact ? 6 : 7) : dense ? (compact ? 5.8 : 7) : 8); lines.forEach((value, index) => { pdf.setDrawColor(190, 195, 200); if (rowBold) { pdf.setFillColor(isTotal ? 232 : 127, isTotal ? 232 : 29, isTotal ? 232 : 29); pdf.setTextColor(isTotal ? 25 : 255, isTotal ? 25 : 255, isTotal ? 25 : 255) } else { pdf.setTextColor(25, 25, 25) } if (rowBold || dense) pdf.rect(x, page.y, widths[index], height, rowBold ? 'FD' : 'S'); else pdf.rect(x, page.y, widths[index], height, 'S'); pdf.text(value, x + (dense ? .8 : 1.5), page.y + (dense ? 3.65 : 4)); x += widths[index] }); page.y += height }; if (page.y > 245 && !dense) { pdf.addPage(); page.y = 22 } draw(headers, true); rows.forEach(items => draw(items)); page.y += dense ? 3 : compact ? 1 : 9 }
function pdfEnvironment(pdf: jsPDF, report: ReportData, page: { y: number }, toc: Array<[string, number, number]>) { const environmentHeading = (title: string) => { if (page.y > 265) { pdf.addPage(); page.y = 22 } page.y += 3; pdf.setTextColor(25, 25, 25); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.text(title, 20, page.y); page.y += 4; pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9) }; const tables = report.environmentTables ?? []; [1,2].forEach(tableNumber => { const table = row(tables.find(item => Number(row(item).table_number) === tableNumber)); const rows = Array.isArray(table.table_data) ? table.table_data as Row[] : []; if (!rows.length) return; environmentHeading('1.4.' + (tableNumber + 4) + ' ' + text(table.table_title)); toc.push(['1.4.' + (tableNumber + 4) + ' ' + text(table.table_title), pdf.getNumberOfPages(), 1]); const keys = Array.from(new Set(rows.flatMap(item => Object.keys(item)))); pdfTable(pdf, keys.map(key => key.replace(/_/g, ' ')), rows.map(item => keys.map(key => number(item[key], 2) !== '—' ? number(item[key], 2) : text(item[key]))), page, false, tableNumber === 1 ? [40, 14.9, 14.9, 14.9, 14.9, 14.9, 14.9, 14.9, 14.9, 14.9] : tableNumber === 2 ? [40, 19.15, 19.15, 19.15, 19.15, 19.15, 19.15, 19.15] : tableNumber === 5 ? [45, 64.5, 64.5] : undefined) }); const table3 = row(tables.find(item => Number(row(item).table_number) === 3)); const rows3 = Array.isArray(table3.table_data) ? table3.table_data as Row[] : []; if (rows3.length) { environmentHeading('1.4.7 Recorded Inputs of Waste Processed at Waste Management Facilities'); toc.push(['1.4.7 Recorded Inputs of Waste Processed at Waste Management Facilities', pdf.getNumberOfPages(), 1]); pdfTable(pdf, ['Equipment','Method','Sludge and Waste','Unit','Volume Treated','Ash and Solid Waste from Treatment Weight (ton)','Destination'], [...rows3.map(item => [text(item.equipment), text(item.method), text(item.waste), text(item.unit), number(item.volume_treated, 2), number(item.ash_solid_weight_ton, 2), text(item.destination)]), ['Total','—','—','—',number(rows3.reduce((sum,item)=>sum+(Number(item.volume_treated)||0),0),2),number(rows3.reduce((sum,item)=>sum+(Number(item.ash_solid_weight_ton)||0),0),2),'—']], page, false, [44, 16, 34, 12, 20, 28, 20]); } [4,5].forEach(tableNumber => { const table = row(tables.find(item => Number(row(item).table_number) === tableNumber)); const rows = Array.isArray(table.table_data) ? table.table_data as Row[] : []; if (!rows.length) return; environmentHeading('1.4.' + (tableNumber + 4) + ' ' + text(table.table_title)); toc.push(['1.4.' + (tableNumber + 4) + ' ' + text(table.table_title), pdf.getNumberOfPages(), 1]); const keys = Array.from(new Set(rows.flatMap(item => Object.keys(item)))); pdfTable(pdf, keys.map(key => key.replace(/_/g, ' ')), rows.map(item => keys.map(key => number(item[key], 2) !== '—' ? number(item[key], 2) : text(item[key]))), page, false, tableNumber === 5 ? [45, 64.5, 64.5] : undefined) }); const table6 = row(tables.find(item => Number(row(item).table_number) === 6)); const rows6 = Array.isArray(table6.table_data) ? table6.table_data as Row[] : []; const gas = rows6[0] ?? {}; const hazard = (key: string) => String(gas[key + '_hazardous'] ?? gas.hazardous ?? '—'); if (rows6.length) { environmentHeading('1.4.10 Calculated gaseous emissions in the oilfield'); toc.push(['1.4.10 Calculated gaseous emissions in the oilfield', pdf.getNumberOfPages(), 1]); pdfTable(pdf, ['Total quantity generated during production (m³)','Gases burnt to produce energy (m³)','Gases burnt to free up spaces (m³)','Vented gases (m³)','Biologically treated gases (m³)','Gases transferred to other subjects / companies (m³)'], [[number(gas.total_quantity_generated_m3,2),number(gas.produced_energy_m3,2),number(gas.free_up_spaces_m3,2),number(gas.vented_gases_m3,2),number(gas.biologically_treated_gases_m3,2),number(gas.gases_transferred_other_subjects_m3,2)]], page, false, [36, 32, 32, 25, 27, 22]); pdfTable(pdf, ['Detailed gaseous emissions','Hazardous','Tonnes/month'], [['CH₄ (VOC)','Yes',number(gas.CH4_tonnes,2)],['NOx','No',number(gas.NOx_tonnes,2)],['SOx','Yes',number(gas.SOx_tonnes,2)],['PM10','Yes',number(gas.PM10_tonnes,2)],['PM₂.₅',hazard('PM2.5_tonnes'),number(gas['PM2.5_tonnes'],2)],['CO','Yes',number(gas.CO_tonnes,2)],['Benzene','Yes',number(gas.Benzene_tonnes,2)],['Toluene','Yes',number(gas.Toluene_tonnes,2)],['Ethyl Benzene','Yes',number(gas.Ethyl_benzene_tonnes,2)],['Xylenes','Yes',number(gas.Xylenes_tonnes,2)],['H₂S','Yes',number(gas.H2S_tonnes,2)],['Mercaptans','Yes',number(gas.Mercaptans_tonnes,2)],['CO₂ released from burned gas','No',number(gas.CO2_tonnes,2)]], page, false, [100, 35, 39]); } }
function pdfEnvironmentReadable(pdf: jsPDF, report: ReportData, page: { y: number }, toc: Array<[string, number, number]>) {
  const heading = (title: string) => { if (page.y > 265) { pdf.addPage(); page.y = 22 }; page.y += 5; pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(25, 25, 25); pdf.text(title, 20, page.y); page.y += 10; pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); toc.push([title, pdf.getNumberOfPages(), 1]) }
  const tables = report.environmentTables ?? []
  const transpose = (tableNumber: number, title: string, rows: Row[]) => { if (!rows.length) return; heading(title); const keys = Array.from(new Set(rows.flatMap(item => Object.keys(item)))).filter(key => !['ecopit', 'reporting_period_id'].includes(key)); const ecopits = rows.map(item => text(item.ecopit) || '—'); const widths = [48, ...ecopits.map(() => (174 - 48) / Math.max(ecopits.length, 1))]; const values = keys.map(key => [key.replace(/_/g, ' '), ...rows.map(item => number(item[key], 2) !== '—' ? number(item[key], 2) : text(item[key]))]); pdfTable(pdf, ['Measure', ...ecopits], values, page, true, widths) }
  const normal = (title: string, rows: Row[]) => { if (!rows.length) return; heading(title); const keys = Array.from(new Set(rows.flatMap(item => Object.keys(item)))); pdfTable(pdf, keys.map(key => key.replace(/_/g, ' ')), rows.map(item => keys.map(key => number(item[key], 2) !== '—' ? number(item[key], 2) : text(item[key]))), page) }
  const table1 = row(tables.find(item => Number(row(item).table_number) === 1)); const rows1 = Array.isArray(table1.table_data) ? table1.table_data as Row[] : []; transpose(1, '1.4.5 ' + text(table1.table_title), rows1)
  const table2 = row(tables.find(item => Number(row(item).table_number) === 2)); const rows2 = Array.isArray(table2.table_data) ? table2.table_data as Row[] : []; transpose(2, '1.4.6 ' + text(table2.table_title), rows2)
  const table3 = row(tables.find(item => Number(row(item).table_number) === 3)); const rows3 = Array.isArray(table3.table_data) ? table3.table_data as Row[] : []; if (rows3.length) { heading('1.4.7 Recorded Inputs of Waste Processed at Waste Management Facilities'); const equipment = rows3.map(item => text(item.equipment) || '—'); const totalVolume = rows3.reduce((sum, item) => sum + (Number(item.volume_treated) || 0), 0); const totalAsh = rows3.reduce((sum, item) => sum + (Number(item.ash_solid_weight_ton) || 0), 0); const transposed = [['Method', ...rows3.map(item => text(item.method))], ['Sludge and Waste', ...rows3.map(item => text(item.waste))], ['Unit', ...rows3.map(item => text(item.unit))], ['Volume Treated', ...rows3.map(item => number(item.volume_treated, 2))], ['Ash and Solid Waste Weight (ton)', ...rows3.map(item => number(item.ash_solid_weight_ton, 2))], ['Destination', ...rows3.map(item => text(item.destination))]]; const widths = [46, ...rows3.map(() => (174 - 46 - 24) / Math.max(rows3.length, 1)), 24]; pdfTable(pdf, ['Measure', ...equipment, 'Total'], transposed.map((rowValues, index) => [...rowValues, index === 3 ? number(totalVolume, 2) : index === 4 ? number(totalAsh, 2) : '—']), page, true, widths) }
  for (const tableNumber of [4, 5]) { const table = row(tables.find(item => Number(row(item).table_number) === tableNumber)); const rows = Array.isArray(table.table_data) ? table.table_data as Row[] : []; normal('1.4.' + (tableNumber + 4) + ' ' + text(table.table_title), rows) }
  const table6 = row(tables.find(item => Number(row(item).table_number) === 6)); const rows6 = Array.isArray(table6.table_data) ? table6.table_data as Row[] : []; const gas = rows6[0] ?? {}; if (rows6.length) { heading('1.4.10 Calculated gaseous emissions in the oilfield'); pdfTable(pdf, ['Measure', 'Value'], [['Total quantity generated during production (m³)', number(gas.total_quantity_generated_m3,2)], ['Gases burnt to produce energy (m³)', number(gas.produced_energy_m3,2)], ['Gases burnt to free up spaces (m³)', number(gas.free_up_spaces_m3,2)], ['Vented gases (m³)', number(gas.vented_gases_m3,2)], ['Biologically treated gases (m³)', number(gas.biologically_treated_gases_m3,2)], ['Gases transferred to other subjects / companies (m³)', number(gas.gases_transferred_other_subjects_m3,2)]], page, false, [130,44]); pdfTable(pdf, ['Detailed gaseous emissions','Hazardous','Tonnes/month'], [['CH₄ (VOC)','Yes',number(gas.CH4_tonnes,2)],['NOx','No',number(gas.NOx_tonnes,2)],['SOx','Yes',number(gas.SOx_tonnes,2)],['PM10','Yes',number(gas.PM10_tonnes,2)],['PM₂.₅','Yes',number(gas['PM2.5_tonnes'],2)],['CO','Yes',number(gas.CO_tonnes,2)],['Benzene','Yes',number(gas.Benzene_tonnes,2)],['Toluene','Yes',number(gas.Toluene_tonnes,2)],['Ethyl Benzene','Yes',number(gas.Ethyl_benzene_tonnes,2)],['Xylenes','Yes',number(gas.Xylenes_tonnes,2)],['H₂S','Yes',number(gas.H2S_tonnes,2)],['Mercaptans','Yes',number(gas.Mercaptans_tonnes,2)],['CO₂ released from burned gas','No',number(gas.CO2_tonnes,2)]], page, false, [100,35,39]) }
}
async function exportWorkingPdf(report: ReportData, periodDate: string) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const period = filenamePeriod(periodDate)
  const printDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  const page = { y: 28 }
  const toc: Array<[string, number, number]> = []
  const addSection = (numberText: string, title: string) => { pdfHeading(pdf, numberText + ' ' + title, page); return pdf.getNumberOfPages() }
  const addSubsection = (numberText: string, title: string, compact = false) => { const tight = compact || numberText.startsWith('1.1.'); if (page.y > (tight ? 275 : 265)) { pdf.addPage(); page.y = 22 }; page.y += tight ? 3 : 5; pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.text(numberText + ' ' + title, 20, page.y); page.y += tight ? 6 : 10; pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); toc.push([numberText + ' ' + title, pdf.getNumberOfPages(), 1]) }

  pdf.setFillColor(243, 243, 243); pdf.rect(0, 0, 210, 297, 'F')
  pdf.setFillColor(25, 25, 25); pdf.rect(0, 0, 210, 18, 'F')
  pdf.setFillColor(127, 29, 29); pdf.rect(0, 18, 210, 2.5, 'F')
  pdf.setFillColor(255, 255, 255); pdf.roundedRect(14, 28, 182, 222, 3, 3, 'F')
  const logo = await assetDataUrl('/bankers-logo.png')
  if (logo) pdf.addImage(logo, 'PNG', 25, 35, 72, 25)
  else { pdf.setTextColor(25, 25, 25); pdf.setFont('times', 'bold'); pdf.setFontSize(34); pdf.text('Bankers', 28, 54); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.text('PETROLEUM ALBANIA LTD.', 57, 62) }
  pdf.setTextColor(127, 29, 29); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.text('PATOS-MARINZA DEVELOPMENT PROJECT', 105, 78, { align: 'center' })
  pdf.setDrawColor(175, 175, 175); pdf.setLineWidth(.4); pdf.line(42, 86, 168, 86)
  pdf.setTextColor(25, 35, 48); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(24); pdf.text('Monthly Progress', 105, 111, { align: 'center' }); pdf.text('Report', 105, 124, { align: 'center' })
  pdf.setFillColor(235, 235, 235); pdf.roundedRect(40, 143, 130, 47, 2, 2, 'F')
  pdf.setTextColor(25, 25, 25); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.text('REPORTING PERIOD', 53, 154); pdf.text('PRINTED ON', 53, 174)
  pdf.setTextColor(25, 35, 48); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(13); pdf.text(period, 157, 154, { align: 'right' }); pdf.setFontSize(10.5); pdf.text(printDate, 157, 174, { align: 'right' })
  pdf.setDrawColor(127, 29, 29); pdf.setLineWidth(1.2); pdf.line(40, 207, 170, 207)
  pdf.setTextColor(107, 114, 128); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.text('Prepared for monthly operational reporting', 105, 220, { align: 'center' })
  pdf.setFontSize(8); pdf.text('Bankers Petroleum Albania Ltd.  |  Confidential', 105, 241, { align: 'center' })
  pdf.addPage(); page.y = 25
  const tocPage = pdf.getNumberOfPages()
  pdf.addPage(); page.y = 22
  const tocContinuationPage = pdf.getNumberOfPages()
  pdf.addPage(); page.y = 22

  const periods = report.periods.map(item => row(item)).sort((a, b) => String(a.period_date).localeCompare(String(b.period_date)))
  const activePeriod = periods.find(item => String(item.period_date).slice(0, 7) === period)
  const previousPeriod = [...periods].reverse().find(item => String(item.period_date) < String(activePeriod?.period_date ?? ''))
  const yearPeriods = periods.filter(item => String(item.period_date).slice(0, 4) === String(activePeriod?.period_date ?? '').slice(0, 4) && String(item.period_date) <= String(activePeriod?.period_date ?? ''))
  const activeYear = String(activePeriod?.period_date ?? '').slice(0, 4)
  const incidentYtdBaseline = (typeId: unknown) => Number(row(report.hseIncidentYtdBaselines.find(item => String(row(item).incident_type_id) === String(typeId) && String(row(item).reporting_year) === activeYear)).incident_count) || 0
  const exposureYtdBaseline = (key: string) => Number(row(report.hseExposureYtdBaselines.find(item => String(row(item).reporting_year) === activeYear))[key]) || 0
  const exposureInceptionBaseline = (key: string) => Number(row(report.hseExposureInceptionBaseline)[key]) || 0
  const incidentValue = (typeId: unknown, periodId: unknown) => Number(row(report.hseIncidents.find(item => String(row(item).incident_type_id) === String(typeId) && String(row(item).reporting_period_id) === String(periodId))).incident_count) || 0
  const exposureValue = (periodId: unknown, key: string) => Number(row(report.hseExposure.find(item => String(row(item).reporting_period_id) === String(periodId)))[key]) || 0
  const numeric = (value: unknown) => Number(String(value ?? 0).replace(/,/g, '')) || 0
  const incidentRows = report.hseTypes.map(item => { const t = row(item); const current = incidentValue(t.id, activePeriod?.id); const last = incidentValue(t.id, previousPeriod?.id); const ytd = incidentYtdBaseline(t.id) + yearPeriods.reduce((sum, periodRow) => sum + incidentValue(t.id, periodRow.id), 0); const inception = (Number(t.inception_baseline) || 0) + periods.filter(periodRow => String(periodRow.period_date) <= String(activePeriod?.period_date ?? '')).reduce((sum, periodRow) => sum + incidentValue(t.id, periodRow.id), 0); return [text(t.name), number(last, 0), number(current, 0), number(ytd, 0), number(inception, 0)] }); const incidentTotals = [incidentRows.reduce((sum, item) => sum + Number(String(item[1] || 0).replace(/,/g, '')), 0), incidentRows.reduce((sum, item) => sum + Number(String(item[2] || 0).replace(/,/g, '')), 0), incidentRows.reduce((sum, item) => sum + Number(String(item[3] || 0).replace(/,/g, '')), 0), incidentRows.reduce((sum, item) => sum + Number(String(item[4] || 0).replace(/,/g, '')), 0)]
  let p = addSection('1.1', 'HSSC&E Summary'); toc.push(['1.1 HSSC&E Summary', p, 1])
  addSubsection('1.1.1', 'Incidents', true); pdfTable(pdf, ['Incident','Last Month','This Month','Year to Date','Inception to Date'], [...incidentRows, ['Total Incidents', ...incidentTotals.map(value => number(value, 0))]], page, true)
  addSubsection('1.1.2', 'Lost Time Incidents'); const ltiRows = ['BANKERS_LTI','CONTRACTOR_LTI'].map(code => { const type = report.hseTypes.find(item => String(row(item).code) === code); return [code === 'BANKERS_LTI' ? 'Bankers' : 'Contractors', number(incidentValue(row(type).id, previousPeriod?.id), 0), number(incidentValue(row(type).id, activePeriod?.id), 0), number(incidentYtdBaseline(row(type).id) + yearPeriods.reduce((sum, periodRow) => sum + incidentValue(row(type).id, periodRow.id), 0), 0), number((Number(row(type).inception_baseline) || 0) + periods.filter(periodRow => String(periodRow.period_date) <= String(activePeriod?.period_date ?? '')).reduce((sum, periodRow) => sum + incidentValue(row(type).id, periodRow.id), 0), 0)] }); pdfTable(pdf, ['Lost Time Incidents','Last Month','This Month','Year to Date','Inception to Date'], [...ltiRows, ['Total LTI', number(Number(String(ltiRows[0]?.[1] || 0).replace(/,/g, '')) + Number(String(ltiRows[1]?.[1] || 0).replace(/,/g, '')), 0), number(Number(String(ltiRows[0]?.[2] || 0).replace(/,/g, '')) + Number(String(ltiRows[1]?.[2] || 0).replace(/,/g, '')), 0), number(Number(String(ltiRows[0]?.[3] || 0).replace(/,/g, '')) + Number(String(ltiRows[1]?.[3] || 0).replace(/,/g, '')), 0), number(Number(String(ltiRows[0]?.[4] || 0).replace(/,/g, '')) + Number(String(ltiRows[1]?.[4] || 0).replace(/,/g, '')), 0)]], page)
  addSubsection('1.1.3', 'LTI Frequency'); const bankersYtd = exposureYtdBaseline('bankers_hours') + yearPeriods.reduce((sum, periodRow) => sum + exposureValue(periodRow.id, 'bankers_hours'), 0); const contractorsYtd = exposureYtdBaseline('contractor_hours') + yearPeriods.reduce((sum, periodRow) => sum + exposureValue(periodRow.id, 'contractor_hours'), 0); const bankersInc = exposureInceptionBaseline('bankers_hours') + periods.filter(periodRow => String(periodRow.period_date) <= String(activePeriod?.period_date ?? '')).reduce((sum, periodRow) => sum + exposureValue(periodRow.id, 'bankers_hours'), 0); const contractorsInc = exposureInceptionBaseline('contractor_hours') + periods.filter(periodRow => String(periodRow.period_date) <= String(activePeriod?.period_date ?? '')).reduce((sum, periodRow) => sum + exposureValue(periodRow.id, 'contractor_hours'), 0); const bankersLti = numeric(ltiRows[0]?.[3]); const contractorsLti = numeric(ltiRows[1]?.[3]); pdfTable(pdf, ['LTI Frequency','Frequency Year to Date','Frequency Inception to Date'], [['Bankers', number(bankersYtd ? bankersLti * 1000000 / bankersYtd : 0, 3), number(bankersInc ? numeric(ltiRows[0]?.[4]) * 1000000 / bankersInc : 0, 3)], ['Contractors', number(contractorsYtd ? contractorsLti * 1000000 / contractorsYtd : 0, 3), number(contractorsInc ? numeric(ltiRows[1]?.[4]) * 1000000 / contractorsInc : 0, 3)], ['Total Frequency', number((bankersYtd + contractorsYtd) ? (bankersLti + contractorsLti) * 1000000 / (bankersYtd + contractorsYtd) : 0, 3), number((bankersInc + contractorsInc) ? (numeric(ltiRows[0]?.[4]) + numeric(ltiRows[1]?.[4])) * 1000000 / (bankersInc + contractorsInc) : 0, 3)]], page)
  addSubsection('1.1.4', 'Exposure Hours'); const currentExposure = row(report.hseExposure.find(item => String(row(item).reporting_period_id) === String(activePeriod?.id))); const previousExposure = row(report.hseExposure.find(item => String(row(item).reporting_period_id) === String(previousPeriod?.id))); pdfTable(pdf, ['Exposure Hours','Last Month','This Month','Year to Date','Inception to Date'], [['Bankers', number(previousExposure.bankers_hours, 0), number(currentExposure.bankers_hours, 0), number(bankersYtd, 0), number(bankersInc, 0)], ['Contractors', number(previousExposure.contractor_hours, 0), number(currentExposure.contractor_hours, 0), number(contractorsYtd, 0), number(contractorsInc, 0)], ['Total Exposure Hours', number((Number(previousExposure.bankers_hours) || 0) + (Number(previousExposure.contractor_hours) || 0), 0), number((Number(currentExposure.bankers_hours) || 0) + (Number(currentExposure.contractor_hours) || 0), 0), number(bankersYtd + contractorsYtd, 0), number(bankersInc + contractorsInc, 0)]], page)

  pdf.addPage(); page.y = 22
  p = addSection('1.2', 'Health & Safety'); toc.push(['1.2 Health & Safety', p, 1])
  addSubsection('1.2.1', 'Operations Support'); pdfLines(pdf, narrativeText(report.hseNarratives.find(item => String(row(item).section_code) === 'OPERATIONS_SUPPORT')?.content), page)
  addSubsection('1.2.2', 'H&S Training'); pdfLines(pdf, narrativeText(report.hseNarratives.find(item => String(row(item).section_code) === 'HS_TRAINING')?.content), page)
  addSubsection('1.2.3', 'Health'); pdfLines(pdf, narrativeText(report.hseNarratives.find(item => String(row(item).section_code) === 'HEALTH')?.content), page)
  addSubsection('1.2.4', 'H&S Incidents'); pdfTable(pdf, ['Classification','Date','Brief Description'], report.hseDetails.map(item => { const v = row(item); return [text(v.classification), text(v.incident_date), text(v.brief_description)] }), page, false, [40, 25, 109])

  const security = row(report.security); page.y += 8; p = addSection('1.3', 'Security'); toc.push(['1.3 Security', p, 1])
  addSubsection('1.3.1', 'Operations Support'); pdfLines(pdf, narrativeText(security.operations_support), page)
  addSubsection('1.3.2', 'Incidents of High Importance'); pdfLines(pdf, narrativeText(security.incidents_high_importance), page)
  addSubsection('1.3.3', 'Security Incidents'); pdfTable(pdf, ['Classification','Date','Brief Description'], report.securityDetails.map(item => { const v = row(item); return [text(v.incident_code ?? v.classification ?? v.incident), text(v.incident_date ?? v.date), text(v.description ?? v.brief_description)] }), page, false, [40, 25, 109])

  const environment = row(report.environment); page.y += 8; p = addSection('1.4', 'Environment'); toc.push(['1.4 Environment', p, 1])
  addSubsection('1.4.1', 'Operations Support'); pdfLines(pdf, narrativeText(environment.operations_support), page)
  addSubsection('1.4.2', 'Environmental Monitoring Program'); pdfLines(pdf, narrativeText(environment.monitoring_program), page)
  addSubsection('1.4.3', 'Lease remediation and material reuse'); pdfLines(pdf, narrativeText(environment.lease_remediation_material_reuse), page)
  addSubsection('1.4.4', 'Environmental Incidents'); pdfTable(pdf, ['Classification','Date','Brief Description'], report.environmentDetails.map(item => { const v = row(item); return [text(v.incident ?? v.incident_code), text(v.incident_date), text(v.description ?? v.brief_description)] }), page, false, [40, 25, 109])
  pdfEnvironmentReadable(pdf, report, page, toc)

  const csr = row(report.csr); p = addSection('1.5', 'Corporate Social Responsibility'); toc.push(['1.5 Corporate Social Responsibility', p, 1])
  addSubsection('1.5.1', 'Social Infrastructure Projects'); pdfLines(pdf, narrativeText(csr.social_infrastructure_projects), page)
  addSubsection('1.5.2', 'Other Activities'); pdfLines(pdf, narrativeText(csr.other_activities), page)
  addSubsection('1.5.3', 'Grievances'); pdfTable(pdf, ['Date','Project Activity','Category','Status','Valid / Not Valid'], report.grievances.map(item => { const v = row(item); return [text(v.grievance_date), text(v.project_activity), text(v.category), text(v.status), text(v.validity)] }), page)

  // The working report also contains the operational sections 2–5. Keep the
  // PDF in the same order as the report navigation and use only values loaded
  // by getMonthlyProgressReport (no placeholder or invented values).
  const display = (value: unknown) => typeof value === 'number' ? number(value, 2) : text(value) || '—'
  const keyLabel = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase())
  const objectTable = (headers: string[], rows: Row[], keys: string[], widths?: number[], compact = false) => {
    const values = rows.map(item => keys.map(key => display(item[key])))
    pdfTable(pdf, headers, values, page, compact, widths)
  }
  const startOperationalSection = (numberText: string, title: string) => {
    pdf.addPage(); page.y = 22
    const sectionPage = addSection(numberText, title)
    toc.push([numberText + ' ' + title, sectionPage, 1])
  }

  startOperationalSection('2', 'Production')
  addSubsection('2.1', 'Production Overview')
  const production = row(report.production)
  const plan = row(report.plan)
  const periodLabel = (id: unknown) => text(periods.find(periodRow => String(row(periodRow).id) === String(id))?.period_date ?? id)
  const previousProduction = row((report.productionHistory ?? []).find(item => String(row(item).reporting_period_id) === String(previousPeriod?.id)))
  const historyProduction = (report.productionHistory ?? []).map(item => row(item)).sort((a, b) => periodLabel(a.reporting_period_id).localeCompare(periodLabel(b.reporting_period_id)))
  const valueForPeriod = (key: string, id: unknown) => Number(row(historyProduction.find(item => String(item.reporting_period_id) === String(id)))[key]) || 0
  const ytdProduction = (key: string) => yearPeriods.reduce((sum, periodRow) => sum + valueForPeriod(key, periodRow.id), 0)
  const factor = Number(production.m3_to_bbl_factor) || 6.2898
  const bblText = (key: string) => {
    const value = Number(production[key])
    return Number.isFinite(value) ? number(value, 3) + ' m³ (' + number(value * factor, 3) + ' bbl)' : 'not entered'
  }
  pdfLines(pdf, [
    '• Net oil production for the month was ' + bblText('net_oil_m3') + ', which equates to an average of ' + number(Number(production.net_oil_bbl) / 31, 3) + ' bopd average oil.',
    'In order to have a better understanding of production from each group of wells a production table is attached under Annex 1, showing production data well by well.',
    '• Pre-existing production (PEP) for the month was ' + number(Number(production.pep_tonne), 3) + ' tonne.',
    '• Total gasoil/solar was ' + bblText('gasoil_solar_m3') + '.',
    '• Crude oil used as fuel during the month was ' + bblText('crude_oil_used_as_fuel_m3') + '.',
    '• Total Sales and Deliveries were ' + bblText('sales_total_m3') + ' during this month. ' + bblText('export_sales_m3') + ' were export sales and ' + bblText('pep_asp_deliveries_m3') + ' were deliveries to Albpetrol as PEP & ASP.',
    '• The net oil inventory changed from ' + number(Number(production.inventory_start_m3), 3) + ' m³ to ' + number(Number(production.inventory_end_m3), 3) + ' m³.',
    'Oil proration factor for this month was ' + number(Number(production.oil_proration_percent), 3) + '%, meanwhile, water proration was ' + number(Number(production.water_proration_percent), 3) + '%. '
  ].join('\n\n'), page)
  const productionFields: Array<[string, string, string]> = [
    ['net_oil_tonne', 'Net Oil', 'tonne**'], ['net_oil_m3', 'Net Oil', 'm³'], ['net_oil_bbl', 'Net Oil', 'Bbl'],
    ['water_m3', 'Water', 'm³'], ['sand_m3', 'Sand', 'm³'], ['gas_nm3', 'Gas', 'm³'], ['days_on_production', 'Days on Prod.', '']
  ]
  objectTable(['Production item', 'Unit', 'Previous Month', 'This Month', 'Year to Date'], productionFields.map(([key, label, unit]) => ({ label, unit, previous: previousProduction[key], value: production[key], ytd: ytdProduction(key) })), ['label', 'unit', 'previous', 'value', 'ytd'], [50, 22, 32, 35, 35])
  const overviewFields: Array<[string, string, string]> = [
    ['pep_tonne', 'Pre-existing production (PEP)', 'tonne'], ['gasoil_solar_m3', 'Gasoil / solar used', 'm³'], ['sales_total_m3', 'Total sales and deliveries', 'm³'],
    ['export_sales_m3', 'Export sales', 'm³'], ['pep_asp_deliveries_m3', 'Deliveries to Albpetrol (PEP & ASP)', 'm³'], ['global_oil_sales_m3', 'Al Global Oil sales', 'm³'],
    ['rbh_sales_m3', 'R.B.H. Beline sales', 'm³'], ['inventory_start_m3', 'Opening net oil inventory', 'm³'], ['inventory_end_m3', 'Closing net oil inventory', 'm³'],
    ['oil_proration_percent', 'Oil proration factor', '%'], ['water_proration_percent', 'Water proration factor', '%'], ['m3_to_bbl_factor', 'm³ to Bbl conversion factor', 'Bbl / m³']
  ]
  // Overview inputs are represented in the narrative above; the separate
  // input table is intentionally omitted from the PDF layout.
  if (page.y > 205) { pdf.addPage(); page.y = 22 }
  addSubsection('2.2', 'Year Figures and Trend')
  const chartRows = historyProduction.filter(item => Number(item.net_oil_bbl) > 0)
  if (chartRows.length) {
    if (page.y > 205) { pdf.addPage(); page.y = 22 }
    const chartX = 22; const chartY = page.y + 8; const chartW = 166; const chartH = 52; const maxValue = Math.max(...chartRows.map(item => Number(item.net_oil_bbl) || 0), 1)
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(25, 25, 25); pdf.text('Average Daily Net Oil Production (Bopd)', chartX, page.y)
    pdf.setDrawColor(190, 195, 200); pdf.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH)
    const barW = Math.min(18, (chartW - 8) / chartRows.length - 3)
    chartRows.forEach((item, index) => { const value = Number(item.net_oil_bbl) || 0; const height = (value / maxValue) * (chartH - 8); const x = chartX + 4 + index * ((chartW - 8) / chartRows.length); pdf.setFillColor(142, 142, 148); pdf.rect(x, chartY + chartH - height, barW, height, 'F'); pdf.setTextColor(25, 25, 25); pdf.setFontSize(6.5); pdf.text(number(value / 31, 1), x + barW / 2, chartY + chartH - height - 2, { align: 'center' }); pdf.setTextColor(107, 114, 128); pdf.text(periodLabel(item.reporting_period_id).slice(0, 7), x + barW / 2, chartY + chartH + 5, { align: 'center' }) })
    page.y = chartY + chartH + 12
  } else pdfLines(pdf, 'No production data reported for the selected year.', page)
  const datedProduction = historyProduction.filter(item => ['net_oil_tonne','net_oil_m3','net_oil_bbl','water_m3','sand_m3','gas_nm3','days_on_production'].some(key => Number(item[key]) > 0))
  if (datedProduction.length) {
    objectTable(['Month', 'Net Oil (tonne)', 'Net Oil (m³)', 'Net Oil (Bbl)', 'Water (m³)', 'Sand (m³)', 'Gas (m³)', 'Days on Prod.'], datedProduction.map(item => ({
      period: periodLabel(item.reporting_period_id), net_oil_tonne: display(item.net_oil_tonne), net_oil_m3: display(item.net_oil_m3), net_oil_bbl: display(item.net_oil_bbl), water_m3: display(item.water_m3), sand_m3: display(item.sand_m3), gas_nm3: display(item.gas_nm3), days_on_production: display(item.days_on_production)
    })), ['period', 'net_oil_tonne', 'net_oil_m3', 'net_oil_bbl', 'water_m3', 'sand_m3', 'gas_nm3', 'days_on_production'], [24, 21.5, 21.5, 21.5, 21.5, 21.5, 21.5, 21.5], true)
  }

  addSubsection('2.3', 'Crude Oil Inventory')
  const visibleKeys = (items: Row[]) => Object.keys(items[0] ?? {}).filter(key => !['id', 'reporting_period_id', 'created_at', 'updated_at', 'source_type', 'source_reference'].includes(key))
  const renderAllRows = (items: Row[], fallback: string, widths?: number[]) => {
    if (!items.length) { pdfLines(pdf, fallback, page); return }
    const keys = visibleKeys(items)
    objectTable(keys.map(keyLabel), items, keys, widths)
  }
  const currentInventory = report.inventory.map(item => row(item))
  const previousInventory = (report.inventoryHistory ?? []).map(item => row(item)).filter(item => String(item.reporting_period_id) === String(previousPeriod?.id))
  if (currentInventory.length) {
    const locations = Array.from(new Set(currentInventory.map(item => text(item.location))))
    const inventoryRows = locations.map(location => ({ location, last: previousInventory.find(item => text(item.location) === location)?.quantity_m3, current: currentInventory.find(item => text(item.location) === location)?.quantity_m3, unit: 'm³' }))
    const totalLast = inventoryRows.reduce((sum, item) => sum + (Number(item.last) || 0), 0); const totalCurrent = inventoryRows.reduce((sum, item) => sum + (Number(item.current) || 0), 0)
    objectTable(['Location', 'Last Month', 'This Month', 'Unit'], [...inventoryRows, { location: 'Total Net Oil Inventory at End of Period', last: totalLast, current: totalCurrent, unit: 'm³' }], ['location', 'last', 'current', 'unit'], [78, 42, 42, 12])
    const historyRows = (report.inventoryHistory ?? []).map(item => row(item)); const historyLocations = Array.from(new Set(historyRows.map(item => text(item.location)))); const historyPeriods = Array.from(new Set(historyRows.map(item => String(item.reporting_period_id)))).sort((a, b) => periodLabel(a).localeCompare(periodLabel(b)))
    const historyTableRows = historyPeriods.map(periodId => { const values = historyLocations.map(location => Number(historyRows.find(item => String(item.reporting_period_id) === periodId && text(item.location) === location)?.quantity_m3) || 0); return { period: periodLabel(periodId), ...Object.fromEntries(historyLocations.map((location, index) => ['v' + index, values[index]])), total: values.reduce((sum, value) => sum + value, 0) } }).filter(item => Number(item.total) > 0)
    if (historyTableRows.length) { pdfLines(pdf, 'Crude Oil Inventory History', page); objectTable(['Period', ...historyLocations, 'Total Net Oil Inventory'], historyTableRows, ['period', ...historyLocations.map((_, index) => 'v' + index), 'total'], [28, ...historyLocations.map(() => Math.max(10, (174 - 28 - 28) / Math.max(historyLocations.length, 1))), 28], true) }
  } else pdfLines(pdf, 'No crude oil inventory reported.', page)
  addSubsection('2.4', 'Water Inventory')
  const currentWater = report.water.map(item => row(item)); const previousWater = (report.waterHistory ?? []).map(item => row(item)).filter(item => String(item.reporting_period_id) === String(previousPeriod?.id))
  if (currentWater.length) {
    const canonicalWaterLocation = (location: string) => ({ 'Pad D': 'Pad "D"', 'Pad "D"': 'Pad "D"', 'Pad H, CTF': 'Pad "H", CTF', 'Pad "H", CTF': 'Pad "H", CTF', 'Sludge Inventory + Sat3': 'Sludge Inventory+Sat3', 'Sludge Inventory+Sat3': 'Sludge Inventory+Sat3' }[location] ?? location)
    const waterLocations = Array.from(new Set(currentWater.map(item => canonicalWaterLocation(text(item.location)))))
    const waterRows = waterLocations.map(location => ({ location, beginning: currentWater.find(item => canonicalWaterLocation(text(item.location)) === location)?.beginning_quantity_m3 ?? previousWater.find(item => canonicalWaterLocation(text(item.location)) === location)?.ending_quantity_m3, ending: currentWater.find(item => canonicalWaterLocation(text(item.location)) === location)?.ending_quantity_m3, unit: 'm³' }))
    const beginningTotal = waterRows.reduce((sum, item) => sum + (Number(item.beginning) || 0), 0); const endingTotal = waterRows.reduce((sum, item) => sum + (Number(item.ending) || 0), 0)
    objectTable(['Location', 'Beginning of Month', 'End of Month', 'Unit'], [...waterRows, { location: 'Total Inventory', beginning: beginningTotal, ending: endingTotal, unit: 'm³' }], ['location', 'beginning', 'ending', 'unit'], [72, 45, 45, 12])
  } else pdfLines(pdf, 'No water inventory reported.', page)
  addSubsection('2.5', 'Production Operation Activities')
  addSubsection('2.5.1', 'Rig Operations')
  const operationRows = report.operations.map(item => row(item))
  if (operationRows.length) {
    const categories = ['MWO', 'FB', 'REAC', 'WO', 'WIII']
    const rigs = Array.from(new Set(operationRows.map(item => text(item.rig_name))))
    const operationTableRows: Row[] = []
    for (const rig of rigs) {
      for (const measure of ['hours_spent', 'operation_count']) {
        const values = categories.map(category => { const item = operationRows.find(rowItem => text(rowItem.rig_name) === rig && text(rowItem.operation_category) === category); return measure === 'hours_spent' ? Number(item?.hours_spent) || 0 : Number(item?.operation_count) || 0 })
        operationTableRows.push({ rig, operation: measure === 'hours_spent' ? 'Sum of HrsSpent' : 'Count Operations', ...Object.fromEntries(categories.map((category, index) => [category, values[index]])), grand_total: values.reduce((sum, value) => sum + value, 0) })
      }
    }
    const totals = (measure: 'hours_spent' | 'operation_count') => categories.map(category => operationRows.filter(item => text(item.operation_category) === category).reduce((sum, item) => sum + (Number(item[measure]) || 0), 0))
    const hourTotals = totals('hours_spent'); const countTotals = totals('operation_count')
    operationTableRows.push({ rig: 'Total', operation: 'TOTAL SUM OF HRSPENT', ...Object.fromEntries(categories.map((category, index) => [category, hourTotals[index]])), grand_total: hourTotals.reduce((sum, value) => sum + value, 0) })
    operationTableRows.push({ rig: 'Total', operation: 'TOTAL COUNT OPERATIONS', ...Object.fromEntries(categories.map((category, index) => [category, countTotals[index]])), grand_total: countTotals.reduce((sum, value) => sum + value, 0) })
    objectTable(['Rigs', 'Operation', 'MWO', 'FB', 'REAC', 'WO', 'WIII', 'Grand Total'], operationTableRows, ['rig', 'operation', ...categories, 'grand_total'], [20, 34, 20, 20, 20, 20, 20, 20])
  } else pdfLines(pdf, 'No production operation activities reported.', page)
  addSubsection('2.5.2', 'Operation Summary Inputs')
  const summary = row(report.operationSummary)
  const summaryKeys = ['producing_wells','horizontal_wells','vertical_wells','waiting_workover_wells','wells_down_water_space','produced_water_total_m3','produced_water_production_wells_m3','produced_water_source_wells_m3','disposed_water_total_m3','limestone_disposed_m3','sandstone_disposed_m3','polymer_wells_converted','water_intrusion_identification','polymer_injection_note','produced_oil_density_g_cm3','produced_oil_api','delivery_oil_density_g_cm3','delivery_oil_api','diluent_density_g_cm3','diluent_api','completed_production_wells']
  const densityKeys = new Set(['produced_oil_density_g_cm3', 'delivery_oil_density_g_cm3', 'diluent_density_g_cm3'])
  const summaryValue = (key: string) => densityKeys.has(key) && typeof summary[key] === 'number' ? number(summary[key], 4) : display(summary[key])
  pdfLines(pdf, 'During the month were conducted ' + operationRows.reduce((sum, item) => sum + (Number(item.operation_count) || 0), 0) + ' Rig well servicing operations, as detailed in the above table. ' + summaryValue('producing_wells') + ' producing wells were active, including ' + summaryValue('horizontal_wells') + ' horizontal and ' + summaryValue('vertical_wells') + ' vertical wells. Produced water was ' + summaryValue('produced_water_total_m3') + ' m³, including ' + summaryValue('produced_water_production_wells_m3') + ' m³ from production wells and ' + summaryValue('produced_water_source_wells_m3') + ' m³ from source wells. Total disposed water was ' + summaryValue('disposed_water_total_m3') + ' m³; Limestone ' + summaryValue('limestone_disposed_m3') + ' m³ and Sandstone ' + summaryValue('sandstone_disposed_m3') + ' m³. ' + summaryValue('water_intrusion_identification') + ' Water Intrusion Identification. The average density of the produced oil is ' + summaryValue('produced_oil_density_g_cm3') + ' g/cm³ or ' + summaryValue('produced_oil_api') + ' API. The average density of the delivery oil is ' + summaryValue('delivery_oil_density_g_cm3') + ' g/cm³ or ' + summaryValue('delivery_oil_api') + ' API. The density of diluent is ' + summaryValue('diluent_density_g_cm3') + ' g/cm³ or ' + summaryValue('diluent_api') + ' API. Completed and brought-on-production wells: ' + summaryValue('completed_production_wells') + '.', page)
  addSubsection('2.5.3', 'Formation Production')
  const formations = report.formationProduction.map(item => row(item))
  if (formations.length) objectTable(['Formation', 'Active Wells', 'Average Oil Rate m³/day/Active Well', '% of Total Production'], formations, ['formation', 'active_wells', 'average_oil_rate_m3_day', 'total_production_percent'], [44, 34, 52, 44])
  else pdfLines(pdf, 'No formation production reported.', page)
  addSubsection('2.6', 'Sales Deliveries')
  const salesRows = (report.salesHistory ?? report.sales).map(item => row(item))
  const currentSalesRows = salesRows.filter(item => String(item.reporting_period_id) === String(activePeriod?.id))
  if (currentSalesRows.length) {
    const salesValue = (type: string, field: string) => Number(currentSalesRows.find(item => text(item.delivery_type) === type)?.[field]) || 0
    const grossTotal = currentSalesRows.reduce((sum, item) => sum + (Number(item.gross_quantity_m3) || 0), 0)
    const bblTotal = currentSalesRows.reduce((sum, item) => sum + (Number(item.net_oil_bbl) || 0), 0)
    pdfLines(pdf, 'Total Sales and Deliveries were ' + number(grossTotal, 1) + ' m³ (' + number(bblTotal, 1) + ' bbl) during this month. ' + number(salesValue('EXPORT_SALES', 'gross_quantity_m3'), 1) + ' m³ (' + number(salesValue('EXPORT_SALES', 'net_oil_bbl'), 1) + ' bbl) were export sales and ' + number(salesValue('PEP_ASP_DELIVERIES', 'gross_quantity_m3'), 1) + ' m³ (' + number(salesValue('PEP_ASP_DELIVERIES', 'net_oil_bbl'), 1) + ' bbl) were deliveries to Albpetrol as PEP&ASP. Meanwhile, sales at Al Global Oil were 0 m³ (0 bbl) and 0 m³ (0 bbl) at R.B.H. Beline.', page)
  }
  const saleTypes = ['EXPORT_SALES', 'DOMESTIC_SALES', 'PEP_ASP_DELIVERIES']
  const saleNames: Record<string, string> = { EXPORT_SALES: 'Export Sales', DOMESTIC_SALES: 'Domestic Sales', PEP_ASP_DELIVERIES: 'PEP & ASP Deliveries' }
  const saleFields = ['gross_quantity_m3', 'average_water_cut_percent', 'net_oil_tonne', 'net_oil_m3', 'net_oil_bbl', 'average_api_gravity']
  for (const saleType of saleTypes) {
    addSubsection('2.6.' + (saleTypes.indexOf(saleType) + 1), saleNames[saleType])
    const typeRows = salesRows.filter(item => text(item.delivery_type) === saleType)
    const periodsWithData = periods.filter(periodRow => String(row(periodRow).period_date).slice(0, 4) === activeYear).sort((a, b) => String(row(a).period_date).localeCompare(String(row(b).period_date))).map(periodRow => String(row(periodRow).id))
    const rowsForType = periodsWithData.map(periodId => { const item = typeRows.find(rowItem => String(rowItem.reporting_period_id) === periodId) ?? {}; return { period: periodLabel(periodId), ...Object.fromEntries(saleFields.map(field => [field, item[field]])) } })
    if (rowsForType.length) { const totalRow = { period: 'Total', ...Object.fromEntries(saleFields.map(field => { const values = rowsForType.map(item => Number(item[field])).filter(value => Number.isFinite(value)); const total = values.reduce((sum, value) => sum + value, 0); return [field, field === 'average_water_cut_percent' || field === 'average_api_gravity' ? (values.length ? total / values.length : null) : total] })) }; objectTable(['Period', 'Gross Quantity Deliveries (m³)', 'Avg. Water Cut (%)', 'Net Oil (tonnes)', 'Net Oil (m³)', 'Net Oil (Bbl)', 'Average API Gravity'], [...rowsForType, totalRow], ['period', ...saleFields], [24, 28, 23, 25, 24, 24, 26], true) }
    else pdfLines(pdf, 'No data reported for this sales category.', page)
  }
  addSubsection('2.6.4', 'Sales and Deliveries Summary')
  pdfLines(pdf, 'Total sales and deliveries are shown by category above. Months without reported values are omitted.', page)
  addSubsection('2.7', 'Albpetrol Pre-Existing (PEP) & Share of Production (ASP)')
  const historicalPepAsp: Record<string, { pep_quantity_tonne: number; asp_rate: number }> = {
    '2025-01-01': { pep_quantity_tonne: 798.3, asp_rate: 0.03 },
    '2025-02-01': { pep_quantity_tonne: 788.4, asp_rate: 0.03 },
    '2025-03-01': { pep_quantity_tonne: 778.6, asp_rate: 0.03 },
    '2025-04-01': { pep_quantity_tonne: 768.9, asp_rate: 0.03 },
  }
  const pepHistory = (report.pepHistory ?? []).map(item => row(item))
  const pepRows = periods.filter(periodRow => String(row(periodRow).period_date).slice(0, 4) === activeYear).sort((a, b) => String(row(a).period_date).localeCompare(String(row(b).period_date))).map(periodRow => { const periodId = row(periodRow).id; const periodDate = String(row(periodRow).period_date); const pepItem = pepHistory.find(item => String(item.reporting_period_id) === String(periodId)) ?? historicalPepAsp[periodDate] ?? {}; const productionItem = historyProduction.find(item => String(item.reporting_period_id) === String(periodId)); const monthlyOil = productionItem ? Number(productionItem.net_oil_m3) || 0 : null; const pepValue = pepItem.pep_quantity_tonne == null ? null : Number(pepItem.pep_quantity_tonne); const afterPep = monthlyOil == null || pepValue == null ? null : monthlyOil - pepValue; const asp = afterPep == null || pepItem.asp_rate == null ? null : afterPep * Number(pepItem.asp_rate); const totalTake = pepValue == null || asp == null ? null : pepValue + asp; return { periodId, period: periodLabel(periodId), monthly_oil: monthlyOil, pep: pepValue, after_pep: afterPep, asp, total_take: totalTake } })
  if (pepRows.length) { const sumPep = (key: string) => pepRows.reduce((sum, item) => sum + (Number(item[key]) || 0), 0); const totals = { period: 'Total', monthly_oil: sumPep('monthly_oil'), pep: sumPep('pep'), after_pep: sumPep('after_pep'), asp: sumPep('asp'), total_take: sumPep('total_take') }; objectTable(['Period', 'Monthly Oil Production (m³)', 'Pre-existing Production (PEP) (m³)', 'Net Oil Production After PEP (m³)', 'Albpetrol Share of Production (ASP) (m³)', 'Total Albpetrol Take (PEP & ASP) (m³)'], [...pepRows, totals], ['period', 'monthly_oil', 'pep', 'after_pep', 'asp', 'total_take'], [25, 28, 29, 29, 34, 29], true) }
  else pdfLines(pdf, 'No PEP / ASP data reported.', page)

  startOperationalSection('3', 'Facilities Construction')
  const facilities = row(report.facilities)
  addSubsection('3.1', 'Civil & General Activity')
  pdfLines(pdf, narrativeText(facilities.civil_general_activity), page)
  addSubsection('3.2', 'Mechanical')
  pdfLines(pdf, narrativeText(facilities.mechanical), page)
  addSubsection('3.3', 'Electrical')
  pdfLines(pdf, narrativeText(facilities.electrical), page)

  startOperationalSection('4', 'Drilling')
  addSubsection('4.1', 'Drilling Program')
  const drillingRows = report.drilling.map(item => row(item))
  if (drillingRows.length) {
    objectTable(['Rig', 'Well', 'Primary Target', 'Operation', 'Northing (m)', 'Easting (m)', 'Final Depth MD (m)'], drillingRows, ['rig', 'well', 'primary_target', 'operation', 'northing', 'easting', 'final_depth_md'], [22, 25, 32, 32, 21, 21, 21])
    addSubsection('4.2', 'Drill Times')
    const drillDays = (item: Row) => { const start = Date.parse(String(item.spud_at ?? '')); const end = Date.parse(String(item.rig_release_at ?? '')); return Number.isFinite(start) && Number.isFinite(end) ? (end - start) / 86400000 : null }
    const times = drillingRows.map(item => ({ rig: item.rig, well: item.well, spud: item.spud_at, release: item.rig_release_at, days: drillDays(item) }))
    const averageDays = times.filter(item => item.days != null).reduce((sum, item) => sum + (item.days ?? 0), 0) / Math.max(times.filter(item => item.days != null).length, 1)
    objectTable(['Rig', 'Well', 'Spud', 'Rig Release', 'Days'], times, ['rig', 'well', 'spud', 'release', 'days'], [28, 30, 38, 38, 40])
    objectTable(['Summary', 'Value'], [{ summary: 'Average – Spud to RR (Drill)', value: averageDays }, { summary: 'Average – RR to Spud (Move)', value: 0 }, { summary: 'Average – RR to RR (Total Days)', value: averageDays }], ['summary', 'value'], [140, 34])
    if (times.some(item => item.days != null)) {
      if (page.y > 220) { pdf.addPage(); page.y = 22 }
      const chartX = 24; const chartY = page.y + 8; const chartW = 162; const chartH = 48; const maxDays = Math.max(...times.map(item => item.days ?? 0), 1); const barW = Math.min(24, (chartW - 8) / times.length - 5)
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(25, 25, 25); pdf.text('Figure 4.2.1 Production – Wells Drilled', chartX, page.y); pdf.setDrawColor(190, 195, 200); pdf.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH)
      times.forEach((item, index) => { const height = ((item.days ?? 0) / maxDays) * (chartH - 8); const x = chartX + 4 + index * ((chartW - 8) / times.length); pdf.setFillColor(78, 79, 84); pdf.rect(x, chartY + chartH - height, barW, height, 'F'); pdf.setTextColor(25, 25, 25); pdf.setFontSize(7); pdf.text(number(item.days, 1), x + barW / 2, chartY + chartH - height - 2, { align: 'center' }); pdf.setTextColor(107, 114, 128); pdf.text(text(item.well), x + barW / 2, chartY + chartH + 5, { align: 'center' }) })
      page.y = chartY + chartH + 12
    }
  } else pdfLines(pdf, 'No drilling wells reported.', page)

  pdf.setPage(tocPage); page.y = 25; pdfHeading(pdf, 'List of Contents', page)
  toc.forEach(([title, pageNumber]) => {
    const isSection = /^(?:1\.\d|[2-5])\s/.test(title)
    const rowHeight = isSection ? 7 : 5
    if (page.y + rowHeight > 278) { pdf.setPage(tocContinuationPage); page.y = 25; pdfHeading(pdf, 'List of Contents (continued)', page) }
    pdf.setFont('helvetica', isSection ? 'bold' : 'normal'); pdf.setFontSize(isSection ? 10 : 8.5)
    const x = isSection ? 20 : 26; pdf.text(title, x, page.y); pdf.text(String(pageNumber), 190, page.y, { align: 'right' }); page.y += rowHeight
  })
  const pages = pdf.getNumberOfPages()
  for (let index = 1; index <= pages; index += 1) { if (index === 1) continue; pdf.setPage(index); pdf.setFontSize(8); pdf.setTextColor(107, 107, 107); pdf.text('Monthly Progress Report · ' + period + ' · Page ' + index + ' of ' + pages, 20, 290) }
  pdf.save('Monthly_Progress_Report_' + period + '.pdf')
}
function addSheet(workbook: XLSX.WorkBook, name: string, rows: unknown[][], widths?: number[]) { const sheet = XLSX.utils.aoa_to_sheet(rows); if (widths) sheet['!cols'] = widths.map(width => ({ wch: width })); XLSX.utils.book_append_sheet(workbook, sheet, name) }
async function exportWorkingWorkbook(report: ReportData, periodDate: string) { const XLSX = await import('xlsx'); const workbook = XLSX.utils.book_new(); const period = filenamePeriod(periodDate); const production = row(report.production); const plan = row(report.plan); addSheet(workbook, 'Summary', [['PATOS-MARINZA DEVELOPMENT PROJECT'],['MONTHLY PROGRESS REPORT'],['Reporting Period', period],['Report Status','DRAFT'],[],['This workbook is an exported representation of current working SaaS data.']], [45, 30]); const typeById = new Map(report.hseTypes.map(item => [String(row(item).id), text(row(item).name)])); addSheet(workbook, 'H&S', [['1.1 HSSC&E Incident Overview'],['Incident','This Month'],...report.hseIncidents.map(item => { const itemRow=row(item); return [typeById.get(String(itemRow.incident_type_id)) ?? 'Incident', itemRow.incident_count]})],[42,18]); addSheet(workbook, 'Production', [['2.2 Production Figures'],['Production item','Unit','This Month'],['Net Oil','tonne**',production.net_oil_tonne],['Net Oil','m³',production.net_oil_m3],['Net Oil','Bbl',production.net_oil_bbl],['Water','m³',production.water_m3],['Sand','m³',production.sand_m3],['Gas','m³',production.gas_nm3],['Days on Prod.','',production.days_on_production],['Oil Forecast','Bbl',plan.oil_forecast_bbl]],[28,14,20]); addSheet(workbook, 'Inv-Sales-PEP', [['3. Inventory / Activities / Sales / PEP'],[],['Crude Oil Inventory'],['Location','Quantity (m³)'],...report.inventory.map(item=>[row(item).location,row(item).quantity_m3]),[],['Sales Deliveries'],['Type','Net Oil (Bbl)'],...report.sales.map(item=>[row(item).delivery_type,row(item).net_oil_bbl]),[],['PEP'],['PEP quantity (tonne)',row(report.pep).pep_quantity_tonne]],[30,22]); const facilities=row(report.facilities); addSheet(workbook,'Facilities',[['4. Facilities Construction'],['3.1 Civil & General Activity',narrativeText(facilities.civil_general_activity)],['3.2 Mechanical',narrativeText(facilities.mechanical)],['3.3 Electrical',narrativeText(facilities.electrical)]],[32,100]); addSheet(workbook,'Drilling',[['5. Drilling'],['Rig','Well','Primary Target','Operation','Northing (m)','Easting (m)','Final Depth MD (m)'],...report.drilling.map(item=>{const itemRow=row(item);return [itemRow.rig,itemRow.well,itemRow.primary_target,itemRow.operation,itemRow.northing,itemRow.easting,itemRow.final_depth_md]})],[15,18,22,20,18,18,22]); const output=XLSX.write(workbook,{bookType:'xlsx',type:'array'}); save(output,`Monthly_Progress_Report_${period}_DRAFT.xlsx`,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') }

export async function exportAnalyticsWorkbook(metric: AnalyticsMetric, points: TrendPoint[], source = 'Live operational data') { const XLSX = await import('xlsx'); const workbook=XLSX.utils.book_new(); const output=[['MANAGEMENT ANALYTICS EXPORT'],['Domain',metric.domain],['Metric',metric.label],['Unit',metric.unit],['Source',source],[],['Reporting Period','Actual','Plan','Variance']]; points.forEach(point=>output.push([point.periodDate,point.value,point.plan,point.value == null || point.plan == null ? null : point.value-point.plan])); addSheet(workbook,'Analytics',output,[18,18,18,18]); save(XLSX.write(workbook,{bookType:'xlsx',type:'array'}),`Management_Analytics_${metric.id}.xlsx`,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') }
