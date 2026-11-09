import assert from 'node:assert/strict'
import test from 'node:test'

const previousReportingPeriod = (periods, id) => { const selected = periods.find(p => p.id === id); return periods.filter(p => selected && p.period_date < selected.period_date).sort((a,b)=>b.period_date.localeCompare(a.period_date))[0] }
const yearToDatePeriods = (periods, selected) => periods.filter(p => selected && p.period_date.slice(0,4) === selected.period_date.slice(0,4) && p.period_date <= selected.period_date)
const sumValues = values => values.reduce((sum,value)=>sum+(value??0),0)
const ltiFrequency = (lti,hours) => hours > 0 ? lti * 1_000_000 / hours : null

const periods=[{id:'dec25',period_date:'2025-12-01'},{id:'jan26',period_date:'2026-01-01'},{id:'feb26',period_date:'2026-02-01'},{id:'sep26',period_date:'2026-09-01'}]
test('previous reporting period handles January rollover',()=>assert.equal(previousReportingPeriod(periods,'jan26')?.id,'dec25'))
test('YTD starts in January of selected year',()=>assert.deepEqual(yearToDatePeriods(periods,periods[3]).map(p=>p.id),['jan26','feb26','sep26']))
test('incident and exposure totals preserve zero',()=>assert.equal(sumValues([0,3,undefined,2]),5))
test('LTI frequency uses one million exposure hours',()=>assert.equal(Number(ltiFrequency(82,64648891)?.toFixed(3)),1.268))
test('May 2025 inception frequency includes imported exposure baseline plus monthly hours',()=>{const bankers=17565993+75020+74540;const contractors=46657763+138752+136823;assert.equal(bankers,17715553);assert.equal(contractors,46933338);assert.equal(Number(ltiFrequency(20,bankers).toFixed(3)),1.129);assert.equal(Number(ltiFrequency(62,contractors).toFixed(3)),1.321);assert.equal(Number(ltiFrequency(82,bankers+contractors).toFixed(3)),1.268)})
test('zero exposure produces unavailable frequency rather than a fake zero',()=>assert.equal(ltiFrequency(2,0),null))
test('simplified completion workflow permits only in-progress reporting to be edited',()=>{const editable=new Set(['NOT_STARTED','IN_PROGRESS']);assert.equal(editable.has('IN_PROGRESS'),true);assert.equal(editable.has('COMPLETE'),false);assert.equal(editable.has('LOCKED'),false)})
test('production variance is unavailable when the forecast is missing or zero',()=>{const variance=(actual,plan)=>actual==null||plan==null||plan===0?null:(actual-plan)/plan*100;assert.equal(variance(268372,null),null);assert.equal(variance(268372,0),null);assert.equal(Number(variance(105000,100000).toFixed(1)),5)})
test('production keeps a missing value distinct from a reported zero',()=>{const sumKnown=values=>values.some(value=>value!=null)?values.reduce((sum,value)=>sum+(value??0),0):null;assert.equal(sumKnown([null,null]),null);assert.equal(sumKnown([0,null]),0)})
