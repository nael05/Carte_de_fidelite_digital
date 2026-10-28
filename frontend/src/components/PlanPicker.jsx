import React from 'react'
import { Check } from 'lucide-react'
import usePlans, { fmtEuro, TIER_LABELS, TIER_FEATURES } from '../utils/usePlans'
import './PlanPicker.css'

const TIER_ORDER = ['free', 'pro', 'business']

// Choix de l'offre (Gratuit / Pro / Business) et de la facturation (mensuelle / annuelle -20 %).
// tiers : offres proposées ; disabledTiers : offres non sélectionnables (ex. offre actuelle).
export default function PlanPicker({ tier, interval, onChange, tiers = TIER_ORDER, current = null, disabled = false }) {
  const plans = usePlans()

  const priceLine = (t) => {
    if (t === 'free') return { main: '0 €', unit: 'pour toujours', sub: `Jusqu'à ${plans.free_client_limit} clients` }
    const monthly = plans.prices[t].monthly.amount
    const yearly = plans.prices[t].yearly.amount
    if (interval === 'yearly') {
      return { main: fmtEuro(yearly), unit: '/ an', sub: `soit ${fmtEuro(Math.round((yearly / 12) * 100) / 100)} / mois` }
    }
    return { main: fmtEuro(monthly), unit: '/ mois', sub: 'Sans engagement' }
  }

  return (
    <div className="pp">
      <div className="pp-interval" role="radiogroup" aria-label="Facturation">
        {[['monthly', 'Mensuel'], ['yearly', 'Annuel']].map(([key, label]) => (
          <button
            type="button"
            key={key}
            role="radio"
            aria-checked={interval === key}
            className={interval === key ? 'on' : ''}
            onClick={() => onChange({ tier, interval: key })}
            disabled={disabled}
          >
            {label}{key === 'yearly' && <em>-20 %</em>}
          </button>
        ))}
      </div>

      <div className="pp-cards" role="radiogroup" aria-label="Offre">
        {tiers.map((t) => {
          const p = priceLine(t)
          const isCurrent = current === t
          return (
            <button
              type="button"
              key={t}
              role="radio"
              aria-checked={tier === t}
              className={`pp-card${tier === t ? ' active' : ''}${t === 'pro' ? ' featured' : ''}`}
              onClick={() => onChange({ tier: t, interval })}
              disabled={disabled}
            >
              <span className="pp-name">
                {TIER_LABELS[t]}
                {t === 'pro' && <em>Populaire</em>}
                {isCurrent && <em className="current">Offre actuelle</em>}
              </span>
              <span className="pp-price">{p.main} <small>{p.unit}</small></span>
              <span className="pp-sub">{p.sub}</span>
              <ul>
                {TIER_FEATURES[t](plans).map((f) => (
                  <li key={f} className={f.endsWith('(bientôt)') ? 'soon' : ''}><Check size={13} strokeWidth={2.6} /> {f}</li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>
    </div>
  )
}
