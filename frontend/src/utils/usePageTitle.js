import { useEffect } from 'react'

// Titre propre à chaque page (onglet du navigateur, résultats de recherche) et, pour les pages privées,
// consigne « noindex » aux moteurs de recherche.
export default function usePageTitle(title, { noindex = false } = {}) {
  useEffect(() => {
    const previous = document.title
    document.title = title

    let meta = null
    if (noindex) {
      meta = document.createElement('meta')
      meta.name = 'robots'
      meta.content = 'noindex, nofollow'
      document.head.appendChild(meta)
    }

    return () => {
      document.title = previous
      if (meta) meta.remove()
    }
  }, [title, noindex])
}
