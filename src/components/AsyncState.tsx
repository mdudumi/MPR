export function LoadingState({ label = 'Loading report information…' }: { label?: string }) { return <div className="state"><span className="spinner" />{label}</div> }
export function EmptyState({ title, detail }: { title: string; detail: string }) { return <div className="state empty"><h3>{title}</h3><p>{detail}</p></div> }
