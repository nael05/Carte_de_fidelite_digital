import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import {
  AlertCircle, CheckCircle2, Loader2, X, Search,
  Lock, Unlock, Trash2, LogOut, Copy, Users,
  Sun, Moon, PieChart, Edit2, TrendingUp, Building2, Store, AlertTriangle,
  FileText, Save, Mail, Tag, Euro, KeyRound, ChevronRight, ExternalLink, ShieldCheck
} from 'lucide-react'
import AppShell, { PageHead } from '../components/AppShell'
import AdminStatsPanel from '../components/AdminStatsPanel'
import { AdminPricingPanel, AdminPromosPanel, AdminMailPanel } from '../components/AdminBillingPanels'
import './AdminDashboard.css'

import usePageTitle from '../utils/usePageTitle'

function AdminDashboard() {
  usePageTitle("Administration | Fidelyz", { noindex: true })
  const [activeTab, setActiveTab] = useState('overview')
  const [contactTarget, setContactTarget] = useState('')
  const [darkMode, setDarkMode] = useState(() => (localStorage.getItem('theme') || 'dark') === 'dark')
  const [enterprises, setEnterprises] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('tous')
  const [newCompanyCredentials, setNewCompanyCredentials] = useState(null)
  const [editingCompany, setEditingCompany] = useState(null)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null)

  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    prenom: '',
    telephone: '',
    loyalty_type: 'points'
  })

  const [legalContent, setLegalContent] = useState('')
  const [legalSaving, setLegalSaving] = useState(false)

  const navigate = useNavigate()
  const { logout, token } = useAuth()

  const copyToClipboard = (text, message = 'Copié !') => {
    navigator.clipboard.writeText(text)
    setSuccess(message)
    setTimeout(() => setSuccess(''), 2000)
  }

  const copyAllInfo = (ent) => {
    const text = `
DÉTAILS COMMERCE FIDELYZ
-----------------------
COMMERCE : ${ent.nom}
ID : #${ent.id}
GÉRANT : ${ent.prenom || 'N/A'}
TEL : ${ent.telephone || 'N/A'}
EMAIL : ${ent.email}
PASS TEMP : ${ent.temporary_password || 'Déjà changé'}
-----------------------`.trim()
    copyToClipboard(text, 'Toutes les infos ont été copiées !')
  }
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-mode')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark-mode')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  useEffect(() => {
    if (!token) {
      navigate('/master-admin-secret')
      return
    }
    loadEnterprises()
    loadLegalContent()
  }, [token])

  const loadLegalContent = async () => {
    try {
      const res = await api.get('/settings/mentions-legales')
      setLegalContent(res.data.content || '')
    } catch {
    }
  }

  const saveLegalContent = async () => {
    setLegalSaving(true)
    setError('')
    setSuccess('')
    try {
      await api.put('/admin/settings/mentions-legales', { content: legalContent })
      setSuccess('Mentions légales mises à jour avec succès.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde.')
    } finally {
      setLegalSaving(false)
    }
  }

  const loadEnterprises = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get('/admin/enterprises')
      let data = response.data
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        data = data.value || []
      }
      const enterprisesData = Array.isArray(data) ? data : []
      setEnterprises(enterprisesData)
    } catch (err) {
      console.error('Error loading enterprises:', err)
      setError('Erreur lors du chargement des entreprises')
      if (err.response?.status === 401) {
        logout()
        navigate('/master-admin-secret')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCompany = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.nom || !formData.email) {
      setError('Tous les champs sont requis')
      return
    }

    setSubmitting(true)
    try {
      const response = await api.post('/admin/create-company', {
        nom: formData.nom,
        email: formData.email,
        prenom: formData.prenom,
        telephone: formData.telephone,
        loyalty_type: formData.loyalty_type
      })

      setNewCompanyCredentials({
        ...response.data,
        nom: formData.nom
      })

      setSuccess('Entreprise créée avec succès!')
      setFormData({ nom: '', email: '', prenom: '', telephone: '', loyalty_type: 'points' })

      setTimeout(() => {
        loadEnterprises()
        setSuccess('')
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSuspend = async (companyId) => {
    if (!window.confirm('Suspendre cette entreprise?')) return
    try {
      await api.put(`/admin/suspend-company/${companyId}`)
      setSuccess('Entreprise suspendue')
      loadEnterprises()
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur')
    }
  }

  const handleReactivate = async (companyId) => {
    if (!window.confirm('Réactiver cette entreprise?')) return
    try {
      await api.put(`/admin/reactivate-company/${companyId}`)
      setSuccess('Entreprise réactivée')
      loadEnterprises()
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur')
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmModal) return
    try {
      await api.delete(`/admin/delete-company/${deleteConfirmModal.id}`)
      setSuccess('Entreprise supprimée définitivement')
      setDeleteConfirmModal(null)
      loadEnterprises()
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la suppression')
      setDeleteConfirmModal(null)
    }
  }

  const handleUpdateCompany = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('');
    setSubmitting(true)
    try {
      await api.put(`/admin/update-company/${editingCompany.id}`, editingCompany)
      setSuccess('Commerce mis à jour avec succès !')
      setEditingCompany(null)
      loadEnterprises()
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de mise à jour')
    } finally {
      setSubmitting(false)
    }
  }

  const stats = {
    total: enterprises.length,
    active: enterprises.filter(e => e.statut === 'actif').length,
    suspended: enterprises.filter(e => e.statut === 'suspendu').length
  }

  const filteredEnterprises = enterprises.filter(ent => {
    const searchLower = searchTerm.toLowerCase().trim()
    const matchesSearch = !searchLower || (ent.nom || '').toLowerCase().includes(searchLower) || (ent.email || '').toLowerCase().includes(searchLower) || String(ent.id).includes(searchLower)
    const matchesFilter = filterStatus === 'tous' || ent.statut === filterStatus
    return matchesSearch && matchesFilter
  })

  const goTab = (id) => { setActiveTab(id); window.scrollTo({ top: 0 }) }
  const openList = (status) => { setFilterStatus(status); setSearchTerm(''); goTab('list') }

  const pendingActivation = enterprises.filter(e => e.temporary_password)
  const suspendedList = enterprises.filter(e => e.statut === 'suspendu')
  const activeRate = stats.total ? Math.round((stats.active / stats.total) * 100) : 0

  const sections = [
    {
      items: [
        { id: 'overview', icon: PieChart, label: "Vue d'ensemble" },
        { id: 'list', icon: Store, label: 'Commerces', badge: stats.total || null },
        { id: 'stats', icon: TrendingUp, label: 'Statistiques' },
      ]
    },
    {
      label: 'Facturation',
      items: [
        { id: 'pricing', icon: Euro, label: 'Tarifs' },
        { id: 'promos', icon: Tag, label: 'Codes promo' },
      ]
    },
    {
      label: 'Communication',
      items: [
        { id: 'email', icon: Mail, label: 'E-mails' },
        { id: 'legal', icon: FileText, label: 'Mentions légales' },
      ]
    }
  ]

  const footItems = [
    { id: 'theme', icon: darkMode ? Sun : Moon, label: darkMode ? 'Thème clair' : 'Thème sombre', onClick: () => setDarkMode(!darkMode) },
    { id: 'logout', icon: LogOut, label: 'Déconnexion', onClick: () => logout(), danger: true },
  ]

  const topbarActions = (
    <>
      <button className="icon-btn" onClick={() => setDarkMode(!darkMode)} aria-label="Changer de thème">
        {darkMode ? <Sun size={17} /> : <Moon size={17} />}
      </button>
      <button className="icon-btn danger" onClick={() => logout()} aria-label="Déconnexion">
        <LogOut size={17} />
      </button>
    </>
  )

  const CopyField = ({ label, value, mono }) => (
    <button className="ad-field" onClick={() => value && copyToClipboard(value)} title="Copier" disabled={!value}>
      <span className="ad-field-label">{label}</span>
      <span className={`ad-field-value${mono ? ' mono' : ''}`}>{value || '—'}</span>
      {value && <Copy size={13} className="ad-field-copy" />}
    </button>
  )

  return (
    <AppShell
      brandTitle="Fidelyz Control"
      brandSub="Administration"
      sections={sections}
      active={activeTab}
      onSelect={goTab}
      footItems={footItems}
      topbarActions={topbarActions}
    >
      {/* Confirmations */}
      {success && (
        <div className="ui-toasts">
          <div className="ui-toast"><CheckCircle2 size={18} /><span>{success}</span></div>
        </div>
      )}

      {error && (
        <div className="ui-alert error">
          <AlertCircle size={18} /> <span>{error}</span>
          <button className="icon-btn" onClick={() => setError('')} aria-label="Fermer"><X size={14} /></button>
        </div>
      )}

      {/* ===== VUE D'ENSEMBLE ===== */}
      {activeTab === 'overview' && (
        <>
          <PageHead
            eyebrow={<><ShieldCheck size={14} /> Administration</>}
            title={<>Réseau <span className="ad-grad">Fidelyz</span></>}
            sub="L'état de votre réseau de commerçants, en temps réel."
          />

          <div className="ui-grid ui-grid-3">
            <button className="kpi ad-kpi" onClick={() => openList('tous')}>
              <span className="kpi-label"><Building2 size={15} /> Commerces inscrits</span>
              <span className="kpi-value">{stats.total}</span>
              <span className="kpi-sub ad-kpi-link">Voir tous les commerces <ChevronRight size={12} /></span>
            </button>
            <button className="kpi ad-kpi" onClick={() => openList('actif')}>
              <span className="kpi-label"><CheckCircle2 size={15} /> Abonnements actifs</span>
              <span className="kpi-value">{stats.active}</span>
              <span className="ad-meter"><span style={{ width: `${activeRate}%` }} /></span>
              <span className="kpi-sub">{activeRate} % du réseau</span>
            </button>
            <button className="kpi ad-kpi" onClick={() => openList('suspendu')}>
              <span className="kpi-label"><Lock size={15} /> Comptes suspendus</span>
              <span className="kpi-value">{stats.suspended}</span>
              <span className="kpi-sub ad-kpi-link">Gérer <ChevronRight size={12} /></span>
            </button>
          </div>

          <div className="ad-overview">
            <section className="ui-card">
              <div className="ui-card-head">
                <h2 className="ui-card-title"><span className="ui-icon sm gold"><KeyRound size={15} /></span> En attente d'activation</h2>
                <span className="ui-badge">{pendingActivation.length}</span>
              </div>
              {pendingActivation.length === 0 ? (
                <p className="ui-hint">Tous les commerçants ont personnalisé leur mot de passe.</p>
              ) : (
                <div className="ad-mini-list">
                  {pendingActivation.slice(0, 5).map(ent => (
                    <div key={ent.id} className="ad-mini-row">
                      <div className="ui-avatar sm">{ent.nom?.[0] || '?'}</div>
                      <div className="ui-row-main">
                        <span className="ui-row-title">{ent.nom}</span>
                        <span className="ui-row-sub">{ent.email}</span>
                      </div>
                      <button className="ui-btn secondary sm" onClick={() => copyAllInfo(ent)}><Copy size={14} /> Accès</button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="ui-card">
              <div className="ui-card-head">
                <h2 className="ui-card-title"><span className="ui-icon sm danger"><Lock size={15} /></span> Comptes suspendus</h2>
                <span className="ui-badge">{suspendedList.length}</span>
              </div>
              {suspendedList.length === 0 ? (
                <p className="ui-hint">Aucun compte suspendu.</p>
              ) : (
                <div className="ad-mini-list">
                  {suspendedList.slice(0, 5).map(ent => (
                    <div key={ent.id} className="ad-mini-row">
                      <div className="ui-avatar sm">{ent.nom?.[0] || '?'}</div>
                      <div className="ui-row-main">
                        <span className="ui-row-title">{ent.nom}</span>
                        <span className="ui-row-sub">{ent.email}</span>
                      </div>
                      <button className="ui-btn secondary sm" onClick={() => handleReactivate(ent.id)}><Unlock size={14} /> Réactiver</button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="section-title">Raccourcis</div>
          <div className="ui-hub">
            {[
              { id: 'stats', icon: TrendingUp, tone: '', title: 'Statistiques', desc: 'Clients, transactions et croissance du réseau' },
              { id: 'pricing', icon: Euro, tone: 'gold', title: 'Tarifs', desc: 'Prix des abonnements et préavis aux abonnés' },
              { id: 'promos', icon: Tag, tone: 'neutral', title: 'Codes promo', desc: 'Créer et désactiver des remises Stripe' },
              { id: 'email', icon: Mail, tone: '', title: 'E-mails', desc: 'Écrire à un commerçant ou à tout le réseau' },
            ].map(item => (
              <button key={item.id} className="ui-hub-item" onClick={() => goTab(item.id)}>
                <span className={`ui-icon ${item.tone}`}><item.icon size={19} /></span>
                <span className="ui-hub-text">
                  <span className="ui-hub-title">{item.title}</span>
                  <span className="ui-hub-desc">{item.desc}</span>
                </span>
                <ChevronRight size={18} className="chev" />
              </button>
            ))}
          </div>
        </>
      )}

      {/* ===== COMMERCES ===== */}
      {activeTab === 'list' && (
        <>
          <PageHead
            eyebrow={<><Store size={14} /> Partenaires</>}
            title="Commerces"
            sub="Accès, statut et coordonnées de vos commerçants. Cliquez sur une information pour la copier."
          />

          <div className="ad-toolbar">
            <div className="ui-search">
              <Search size={17} />
              <input
                className="ui-input"
                type="text"
                placeholder="Nom, email ou identifiant…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              {searchTerm && <button className="icon-btn plain" onClick={() => setSearchTerm('')} aria-label="Effacer"><X size={14} /></button>}
            </div>
            <div className="ui-seg">
              {[['tous', `Tous · ${stats.total}`], ['actif', `Actifs · ${stats.active}`], ['suspendu', `Suspendus · ${stats.suspended}`]].map(([v, l]) => (
                <button key={v} className={filterStatus === v ? 'on' : ''} onClick={() => setFilterStatus(v)}>{l}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="ui-loading"><Loader2 size={24} className="spin" /> Chargement…</div>
          ) : filteredEnterprises.length === 0 ? (
            <div className="ui-card">
              <div className="ui-empty">
                <span className="ui-icon lg neutral"><Store size={24} /></span>
                <p className="ui-empty-title">{enterprises.length === 0 ? 'Aucun commerce disponible' : 'Aucun résultat'}</p>
                <p>{enterprises.length === 0 ? 'Les commerçants apparaîtront ici après leur inscription.' : 'Modifiez la recherche ou le filtre.'}</p>
              </div>
            </div>
          ) : (
            <div className="ad-grid">
              {filteredEnterprises.map(ent => (
                <article key={ent.id} className={`ui-card ad-ent${ent.statut === 'suspendu' ? ' off' : ''}`}>
                  <header className="ad-ent-head">
                    <div className="ui-avatar">{ent.nom?.[0] || '?'}</div>
                    <div className="ui-row-main">
                      <button className="ad-ent-name" onClick={() => copyToClipboard(ent.nom)} title="Copier le nom">{ent.nom}</button>
                      <span className="ad-ent-id" onClick={() => copyToClipboard(ent.id)} title="Copier l'identifiant">#{ent.id}</span>
                    </div>
                    <span className={`ui-badge ${ent.statut === 'actif' ? 'accent' : 'danger'}`}>
                      <span className="dot" />{ent.statut === 'actif' ? 'Actif' : 'Suspendu'}
                    </span>
                  </header>

                  <div className="ad-fields">
                    <CopyField label="Gérant" value={ent.prenom} />
                    <CopyField label="Téléphone" value={ent.telephone} />
                    <CopyField label="Email de connexion" value={ent.email} />
                    {ent.temporary_password && <CopyField label="Mot de passe temporaire" value={ent.temporary_password} mono />}
                  </div>

                  <footer className="ad-ent-foot">
                    <button onClick={() => { setContactTarget(ent.id); goTab('email') }} className="ui-btn secondary sm"><Mail size={14} /> Écrire</button>
                    <div className="ad-ent-actions">
                      <button onClick={() => copyAllInfo(ent)} className="icon-btn" title="Copier toutes les infos"><Copy size={15} /></button>
                      <button onClick={() => setEditingCompany({ ...ent })} className="icon-btn" title="Modifier"><Edit2 size={15} /></button>
                      {ent.statut === 'actif' ? (
                        <button onClick={() => handleSuspend(ent.id)} className="icon-btn" title="Suspendre"><Lock size={15} /></button>
                      ) : (
                        <button onClick={() => handleReactivate(ent.id)} className="icon-btn accent" title="Réactiver"><Unlock size={15} /></button>
                      )}
                      <button onClick={() => setDeleteConfirmModal(ent)} className="icon-btn danger" title="Supprimer"><Trash2 size={15} /></button>
                    </div>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== STATISTIQUES ===== */}
      {activeTab === 'stats' && <AdminStatsPanel />}

      {activeTab === 'pricing' && <AdminPricingPanel />}
      {activeTab === 'promos' && <AdminPromosPanel />}
      {activeTab === 'email' && <AdminMailPanel enterprises={enterprises} initialCompanyId={contactTarget} />}

      {/* ===== MENTIONS LÉGALES ===== */}
      {activeTab === 'legal' && (
        <>
          <PageHead
            eyebrow={<><FileText size={14} /> Contenu public</>}
            title="Mentions légales"
            sub={<>Le contenu affiché sur la page publique <code>/mentions-legales</code>. Les balises HTML sont acceptées.</>}
            actions={
              <>
                <a href="/mentions-legales" target="_blank" rel="noopener noreferrer" className="ui-btn secondary">
                  <ExternalLink size={16} /> Prévisualiser
                </a>
                <button onClick={saveLegalContent} disabled={legalSaving} className="ui-btn">
                  {legalSaving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                  {legalSaving ? 'Sauvegarde…' : 'Sauvegarder'}
                </button>
              </>
            }
          />
          <section className="ui-card flush ad-editor">
            <div className="ad-editor-bar">
              <span className="ad-editor-dots" aria-hidden><i /><i /><i /></span>
              <span>mentions-legales.html</span>
            </div>
            <textarea
              value={legalContent}
              onChange={e => setLegalContent(e.target.value)}
              rows={26}
              spellCheck={false}
              placeholder="<h1>Mentions Légales</h1>&#10;<p>Contenu…</p>"
            />
          </section>
          <p className="ui-hint ad-editor-hint">
            Balises utiles : &lt;h1&gt;, &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;a&gt;.
          </p>
        </>
      )}

      {/* ===== MODALE : ACCÈS CRÉÉS ===== */}
      {newCompanyCredentials && (
        <div className="ui-overlay" onClick={() => setNewCompanyCredentials(null)}>
          <div className="ui-modal" onClick={e => e.stopPropagation()}>
            <div className="ui-modal-center">
              <span className="ui-icon lg"><CheckCircle2 size={26} /></span>
              <h3 className="ui-modal-title">Commerce créé</h3>
              <p>Voici les accès pour <strong>{newCompanyCredentials.nom}</strong></p>
            </div>
            <div className="ui-modal-body">
              <div className="ad-fields">
                <CopyField label="Email identifiant" value={newCompanyCredentials.email} />
                <CopyField label="Mot de passe temporaire" value={newCompanyCredentials.temporaryPassword} mono />
              </div>
            </div>
            <div className="ui-modal-foot">
              <button onClick={() => setNewCompanyCredentials(null)} className="ui-btn">Fermer et continuer</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODALE : SUPPRESSION ===== */}
      {deleteConfirmModal && (
        <div className="ui-overlay" onClick={() => setDeleteConfirmModal(null)}>
          <div className="ui-modal" onClick={e => e.stopPropagation()}>
            <div className="ui-modal-center">
              <span className="ui-icon lg danger"><AlertTriangle size={26} /></span>
              <h3 className="ui-modal-title">Supprimer {deleteConfirmModal.nom} ?</h3>
              <p>Le commerce, toutes ses cartes configurées et tous ses clients seront supprimés <strong>de façon irréversible</strong>.</p>
            </div>
            <div className="ui-modal-foot ad-foot-plain">
              <button onClick={() => setDeleteConfirmModal(null)} className="ui-btn secondary">Annuler</button>
              <button onClick={handleConfirmDelete} className="ui-btn danger-solid">Supprimer définitivement</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODALE : MODIFIER ===== */}
      {editingCompany && (
        <div className="ui-overlay" onClick={() => setEditingCompany(null)}>
          <form className="ui-modal" onClick={e => e.stopPropagation()} onSubmit={handleUpdateCompany}>
            <div className="ui-modal-head">
              <span className="ui-icon"><Edit2 size={17} /></span>
              <div className="ui-modal-head-text">
                <h3 className="ui-modal-title">Modifier {editingCompany.nom}</h3>
                <p className="ui-modal-sub">Informations du commerce</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setEditingCompany(null)} aria-label="Fermer"><X size={18} /></button>
            </div>
            <div className="ui-modal-body">
              <div className="ui-field">
                <label className="ui-label">Nom du commerce</label>
                <input className="ui-input" type="text" value={editingCompany.nom}
                  onChange={e => setEditingCompany({ ...editingCompany, nom: e.target.value })} required />
              </div>
              <div className="ui-field">
                <label className="ui-label">Email (identifiant de connexion)</label>
                <input className="ui-input" type="email" value={editingCompany.email}
                  onChange={e => setEditingCompany({ ...editingCompany, email: e.target.value })} required />
              </div>
              <div className="ui-grid ui-grid-2 ad-form-row">
                <div className="ui-field">
                  <label className="ui-label">Gérant</label>
                  <input className="ui-input" type="text" value={editingCompany.prenom || ''}
                    onChange={e => setEditingCompany({ ...editingCompany, prenom: e.target.value })} />
                </div>
                <div className="ui-field">
                  <label className="ui-label">Téléphone</label>
                  <input className="ui-input" type="tel" value={editingCompany.telephone || ''}
                    onChange={e => setEditingCompany({ ...editingCompany, telephone: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="ui-modal-foot">
              <button type="button" onClick={() => setEditingCompany(null)} className="ui-btn secondary">Annuler</button>
              <button type="submit" disabled={submitting} className="ui-btn">
                {submitting ? <Loader2 className="spin" size={18} /> : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  )
}

export default AdminDashboard
