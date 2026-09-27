import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  Bell,
  Bookmark,
  BookmarkCheck,
  Bot,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Compass,
  Filter,
  GraduationCap,
  Heart,
  Lightbulb,
  MapPin,
  Menu,
  Mic,
  PenLine,
  Search,
  Send,
  Sparkles,
  SlidersHorizontal,
  Target,
  Trophy,
  UserRound,
  X,
  Zap,
} from 'lucide-react'
import { blankProfile, categories, demoProfile, modes, opportunities, type Category, type Mode, type Opportunity, type Profile } from './data'
import { explainMatch, getMatch, type MatchBreakdown } from './engine'

type View = 'landing' | 'onboarding' | 'app'
type Tab = 'dashboard' | 'discover' | 'saved' | 'copilot' | 'profile'
type Toast = { message: string; tone?: 'success' | 'info' }

const storageKeys = { profile: 'pathfinder-profile', saved: 'pathfinder-saved', onboarded: 'pathfinder-onboarded' }

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

function formatDeadline(date: string) {
  return new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T12:00:00`))
}

function daysUntil(date: string) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const target = new Date(`${date}T12:00:00`)
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime()
  return Math.ceil((targetDay - today) / 86400000)
}

function deadlineLabel(date: string) {
  const days = daysUntil(date)
  if (days < 0) return 'Closed'
  if (days === 0) return 'Closing today'
  if (days === 1) return 'Closing tomorrow'
  if (days <= 3) return 'Closing soon'
  if (days <= 7) return 'This week'
  return 'Upcoming'
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'PF'
}

function App() {
  const [view, setView] = useState<View>(() => readStorage(storageKeys.onboarded, false) ? 'app' : 'landing')
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [profile, setProfile] = useState<Profile>(() => readStorage(storageKeys.profile, blankProfile))
  const [savedIds, setSavedIds] = useState<string[]>(() => readStorage(storageKeys.saved, []))
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(storageKeys.profile, JSON.stringify(profile))
  }, [profile])

  useEffect(() => {
    localStorage.setItem(storageKeys.saved, JSON.stringify(savedIds))
  }, [savedIds])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const matches = useMemo(() => opportunities.map((opportunity) => ({ opportunity, match: getMatch(opportunity, profile) })), [profile])
  const saved = useMemo(() => matches.filter(({ opportunity }) => savedIds.includes(opportunity.id)), [matches, savedIds])

  const showToast = (message: string, tone: Toast['tone'] = 'success') => setToast({ message, tone })
  const toggleSaved = (id: string) => {
    setSavedIds((current) => {
      const alreadySaved = current.includes(id)
      showToast(alreadySaved ? 'Removed from your saved list' : 'Saved to your opportunity board', alreadySaved ? 'info' : 'success')
      return alreadySaved ? current.filter((savedId) => savedId !== id) : [...current, id]
    })
  }
  const enterDemo = () => {
    setProfile(demoProfile)
    localStorage.setItem(storageKeys.onboarded, 'true')
    setView('app')
    setActiveTab('dashboard')
    showToast('Demo profile loaded — your path is ready')
  }
  const startOnboarding = () => {
    setView('onboarding')
    setMobileMenuOpen(false)
  }
  const finishOnboarding = (nextProfile: Profile) => {
    setProfile(nextProfile)
    localStorage.setItem(storageKeys.onboarded, 'true')
    setView('app')
    setActiveTab('dashboard')
    showToast(`Welcome, ${nextProfile.name.split(' ')[0] || 'explorer'} — your matches are ready`)
  }
  const saveProfile = (nextProfile: Profile) => {
    setProfile(nextProfile)
    showToast('Profile updated — your matches have been recalculated')
  }
  const navigate = (tab: Tab) => {
    setActiveTab(tab)
    setView('app')
    setMobileMenuOpen(false)
  }

  if (view === 'landing') {
    return <Landing onDemo={enterDemo} onStart={startOnboarding} />
  }

  if (view === 'onboarding') {
    return <Onboarding initialProfile={profile} onBack={() => setView('landing')} onComplete={finishOnboarding} />
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand brand-sidebar" onClick={() => navigate('dashboard')} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && navigate('dashboard')}>
          <span className="brand-mark"><Compass size={19} strokeWidth={2.5} /></span>
          <span>pathfinder<span className="brand-ai">.ai</span></span>
        </div>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          <NavItem icon={<BarChart3 size={18} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => navigate('dashboard')} />
          <NavItem icon={<Compass size={18} />} label="Discover" active={activeTab === 'discover'} onClick={() => navigate('discover')} />
          <NavItem icon={<Bookmark size={18} />} label="Saved" count={savedIds.length} active={activeTab === 'saved'} onClick={() => navigate('saved')} />
          <NavItem icon={<Bot size={18} />} label="Copilot" active={activeTab === 'copilot'} onClick={() => navigate('copilot')} />
        </nav>
        <div className="sidebar-bottom">
          <button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => navigate('profile')}>
            <span className="nav-icon"><UserRound size={18} /></span><span>My profile</span>
          </button>
          <div className="sidebar-tip">
            <div className="tip-icon"><Sparkles size={16} /></div>
            <div><strong>Make your profile work</strong><span>Complete it for sharper matches.</span></div>
          </div>
        </div>
      </aside>
      {mobileMenuOpen && <button className="mobile-overlay" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} />}
      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileMenuOpen(true)}><Menu size={21} /></button>
          <div className="crumb">{activeTab === 'dashboard' ? 'Overview' : activeTab[0].toUpperCase() + activeTab.slice(1)}</div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Notifications"><Bell size={18} /><span className="notification-dot" /></button>
            <button className="user-chip" onClick={() => navigate('profile')}><span className="avatar avatar-small">{initials(profile.name)}</span><span className="user-chip-name">{profile.name || 'Your profile'}</span><ChevronDown size={14} /></button>
          </div>
        </header>
        <div className="page-wrap">
          {activeTab === 'dashboard' && <Dashboard profile={profile} matches={matches} savedIds={savedIds} onExplore={() => navigate('discover')} onSelect={setSelectedOpportunity} onSave={toggleSaved} />}
          {activeTab === 'discover' && <Discover matches={matches} savedIds={savedIds} onSelect={setSelectedOpportunity} onSave={toggleSaved} />}
          {activeTab === 'saved' && <Saved matches={saved} savedIds={savedIds} onSelect={setSelectedOpportunity} onSave={toggleSaved} onExplore={() => navigate('discover')} />}
          {activeTab === 'copilot' && <Copilot profile={profile} matches={matches} onSelect={setSelectedOpportunity} onSave={toggleSaved} />}
          {activeTab === 'profile' && <ProfilePage profile={profile} onSave={saveProfile} />}
        </div>
      </main>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <NavItem icon={<BarChart3 size={19} />} label="Home" active={activeTab === 'dashboard'} onClick={() => navigate('dashboard')} />
        <NavItem icon={<Compass size={19} />} label="Discover" active={activeTab === 'discover'} onClick={() => navigate('discover')} />
        <NavItem icon={<Bookmark size={19} />} label="Saved" active={activeTab === 'saved'} onClick={() => navigate('saved')} />
        <NavItem icon={<Bot size={19} />} label="Copilot" active={activeTab === 'copilot'} onClick={() => navigate('copilot')} />
        <NavItem icon={<UserRound size={19} />} label="Profile" active={activeTab === 'profile'} onClick={() => navigate('profile')} />
      </nav>
      {selectedOpportunity && <OpportunityModal opportunity={selectedOpportunity} match={getMatch(selectedOpportunity, profile)} saved={savedIds.includes(selectedOpportunity.id)} onSave={() => toggleSaved(selectedOpportunity.id)} onClose={() => setSelectedOpportunity(null)} />}
      {toast && <div className={`toast toast-${toast.tone || 'success'}`} role="status"><span className="toast-check">{toast.tone === 'info' ? <Bookmark size={14} /> : <Check size={14} />}</span>{toast.message}</div>}
    </div>
  )
}

function Landing({ onDemo, onStart }: { onDemo: () => void; onStart: () => void }) {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="brand"><span className="brand-mark"><Compass size={19} strokeWidth={2.5} /></span><span>pathfinder<span className="brand-ai">.ai</span></span></div>
        <div className="landing-nav-right"><span className="seed-pill"><span className="pulse-dot" /> Demo data, real direction</span><button className="text-button" onClick={onDemo}>Open demo <ArrowRight size={15} /></button></div>
      </header>
      <main className="landing-main">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> FIT FEST HACKATHON 2026 <span className="eyebrow-line" /></div>
          <h1>Don't search for<br /><em>opportunities.</em><br />Let them find you.</h1>
          <p className="hero-subtitle">A personal discovery engine for the internships, hackathons, scholarships, and experiences that fit <strong>your</strong> next move.</p>
          <div className="hero-actions"><button className="button button-primary button-large" onClick={onStart}>Find my opportunities <ArrowRight size={17} /></button><button className="button button-ghost button-large" onClick={onDemo}><Sparkles size={16} /> Try demo</button></div>
          <div className="hero-proof"><div className="proof-avatars"><span>AS</span><span>MK</span><span>RN</span><span>+</span></div><span>Built for students who are ready to be surprised.</span></div>
        </div>
        <div className="hero-visual" aria-label="Preview of the PathFinder dashboard">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="preview-window">
            <div className="preview-top"><span className="preview-dots"><i /><i /><i /></span><span>pathfinder.ai / your-path</span><span className="preview-live">LIVE PREVIEW</span></div>
            <div className="preview-body"><div className="preview-greeting"><div><span className="preview-overline">TUESDAY, SEPTEMBER 29</span><h3>Good morning, Aarav <span>✦</span></h3><p>Three paths worth your attention today.</p></div><span className="avatar">AS</span></div>
              <div className="preview-metrics"><div><span>OPPORTUNITIES</span><strong>24</strong><small>in your orbit</small></div><div><span>AVG. MATCH</span><strong className="lime-text">86%</strong><small>up from last week</small></div><div><span>SAVED</span><strong>06</strong><small>keep exploring</small></div></div>
              <div className="preview-list"><PreviewOpportunity title="Applied AI Product Internship" org="Northstar Labs · Hybrid" score="92%" color="violet" /><PreviewOpportunity title="Build for Bharat Hackathon" org="CivicStack · Remote" score="88%" color="teal" /><PreviewOpportunity title="Machine Learning Foundations" org="LearnLab · Remote" score="84%" color="orange" /></div>
            </div>
          </div>
          <div className="floating-match"><div className="floating-ring">92<span>%</span></div><div><strong>Strong match</strong><span>for your path</span></div><Sparkles size={17} /></div>
          <div className="floating-copilot"><span className="copilot-mini"><Bot size={16} /></span><span><strong>Ask your Copilot</strong><small>“Find remote AI roles”</small></span><ArrowRight size={15} /></div>
        </div>
      </main>
      <div className="landing-bottom"><span>ONE PROFILE. A CLEARER PATH.</span><span>PERSONALIZED DISCOVERY ENGINE <ArrowRight size={13} /></span><span>EXPLAINABLE MATCHES <ArrowRight size={13} /></span></div>
    </div>
  )
}

function PreviewOpportunity({ title, org, score, color }: { title: string; org: string; score: string; color: string }) {
  return <div className="preview-opportunity"><span className={`preview-logo ${color}`}>{title[0]}</span><div><strong>{title}</strong><small>{org}</small></div><span className="preview-score">{score}</span><ChevronRight size={14} /></div>
}

function Onboarding({ initialProfile, onBack, onComplete }: { initialProfile: Profile; onBack: () => void; onComplete: (profile: Profile) => void }) {
  const [form, setForm] = useState<Profile>(initialProfile.name ? initialProfile : blankProfile)
  const [step, setStep] = useState(1)
  const update = <K extends keyof Profile>(key: K, value: Profile[K]) => setForm((current) => ({ ...current, [key]: value }))
  const toggleArray = (key: 'categories', value: Category) => setForm((current) => ({ ...current, [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value] }))
  const parseTags = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean)
  return (
    <div className="onboarding-shell">
      <header className="onboarding-nav"><button className="back-link" onClick={onBack}><span className="brand-mark"><Compass size={18} /></span><span>pathfinder<span className="brand-ai">.ai</span></span></button><span className="onboarding-save">No login required <span className="save-dot" /> Saved on this device</span></header>
      <main className="onboarding-main"><div className="onboarding-intro"><span className="eyebrow eyebrow-dark"><span className="eyebrow-line" /> YOUR OPPORTUNITY DNA</span><h1>Let’s make the search<br /><em>feel like you.</em></h1><p>Tell us a little about where you are and where you want to go. We’ll do the sorting.</p></div>
        <div className="onboarding-card"><div className="stepper"><div className={`step ${step >= 1 ? 'step-current' : ''}`}><span>01</span><div><strong>About you</strong><small>Start with the basics</small></div></div><div className="step-line" /><div className={`step ${step >= 2 ? 'step-current' : ''}`}><span>02</span><div><strong>Your direction</strong><small>Shape your matches</small></div></div></div>
          {step === 1 ? <div className="form-step"><div className="form-heading"><span className="section-kicker">THE BASICS</span><h2>Who’s behind the path?</h2><p>We use this to make sure opportunities are actually open to you.</p></div><div className="form-grid"><Field label="Your name" placeholder="e.g. Aarav Sharma" value={form.name} onChange={(value) => update('name', value)} /><Field label="Current education" type="select" value={form.education} onChange={(value) => update('education', value)} options={['High School', 'Undergraduate', 'Postgraduate', 'Recent Graduate']} /><Field label="Stream / degree" placeholder="e.g. Computer Science" value={form.stream} onChange={(value) => update('stream', value)} /><Field label="Where are you based?" placeholder="e.g. Pune, Maharashtra" value={form.location} onChange={(value) => update('location', value)} /><Field label="Your experience level" type="select" value={form.experience} onChange={(value) => update('experience', value)} options={['Beginner', 'Intermediate', 'Advanced']} /><Field label="Work preference" type="select" value={form.mode} onChange={(value) => update('mode', value as Mode | 'Any')} options={modes} /></div><div className="form-footer"><span className="required-note"><span>*</span> All fields help us match better</span><button className="button button-dark" onClick={() => setStep(2)} disabled={!form.name || !form.education || !form.location}>Continue <ArrowRight size={16} /></button></div></div>
            : <div className="form-step"><div className="form-heading"><button className="back-step" onClick={() => setStep(1)}><ArrowRight size={14} /> Back to basics</button><span className="section-kicker">YOUR DIRECTION</span><h2>What should find you?</h2><p>Choose what you’d genuinely make time for. You can always change this later.</p></div><div className="tag-field-group"><label>Skills <span>Separate with commas</span></label><input className="input" placeholder="e.g. Python, Figma, Public speaking" value={form.skills.join(', ')} onChange={(event) => update('skills', parseTags(event.target.value))} /><div className="suggestion-row">{['Python', 'JavaScript', 'UI/UX', 'Research'].map((skill) => <button key={skill} className={`suggestion ${form.skills.includes(skill) ? 'selected' : ''}`} onClick={() => update('skills', form.skills.includes(skill) ? form.skills.filter((item) => item !== skill) : [...form.skills, skill])}>{form.skills.includes(skill) && <Check size={12} />}{skill}</button>)}</div></div><div className="tag-field-group"><label>Interests <span>Topics you want to explore</span></label><input className="input" placeholder="e.g. AI, Climate, Startups" value={form.interests.join(', ')} onChange={(event) => update('interests', parseTags(event.target.value))} /></div><div className="tag-field-group"><label>Opportunity categories <span>Pick at least one</span></label><div className="category-select-grid">{categories.map((category) => <button key={category} className={`category-option ${form.categories.includes(category) ? 'selected' : ''}`} onClick={() => toggleArray('categories', category)}><span className="category-option-check">{form.categories.includes(category) ? <Check size={13} /> : null}</span>{category}</button>)}</div></div><div className="form-footer"><span className="required-note"><Sparkles size={14} /> Your matches update as you edit</span><button className="button button-dark" onClick={() => onComplete(form)} disabled={form.categories.length === 0}>See my opportunities <ArrowRight size={16} /></button></div></div>}
        </div>
      </main>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', options = [] }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: 'text' | 'select'; options?: string[] }) {
  return <label className="field"><span>{label}</span>{type === 'select' ? <span className="select-wrap"><select value={value} onChange={(event) => onChange(event.target.value)}><option value="">Select one</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select><ChevronDown size={15} /></span> : <input className="input" placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />}</label>
}

function Dashboard({ profile, matches, savedIds, onExplore, onSelect, onSave }: { profile: Profile; matches: Array<{ opportunity: Opportunity; match: MatchBreakdown }>; savedIds: string[]; onExplore: () => void; onSelect: (opportunity: Opportunity) => void; onSave: (id: string) => void }) {
  const ranked = [...matches].sort((a, b) => b.match.score - a.match.score)
  const closing = [...matches].filter(({ opportunity }) => daysUntil(opportunity.deadline) >= 0 && daysUntil(opportunity.deadline) <= 7).sort((a, b) => daysUntil(a.opportunity.deadline) - daysUntil(b.opportunity.deadline))
  const completion = [profile.name, profile.education, profile.stream, profile.location, profile.skills.length, profile.interests.length, profile.categories.length, profile.mode !== 'Any'].filter(Boolean).length / 8 * 100
  const firstName = profile.name.split(' ')[0] || 'Explorer'
  return <div className="dashboard-page"><div className="page-intro"><div><span className="eyebrow eyebrow-dark"><span className="eyebrow-line" /> YOUR DAILY BRIEF</span><h1>Good morning, {firstName} <span className="title-spark">✦</span></h1><p>Three high-signal paths worth your attention today.</p></div><button className="button button-outline" onClick={onExplore}><Compass size={16} /> Explore all <span className="button-count">{opportunities.length}</span></button></div>
    <div className="notice-banner"><span className="notice-icon"><Sparkles size={16} /></span><div><strong>Your path is getting clearer.</strong><span>Complete your profile to unlock even more relevant opportunities.</span></div><div className="notice-progress"><span style={{ width: `${completion}%` }} /></div><strong className="notice-percent">{Math.round(completion)}%</strong><button className="notice-arrow" onClick={onExplore} aria-label="Improve profile"><ArrowRight size={17} /></button></div>
    <section className="stats-grid"><StatCard icon={<Target size={18} />} label="Opportunities for you" value={String(opportunities.length)} change="+8 this week" tone="teal" /><StatCard icon={<Zap size={18} />} label="Average match" value={`${Math.round(ranked.reduce((total, item) => total + item.match.score, 0) / ranked.length)}%`} change="Strong signal" tone="lime" /><StatCard icon={<Bookmark size={18} />} label="Saved to explore" value={String(savedIds.length).padStart(2, '0')} change="Keep building your list" tone="violet" /><StatCard icon={<Clock3 size={18} />} label="Closing this week" value={String(closing.length).padStart(2, '0')} change="Don’t miss your window" tone="orange" /></section>
    <div className="dashboard-columns"><section className="content-panel matches-panel"><PanelHeader title="Top matches" subtitle="Sorted by your personal fit" action="View all" onAction={onExplore} /><div className="opportunity-list">{ranked.slice(0, 4).map(({ opportunity, match }) => <OpportunityRow key={opportunity.id} opportunity={opportunity} match={match} saved={savedIds.includes(opportunity.id)} onSelect={onSelect} onSave={onSave} />)}</div></section><section className="content-panel closing-panel"><PanelHeader title="Closing soon" subtitle="Your next 7 days" action="Explore dates" onAction={onExplore} /><div className="closing-list">{closing.slice(0, 3).map(({ opportunity, match }) => <button className="closing-item" key={opportunity.id} onClick={() => onSelect(opportunity)}><span className="date-tile"><strong>{new Date(`${opportunity.deadline}T12:00:00`).getDate()}</strong><small>{new Date(`${opportunity.deadline}T12:00:00`).toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}</small></span><span className="closing-info"><strong>{opportunity.title}</strong><small>{opportunity.organization}</small></span><span className="mini-score">{match.score}%</span></button>)}</div>{closing.length === 0 && <EmptyState icon={<Clock3 />} title="A little breathing room" text="No opportunities close in the next 7 days." />}</section></div>
    <section className="insight-strip"><div className="insight-icon"><Lightbulb size={20} /></div><div><span className="section-kicker">A NOTE FROM YOUR PATHFINDER</span><p>You’re showing a strong signal for <strong>{profile.interests[0] || 'technology'}</strong> and <strong>{profile.categories[0] || 'hands-on opportunities'}</strong>. Keep following the work that feels like a “yes”.</p></div><ArrowRight size={18} /></section>
  </div>
}

function StatCard({ icon, label, value, change, tone }: { icon: React.ReactNode; label: string; value: string; change: string; tone: string }) {
  return <div className="stat-card"><span className={`stat-icon ${tone}`}>{icon}</span><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className="stat-change">{change}</span></div>
}

function PanelHeader({ title, subtitle, action, onAction }: { title: string; subtitle: string; action: string; onAction: () => void }) {
  return <div className="panel-header"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="panel-action" onClick={onAction}>{action} <ArrowRight size={14} /></button></div>
}

function OpportunityRow({ opportunity, match, saved, onSelect, onSave }: { opportunity: Opportunity; match: MatchBreakdown; saved: boolean; onSelect: (opportunity: Opportunity) => void; onSave: (id: string) => void }) {
  return <div className="opportunity-row"><button className="opportunity-main" onClick={() => onSelect(opportunity)}><span className={`org-logo logo-${opportunity.category.toLowerCase()}`}>{opportunity.organization.split(' ').map((word) => word[0]).slice(0, 2).join('')}</span><span className="opportunity-copy"><span className="opportunity-title">{opportunity.title}</span><span className="opportunity-meta">{opportunity.organization} <i /> {opportunity.mode} <i /> {deadlineLabel(opportunity.deadline)}</span></span><span className="match-pill"><strong>{match.score}%</strong><small>match</small></span></button><button className={`save-button ${saved ? 'saved' : ''}`} onClick={() => onSave(opportunity.id)} aria-label={saved ? `Unsave ${opportunity.title}` : `Save ${opportunity.title}`}>{saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}</button></div>
}

function Discover({ matches, savedIds, onSelect, onSave }: { matches: Array<{ opportunity: Opportunity; match: MatchBreakdown }>; savedIds: string[]; onSelect: (opportunity: Opportunity) => void; onSave: (id: string) => void }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All categories')
  const [location, setLocation] = useState('All locations')
  const [mode, setMode] = useState('All modes')
  const [sort, setSort] = useState<'match' | 'deadline'>('match')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [skill, setSkill] = useState('')
  const [education, setEducation] = useState('All education')
  const locations = ['All locations', ...Array.from(new Set(opportunities.map((item) => item.location)))]
  const skills = Array.from(new Set(opportunities.flatMap((item) => item.skills))).sort()
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return matches.filter(({ opportunity }) => {
      const haystack = [opportunity.title, opportunity.organization, opportunity.description, ...opportunity.tags, ...opportunity.skills].join(' ').toLowerCase()
      return (!term || haystack.includes(term)) && (category === 'All categories' || opportunity.category === category) && (location === 'All locations' || opportunity.location === location) && (mode === 'All modes' || opportunity.mode === mode) && (education === 'All education' || opportunity.education.includes(education)) && (!skill || opportunity.skills.includes(skill))
    }).sort((a, b) => sort === 'match' ? b.match.score - a.match.score : daysUntil(a.opportunity.deadline) - daysUntil(b.opportunity.deadline))
  }, [category, education, location, matches, mode, search, skill, sort])
  const clearFilters = () => { setSearch(''); setCategory('All categories'); setLocation('All locations'); setMode('All modes'); setEducation('All education'); setSkill('') }
  return <div className="discover-page"><div className="page-intro discover-intro"><div><span className="eyebrow eyebrow-dark"><span className="eyebrow-line" /> THE OPPORTUNITY BOARD</span><h1>Find your next <em>yes.</em></h1><p>{opportunities.length} seeded opportunities, ranked by your fit. Demo data for exploration — always verify details before applying.</p></div><span className="demo-label"><span className="pulse-dot" /> DEMO DATASET</span></div>
    <div className="search-bar-wrap"><Search size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search roles, skills, organizations..." aria-label="Search opportunities" /><kbd>⌘ K</kbd><button className={`filter-toggle ${filtersOpen ? 'active' : ''}`} onClick={() => setFiltersOpen((value) => !value)}><SlidersHorizontal size={16} /> Filters <span>{[category !== 'All categories', location !== 'All locations', mode !== 'All modes', education !== 'All education', Boolean(skill)].filter(Boolean).length || ''}</span></button></div>
    <div className={`filter-drawer ${filtersOpen ? 'open' : ''}`}><FilterSelect label="Category" value={category} options={['All categories', ...categories]} onChange={setCategory} /><FilterSelect label="Location" value={location} options={locations} onChange={setLocation} /><FilterSelect label="Mode" value={mode} options={['All modes', ...modes.filter((item) => item !== 'Any')]} onChange={setMode} /><FilterSelect label="Education" value={education} options={['All education', 'High School', 'Undergraduate', 'Postgraduate']} onChange={setEducation} /><FilterSelect label="Skill" value={skill || 'All skills'} options={['All skills', ...skills]} onChange={(value) => setSkill(value === 'All skills' ? '' : value)} /><button className="clear-filter" onClick={clearFilters}>Clear all</button></div>
    <div className="discover-toolbar"><span><strong>{filtered.length}</strong> opportunities found</span><div className="sort-control"><span>Sort by</span><button className={sort === 'match' ? 'active' : ''} onClick={() => setSort('match')}><Sparkles size={14} /> Best match</button><button className={sort === 'deadline' ? 'active' : ''} onClick={() => setSort('deadline')}><Clock3 size={14} /> Deadline</button></div></div>
    {filtered.length > 0 ? <div className="discover-grid">{filtered.map(({ opportunity, match }) => <OpportunityCard key={opportunity.id} opportunity={opportunity} match={match} saved={savedIds.includes(opportunity.id)} onSelect={onSelect} onSave={onSave} />)}</div> : <EmptyState icon={<Search />} title="No paths found" text="Try widening your filters or searching for a different skill." action="Clear filters" onAction={clearFilters} />}
  </div>
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="filter-select"><span>{label}</span><span className="select-wrap"><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={14} /></span></label>
}

function OpportunityCard({ opportunity, match, saved, onSelect, onSave }: { opportunity: Opportunity; match: MatchBreakdown; saved: boolean; onSelect: (opportunity: Opportunity) => void; onSave: (id: string) => void }) {
  return <article className="opportunity-card"><div className="card-topline"><span className={`category-label category-${opportunity.category.toLowerCase()}`}>{opportunity.category}</span><button className={`save-button ${saved ? 'saved' : ''}`} onClick={() => onSave(opportunity.id)} aria-label={saved ? `Unsave ${opportunity.title}` : `Save ${opportunity.title}`}>{saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}</button></div><button className="card-click-target" onClick={() => onSelect(opportunity)}><span className={`org-logo logo-${opportunity.category.toLowerCase()} large-logo`}>{opportunity.organization.split(' ').map((word) => word[0]).slice(0, 2).join('')}</span><h3>{opportunity.title}</h3><p className="card-org">{opportunity.organization}</p><p className="card-description">{opportunity.description}</p><div className="card-details"><span><MapPin size={14} /> {opportunity.location === 'Online' ? 'Online' : opportunity.location}</span><span><Clock3 size={14} /> {deadlineLabel(opportunity.deadline)}</span></div><div className="card-tags">{opportunity.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div></button><div className="card-footer"><span className="match-pill match-pill-large"><strong>{match.score}%</strong><small>match</small></span><button className="view-link" onClick={() => onSelect(opportunity)}>View opportunity <ArrowRight size={14} /></button></div></article>
}

function Saved({ matches, savedIds, onSelect, onSave, onExplore }: { matches: Array<{ opportunity: Opportunity; match: MatchBreakdown }>; savedIds: string[]; onSelect: (opportunity: Opportunity) => void; onSave: (id: string) => void; onExplore: () => void }) {
  return <div className="saved-page"><div className="page-intro"><div><span className="eyebrow eyebrow-dark"><span className="eyebrow-line" /> YOUR SHORTLIST</span><h1>Keep the good <em>ones</em> close.</h1><p>Your saved paths in one place, ready when you are.</p></div><span className="saved-count">{savedIds.length.toString().padStart(2, '0')} <small>saved</small></span></div>{matches.length ? <div className="saved-list">{matches.map(({ opportunity, match }) => <OpportunityRow key={opportunity.id} opportunity={opportunity} match={match} saved onSelect={onSelect} onSave={onSave} />)}</div> : <EmptyState icon={<Bookmark />} title="Your shortlist is waiting" text="Save opportunities that spark something. They’ll show up here." action="Explore opportunities" onAction={onExplore} />}</div>
}

function Copilot({ profile, matches, onSelect, onSave }: { profile: Profile; matches: Array<{ opportunity: Opportunity; match: MatchBreakdown }>; onSelect: (opportunity: Opportunity) => void; onSave: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'assistant'; text: string; items?: Array<{ opportunity: Opportunity; match: MatchBreakdown }> }>>([])
  const runQuery = (prompt: string) => {
    const trimmed = prompt.trim()
    if (!trimmed) return
    const lower = trimmed.toLowerCase()
    const wantsRemote = lower.includes('remote') || lower.includes('online')
    const wantsSoon = lower.includes('soon') || lower.includes('closing') || lower.includes('deadline')
    const requestedCategory = categories.find((category) => lower.includes(category.toLowerCase()))
    const requestedSkill = profile.skills.find((skill) => lower.includes(skill.toLowerCase())) || opportunities.flatMap((item) => item.skills).find((skill) => lower.includes(skill.toLowerCase()))
    const items = matches.filter(({ opportunity }) => (!wantsRemote || opportunity.mode === 'Remote') && (!requestedCategory || opportunity.category === requestedCategory) && (!requestedSkill || opportunity.skills.some((skill) => skill.toLowerCase() === requestedSkill.toLowerCase())) && (!wantsSoon || daysUntil(opportunity.deadline) <= 7)).sort((a, b) => b.match.score - a.match.score).slice(0, 4)
    const fallbackItems = items.length ? items : [...matches].sort((a, b) => b.match.score - a.match.score).slice(0, 3)
    const answer = items.length ? `I found ${items.length} path${items.length === 1 ? '' : 's'} that fit what you asked for. I ranked them using your profile, not a random feed.` : `I didn’t find an exact match for that combination, so I widened the search and pulled the strongest options for your profile.`
    setConversation((current) => [...current, { role: 'user', text: trimmed }, { role: 'assistant', text: answer, items: fallbackItems }])
    setQuery('')
  }
  const suggestions = ['Find remote AI opportunities for me', 'What is closing this week?', 'Show me beginner-friendly internships']
  return <div className="copilot-page"><div className="copilot-hero"><div className="copilot-orb"><Bot size={28} /></div><div><span className="eyebrow eyebrow-dark"><span className="eyebrow-line" /> YOUR PATHFINDER COPILOT</span><h1>A smarter way to <em>ask.</em></h1><p>Tell me what you’re looking for. I’ll read between the lines of your profile and the opportunity board.</p></div><span className="local-badge"><span className="pulse-dot" /> Local intelligence</span></div>
    <div className="copilot-window"><div className="copilot-window-head"><span><span className="copilot-mini"><Bot size={15} /></span><strong>PathFinder Copilot</strong><small>Always on your side</small></span><CircleHelp size={17} /></div><div className="conversation">{conversation.length === 0 && <div className="copilot-welcome"><span className="welcome-spark">✦</span><h2>What are you curious about?</h2><p>Try one of these, or ask in your own words.</p><div className="suggestion-prompts">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => runQuery(suggestion)}>{suggestion}<ArrowRight size={14} /></button>)}</div></div>}{conversation.map((message, index) => message.role === 'user' ? <div className="chat-row user-row" key={`${message.role}-${index}`}><div className="chat-bubble user-bubble">{message.text}</div><span className="avatar avatar-small">{initials(profile.name)}</span></div> : <div className="chat-row assistant-row" key={`${message.role}-${index}`}><span className="copilot-mini"><Bot size={15} /></span><div className="assistant-content"><div className="chat-bubble assistant-bubble">{message.text}</div>{message.items && <div className="copilot-results">{message.items.map(({ opportunity, match }) => <div className="copilot-result" key={opportunity.id}><button onClick={() => onSelect(opportunity)}><span className={`org-logo logo-${opportunity.category.toLowerCase()}`}>{opportunity.organization.split(' ').map((word) => word[0]).slice(0, 2).join('')}</span><span><strong>{opportunity.title}</strong><small>{opportunity.organization} · {opportunity.mode}</small></span><span className="mini-score">{match.score}%</span></button><button className="mini-save" onClick={() => onSave(opportunity.id)} aria-label={`Save ${opportunity.title}`}><Bookmark size={15} /></button></div>)}</div>}</div></div>)}</div><div className="copilot-input-wrap"><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && runQuery(query)} placeholder="Ask anything about your next opportunity..." aria-label="Ask PathFinder Copilot" /><button className="mic-button" aria-label="Voice input (demo)"><Mic size={17} /></button><button className="send-button" onClick={() => runQuery(query)} aria-label="Send message"><Send size={16} /></button></div><p className="copilot-note"><Sparkles size={12} /> Powered by your profile and the PathFinder demo dataset. No API key required.</p></div>
  </div>
}

function ProfilePage({ profile, onSave }: { profile: Profile; onSave: (profile: Profile) => void }) {
  const [draft, setDraft] = useState(profile)
  const [saved, setSaved] = useState(false)
  const update = <K extends keyof Profile>(key: K, value: Profile[K]) => { setDraft((current) => ({ ...current, [key]: value })); setSaved(false) }
  const parseTags = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean)
  const toggleCategory = (category: Category) => update('categories', draft.categories.includes(category) ? draft.categories.filter((item) => item !== category) : [...draft.categories, category])
  const save = () => { onSave(draft); setSaved(true) }
  return <div className="profile-page"><div className="page-intro"><div><span className="eyebrow eyebrow-dark"><span className="eyebrow-line" /> YOUR OPPORTUNITY DNA</span><h1>Make your profile <em>work harder.</em></h1><p>Small updates here change every match across your board.</p></div><button className="button button-dark" onClick={save}>{saved ? <Check size={16} /> : <PenLine size={16} />} {saved ? 'Saved' : 'Save changes'}</button></div>
    <div className="profile-layout"><div className="profile-card profile-card-main"><div className="profile-card-head"><div className="avatar avatar-large">{initials(draft.name)}</div><div><span className="section-kicker">YOUR SIGNAL</span><h2>{draft.name || 'Your name'}</h2><p>{draft.stream || 'Your field'} · {draft.location || 'Your location'}</p></div></div><div className="profile-form-grid"><Field label="Your name" value={draft.name} onChange={(value) => update('name', value)} placeholder="e.g. Aarav Sharma" /><Field label="Current education" type="select" value={draft.education} onChange={(value) => update('education', value)} options={['High School', 'Undergraduate', 'Postgraduate', 'Recent Graduate']} /><Field label="Stream / degree" value={draft.stream} onChange={(value) => update('stream', value)} placeholder="e.g. Computer Science" /><Field label="Where are you based?" value={draft.location} onChange={(value) => update('location', value)} placeholder="e.g. Pune, Maharashtra" /><Field label="Experience level" type="select" value={draft.experience} onChange={(value) => update('experience', value)} options={['Beginner', 'Intermediate', 'Advanced']} /><Field label="Work preference" type="select" value={draft.mode} onChange={(value) => update('mode', value as Mode | 'Any')} options={modes} /></div></div><aside className="profile-card profile-card-side"><span className="section-kicker">MATCHING SIGNALS</span><h2>What should find you?</h2><label className="field"><span>Skills <small>Comma separated</small></span><input className="input" value={draft.skills.join(', ')} onChange={(event) => update('skills', parseTags(event.target.value))} /></label><label className="field"><span>Interests <small>Comma separated</small></span><input className="input" value={draft.interests.join(', ')} onChange={(event) => update('interests', parseTags(event.target.value))} /></label><div className="field"><span>Preferred categories</span><div className="profile-category-list">{categories.map((category) => <button key={category} className={`profile-category ${draft.categories.includes(category) ? 'selected' : ''}`} onClick={() => toggleCategory(category)}><span>{draft.categories.includes(category) ? <Check size={13} /> : null}</span>{category}</button>)}</div></div></aside></div>
  </div>
}

function OpportunityModal({ opportunity, match, saved, onSave, onClose }: { opportunity: Opportunity; match: MatchBreakdown; saved: boolean; onSave: () => void; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const explanations = explainMatch(match)
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><article className="detail-modal"><button className="modal-close" onClick={onClose} aria-label="Close opportunity details"><X size={18} /></button><div className="detail-header"><span className={`org-logo logo-${opportunity.category.toLowerCase()} detail-logo`}>{opportunity.organization.split(' ').map((word) => word[0]).slice(0, 2).join('')}</span><div><span className={`category-label category-${opportunity.category.toLowerCase()}`}>{opportunity.category}</span><h2>{opportunity.title}</h2><p>{opportunity.organization}</p></div><div className="detail-score"><strong>{match.score}%</strong><span>Match</span></div></div><div className="detail-grid"><div className="detail-main"><p className="detail-description">{opportunity.description}</p><div className="detail-facts"><span><MapPin size={16} /><strong>{opportunity.location}</strong><small>{opportunity.mode}</small></span><span><Clock3 size={16} /><strong>{formatDeadline(opportunity.deadline)}</strong><small>{deadlineLabel(opportunity.deadline)}</small></span><span><GraduationCap size={16} /><strong>{opportunity.education.join(' / ')}</strong><small>Education</small></span></div><h3>About this opportunity</h3><p>{opportunity.eligibility}</p><h3>What you get</h3><ul className="benefits-list">{opportunity.benefits.map((benefit) => <li key={benefit}><Check size={14} />{benefit}</li>)}</ul><div className="detail-tags">{opportunity.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div><aside className="why-match"><div className="why-match-head"><span className="why-icon"><Sparkles size={16} /></span><div><span className="section-kicker">EXPLAINABLE MATCH</span><h3>Why this matches you</h3></div></div><div className="explanation-list">{explanations.map((explanation) => <div className={explanation.active ? 'explanation active' : 'explanation'} key={explanation.label}><span>{explanation.active ? <Check size={13} /> : <span className="explanation-dash" />}</span><div><strong>{explanation.label}</strong><small>{explanation.detail}</small></div></div>)}</div></aside></div><div className="detail-actions"><button className={`button button-outline ${saved ? 'button-saved' : ''}`} onClick={onSave}>{saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />} {saved ? 'Saved' : 'Save opportunity'}</button><a className="button button-primary" href={opportunity.url} target="_blank" rel="noreferrer">Apply on organization site <ArrowRight size={16} /></a></div><p className="detail-disclaimer"><CircleHelp size={13} /> Demo opportunity data for FIT FEST HACKATHON 2026. Verify eligibility, deadlines, and details on the organization’s site before applying.</p></article></div>
}

function NavItem({ icon, label, active, count, onClick }: { icon: React.ReactNode; label: string; active: boolean; count?: number; onClick: () => void }) {
  return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}><span className="nav-icon">{icon}</span><span>{label}</span>{count ? <span className="nav-count">{count}</span> : null}</button>
}

function EmptyState({ icon, title, text, action, onAction }: { icon: React.ReactNode; title: string; text: string; action?: string; onAction?: () => void }) {
  return <div className="empty-state"><span className="empty-icon">{icon}</span><h2>{title}</h2><p>{text}</p>{action && onAction && <button className="button button-dark" onClick={onAction}>{action} <ArrowRight size={15} /></button>}</div>
}

export default App