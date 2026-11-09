export type SectionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEWED' | 'LOCKED'

export interface ReportingPeriod {
  id: string
  period_date: string
  status: 'OPEN' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'FINALIZED' | 'CLOSED'
}

export interface ReportSection {
  id: string
  code: string
  name: string
  parent_code: string | null
  display_order: number
}

export interface SectionStatusRow {
  report_section_id: string
  status: SectionStatus
}
