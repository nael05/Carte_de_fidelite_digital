import { useEffect, useState } from 'react'
import api from '../api'

// Tarifs de repli tant que /plans n'a pas répondu : annuel = 12 mois -20 %.
const FALLBACK = {
  free_client_limit: 15,
  push_monthly_quota: { free: 0, pro: 4, business: 8 },
  prices: {
    pro: { monthly: { amount: 29 }, yearly: { amount: 278.4 } },
    business: { monthly: { amount: 59 }, yearly: { amount: 566.4 } }
  }
}

export const fmtEuro = (amount) =>
  `${Number(amount).toLocaleString('fr-FR', { minimumFractionDigits: Number.isInteger(Number(amount)) ? 0 : 2, maximumFractionDigits: 2 })} €`

export const TIER_LABELS = { free: 'Gratuit', pro: 'Pro', business: 'Business' }

// Les fonctionnalités annoncées doivent exister : celles pas encore livrées sont marquées « bientôt ».
export const TIER_FEATURES = {
  free: (plans) => [
    `Jusqu'à ${plans.free_client_limit} clients`,
    'Cartes Apple Wallet et Google Wallet',
    'Points et récompenses',
    'Statistiques de base'
  ],
  pro: (plans) => [
    'Clients illimités',
    `Campagnes de notifications (${plans.push_monthly_quota.pro} par mois)`,
    'Statistiques et historique complets'
  ],
  business: (plans) => [
    'Tout Pro, et :',
    `Campagnes de notifications (${plans.push_monthly_quota.business} par mois)`,
    'Statistiques avancées et export CSV',
    'Liste des clients à relancer',
    'Plusieurs établissements (bientôt)',
    'Comptes équipe (bientôt)'
  ]
}

let cached = null

// Tarifs courants (modifiables depuis l'admin) : { free_client_limit, prices: { pro: { monthly, yearly }, business: {...} } }
export default function usePlans() {
  const [plans, setPlans] = useState(cached || FALLBACK)

  useEffect(() => {
    if (cached) return
    let alive = true
    api.get('/plans').then(({ data }) => {
      const merged = {
        ...FALLBACK,
        ...data,
        prices: {
          pro: { ...FALLBACK.prices.pro, ...Object.fromEntries(Object.entries(data.prices?.pro || {}).filter(([, v]) => v)) },
          business: { ...FALLBACK.prices.business, ...Object.fromEntries(Object.entries(data.prices?.business || {}).filter(([, v]) => v)) }
        }
      }
      cached = merged
      if (alive) setPlans(merged)
    }).catch(() => {})
    return () => { alive = false }
  }, [])

  return plans
}
