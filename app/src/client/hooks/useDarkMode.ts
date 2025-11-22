import { useState, useEffect } from 'react'

export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDark(darkModeMediaQuery.matches)
    const handleModeChange = (event: MediaQueryListEvent) => {
      setIsDark(event.matches)
    }

    darkModeMediaQuery.addEventListener('change', handleModeChange)
    return () => {
      darkModeMediaQuery.removeEventListener('change', handleModeChange)
    }
  }, [])

  return isDark
}
