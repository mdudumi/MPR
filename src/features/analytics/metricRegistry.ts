export type AnalyticsMetricId = 'OIL_BBL' | 'HSE_INCIDENTS' | 'CRUDE_INVENTORY_M3' | 'SALES_BBL' | 'PEP_TONNE'
export type AnalyticsMetric = { id: AnalyticsMetricId; label: string; domain: string; unit: string; aggregation: 'SUM' | 'LAST_VALUE'; supportsPlan: boolean }

/** Presentation definitions only. Operational values remain in their owning tables. */
export const analyticsMetrics: AnalyticsMetric[] = [
  { id: 'OIL_BBL', label: 'Oil Production', domain: 'Production', unit: 'Bbl', aggregation: 'SUM', supportsPlan: true },
  { id: 'HSE_INCIDENTS', label: 'HSSC&E Incidents', domain: 'HSSC&E', unit: 'count', aggregation: 'SUM', supportsPlan: false },
  { id: 'CRUDE_INVENTORY_M3', label: 'Crude Oil Inventory', domain: 'Inventory', unit: 'm³', aggregation: 'LAST_VALUE', supportsPlan: false },
  { id: 'SALES_BBL', label: 'Sales Deliveries', domain: 'Sales', unit: 'Bbl', aggregation: 'SUM', supportsPlan: false },
  { id: 'PEP_TONNE', label: 'PEP', domain: 'PEP', unit: 'tonne', aggregation: 'SUM', supportsPlan: false },
]
export const metricById = (id: AnalyticsMetricId) => analyticsMetrics.find(metric => metric.id === id)!
