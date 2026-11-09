import { useState } from 'react'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  async function signIn(event: React.FormEvent) {
    event.preventDefault(); if (!supabase) return
    setSubmitting(true); setMessage(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false); setMessage(error ? error.message : null)
  }
  return <main className="login-page"><section className="login-panel"><p className="eyebrow">PATOS-MARINZA DEVELOPMENT PROJECT</p><h1>Monthly Progress Report</h1><p className="muted">Sign in to prepare, review, and preserve official monthly operational reports.</p>
    {!isSupabaseConfigured ? <div className="notice error">Supabase is not configured. Copy <code>.env.example</code> to <code>.env.local</code>.</div> : <form onSubmit={signIn}><label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>{message && <div className="notice error">{message}</div>}<button className="button primary" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button></form>}
  </section></main>
}
