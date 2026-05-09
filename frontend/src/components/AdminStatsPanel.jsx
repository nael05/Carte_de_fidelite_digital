import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { Loader2, TrendingUp, Users, Building2, Zap } from 'lucide-react'
import api from '../api'
import './StatsPanel.css'

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#84cc16']

const MONTH_LABELS = { '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr', '05': 'Mai', '06': 'Jui', '07': 'Jul', '08': 'Aoû', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc' }

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

export default function AdminStatsPanel() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/stats').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="ux-view-fade" style={{ padding: '48px 0' }}>
      <div className="st-loading"><Loader2 size={22} className="pro-spin" /><span>Chargement…</span></div>
    </div>
  )
  if (!data) return null

  const { platform, clients, activity, topEnterprises, growth, enterpriseGrowth } = data

  const walletData = [
    { name: 'Apple', value: clients.appleClients },
    { name: 'Google', value: clients.googleClients },
  ].filter(d => d.value > 0)

  const growthData = growth.map(g => ({
    name: MONTH_LABELS[g.month.slice(5)] || g.month.slice(5),
    clients: g.newClients
  }))

  const enterpriseGrowthData = enterpriseGrowth.map(g => ({
    name: MONTH_LABELS[g.month.slice(5)] || g.month.slice(5),
    entreprises: g.newEnterprises
  }))

  const redemptionRate = activity.totalPointsDistributed > 0
    ? Math.round((activity.totalPointsRedeemed / activity.totalPointsDistributed) * 100)
    : 0

  return (
    <div className="ux-view-fade">
      <header className="ux-view-header">
        <h2>Statistiques plateforme</h2>
        <p>Vue globale de l'activité Fidelyz sur les 30 derniers jours</p>
      </header>

      <div style={{ padding: '0 0 32px' }}>

        <SectionTitle>Plateforme</SectionTitle>
        <div className="st-grid-2" style={{ padding: '0 0 4px' }}>
          <StatCard label="Entreprises actives" value={platform.activeEnterprises}
            sub={`${platform.suspendedEnterprises} suspendue(s)`} color="#6366f1" />
          <StatCard label="Clients total" value={clients.totalClients} color="#8b5cf6" />
          <StatCard label="Transactions (30j)" value={activity.totalTransactions} color="#06b6d4" />
          <StatCard label="Taux de rachat" value={`${redemptionRate}%`}
            sub="points utilisés / distribués" color="#10b981" />
        </div>

        <SectionTitle>Ce mois-ci</SectionTitle>
        <div className="st-grid-2" style={{ padding: '0 0 4px' }}>
          <StatCard label="Points distribués" value={activity.totalPointsDistributed} color="#f59e0b" />
          <StatCard label="Points utilisés" value={activity.totalPointsRedeemed} color="#ef4444" />
        </div>

        {walletData.length > 0 && (
          <>
            <SectionTitle>Répartition Wallet</SectionTitle>
            <div className="st-pie-wrap">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={walletData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                    dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {walletData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {growthData.length > 0 && (
          <>
            <SectionTitle>Nouveaux clients (6 mois)</SectionTitle>
            <div className="st-chart-wrap">
              <ResponsiveContainer width="100%" height={160}>
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

        {enterpriseGrowthData.length > 0 && (
          <>
            <SectionTitle>Nouvelles entreprises (6 mois)</SectionTitle>
            <div className="st-chart-wrap">
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={enterpriseGrowthData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [v, 'Entreprises']} />
                  <Bar dataKey="entreprises" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {topEnterprises.length > 0 && (
          <>
            <SectionTitle>Top entreprises actives (30j)</SectionTitle>
            <div className="st-tiers-list">
              {topEnterprises.map((e, i) => (
                <div key={e.id} className="st-tier-row">
                  <div className="st-tier-badge" style={{ background: COLORS[i % COLORS.length] }}>
                    {i + 1}
                  </div>
                  <div className="st-tier-info">
                    <div className="st-tier-name">{e.nom}</div>
                    <div className="st-tier-pts">{e.clientCount} clients</div>
                  </div>
                  <div className="st-tier-count">{e.scanCount} scans</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
