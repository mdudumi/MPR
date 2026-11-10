export const incidentRows = [
  ['BANKERS_LTI', 'Bankers Lost Time Incident'], ['CONTRACTOR_LTI', 'Contractor Lost Time Incident'], ['RESTRICTED_WORK_CASE', 'Restricted Work Case'], ['PERSONNEL_INJURY_FA', 'Personnel Injury FA'], ['PERSONNEL_INJURY_MT', 'Personnel Injury MT'], ['PROPERTY_DAMAGE', 'Property Damage'], ['NEAR_MISS', 'Near Miss'], ['ENVIRONMENTAL', 'Environmental'], ['SECURITY', 'Security'], ['MOTOR_VEHICLE_ACCIDENTS', 'Motor Vehicle Accidents'], ['FATALITY', 'Fatality'], ['FIRES', 'Fires'], ['NON_TABULATED', 'Non Tabulated'],
] as const
export const recordableCodes = new Set(['BANKERS_LTI', 'CONTRACTOR_LTI', 'RESTRICTED_WORK_CASE', 'PERSONNEL_INJURY_FA', 'PERSONNEL_INJURY_MT'])
export type IncidentType = { id: string; code: string; name: string; display_order: number; inception_baseline: number; is_recordable?: boolean }
export const total = (values: Record<string, number>, codes: readonly string[] = incidentRows.map(([code]) => code)) => codes.reduce((sum, code) => sum + (values[code] ?? 0), 0)
export const numberText = (value: number, decimals = 0) => new Intl.NumberFormat('en-GB', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(value)
