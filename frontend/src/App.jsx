import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PrivateAdminRoute, PrivateProRoute } from './components/PrivateRoute'

// Chaque page est chargée à la demande : la page d'inscription client (ouverte sur mobile en magasin)
// ne télécharge ni l'espace pro, ni l'administration, ni les graphiques.
const Home = lazy(() => import('./pages/Home'))
const Join = lazy(() => import('./pages/Join'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const ProLogin = lazy(() => import('./pages/ProLogin'))
const ProResetPassword = lazy(() => import('./pages/ProResetPassword'))
const ProDashboard = lazy(() => import('./pages/ProDashboard'))
const ProAccount = lazy(() => import('./pages/ProAccount'))
const ProSignup = lazy(() => import('./pages/ProSignup'))
const ProCheckoutSuccess = lazy(() => import('./pages/ProCheckoutResult').then((m) => ({ default: m.ProCheckoutSuccess })))
const ProCheckoutCancel = lazy(() => import('./pages/ProCheckoutResult').then((m) => ({ default: m.ProCheckoutCancel })))
const ProConfirmEmail = lazy(() => import('./pages/ProConfirmEmail'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const PublicResetPassword = lazy(() => import('./pages/PublicResetPassword'))
const MentionsLegales = lazy(() => import('./pages/MentionsLegales'))

const PageLoader = () => (
  <div role="status" aria-live="polite" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: 'var(--text-secondary, #888)' }}>
    Chargement…
  </div>
)

function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />

            {/* Inscription d'un client à un programme */}
            <Route path="/join/:empresaId" element={<Join />} />

            {/* Master Admin */}
            <Route path="/master-admin-secret" element={<AdminLogin />} />
            <Route path="/master-admin-secret/dashboard" element={<PrivateAdminRoute element={<AdminDashboard />} />} />

            {/* Espace pro */}
            <Route path="/pro/login" element={<ProLogin />} />
            <Route path="/pro/signup" element={<ProSignup />} />
            <Route path="/pro/checkout/success" element={<ProCheckoutSuccess />} />
            <Route path="/pro/checkout/cancel" element={<ProCheckoutCancel />} />
            <Route path="/pro/forgot-password" element={<ForgotPassword />} />
            <Route path="/password-recovery" element={<PublicResetPassword />} />
            <Route path="/pro/secure-password" element={<ProResetPassword />} />
            <Route path="/pro/dashboard" element={<PrivateProRoute element={<ProDashboard />} />} />
            <Route path="/pro/account" element={<PrivateProRoute element={<ProAccount />} />} />
            <Route path="/pro/confirm-email" element={<PrivateProRoute element={<ProConfirmEmail />} />} />

            <Route path="/mentions-legales" element={<MentionsLegales />} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
