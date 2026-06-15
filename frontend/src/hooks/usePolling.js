import { useEffect, useRef, useCallback } from 'react'

/**
 * Hook de polling avec gestion de la visibilité de la page (Req 2.1, 14.3)
 * Interroge périodiquement la fonction fetchFn et arrête le polling
 * lorsque l'onglet n'est pas visible pour économiser les ressources.
 *
 * @param {Function} fetchFn - Fonction asynchrone à exécuter
 * @param {number} interval - Intervalle en millisecondes (défaut 10s)
 * @param {boolean} enabled - Active/désactive le polling
 */
export const usePolling = (fetchFn, interval = 10000, enabled = true) => {
  const savedFn = useRef(fetchFn)
  const timerRef = useRef(null)

  useEffect(() => {
    savedFn.current = fetchFn
  }, [fetchFn])

  const tick = useCallback(() => {
    if (document.visibilityState === 'visible') {
      savedFn.current()
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    // Exécution immédiate
    savedFn.current()

    const start = () => {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(tick, interval)
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        savedFn.current() // Rafraîchit immédiatement au retour
        start()
      } else if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    start()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [interval, enabled, tick])
}

export default usePolling
