import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts'
import { TrendingUp, Users, Zap, Gift, ChevronRight, ArrowLeft, Loader2, Award } from 'lucide-react'
import api from '../api'
import './StatsPanel.css'

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

const DOW_LABELS = ['', 'Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function StatCard({ label, value, sub, color = '#6366f1' }) {
  return (
    <div className="st-card">
      <div className="st-card-value" style={{ color }}>{value}</div>
      <div className="st-card-label">{label}</div>
      {sub && <div className="st-card-sub">{sub}</div>}
    </div>
  )
}

function SectionTitle({ children }) {
  return <div className="st-section-title">{children}</div>
}

function LoadingState() {
  return (
    <div className="st-loading">
      <Loader2 size={22} className="pro-spin" />
      <span>Chargement…</span>
    </div>
  )
}
function OverviewTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/pro/stats/overview').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState />
  if (!data) return null

  const redemptionRate = data.pointsDistributedThisMonth > 0
    ? Math.round((data.pointsRedeemedThisMonth / data.pointsDistributedThisMonth) * 100)
    : 0

  const scanTrend = data.scansLastMonth > 0
    ? Math.round(((data.scansThisMonth - data.scansLastMonth) / data.scansLastMonth) * 100)
    : null

  const walletData = [
    { name: 'Apple', value: Number(data.appleClients) },
    { name: 'Google', value: Number(data.googleClients) },
  ].filter(d => d.value > 0)

  return (
    <div className="st-content">
      <SectionTitle>Ce mois-ci</SectionTitle>
      <div className="st-grid-2">
        <StatCard label="Scans" value={data.scansThisMonth}
          sub={scanTrend !== null ? `${scanTrend > 0 ? '+' : ''}${scanTrend}% vs mois dernier` : null}
          color="#6366f1" />
        <StatCard label="Clients actifs" value={data.activeClientsThisMonth}
          sub={`sur ${data.totalClients} total`} color="#8b5cf6" />
        <StatCard label="Points distribués" value={data.pointsDistributedThisMonth} color="#06b6d4" />
        <StatCard label="Points utilisés" value={data.pointsRedeemedThisMonth}
          sub={`${redemptionRate}% de rachat`} color="#10b981" />
      </div>

      <SectionTitle>Portefeuille total</SectionTitle>
      <div className="st-grid-2">
        <StatCard label="Clients total" value={data.totalClients}
          sub={`+${data.newClientsThisMonth} ce mois`} color="#6366f1" />
        <StatCard label="Points en circulation" value={data.totalPointsInCirculation} color="#f59e0b" />
      </div>

      {walletData.length > 0 && (
        <>
          <SectionTitle>Répartition Wallet</SectionTitle>
          <div className="st-wallet-bars">
            {walletData.map((item, i) => {
              const total = walletData.reduce((s, d) => s + d.value, 0)
              const pct = Math.round((item.value / total) * 100)
              return (
                <div key={item.name} className="st-wallet-row">
                  <span className="st-wallet-name">{item.name}</span>
                  <div className="st-wallet-bar-wrap">
                    <div className="st-wallet-bar" style={{ width: `${pct}%`, background: COLORS[i] }} />
                  </div>
                  <span className="st-wallet-val">{item.value} <span style={{ opacity: 0.6, fontSize: 11 }}>({pct}%)</span></span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
function ActivityTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')

  useEffect(() => {
    setLoading(true)
    api.get(`/pro/stats/activity?period=${period}`).then(r => setData(r.data)).finally(() => setLoading(false))
  }, [period])

  if (loading) return <LoadingState />
  if (!data) return null

  const dowData = DOW_LABELS.slice(1).map((label, i) => {
    const found = data.byDayOfWeek.find(d => d.dow === i + 1)
    return { name: label, scans: found?.count || 0 }
  })

  const hourData = Array.from({ length: 24 }, (_, h) => {
    const found = data.byHour.find(d => d.hour === h)
    return { name: `${h}h`, scans: found?.count || 0 }
  }).filter((_, i) => i % 2 === 0)

  return (
    <div className="st-content">
      <div className="st-period-btns">
        {[['7', '7j'], ['30', '30j'], ['90', '90j']].map(([v, l]) => (
          <button key={v} className={`st-period-btn ${period === v ? 'active' : ''}`}
            onClick={() => setPeriod(v)}>{l}</button>
        ))}
      </div>

      <SectionTitle>Scans par jour</SectionTitle>
      {data.daily.length === 0 ? (
        <div className="st-empty">Aucune activité sur cette période</div>
      ) : (
        <div className="st-chart-wrap">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.daily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }}
                tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v, n) => [v, n === 'scans' ? 'Scans' : 'Points']}
                labelFormatter={l => `Date : ${l}`} />
              <Bar dataKey="scans" fill="#6366f1" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <SectionTitle>Jours les plus actifs</SectionTitle>
      <div className="st-chart-wrap">
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={dowData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="scans" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <SectionTitle>Heures de pointe (30j)</SectionTitle>
      <div className="st-chart-wrap">
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={hourData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="scans" fill="#06b6d4" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
function ClientsTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/pro/stats/clients').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState />
  if (!data) return null

  const { retention } = data
  const retentionItems = [
    { label: '7 derniers jours', value: retention.last7days, color: '#10b981' },
    { label: '30 derniers jours', value: retention.last30days, color: '#6366f1' },
    { label: '90 derniers jours', value: retention.last90days, color: '#8b5cf6' },
    { label: 'Inactifs (+90j)', value: retention.inactive, color: '#9ca3af' },
  ]

  const monthLabels = { '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr', '05': 'Mai', '06': 'Jui', '07': 'Jul', '08': 'Aoû', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc' }
  const growthData = data.growth.map(g => ({
    name: monthLabels[g.month.slice(5)] || g.month.slice(5),
    clients: g.newClients
  }))

  return (
    <div className="st-content">
      <SectionTitle>Rétention</SectionTitle>
      <div className="st-retention">
        {retentionItems.map(item => (
          <div key={item.label} className="st-retention-row">
            <span className="st-retention-label">{item.label}</span>
            <div className="st-retention-bar-wrap">
              <div className="st-retention-bar" style={{
                width: retention.total > 0 ? `${Math.round((item.value / retention.total) * 100)}%` : '0%',
                background: item.color
              }} />
            </div>
            <span className="st-retention-count">{item.value}</span>
          </div>
        ))}
      </div>

      <SectionTitle>Distribution des points</SectionTitle>
      <div className="st-chart-wrap">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data.distribution} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="range_label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={v => [v, 'Clients']} />
            <Bar dataKey="count" fill="#f59e0b" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {growthData.length > 0 && (
        <>
          <SectionTitle>Nouveaux clients (6 mois)</SectionTitle>
          <div className="st-chart-wrap">
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={growthData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => [v, 'Nouveaux clients']} />
                <Line type="monotone" dataKey="clients" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
function RewardsTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/pro/stats/rewards').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState />
  if (!data) return null

  const monthLabels = { '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr', '05': 'Mai', '06': 'Jui', '07': 'Jul', '08': 'Aoû', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc' }
  const monthlyData = data.monthly.map(m => ({
    name: monthLabels[m.month.slice(5)] || m.month.slice(5),
    rachats: m.redemptions
  }))

  return (
    <div className="st-content">
      <div className="st-grid-2" style={{ marginBottom: 20 }}>
        <StatCard label="Rachats total" value={data.totals.totalRedemptions || 0} color="#10b981" />
        <StatCard label="Points dépensés" value={data.totals.totalPointsSpent || 0} color="#ef4444" />
      </div>

      {data.tiers.length === 0 ? (
        <div className="st-empty">Aucun palier configuré</div>
      ) : (
        <>
          <SectionTitle>Récompenses les plus utilisées</SectionTitle>
          <div className="st-tiers-list">
            {data.tiers.map((t, i) => (
              <div key={i} className="st-tier-row">
                <div className="st-tier-badge" style={{ background: COLORS[i % COLORS.length] }}>
                  {i + 1}
                </div>
                <div className="st-tier-info">
                  <div className="st-tier-name">{t.title}</div>
                  <div className="st-tier-pts">{t.points_required} pts</div>
                </div>
                <div className="st-tier-count">{t.redemptions}×</div>
              </div>
            ))}
          </div>
        </>
      )}

      {monthlyData.length > 0 && (
        <>
          <SectionTitle>Rachats par mois</SectionTitle>
          <div className="st-chart-wrap">
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={v => [v, 'Rachats']} />
                <Bar dataKey="rachats" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
const TABS = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
  { id: 'activity', label: 'Activité', icon: Zap },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'rewards', label: 'Récompenses', icon: Gift },
]

export default function StatsPanel({ onBack }) {
  const [activeTab, setActiveTab] = useState('overview')

  const TabContent = {
    overview: OverviewTab,
    activity: ActivityTab,
    clients: ClientsTab,
    rewards: RewardsTab,
  }[activeTab]

  return (
    <div className="st-panel">
      <div className="stg-subpage-head">
        <button className="stg-back" onClick={onBack}>
          <ChevronRight size={15} className="stg-back-arrow" /> Paramètres
        </button>
        <div className="stg-subpage-title-row">
          <span className="stg-hub-icon stg-hub-icon--blue"><TrendingUp size={18} /></span>
          <div>
            <h2>Statistiques</h2>
            <p>Analyse de votre programme de fidélité</p>
          </div>
        </div>
      </div>

      <div className="st-tabs">
        {TABS.map(t => (
          <button key={t.id}
            className={`st-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}>
            <t.icon size={14} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <TabContent />
    </div>
  )
}
