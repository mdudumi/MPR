import type { SectionStatus } from '../types/reporting'
export function StatusBadge({ status }: { status: SectionStatus | 'OPEN' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'FINALIZED' | 'CLOSED' | 'COMPLETE' }) { return <span className={`status status-${status.toLowerCase().replace(/_/g, '-')}`}>{status.replace(/_/g, ' ')}</span> }
