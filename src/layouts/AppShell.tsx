import { useEffect } from 'react'
import { BarChart3, Building2, ChevronDown, FileText, Gauge, LogOut, Settings, TableProperties, UsersRound, Wrench } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ReportingMonthSelector } from '../components/ReportingMonthSelector'

const navItems = [
  ['/dashboard', 'Dashboard', Gauge], ['/management/history', 'Historical Analysis', BarChart3], ['/monthly-progress-report', 'Monthly Report', FileText], ['/health-safety', 'HSSC&E Summary', UsersRound], ['/health-safety/narrative', 'Health & Safety', FileText], ['/security', 'Security', UsersRound], ['/environment', 'Environment', UsersRound], ['/csr', 'CSR', UsersRound], ['/production', 'Production', BarChart3], ['/inventory-sales-pep', 'Inventory / Sales / PEP', TableProperties], ['/facilities', 'Facilities', Wrench], ['/drilling', 'Drilling', Building2], ['/reports', 'Management Reporting', FileText], ['/administration', 'Administration', Settings],
] as const
export function AppShell() {
  useEffect(() => {
    const enhance = () => document.querySelectorAll<HTMLElement>('.table-section, .narrative-card, .production-subsection, .facilities-section').forEach(section => {
      if (section.dataset.sectionTools || (section.classList.contains('narrative-card') && section.closest('.facilities-section'))) return
      const title = section.querySelector<HTMLElement>('h2, h3')
      if (!title) return
      section.dataset.sectionTools = 'true'
      section.classList.add('section-collapsed')
      const titleText = title.textContent?.trim() ?? ''
      const editable = !!section.querySelector('input, textarea, [contenteditable="true"]') || /^2\.[34]\b/.test(titleText)
      if (!editable && !section.classList.contains('chart-section')) {
        section.classList.add('section-automatic')
        const automatic = document.createElement('span')
        automatic.className = 'section-automatic-label'
        automatic.textContent = 'Automatic'
        title.append(' ', automatic)
      }
      const toggle = document.createElement('button')
      toggle.type = 'button'; toggle.className = 'section-toggle'; toggle.textContent = 'Expand'
      toggle.onclick = () => { const collapsed = section.classList.toggle('section-collapsed'); toggle.textContent = collapsed ? 'Expand' : 'Collapse'; if (section.classList.contains('drilling-program-group')) section.querySelectorAll<HTMLElement>(':scope > .production-subsection').forEach(child => child.classList.toggle('section-collapsed', collapsed)) }
      title.append(' ', toggle)
      if (editable) {
        const save = document.createElement('button')
        save.type = 'button'; save.className = 'section-save'; save.textContent = 'Save section'
        const status = document.createElement('span'); status.className = 'section-save-status'
        save.onclick = () => { section.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-section-field], input, textarea, [contenteditable="true"]').forEach(field => field.blur()); const dedicated = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-section-save-for]')).find(button => button.dataset.sectionSaveFor?.split(',').map(value => value.trim()).includes(titleText)); if (dedicated && dedicated !== save) dedicated.click(); const nestedSaves = Array.from(section.querySelectorAll<HTMLButtonElement>('button')).filter(button => button !== save && /save/i.test(button.textContent ?? '')); nestedSaves.forEach(button => button.click()); status.textContent = 'Saving…'; window.setTimeout(() => { status.textContent = '' }, 1800) }
        title.append(' ', save, status)
      }
    })
    enhance()
    const observer = new MutationObserver(enhance)
    observer.observe(document.querySelector('.main-content') ?? document.body, { childList: true, subtree: true })
    const collapseForNewMonth = () => document.querySelectorAll<HTMLElement>('.table-section, .narrative-card, .production-subsection, .facilities-section').forEach(section => section.classList.add('section-collapsed'))
    window.addEventListener('reporting-month-changed', collapseForNewMonth)
    return () => { observer.disconnect(); window.removeEventListener('reporting-month-changed', collapseForNewMonth) }
  }, [])
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark">PM</span><div><strong>Patos-Marinza</strong><small>Monthly Progress Report</small></div></div><nav>{navItems.map(([to, label, Icon]) => <NavLink key={to} to={to} className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={18}/><span>{label}</span></NavLink>)}</nav><div className="sidebar-footer"><button className="user-button" onClick={() => supabase?.auth.signOut()}><LogOut size={17}/> Sign out</button></div></aside><div className="workspace"><header className="topbar"><div><p className="eyebrow">REPORTING CONTEXT</p><ReportingMonthSelector /></div><div className="period-state"><ChevronDown size={15}/> Monthly report workspace</div></header><main className="main-content"><Outlet /></main></div></div>
}
