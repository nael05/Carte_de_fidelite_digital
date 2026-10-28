import { useEffect, useState } from 'react'

// Thème de l'application : sombre par défaut (DA de la page d'accueil), mémorisé dans localStorage.
export default function useTheme() {
  const [darkMode, setDarkMode] = useState(() => (localStorage.getItem('theme') || 'dark') === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', darkMode)
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  return [darkMode, setDarkMode]
}
