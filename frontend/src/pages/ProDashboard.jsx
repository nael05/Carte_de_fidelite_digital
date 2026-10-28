import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { QRCodeSVG } from 'qrcode.react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

import CardCustomizer from '../components/CardCustomizer'
import AppShell, { PageHead } from '../components/AppShell'
import PlanBanner from '../components/PlanBanner'
import appleLogo from '../assets/apple.svg'
import googleLogo from '../assets/google.svg'
import HistoryModal from '../components/HistoryModal'
import StatsPanel from '../components/StatsPanel'
import CampaignsPanel from '../components/CampaignsPanel'
import BusinessPanel from '../components/BusinessPanel'
import EstablishmentPicker from '../components/EstablishmentPicker'
import {
  LogOut, ScanLine, Users, Palette, X, Copy, Plus, Minus, AlertCircle, Loader2, Phone, Mail, Award, Check,
  Settings, Save, Trash2, Sun, Moon, Gift, Lock, ChevronRight, History, Globe, Bell, MapPin, Navigation,
  UserPlus, Send, Megaphone, TrendingUp, Search, Download, QrCode, CircleUser, Coins, Sparkles, Hourglass, Info, Zap
} from 'lucide-react'
import './ProDashboard.css'

const TAB_IDS = ['scanner', 'clients', 'stats', 'register', 'design', 'settings', 'campaigns', 'business']

function ProDashboard() {
  const [activeTab, setActiveTab] = useState(() => {
    const t = new URLSearchParams(window.location.search).get('tab')
    return TAB_IDS.includes(t) ? t : 'scanner'
  })
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === null ? true : saved === 'dark';
  })
  const [toasts, setToasts] = useState([])
  const [clients, setClients] = useState([])
  const [scannerActive, setScannerActive] = useState(false)
  const [lastScan, setLastScan] = useState(null)

  const [proInfo, setProInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [customization, setCustomization] = useState(null)
  const [selectedClientCard, setSelectedClientCard] = useState(null)

  const [copied, setCopied] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [cashSearch, setCashSearch] = useState('')

  const [redeemModal, setRedeemModal] = useState(null); // { clientId, clientName, rewards }
  const [deleteModal, setDeleteModal] = useState(null); // { clientId, clientName }
  const [showHistory, setShowHistory] = useState(false)
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [activeTransaction, setActiveTransaction] = useState(null); // { clientId, clientName, currentPoints, allRewards, nextTier }
  const [scanStep, setScanStep] = useState(null); // null, 'reward', 'points'
  const [isProcessing, setIsProcessing] = useState(false);
  const [loyaltyConfig, setLoyaltyConfig] = useState({
    points_adding_mode: 'automatic',
    points_per_purchase: 10,
    max_points_balance: null,
    points_shortcuts: [],
    reward_tiers: []
  })
  const [shortcutInput, setShortcutInput] = useState('')
  const [newTier, setNewTier] = useState({ points_required: '', title: '' })

  const [savingSettings, setSavingSettings] = useState(false)
  const [proxConfig, setProxConfig] = useState({ relevant_text: '', locations: [] })
  const [proxSaving, setProxSaving] = useState(false)
  const [settingsPage, setSettingsPage] = useState(null)
  const [showCreateClientModal, setShowCreateClientModal] = useState(false)
  const [createClientForm, setCreateClientForm] = useState({ nom: '', prenom: '', telephone: '', email: '', type_wallet: 'apple' })
  const [createClientLoading, setCreateClientLoading] = useState(false)
  const [expirationConfig, setExpirationConfig] = useState({ points_expiration_months: null })
  const [expirationSlider, setExpirationSlider] = useState(12)
  const [expirationIndeterminate, setExpirationIndeterminate] = useState(true)
  const [expirationSaving, setExpirationSaving] = useState(false)
  const [showResendModal, setShowResendModal] = useState(false)
  const [resendSearch, setResendSearch] = useState('')
  const [resendSelected, setResendSelected] = useState(new Set())
  const [resendLoading, setResendLoading] = useState(false)

  const navigate = useNavigate()
  const scannerRef = useRef(null)
  const scannerInstance = useRef(null)
  const qrRef = useRef(null)
  const { token, isSuspended, logout, user } = useAuth()

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-mode')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark-mode')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  const handleCreateClientSubmit = async (e) => {
    e.preventDefault()
    setCreateClientLoading(true)
    try {
      await api.post('/pro/clients/create-invite', createClientForm)
      addToast('Client créé et email d\'invitation envoyé !')
      setShowCreateClientModal(false)
      setCreateClientForm({ nom: '', prenom: '', telephone: '', email: '', type_wallet: 'apple' })
      loadClients()
    } catch (err) {
      addToast(err.response?.data?.error || 'Erreur lors de la création du client', 'error')
    } finally {
      setCreateClientLoading(false)
    }
  }

  const handleResendLinks = async () => {
    if (resendSelected.size === 0) return
    setResendLoading(true)
    try {
      const { data } = await api.post('/pro/clients/resend-links', { clientIds: Array.from(resendSelected) })
      addToast(`Liens envoyés : ${data.sent} email(s)${data.skipped > 0 ? `, ${data.skipped} ignoré(s) (sans email)` : ''}`)
      setShowResendModal(false)
      setResendSelected(new Set())
      setResendSearch('')
    } catch (err) {
      addToast(err.response?.data?.error || 'Erreur lors de l\'envoi des liens', 'error')
    } finally {
      setResendLoading(false)
    }
  }

  const addToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }

  useEffect(() => {
    if (!token) {
      navigate('/pro/login')
    } else {
      loadProInfo()
      loadClients()
      loadLoyaltyConfig()
      loadExpirationConfig()
    }
  }, [token, navigate])

  useEffect(() => {
    if (activeTab === 'scanner' && scannerActive && scannerRef.current) {
      initScanner()
    } else if (activeTab !== 'scanner') {
      destroyScanner()
    }
  }, [activeTab, scannerActive])

  const loadProInfo = async () => {
    try {
      const response = await api.get('/pro/info')
      setProInfo(response.data)
      try {
        const customResp = await api.get(`/pro/card-customization/${response.data.id}?loyaltyType=points`)
        setCustomization(customResp.data)
      } catch (err) {
        console.log('Pas de personnalisation, utiliser valeurs par défaut')
      }
      setLoading(false)
    } catch (err) {
      setPageError('Erreur lors du chargement des informations')
      setLoading(false)
    }
  }

  const loadClients = async () => {
    try {
      const response = await api.get('/pro/clients')
      setClients(response.data)
    } catch (err) {
      setPageError('Erreur lors du chargement de la liste des clients')
    }
  }

  useEffect(() => {
    if (proInfo?.id) {
      const loadProxConfig = async () => {
        try {
          const { data } = await api.get(`/pro/card-customization/${proInfo.id}?loyaltyType=${proInfo.loyalty_type || 'points'}`)
          let parsedLocs = []
          try { parsedLocs = data.locations ? (typeof data.locations === 'string' ? JSON.parse(data.locations) : data.locations) : [] } catch (e) {}
          setProxConfig({ relevant_text: data.relevant_text || '', locations: parsedLocs })
        } catch (err) {}
      }
      loadProxConfig()
    }
  }, [proInfo])

  const loadLoyaltyConfig = async () => {
    try {
      const resp = await api.get('/pro/loyalty/config')
      setLoyaltyConfig({
        ...resp.data,
        reward_tiers: resp.data.reward_tiers || []
      })
    } catch (err) {
      console.error('Erreur chargement config loyauté:', err)
    }
  }

  const loadExpirationConfig = async () => {
    try {
      const resp = await api.get('/pro/loyalty/expiration')
      const months = resp.data.points_expiration_months ?? null
      setExpirationConfig({ points_expiration_months: months })
      setExpirationIndeterminate(months === null)
      setExpirationSlider(months ?? 12)
    } catch (err) {
      console.error('Erreur chargement config expiration:', err)
    }
  }

  const handleSaveExpiration = async () => {
    setExpirationSaving(true)
    try {
      const months = expirationIndeterminate ? null : expirationSlider
      await api.put('/pro/loyalty/expiration', { points_expiration_months: months })
      setExpirationConfig({ points_expiration_months: months })
      addToast(months === null ? 'Points sans expiration enregistré' : `Expiration à ${months} mois enregistrée`)
    } catch (err) {
      addToast(err.response?.data?.error || 'Erreur lors de la sauvegarde', 'error')
    } finally {
      setExpirationSaving(false)
    }
  }

  const initScanner = async () => {
    if (!scannerRef.current) return;
    if (scannerInstance.current) return;

    try {
      const html5QrCode = new Html5Qrcode('qr-scanner');
      scannerInstance.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };
      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          html5QrCode.stop().then(() => {
            scannerInstance.current = null;
            setScannerActive(false);
            processScan(decodedText);
          });
        },
        (errorMessage) => {
        }
      );
    } catch (err) {
      console.error("Erreur démarrage scanner:", err);
      setScannerActive(false);
      alert("Impossible d'accéder à la caméra arrière.");
    }
  }

  const destroyScanner = async () => {
    if (scannerInstance.current) {
      try {
        await scannerInstance.current.stop();
        scannerInstance.current = null;
      } catch (e) {
        console.warn("Erreur stop scanner:", e);
      }
    }
  }

  const processScan = async (clientId) => {
    try {
      setLoading(true);
      const response = await api.get(`/pro/scan-lookup/${clientId}`);
      setActiveTransaction({
        ...response.data,
        clientId
      });
      setScanStep('reward');
    } catch (err) {
      addToast(err.response?.data?.error || 'Erreur lors de la lecture du QR Code', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleRewardStepChoice = async (rewardToClaim = null) => {
    if (!activeTransaction) return;

    if (rewardToClaim) {
      try {
        setIsProcessing(true);
        const response = await api.post('/pro/redeem-reward', {
          clientId: activeTransaction.clientId,
          rewardTierId: rewardToClaim.id
        });
        setActiveTransaction(prev => ({
          ...prev,
          currentPoints: prev.currentPoints - rewardToClaim.points_required
        }));

        addToast(`Cadeau "${rewardToClaim.title}" utilisé !`);
      } catch (err) {
        addToast(err.response?.data?.error || 'Erreur lors de l\'utilisation du cadeau', 'error');
        setIsProcessing(false);
        return; // On ne passe pas à la suite si erreur
      }
    }
    setPointsToAdd(loyaltyConfig.points_adding_mode === 'automatic' ? loyaltyConfig.points_per_purchase.toString() : '');
    setScanStep('points');
    setIsProcessing(false);
  }

  const handleFinalizePointsStep = async () => {
    if (!activeTransaction) return;

    try {
      setIsProcessing(true);
      const pts = Number(pointsToAdd) || 0;

      const response = await api.post('/pro/scan', {
        clientId: activeTransaction.clientId,
        points_to_add: pts
      });

      addToast(response.data.message || 'Points ajoutés !');

      setLastScan({
        success: true,
        clientName: activeTransaction.clientName,
        newPoints: response.data.newPoints,
        message: response.data.message
      });

      setScanStep(null);
      setActiveTransaction(null);
      loadClients();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erreur lors de l\'ajout des points', 'error');
    } finally {
      setIsProcessing(false);
    }
  }

  const handleManualClientScan = async (clientId) => {
    try {
      setLoading(true);
      const response = await api.get(`/pro/scan-lookup/${clientId}`);
      setActiveTransaction({
        ...response.data,
        clientId
      });
      setScanStep('reward');
    } catch (err) {
      addToast(err.response?.data?.error || 'Impossible de charger les données du client', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleRedeem = async (rewardTierId) => {
    try {
      setLoading(true)
      const response = await api.post('/pro/redeem-reward', {
        clientId: redeemModal.clientId,
        rewardTierId
      })
      setRedeemModal(null)
      setLastScan(null)
      addToast('Cadeau validé avec succès !')
      loadClients()
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors du rachat')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClient = (clientId, clientName) => {
    setDeleteModal({ clientId, clientName });
  }

  const handleConfirmDelete = async () => {
    const { clientId, clientName } = deleteModal;
    setDeleteModal(null);
    try {
      await api.delete(`/pro/clients/${clientId}`);
      setClients(prev => prev.filter(c => c.id !== clientId));
      addToast(`Le client ${clientName} a été supprimé.`, 'error');
    } catch (err) {
      console.error('Erreur suppression client:', err);
      setPageError(err.response?.data?.error || 'Erreur lors de la suppression du client');
    }
  }

  const adjustPoints = async (clientId, adjustment) => {
    try {
      await api.put(`/pro/adjust-points/${clientId}`, { adjustment })
      addToast(adjustment > 0 ? '+ points ajoutés' : '- points retirés')
      loadClients()
    } catch (err) {
      addToast(err.response?.data?.error || 'Erreur', 'error')
    }
  }

  const handleLogout = () => { logout(); navigate('/pro/login') }

  const handleExportCSV = () => {
    const headers = ['Prénom', 'Nom', 'Téléphone', 'Email', 'Points', 'Type Wallet', 'Optin Marketing']
    const rows = clients.map(c => [
      c.prenom || '',
      c.nom || '',
      c.telephone || '',
      c.email || '',
      c.points || 0,
      c.type_wallet || '',
      c.marketing_optin ? 'Oui' : 'Non'
    ])
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join('\t'))
      .join('\n')
    const BOM = new Uint8Array([0xFF, 0xFE])
    const view = new Uint16Array(csvContent.length)
    for (let i = 0; i < csvContent.length; i++) view[i] = csvContent.charCodeAt(i)
    const blob = new Blob([BOM, view], { type: 'text/csv;charset=utf-16le;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `clients-${proInfo?.nom?.toLowerCase().replace(/\s+/g, '-') || 'export'}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const handleDownloadQR = () => {
    const svg = qrRef.current.querySelector('svg')
    const svgData = new XMLSerializer().serializeToString(svg)
    const padding = 40
    const qrSize = 400
    const size = qrSize + padding * 2
    const radius = 32
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(radius, 0)
    ctx.lineTo(size - radius, 0)
    ctx.quadraticCurveTo(size, 0, size, radius)
    ctx.lineTo(size, size - radius)
    ctx.quadraticCurveTo(size, size, size - radius, size)
    ctx.lineTo(radius, size)
    ctx.quadraticCurveTo(0, size, 0, size - radius)
    ctx.lineTo(0, radius)
    ctx.quadraticCurveTo(0, 0, radius, 0)
    ctx.closePath()
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.clip()
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, padding, padding, qrSize, qrSize)
      URL.revokeObjectURL(url)
      const a = document.createElement('a')
      a.download = `qrcode-${proInfo.nom.toLowerCase().replace(/\s+/g, '-')}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    }
    img.src = url
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${proInfo.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleProxChange = (e) => {
    const { name, value } = e.target
    setProxConfig(prev => ({ ...prev, [name]: value }))
  }
  const handleProxLocationChange = (index, field, value) => {
    const updatedLocs = [...(proxConfig.locations || [])]
    let parsed = value
    if (field === 'latitude' || field === 'longitude') { parsed = value === '' ? '' : parseFloat(value); if (isNaN(parsed)) parsed = '' }
    updatedLocs[index] = { ...updatedLocs[index], [field]: parsed }
    setProxConfig(prev => ({ ...prev, locations: updatedLocs }))
  }
  const addProxLocation = () => {
    const current = proxConfig.locations || []
    if (current.length >= 10) return
    setProxConfig(prev => ({ ...prev, locations: [...current, { latitude: '', longitude: '', relevantText: '' }] }))
  }
  const removeProxLocation = (index) => {
    const updatedLocs = [...(proxConfig.locations || [])]
    updatedLocs.splice(index, 1)
    setProxConfig(prev => ({ ...prev, locations: updatedLocs }))
  }
  const handleSaveProx = async () => {
    if (!proInfo?.id) return
    setProxSaving(true)
    try {
      await api.patch(`/pro/card-customization/${proInfo.id}/gps?loyaltyType=${proInfo.loyalty_type || 'points'}`, proxConfig)
      addToast('GPS & Notifications enregistrés !')
    } catch (err) {
      addToast('Erreur lors de la sauvegarde', 'error')
    } finally {
      setProxSaving(false)
    }
  }

  const handleSaveLoyaltyConfig = async (e) => {
    e.preventDefault()
    try {
      setSavingSettings(true)
      await api.put('/pro/loyalty/config', loyaltyConfig)
      addToast('Paramètres enregistrés !')
      loadLoyaltyConfig()
    } catch (err) {
      addToast(err.response?.data?.error || 'Erreur lors de la sauvegarde', 'error')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleAddTier = async () => {
    if (!newTier.points_required || !newTier.title) return
    try {
      setSavingSettings(true)
      await api.post('/pro/reward-tiers', newTier)
      setNewTier({ points_required: '', title: '' })
      loadLoyaltyConfig()
      addToast('Palier ajouté avec succès')
    } catch (err) {
      addToast(err.response?.data?.error || "Erreur lors de l'ajout", 'error')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleDeleteTier = async (id) => {
    if (!window.confirm('Supprimer ce palier ?')) return
    try {
      setSavingSettings(true)
      await api.delete(`/pro/reward-tiers/${id}`)
      loadLoyaltyConfig()
      addToast('Palier supprimé')
    } catch (err) {
      addToast('Erreur lors de la suppression', 'error')
    } finally {
      setSavingSettings(false)
    }
  }

  const addShortcut = () => {
    const v = parseInt(shortcutInput);
    if (v > 0 && !(loyaltyConfig.points_shortcuts || []).includes(v)) {
      setLoyaltyConfig(prev => ({ ...prev, points_shortcuts: [...(prev.points_shortcuts || []), v].sort((a, b) => a - b) }));
      setShortcutInput('');
    }
  }

  const filteredClients = clients.filter(c => {
    if (!clientSearch) return true
    const s = clientSearch.toLowerCase()
    return `${c.prenom} ${c.nom}`.toLowerCase().includes(s) || c.telephone?.includes(s)
  })

  const cashResults = cashSearch.trim()
    ? clients.filter(c => {
        const s = cashSearch.toLowerCase()
        return `${c.prenom} ${c.nom}`.toLowerCase().includes(s) || c.telephone?.includes(s) || c.email?.toLowerCase().includes(s)
      }).slice(0, 6)
    : []

  const totalPoints = clients.reduce((sum, c) => sum + (Number(c.points) || 0), 0)
  const joinUrl = proInfo ? `${window.location.origin}/join/${proInfo.id}` : ''
  const companyName = proInfo?.nom || localStorage.getItem('companyName') || 'Mon commerce'
  const todayLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const selectedClient = selectedClientCard ? (clients.find(c => c.id === selectedClientCard.id) || selectedClientCard) : null

  const goTab = (id) => {
    setActiveTab(id)
    setSettingsPage(null)
    window.scrollTo({ top: 0 })
  }

  const allSections = [
    {
      items: [
        { id: 'scanner', icon: ScanLine, label: 'Caisse' },
        { id: 'clients', icon: Users, label: 'Clients', badge: clients.length || null },
        { id: 'stats', icon: TrendingUp, label: 'Statistiques' },
      ]
    },
    {
      label: 'Mon programme',
      items: [
        { id: 'register', icon: QrCode, label: 'Recruter' },
        { id: 'design', icon: Palette, label: 'Ma carte' },
        { id: 'campaigns', icon: Megaphone, label: 'Campagnes' },
        { id: 'business', icon: Sparkles, label: 'Business' },
        { id: 'settings', icon: Settings, label: 'Réglages' },
      ]
    }
  ]

  // Comptes équipe : un caissier n'a que la caisse et les clients ; aucun accès au compte du propriétaire.
  const staffRole = user?.staff_role || null
  const sections = staffRole === 'cashier'
    ? allSections.map(s => ({ ...s, items: s.items.filter(i => ['scanner', 'clients'].includes(i.id)) })).filter(s => s.items.length)
    : allSections

  const allFootItems = [
    { id: 'account', icon: CircleUser, label: 'Mon compte', onClick: () => navigate('/pro/account') },
    { id: 'theme', icon: darkMode ? Sun : Moon, label: darkMode ? 'Thème clair' : 'Thème sombre', onClick: () => setDarkMode(!darkMode) },
    { id: 'logout', icon: LogOut, label: 'Déconnexion', onClick: handleLogout, danger: true },
  ]

  const footItems = staffRole ? allFootItems.filter(i => i.id !== 'account') : allFootItems

  const topbarActions = (
    <>
      <button className="icon-btn" onClick={() => setDarkMode(!darkMode)} aria-label="Changer de thème">
        {darkMode ? <Sun size={17} /> : <Moon size={17} />}
      </button>
      {!staffRole && (
        <button className="icon-btn" onClick={() => navigate('/pro/account')} aria-label="Mon compte">
          <CircleUser size={18} />
        </button>
      )}
      <button className="icon-btn danger" onClick={handleLogout} aria-label="Déconnexion">
        <LogOut size={17} />
      </button>
    </>
  )

  const SaveButton = ({ saving, onClick, type = 'button', label = 'Enregistrer' }) => (
    <button type={type} className="ui-btn" onClick={onClick} disabled={saving}>
      {saving ? <Loader2 size={16} className="pro-spin" /> : <Save size={16} />}
      {saving ? 'Enregistrement…' : label}
    </button>
  )

  /* ───────── Pages ───────── */

  const renderCaisse = () => (
    <>
      <PageHead
        eyebrow={<><Sparkles size={14} /> {todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)}</>}
        title={<>Bonjour, <span className="pd-company">{companyName}</span></>}
        sub="Scannez la carte d'un client pour lui ajouter des points ou lui offrir une récompense."
      />
      <EstablishmentPicker user={user} />

      {lastScan && lastScan.success && !lastScan.nextTier && !lastScan.availableRewards && (
        <div className="pd-last">
          <span className="ui-icon success sm"><Check size={16} strokeWidth={2.6} /></span>
          <div className="pd-last-text">
            <strong>{lastScan.clientName}</strong>
            <span>{lastScan.message}</span>
          </div>
          {lastScan.newPoints != null && <span className="ui-badge accent">{lastScan.newPoints} pts</span>}
          <button className="icon-btn plain" onClick={() => setLastScan(null)} aria-label="Fermer"><X size={16} /></button>
        </div>
      )}

      <div className="pd-cash">
        <button className="pd-scan" onClick={() => setScannerActive(true)}>
          <span className="pd-scan-glow" aria-hidden />
          <span className="pd-scan-frame" aria-hidden>
            <i /><i /><i /><i />
            <span className="pd-scan-line" />
            <ScanLine size={44} strokeWidth={1.6} />
          </span>
          <span className="pd-scan-title">Scanner une carte</span>
          <span className="pd-scan-sub">Ouvrez la caméra et visez le QR code du pass de votre client.</span>
          <span className="pd-scan-cta">Lancer le scan <ChevronRight size={16} /></span>
        </button>

        <section className="ui-card pd-manual">
          <div className="ui-card-head">
            <div>
              <h2 className="ui-card-title">Sans scanner</h2>
              <p className="ui-card-sub">Retrouvez un client et créditez-le en un clic.</p>
            </div>
          </div>
          <div className="ui-search">
            <Search size={17} />
            <input
              className="ui-input"
              type="text"
              placeholder="Nom, téléphone ou email…"
              value={cashSearch}
              onChange={e => setCashSearch(e.target.value)}
            />
            {cashSearch && <button className="icon-btn plain" onClick={() => setCashSearch('')} aria-label="Effacer"><X size={14} /></button>}
          </div>

          <div className="pd-manual-list">
            {!cashSearch.trim() ? (
              <div className="pd-manual-hint">
                <Search size={20} />
                <span>Tapez quelques lettres pour retrouver un client.</span>
              </div>
            ) : cashResults.length === 0 ? (
              <div className="pd-manual-hint">
                <Users size={20} />
                <span>Aucun client trouvé.</span>
              </div>
            ) : cashResults.map(c => (
              <div key={c.id} className="pd-manual-row">
                <div className="ui-avatar sm">{c.prenom?.[0] || '?'}</div>
                <div className="ui-row-main">
                  <span className="ui-row-title">{c.prenom} {c.nom}</span>
                  <span className="ui-row-sub">{c.points || 0} pts</span>
                </div>
                <button className="ui-btn sm" onClick={() => handleManualClientScan(c.id)}>
                  <Plus size={15} /> Créditer
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="ui-grid ui-grid-3 pd-kpis">
        <button className="kpi pd-kpi-link" onClick={() => goTab('clients')}>
          <span className="kpi-label"><Users size={15} /> Clients</span>
          <span className="kpi-value">{clients.length.toLocaleString('fr-FR')}</span>
          <span className="kpi-sub">Voir la liste <ChevronRight size={12} /></span>
        </button>
        <div className="kpi">
          <span className="kpi-label"><Coins size={15} /> Points en circulation</span>
          <span className="kpi-value">{totalPoints.toLocaleString('fr-FR')}</span>
          <span className="kpi-sub">Sur l'ensemble de vos clients</span>
        </div>
        <button className="kpi pd-kpi-link" onClick={() => { goTab('settings'); setSettingsPage('programme') }}>
          <span className="kpi-label"><Zap size={15} /> Attribution</span>
          <span className="kpi-value">
            {loyaltyConfig.points_adding_mode === 'automatic' ? `+${loyaltyConfig.points_per_purchase}` : 'Libre'}
          </span>
          <span className="kpi-sub">
            {loyaltyConfig.points_adding_mode === 'automatic' ? 'Points par passage' : 'Montant saisi à chaque scan'} <ChevronRight size={12} />
          </span>
        </button>
      </div>
    </>
  )

  const renderClients = () => (
    <>
      <PageHead
        eyebrow={<><Users size={14} /> Fichier clients</>}
        title="Clients"
        sub={`${clients.length} client${clients.length > 1 ? 's' : ''} inscrit${clients.length > 1 ? 's' : ''} à votre programme.`}
        actions={
          <>
            {clients.length > 0 && (
              <button className="ui-btn secondary" onClick={handleExportCSV}>
                <Download size={16} /> Exporter
              </button>
            )}
            <button className="ui-btn" onClick={() => setShowCreateClientModal(true)}>
              <UserPlus size={16} /> Nouveau client
            </button>
          </>
        }
      />

      <div className="pd-toolbar">
        <div className="ui-search">
          <Search size={17} />
          <input
            className="ui-input"
            type="text"
            placeholder="Rechercher par nom ou téléphone…"
            value={clientSearch}
            onChange={e => setClientSearch(e.target.value)}
          />
          {clientSearch && <button className="icon-btn plain" onClick={() => setClientSearch('')} aria-label="Effacer"><X size={14} /></button>}
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="ui-card">
          <div className="ui-empty">
            <span className="ui-icon lg neutral"><Users size={24} /></span>
            <p className="ui-empty-title">{clientSearch ? 'Aucun résultat' : 'Aucun client pour le moment'}</p>
            <p>{clientSearch ? 'Essayez un autre nom ou numéro.' : 'Partagez votre QR code ou créez un client pour démarrer.'}</p>
            {!clientSearch && (
              <button className="ui-btn sm" onClick={() => goTab('register')}><QrCode size={15} /> Recruter des clients</button>
            )}
          </div>
        </div>
      ) : (
        <div className="ui-card flush">
          <div className="ui-list">
            {filteredClients.map(client => (
              <div className="ui-row clickable pd-client" key={client.id} onClick={() => setSelectedClientCard(client)}>
                <div className="ui-avatar">{client.prenom?.[0] || '?'}</div>
                <div className="ui-row-main">
                  <span className="ui-row-title">
                    {client.prenom} {client.nom}
                    {!client.marketing_optin && (
                      <span className="ui-badge danger" title="Ce client n'a pas consenti aux communications marketing">Opt-in refusé</span>
                    )}
                  </span>
                  <span className="ui-row-sub">
                    {client.telephone && <span><Phone size={12} /> {client.telephone}</span>}
                    {client.email && <span className="pd-hide-sm"><Mail size={12} /> {client.email}</span>}
                  </span>
                </div>
                <span className="ui-points"><strong>{client.points || 0}</strong><span>pts</span></span>
                <div className="ui-row-actions" onClick={e => e.stopPropagation()}>
                  <button className="icon-btn pd-hide-sm" onClick={() => adjustPoints(client.id, -1)} title="Retirer 1 point"><Minus size={15} /></button>
                  <button className="icon-btn pd-hide-sm" onClick={() => adjustPoints(client.id, 1)} title="Ajouter 1 point"><Plus size={15} /></button>
                  <button className="icon-btn accent" onClick={() => handleManualClientScan(client.id)} title="Créditer des points"><Coins size={15} /></button>
                  <button className="icon-btn danger pd-hide-sm" onClick={() => handleDeleteClient(client.id, `${client.prenom} ${client.nom}`)} title="Supprimer le client"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )

  const renderRecruter = () => (
    <>
      <PageHead
        eyebrow={<><QrCode size={14} /> Recrutement</>}
        title="Recruter des clients"
        sub="Affichez ce QR code en caisse ou partagez le lien : vos clients ajoutent leur carte en quelques secondes, sans application."
      />

      <div className="pd-recruit">
        <section className="ui-card pad-lg pd-qr-card">
          <div className="pd-qr" ref={qrRef}>
            {proInfo ? (
              <QRCodeSVG value={joinUrl} size={220} level="H" includeMargin={false} />
            ) : (
              <div className="pd-qr-placeholder"><Loader2 size={24} className="pro-spin" /></div>
            )}
          </div>
          <div className="pd-qr-name">{companyName}</div>
          <p className="pd-qr-caption">Scannez pour obtenir votre carte de fidélité</p>
          {proInfo && (
            <button className="ui-btn secondary" onClick={handleDownloadQR}>
              <Download size={16} /> Télécharger en PNG
            </button>
          )}
        </section>

        <div className="pd-recruit-side">
          <section className="ui-card">
            <div className="ui-card-head">
              <div>
                <h2 className="ui-card-title">Lien d'inscription</h2>
                <p className="ui-card-sub">À partager par SMS, email ou sur vos réseaux.</p>
              </div>
            </div>
            <div className="pd-link">
              <input className="ui-input" type="text" readOnly value={joinUrl} onFocus={e => e.target.select()} />
              <button className={`ui-btn${copied ? ' secondary' : ''}`} onClick={handleCopyLink} disabled={!proInfo}>
                {copied ? <><Check size={16} /> Copié</> : <><Copy size={16} /> Copier</>}
              </button>
            </div>
          </section>

          <div className="section-title">Actions directes</div>
          <div className="pd-actions">
            <button className="ui-hub-item" onClick={() => setShowCreateClientModal(true)}>
              <span className="ui-icon"><UserPlus size={19} /></span>
              <span className="ui-hub-text">
                <span className="ui-hub-title">Créer un client</span>
                <span className="ui-hub-desc">Enregistrez un client et envoyez-lui sa carte par email.</span>
              </span>
              <ChevronRight size={18} className="chev" />
            </button>
            <button className="ui-hub-item" onClick={() => { setShowResendModal(true); setResendSearch(''); setResendSelected(new Set()) }}>
              <span className="ui-icon gold"><Send size={18} /></span>
              <span className="ui-hub-text">
                <span className="ui-hub-title">Renvoyer un lien</span>
                <span className="ui-hub-desc">Renvoyez le lien de la carte à un ou plusieurs clients.</span>
              </span>
              <ChevronRight size={18} className="chev" />
            </button>
          </div>
        </div>
      </div>
    </>
  )

  const settingsHub = [
    { id: 'programme', icon: Award, tone: '', title: 'Programme de fidélité', desc: 'Points par passage, paliers de récompenses, solde maximum' },
    { id: 'notifications', icon: Bell, tone: 'gold', title: 'Notifications push', desc: "Message promotionnel affiché sur l'écran verrouillé" },
    { id: 'expiration', icon: Hourglass, tone: 'neutral', title: 'Expiration des points', desc: 'Durée de validité des points de vos clients' },
    { id: 'geolocalisation', icon: MapPin, tone: '', title: 'Géolocalisation', desc: 'La carte apparaît quand le client passe devant chez vous' },
    { id: 'historique', icon: History, tone: 'gold', title: 'Historique', desc: 'Points ajoutés, cadeaux utilisés, retraits', onClick: () => setShowHistory(true) },
    { id: 'statistiques', icon: TrendingUp, tone: 'neutral', title: 'Statistiques', desc: 'Activité, clients, récompenses et tendances', onClick: () => goTab('stats') },
    { id: 'campagnes', icon: Megaphone, tone: 'gold', title: 'Campagnes', desc: 'Envoyer une notification promotionnelle à vos clients', onClick: () => goTab('campaigns') },
    { id: 'business', icon: Sparkles, tone: '', title: 'Espace Business', desc: 'Clients à relancer, indicateurs avancés, exports CSV', onClick: () => goTab('business') },
  ]

  const backToSettings = () => { setSettingsPage(null); window.scrollTo({ top: 0 }) }

  const renderSettings = () => {
    if (!settingsPage) {
      return (
        <>
          <PageHead
            eyebrow={<><Settings size={14} /> Configuration</>}
            title="Réglages"
            sub="Tout ce qui fait fonctionner votre programme de fidélité."
          />
          <nav className="ui-hub">
            {settingsHub.map(item => (
              <button key={item.id} className="ui-hub-item" onClick={item.onClick || (() => { setSettingsPage(item.id); window.scrollTo({ top: 0 }) })}>
                <span className={`ui-icon ${item.tone}`}><item.icon size={19} /></span>
                <span className="ui-hub-text">
                  <span className="ui-hub-title">{item.title}</span>
                  <span className="ui-hub-desc">{item.desc}</span>
                </span>
                <ChevronRight size={18} className="chev" />
              </button>
            ))}
          </nav>
        </>
      )
    }

    if (settingsPage === 'programme') {
      const shortcuts = loyaltyConfig.points_shortcuts || []
      return (
        <>
          <PageHead onBack={backToSettings} backLabel="Réglages" title="Programme de fidélité" sub="Comment vos clients gagnent des points et ce qu'ils peuvent obtenir." />
          <div className="pd-settings-grid">
            <form onSubmit={handleSaveLoyaltyConfig} className="ui-card">
              <div className="ui-card-head">
                <h2 className="ui-card-title"><span className="ui-icon sm"><Coins size={16} /></span> Attribution des points</h2>
              </div>

              <div className="ui-choice-grid">
                <button type="button"
                  className={`ui-choice${loyaltyConfig.points_adding_mode === 'automatic' ? ' on' : ''}`}
                  onClick={() => setLoyaltyConfig({ ...loyaltyConfig, points_adding_mode: 'automatic' })}>
                  <span className="ui-choice-title"><Zap size={16} /> Automatique</span>
                  <span className="ui-choice-desc">Le même nombre de points à chaque passage.</span>
                </button>
                <button type="button"
                  className={`ui-choice${loyaltyConfig.points_adding_mode === 'manual' ? ' on' : ''}`}
                  onClick={() => setLoyaltyConfig({ ...loyaltyConfig, points_adding_mode: 'manual' })}>
                  <span className="ui-choice-title"><Coins size={16} /> Manuel</span>
                  <span className="ui-choice-desc">Vous saisissez le montant à chaque scan.</span>
                </button>
              </div>

              {loyaltyConfig.points_adding_mode === 'automatic' && (
                <div className="ui-field pd-field">
                  <label className="ui-label">Points par passage</label>
                  <div className="ui-input-row">
                    <input className="ui-input num" type="number" min="1"
                      value={loyaltyConfig.points_per_purchase}
                      onChange={e => setLoyaltyConfig({ ...loyaltyConfig, points_per_purchase: parseInt(e.target.value) })} />
                    <span className="ui-unit">points à chaque scan</span>
                  </div>
                </div>
              )}

              {loyaltyConfig.points_adding_mode === 'manual' && (
                <div className="ui-field pd-field">
                  <label className="ui-label">Boutons rapides au moment du scan</label>
                  <div className="ui-chips">
                    {shortcuts.map((v, i) => (
                      <span key={i} className="ui-chip">
                        +{v}
                        <button type="button" aria-label={`Retirer ${v}`}
                          onClick={() => setLoyaltyConfig(prev => ({ ...prev, points_shortcuts: prev.points_shortcuts.filter((_, j) => j !== i) }))}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    {!shortcuts.length && <span className="ui-hint">Par défaut : +5, +10, +20, +50</span>}
                  </div>
                  <div className="ui-input-row">
                    <input className="ui-input num" type="number" min="1" placeholder="25"
                      value={shortcutInput} onChange={e => setShortcutInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addShortcut() } }} />
                    <button type="button" className="ui-btn secondary sm" onClick={addShortcut}><Plus size={14} /> Ajouter</button>
                    {shortcuts.length > 0 && (
                      <button type="button" className="ui-btn ghost sm"
                        onClick={() => setLoyaltyConfig(prev => ({ ...prev, points_shortcuts: [] }))}>Réinitialiser</button>
                    )}
                  </div>
                </div>
              )}

              <div className="ui-field pd-field pd-sep">
                <label className="ui-label">
                  Solde maximum par client
                  {loyaltyConfig.max_points_balance
                    ? <span className="ui-badge accent">{loyaltyConfig.max_points_balance} pts max</span>
                    : <span className="ui-badge">Illimité</span>}
                </label>
                <div className="ui-input-row">
                  <input className="ui-input num" type="number" min="1" placeholder="Illimité"
                    value={loyaltyConfig.max_points_balance ?? ''}
                    onChange={e => setLoyaltyConfig({
                      ...loyaltyConfig,
                      max_points_balance: e.target.value === '' ? null : Math.max(1, parseInt(e.target.value) || 1)
                    })} />
                  <span className="ui-unit">pts</span>
                  {loyaltyConfig.max_points_balance != null && (
                    <button type="button" className="ui-btn ghost sm"
                      onClick={() => setLoyaltyConfig({ ...loyaltyConfig, max_points_balance: null })}>Désactiver</button>
                  )}
                </div>
                <p className="ui-hint">Laissez vide pour ne fixer aucune limite.</p>
              </div>

              <div className="pd-form-foot">
                <SaveButton type="submit" saving={savingSettings} />
              </div>
            </form>

            <section className="ui-card">
              <div className="ui-card-head">
                <h2 className="ui-card-title"><span className="ui-icon sm gold"><Gift size={16} /></span> Paliers de récompenses</h2>
                <span className="ui-badge">{loyaltyConfig.reward_tiers.length}</span>
              </div>

              {loyaltyConfig.reward_tiers.length === 0 ? (
                <div className="pd-tier-empty">
                  <Gift size={22} />
                  <span>Ajoutez votre première récompense, par exemple « Café offert » à 100 points.</span>
                </div>
              ) : (
                <div className="pd-tiers">
                  {[...loyaltyConfig.reward_tiers].sort((a, b) => a.points_required - b.points_required).map(tier => (
                    <div key={tier.id} className="pd-tier">
                      <div className="pd-tier-pts">{tier.points_required}<span>pts</span></div>
                      <span className="pd-tier-title">{tier.title}</span>
                      <button className="icon-btn plain danger" onClick={() => handleDeleteTier(tier.id)} aria-label="Supprimer le palier"><Trash2 size={15} /></button>
                    </div>
                  ))}
                </div>
              )}

              <div className="pd-tier-add">
                <input className="ui-input num" type="number" placeholder="Points"
                  value={newTier.points_required} onChange={e => setNewTier({ ...newTier, points_required: e.target.value })} />
                <input className="ui-input" type="text" placeholder="Récompense (ex : Café offert)"
                  value={newTier.title} onChange={e => setNewTier({ ...newTier, title: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTier() } }} />
                <button className="ui-btn" onClick={handleAddTier} disabled={savingSettings || !newTier.points_required || !newTier.title}>
                  <Plus size={16} /> Ajouter
                </button>
              </div>
            </section>
          </div>
        </>
      )
    }

    if (settingsPage === 'notifications') {
      return (
        <>
          <PageHead onBack={backToSettings} backLabel="Réglages" title="Notifications push" sub="Le message qui s'affiche sur l'écran verrouillé de vos clients lors d'une promotion." />
          <div className="pd-settings-grid">
            <section className="ui-card">
              <div className="ui-field">
                <label className="ui-label">
                  Texte de la promotion
                  <span className="ui-count">{(proxConfig.relevant_text || '').length}/100</span>
                </label>
                <textarea className="ui-textarea" name="relevant_text"
                  value={proxConfig.relevant_text} onChange={handleProxChange}
                  placeholder="Ex : -20 % sur tout le magasin ce week-end !"
                  rows={4} maxLength={100} />
              </div>
              <div className="ui-note pd-field">
                <Info size={15} />
                <span><strong>Apple Wallet</strong> : notification directe sur l'écran verrouillé. <strong>Google Wallet</strong> : notification de mise à jour sur Android.</span>
              </div>
              <div className="pd-form-foot">
                <SaveButton saving={proxSaving} onClick={handleSaveProx} />
              </div>
            </section>

            <section className="pd-lock">
              <div className="pd-lock-time">9:41</div>
              <div className="pd-lock-date">{todayLabel}</div>
              <div className="pd-notif">
                <span className="pd-notif-app" aria-hidden><i /><i /><i /></span>
                <div className="pd-notif-body">
                  <div className="pd-notif-top"><strong>{companyName}</strong><span>maintenant</span></div>
                  <p>{proxConfig.relevant_text || 'Votre message apparaîtra ici.'}</p>
                </div>
              </div>
              <span className="pd-lock-caption">Aperçu sur iPhone</span>
            </section>
          </div>
        </>
      )
    }

    if (settingsPage === 'expiration') {
      return (
        <>
          <PageHead onBack={backToSettings} backLabel="Réglages" title="Expiration des points" sub="Définissez combien de temps les points de vos clients restent valables." />
          <section className="ui-card pd-narrow">
            <div className="ui-switch-row" onClick={() => setExpirationIndeterminate(v => !v)}>
              <span className="ui-switch-text">
                <span className="ui-switch-title">Points sans expiration</span>
                <span className="ui-switch-desc">Les points restent valables indéfiniment.</span>
              </span>
              <button type="button" className={`ui-switch${expirationIndeterminate ? ' on' : ''}`} aria-pressed={expirationIndeterminate} aria-label="Points sans expiration" />
            </div>

            {!expirationIndeterminate ? (
              <div className="pd-expire">
                <div className="pd-expire-value">
                  <strong>{expirationSlider}</strong>
                  <span>mois</span>
                </div>
                <input
                  type="range"
                  className="pd-range"
                  min={1}
                  max={36}
                  value={expirationSlider}
                  onChange={e => setExpirationSlider(Number(e.target.value))}
                  style={{ '--fill': `${((expirationSlider - 1) / 35) * 100}%` }}
                />
                <div className="pd-range-scale"><span>1 mois</span><span>18 mois</span><span>36 mois</span></div>
                <div className="ui-note">
                  <Hourglass size={15} />
                  <span>Les points expirés sont retirés automatiquement chaque nuit. Vos clients reçoivent une notification 7 jours avant.</span>
                </div>
              </div>
            ) : (
              <div className="ui-note pd-field">
                <Info size={15} />
                <span>Les points de vos clients n'expirent jamais.</span>
              </div>
            )}

            <div className="pd-form-foot">
              <SaveButton saving={expirationSaving} onClick={handleSaveExpiration} />
            </div>
          </section>
        </>
      )
    }

    if (settingsPage === 'geolocalisation') {
      const locations = proxConfig.locations || []
      return (
        <>
          <PageHead
            onBack={backToSettings}
            backLabel="Réglages"
            title="Géolocalisation"
            sub="Quand un client passe près d'un de vos lieux, sa carte s'affiche sur l'écran verrouillé avec votre message."
            actions={
              <button type="button" className="ui-btn secondary" onClick={addProxLocation} disabled={locations.length >= 10}>
                <Plus size={16} /> Ajouter un lieu
              </button>
            }
          />

          <div className="pd-locs-head">
            <span className="ui-badge">{locations.length}/10 lieux</span>
          </div>

          {locations.length === 0 ? (
            <div className="ui-card">
              <div className="ui-empty">
                <span className="ui-icon lg"><Navigation size={24} /></span>
                <p className="ui-empty-title">Aucun lieu configuré</p>
                <p>Ajoutez l'adresse de votre boutique pour rappeler votre carte à vos clients de passage.</p>
                <button className="ui-btn sm" onClick={addProxLocation}><Plus size={15} /> Ajouter un lieu</button>
              </div>
            </div>
          ) : (
            <div className="pd-locs">
              {locations.map((loc, index) => (
                <section key={index} className="ui-card pd-loc">
                  <div className="pd-loc-head">
                    <span className="ui-icon sm"><MapPin size={16} /></span>
                    <strong>Lieu {index + 1}</strong>
                    <button className="icon-btn plain danger" onClick={() => removeProxLocation(index)} aria-label="Supprimer le lieu"><Trash2 size={15} /></button>
                  </div>
                  <div className="ui-grid ui-grid-2">
                    <div className="ui-field">
                      <label className="ui-label">Latitude</label>
                      <input className="ui-input" type="number" step="any"
                        value={loc.latitude ?? ''}
                        onChange={e => handleProxLocationChange(index, 'latitude', e.target.value)}
                        placeholder="48.8566" />
                    </div>
                    <div className="ui-field">
                      <label className="ui-label">Longitude</label>
                      <input className="ui-input" type="number" step="any"
                        value={loc.longitude ?? ''}
                        onChange={e => handleProxLocationChange(index, 'longitude', e.target.value)}
                        placeholder="2.3522" />
                    </div>
                  </div>
                  <div className="ui-field pd-field">
                    <label className="ui-label">Message sur l'écran verrouillé</label>
                    <input className="ui-input" type="text"
                      value={loc.relevantText || ''}
                      onChange={e => handleProxLocationChange(index, 'relevantText', e.target.value)}
                      placeholder="Ex : Bienvenue ! N'oubliez pas votre carte." />
                  </div>
                </section>
              ))}
            </div>
          )}

          <div className="ui-note pd-field">
            <Globe size={15} />
            <span>Trouvez les coordonnées sur <strong>Google Maps</strong> : clic droit sur votre boutique, puis cliquez sur les chiffres affichés pour les copier.</span>
          </div>

          <div className="pd-form-foot">
            <SaveButton saving={proxSaving} onClick={handleSaveProx} />
          </div>
        </>
      )
    }

    return null
  }

  const renderStats = () => (
    <>
      <PageHead
        eyebrow={<><TrendingUp size={14} /> Analyse</>}
        title="Statistiques"
        sub="L'activité de votre programme de fidélité, en un coup d'œil."
      />
      <StatsPanel />
    </>
  )

  const renderDesign = () => (
    <>
      <PageHead
        eyebrow={<><Palette size={14} /> Personnalisation</>}
        title="Ma carte"
        sub="Couleurs, logo, bannière et textes : votre carte Apple Wallet et Google Wallet, à l'image de votre commerce."
      />
      <CardCustomizer proInfo={proInfo} />
    </>
  )

  const renderCampaigns = () => (
    <>
      <PageHead
        eyebrow={<><Megaphone size={14} /> Marketing</>}
        title="Campagnes"
        sub="Des notifications utiles, en nombre limité, pour ne jamais lasser vos clients."
      />
      <CampaignsPanel />
    </>
  )

  const renderBusiness = () => (
    <>
      <PageHead
        eyebrow={<><Sparkles size={14} /> Offre Business</>}
        title="Espace Business"
        sub="Pilotez la fidélité de vos clients avec des indicateurs avancés."
      />
      {user ? <BusinessPanel tier={user.tier} staffRole={staffRole} /> : <div className="ui-card"><div className="ui-loading">Chargement…</div></div>}
    </>
  )

  const pages = {
    scanner: renderCaisse,
    clients: renderClients,
    stats: renderStats,
    register: renderRecruter,
    design: renderDesign,
    settings: renderSettings,
    campaigns: renderCampaigns,
    business: renderBusiness,
  }

  /* ───────── Rendu ───────── */

  const resendFiltered = clients.filter(c => {
    if (!c.email) return false
    const q = resendSearch.toLowerCase()
    return !q || `${c.prenom} ${c.nom}`.toLowerCase().includes(q) || c.email.includes(q)
  })
  const resendAllSelected = resendFiltered.length > 0 && resendFiltered.every(c => resendSelected.has(c.id))

  return (
    <AppShell
      brandTitle={companyName}
      brandSub="Espace Pro · Fidelyz"
      sections={sections}
      active={activeTab}
      onSelect={goTab}
      footItems={footItems}
      tabbarIds={['scanner', 'clients', 'register', 'design', 'settings']}
      topbarActions={topbarActions}
    >
      {/* Notifications */}
      <div className="ui-toasts">
        {toasts.map(t => (
          <div key={t.id} className={`ui-toast ${t.type}`}>
            {t.type === 'success' ? <Check size={18} strokeWidth={2.6} /> : <AlertCircle size={18} />}
            <span>{t.message}</span>
            <button className="icon-btn" onClick={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))} aria-label="Fermer">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {isSuspended && (
        <div className="ui-banner">
          <AlertCircle size={22} />
          <div>
            <strong>Compte suspendu</strong>
            <p>Contactez l'administrateur pour plus d'informations.</p>
          </div>
        </div>
      )}

      {!staffRole && <PlanBanner refreshKey={clients.length} />}

      {pageError && (
        <div className="ui-alert error">
          <AlertCircle size={18} /> <span>{pageError}</span>
          <button className="icon-btn" onClick={() => setPageError('')} aria-label="Fermer"><X size={14} /></button>
        </div>
      )}

      {loading ? (
        <div className="pro-loading">
          <Loader2 size={26} className="pro-spin" />
          <p>Chargement…</p>
        </div>
      ) : (
        <div className="pd-page" style={{ opacity: isSuspended ? 0.4 : 1, pointerEvents: isSuspended ? 'none' : 'auto' }}>
          {pages[activeTab]()}
        </div>
      )}

      {/* ===== SCANNER PLEIN ÉCRAN ===== */}
      {scannerActive && activeTab === 'scanner' && (
        <div className="pd-scanner">
          <div className="pd-scanner-head">
            <button onClick={() => setScannerActive(false)} className="icon-btn" aria-label="Fermer le scanner">
              <X size={20} />
            </button>
            <span>Scan en cours</span>
            <span style={{ width: 36 }} />
          </div>
          <div className="pd-scanner-view">
            <div id="qr-scanner" ref={scannerRef} className="pd-scanner-reader"></div>
            <div className="pd-scanner-frame"><i /><i /><i /><i /><span className="pd-scan-line" /></div>
          </div>
          <div className="pd-scanner-foot">Placez le QR code du pass dans le cadre</div>
        </div>
      )}

      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}

      {/* ===== FICHE CLIENT ===== */}
      {selectedClient && (
        <div className="ui-overlay" onClick={() => setSelectedClientCard(null)}>
          <div className="ui-modal" onClick={e => e.stopPropagation()}>
            <div className="ui-modal-head">
              <span className="ui-modal-head-text" />
              <button className="icon-btn" onClick={() => setSelectedClientCard(null)} aria-label="Fermer"><X size={18} /></button>
            </div>
            <div className="ui-modal-center pd-client-sheet">
              <div className="ui-avatar lg">{selectedClient.prenom?.[0] || '?'}</div>
              <h3 className="ui-modal-title">{selectedClient.prenom} {selectedClient.nom}</h3>
              <div className="pd-client-points">
                <button className="icon-btn" onClick={() => adjustPoints(selectedClient.id, -1)} aria-label="Retirer 1 point"><Minus size={18} /></button>
                <div className="pd-client-points-value">
                  <strong>{selectedClient.points || 0}</strong>
                  <span>points</span>
                </div>
                <button className="icon-btn accent" onClick={() => adjustPoints(selectedClient.id, 1)} aria-label="Ajouter 1 point"><Plus size={18} /></button>
              </div>
              <div className="pd-client-info">
                {selectedClient.telephone && <div><Phone size={14} /><span>{selectedClient.telephone}</span></div>}
                {selectedClient.email && <div><Mail size={14} /><span>{selectedClient.email}</span></div>}
                {!selectedClient.marketing_optin && <div><AlertCircle size={14} /><span>N'a pas consenti aux communications marketing</span></div>}
              </div>
            </div>
            <div className="ui-modal-foot">
              <button className="ui-btn danger" onClick={() => { const c = selectedClient; setSelectedClientCard(null); handleDeleteClient(c.id, `${c.prenom} ${c.nom}`) }}>
                <Trash2 size={16} /> Supprimer
              </button>
              <button className="ui-btn" onClick={() => { const id = selectedClient.id; setSelectedClientCard(null); handleManualClientScan(id) }}>
                <Coins size={16} /> Créditer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CONFIRMATION SUPPRESSION ===== */}
      {deleteModal && (
        <div className="ui-overlay" style={{ zIndex: 1100 }} onClick={() => setDeleteModal(null)}>
          <div className="ui-modal" onClick={e => e.stopPropagation()}>
            <div className="ui-modal-center">
              <span className="ui-icon lg danger"><Trash2 size={24} /></span>
              <h3 className="ui-modal-title">Supprimer {deleteModal.clientName} ?</h3>
              <p>Sa carte de fidélité et son historique seront définitivement supprimés.</p>
            </div>
            <div className="ui-modal-foot pd-foot-plain">
              <button className="ui-btn secondary" onClick={() => setDeleteModal(null)}>Annuler</button>
              <button className="ui-btn danger-solid" onClick={handleConfirmDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CRÉER UN CLIENT ===== */}
      {showCreateClientModal && (
        <div className="ui-overlay" style={{ zIndex: 1100 }} onClick={() => setShowCreateClientModal(false)}>
          <form className="ui-modal" onClick={e => e.stopPropagation()} onSubmit={handleCreateClientSubmit}>
            <div className="ui-modal-head">
              <span className="ui-icon"><UserPlus size={19} /></span>
              <div className="ui-modal-head-text">
                <h3 className="ui-modal-title">Nouveau client</h3>
                <p className="ui-modal-sub">Il recevra sa carte par email.</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setShowCreateClientModal(false)} aria-label="Fermer"><X size={18} /></button>
            </div>
            <div className="ui-modal-body">
              <div className="ui-grid ui-grid-2">
                <div className="ui-field">
                  <label className="ui-label">Prénom</label>
                  <input className="ui-input" type="text" required maxLength={50} value={createClientForm.prenom} onChange={e => setCreateClientForm(f => ({ ...f, prenom: e.target.value }))} placeholder="Jean" autoFocus />
                </div>
                <div className="ui-field">
                  <label className="ui-label">Nom</label>
                  <input className="ui-input" type="text" required maxLength={50} value={createClientForm.nom} onChange={e => setCreateClientForm(f => ({ ...f, nom: e.target.value }))} placeholder="Dupont" />
                </div>
              </div>
              <div className="ui-field pd-field">
                <label className="ui-label">Téléphone</label>
                <input
                  className="ui-input"
                  type="tel"
                  required
                  minLength={10}
                  maxLength={14}
                  inputMode="numeric"
                  value={createClientForm.telephone}
                  onChange={e => setCreateClientForm(f => ({ ...f, telephone: e.target.value }))}
                  placeholder="06 12 34 56 78"
                />
              </div>
              <div className="ui-field pd-field">
                <label className="ui-label">Email</label>
                <input className="ui-input" type="email" required maxLength={100} value={createClientForm.email} onChange={e => setCreateClientForm(f => ({ ...f, email: e.target.value }))} placeholder="jean.dupont@email.com" />
              </div>
              <div className="ui-field pd-field">
                <label className="ui-label">Téléphone du client</label>
                <div className="ui-choice-grid">
                  {[
                    { key: 'apple', logo: appleLogo, label: 'iPhone', sub: 'Apple Wallet' },
                    { key: 'google', logo: googleLogo, label: 'Android', sub: 'Google Wallet' },
                  ].map(({ key, logo, label, sub }) => (
                    <button
                      key={key}
                      type="button"
                      className={`ui-choice${createClientForm.type_wallet === key ? ' on' : ''}`}
                      onClick={() => setCreateClientForm(f => ({ ...f, type_wallet: key }))}
                    >
                      <span className="ui-choice-title">
                        <img src={logo} alt="" className={darkMode && key === 'apple' ? 'pd-invert' : ''} /> {label}
                      </span>
                      <span className="ui-choice-desc">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="ui-modal-foot">
              <button type="button" className="ui-btn secondary" onClick={() => setShowCreateClientModal(false)}>Annuler</button>
              <button type="submit" className="ui-btn" disabled={createClientLoading}>
                {createClientLoading ? <><Loader2 size={15} className="pro-spin" /> Création…</> : <><Send size={15} /> Créer et envoyer</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===== RENVOYER UN LIEN ===== */}
      {showResendModal && (
        <div className="ui-overlay" style={{ zIndex: 1100 }} onClick={() => setShowResendModal(false)}>
          <div className="ui-modal wide" onClick={e => e.stopPropagation()}>
            <div className="ui-modal-head">
              <span className="ui-icon gold"><Send size={18} /></span>
              <div className="ui-modal-head-text">
                <h3 className="ui-modal-title">Renvoyer un lien</h3>
                <p className="ui-modal-sub">Les points de vos clients sont conservés.</p>
              </div>
              <button className="icon-btn" onClick={() => setShowResendModal(false)} aria-label="Fermer"><X size={18} /></button>
            </div>

            <div className="pd-resend-tools">
              <div className="ui-search">
                <Search size={17} />
                <input className="ui-input" type="text" placeholder="Rechercher un client…" value={resendSearch} onChange={e => setResendSearch(e.target.value)} />
                {resendSearch && <button className="icon-btn plain" onClick={() => setResendSearch('')} aria-label="Effacer"><X size={14} /></button>}
              </div>
              <div className="pd-resend-bar">
                <label className="pd-check">
                  <input type="checkbox" checked={resendAllSelected} onChange={() => {
                    if (resendAllSelected) {
                      setResendSelected(prev => { const s = new Set(prev); resendFiltered.forEach(c => s.delete(c.id)); return s })
                    } else {
                      setResendSelected(prev => { const s = new Set(prev); resendFiltered.forEach(c => s.add(c.id)); return s })
                    }
                  }} />
                  Tout sélectionner <span>({resendFiltered.length} avec email)</span>
                </label>
                {resendSelected.size > 0 && (
                  <span className="ui-badge accent">{resendSelected.size} sélectionné{resendSelected.size > 1 ? 's' : ''}</span>
                )}
              </div>
            </div>

            <div className="ui-modal-body pd-resend-list">
              {resendFiltered.length === 0 ? (
                <div className="ui-empty">
                  <span className="ui-icon lg neutral"><Mail size={22} /></span>
                  <p>{resendSearch ? 'Aucun résultat' : 'Aucun client avec une adresse email'}</p>
                </div>
              ) : resendFiltered.map(client => (
                <label key={client.id} className={`pd-pick${resendSelected.has(client.id) ? ' on' : ''}`}>
                  <input type="checkbox" checked={resendSelected.has(client.id)} onChange={() => setResendSelected(prev => {
                    const s = new Set(prev); s.has(client.id) ? s.delete(client.id) : s.add(client.id); return s
                  })} />
                  <div className="ui-avatar sm">{client.prenom?.[0]?.toUpperCase() || '?'}</div>
                  <div className="ui-row-main">
                    <span className="ui-row-title">{client.prenom} {client.nom}</span>
                    <span className="ui-row-sub"><span><Mail size={11} /> {client.email}</span></span>
                  </div>
                  <span className="ui-badge">{client.points || 0} pts</span>
                </label>
              ))}
            </div>

            <div className="ui-modal-foot">
              <button className="ui-btn secondary" onClick={() => setShowResendModal(false)}>Annuler</button>
              <button className="ui-btn" disabled={resendSelected.size === 0 || resendLoading} onClick={handleResendLinks}>
                {resendLoading
                  ? <><Loader2 size={15} className="pro-spin" /> Envoi…</>
                  : `Envoyer à ${resendSelected.size || 0} client${resendSelected.size > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ÉTAPE 1 : RÉCOMPENSE ===== */}
      {scanStep === 'reward' && activeTransaction && (
        <div className="ui-overlay" style={{ zIndex: 1200 }}>
          <div className="ui-modal">
            <div className="ui-modal-head">
              <div className="ui-avatar">{activeTransaction.clientName?.[0] || '?'}</div>
              <div className="ui-modal-head-text">
                <h3 className="ui-modal-title">{activeTransaction.clientName}</h3>
                <p className="ui-modal-sub"><strong className="pd-strong">{activeTransaction.currentPoints} pts</strong> disponibles</p>
              </div>
              <button className="icon-btn" onClick={() => { setScanStep(null); setActiveTransaction(null); }} aria-label="Annuler"><X size={18} /></button>
            </div>

            <div className="pd-steps" aria-hidden><span className="on" /><span /></div>

            <div className="ui-modal-body">
              <p className="pd-step-q">Utiliser une récompense aujourd'hui ?</p>
              {activeTransaction.allRewards.length === 0 ? (
                <div className="pd-tier-empty"><Gift size={20} /><span>Aucune récompense configurée.</span></div>
              ) : (
                <div className="pd-rewards">
                  {activeTransaction.allRewards.map(reward => {
                    const canAfford = activeTransaction.currentPoints >= reward.points_required;
                    return (
                      <button
                        key={reward.id}
                        className={`pd-reward${canAfford ? '' : ' locked'}`}
                        disabled={!canAfford || isProcessing}
                        onClick={() => handleRewardStepChoice(reward)}
                      >
                        <span className={`ui-icon sm ${canAfford ? 'gold' : 'neutral'}`}>
                          {canAfford ? <Gift size={16} /> : <Lock size={15} />}
                        </span>
                        <span className="pd-reward-text">
                          <strong>{reward.title}</strong>
                          <span>{canAfford ? `${reward.points_required} pts` : `Encore ${reward.points_required - activeTransaction.currentPoints} pts`}</span>
                        </span>
                        {canAfford && <ChevronRight size={16} className="pd-reward-chev" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="ui-modal-foot">
              <button className="ui-btn secondary" onClick={() => handleRewardStepChoice(null)} disabled={isProcessing}>
                {isProcessing ? <Loader2 size={16} className="pro-spin" /> : <>Continuer sans récompense <ChevronRight size={16} /></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ÉTAPE 2 : POINTS ===== */}
      {scanStep === 'points' && activeTransaction && (
        <div className="ui-overlay" style={{ zIndex: 1200 }}>
          <div className="ui-modal">
            <div className="ui-modal-head">
              <div className="ui-avatar">{activeTransaction.clientName?.[0] || '?'}</div>
              <div className="ui-modal-head-text">
                <h3 className="ui-modal-title">{activeTransaction.clientName}</h3>
                <p className="ui-modal-sub">Solde actuel : <strong className="pd-strong">{activeTransaction.currentPoints} pts</strong></p>
              </div>
              <button className="icon-btn" onClick={() => { setScanStep(null); setActiveTransaction(null); }} aria-label="Annuler"><X size={18} /></button>
            </div>

            <div className="pd-steps" aria-hidden><span className="on" /><span className="on" /></div>

            <div className="ui-modal-body">
              {loyaltyConfig.points_adding_mode === 'automatic' ? (
                <div className="pd-points-auto">
                  <div className="pd-points-big">+{loyaltyConfig.points_per_purchase}</div>
                  <p>points pour ce passage</p>
                </div>
              ) : (
                <div className="pd-points-manual">
                  <p className="pd-step-q">Combien de points ajouter ?</p>
                  <div className="pd-points-input">
                    <input
                      type="number"
                      autoFocus
                      placeholder="0"
                      value={pointsToAdd}
                      onChange={(e) => setPointsToAdd(e.target.value)}
                    />
                    <span>pts</span>
                  </div>
                  <div className="pd-shortcuts">
                    {(loyaltyConfig.points_shortcuts?.length > 0 ? loyaltyConfig.points_shortcuts : [5, 10, 20, 50]).map(v => (
                      <button key={v} className={Number(pointsToAdd) === v ? 'on' : ''} onClick={() => setPointsToAdd(v.toString())}>+{v}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="ui-modal-foot">
              <button className="ui-btn lg" onClick={handleFinalizePointsStep} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="pro-spin" size={20} /> : <><Check size={18} strokeWidth={2.6} /> Valider{Number(pointsToAdd) > 0 ? ` +${Number(pointsToAdd)} pts` : ''}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

export default ProDashboard
