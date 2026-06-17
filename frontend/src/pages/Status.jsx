import { useState, useCallback } from 'react'
import { healthApi } from '../api/client'
import usePolling from '../hooks/usePolling'
import { formatDate } from '../utils/format'

/**
 * Page « État des services » — affiche la santé de MongoDB, Jenkins et SonarQube
 * en interrogeant l'endpoint /health du backend (Req 12.6).
 */
const SERVICE_LABELS = {
  mongodb: 'MongoDB',
  jenkins: 'Jenkins',
  sonarqube: 'SonarQube',
}

// Valeurs considérées comme « opérationnelles »
const isUp = (v) => ['connected', 'reachable', 'ok'].includes(String(v).toLowerCase())

const StatusDot = ({ up }) => (
  <span className="relative flex h-3 w-3">
    {up && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gh-success-fg opacity-60" />}
    <span className={`relative inline-flex rounded-full h-3 w-3 ${up ? 'bg-gh-success-fg' : 'bg-gh-danger-fg'}`} />
  </span>
)

const Status = () => {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)

  const fetchHealth = useCallback(async () => {
    try {
      const res = await healthApi.get()
      setHealth(res.data)
      setError(null)
      setUpdatedAt(new Date().toISOString())
    } catch {
      setError('Le backend est injoignable')
      setHealth(null)
    }
  }, [])

  usePolling(fetchHealth, 15000, true)

  const services = health?.services || {}
  const allUp = health && Object.values(services).every(isUp)

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Bandeau global */}
      <div className={`rounded-md border p-5 flex items-center gap-4 ${
        error ? 'border-gh-danger-fg/40 bg-gh-danger-subtle'
          : allUp ? 'border-gh-success-fg/40 bg-gh-success-subtle'
          : 'border-gh-attention-fg/40 bg-gh-attention-subtle'
      }`}>
        <StatusDot up={!error && allUp} />
        <div>
          <h2 className="text-lg font-semibold text-gh-fg">
            {error ? 'Backend injoignable'
              : allUp ? 'Tous les services sont opérationnels'
              : 'Certains services sont indisponibles'}
          </h2>
          {updatedAt && (
            <p className="gh-mono-label text-xs text-gh-fg-muted mt-0.5">
              Dernière vérification : {formatDate(updatedAt)}
            </p>
          )}
        </div>
      </div>

      {/* Liste des services */}
      {error ? (
        <p className="text-gh-fg-muted">{error}</p>
      ) : !health ? (
        <p className="text-gh-fg-muted">Vérification en cours…</p>
      ) : (
        <ul className="divide-y divide-gh-border border border-gh-border rounded-md overflow-hidden">
          {Object.entries(services).map(([key, value]) => {
            const up = isUp(value)
            return (
              <li key={key} className="flex items-center justify-between px-5 py-4 bg-gh-subtle">
                <div className="flex items-center gap-3">
                  <StatusDot up={up} />
                  <span className="font-medium text-gh-fg">{SERVICE_LABELS[key] || key}</span>
                </div>
                <span className={`gh-mono-label text-xs px-2 py-1 rounded-full ${
                  up ? 'bg-gh-success-subtle text-gh-success-fg' : 'bg-gh-danger-subtle text-gh-danger-fg'
                }`}>
                  {String(value)}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      <p className="gh-mono-label text-xs text-gh-fg-subtle">
        Actualisation automatique toutes les 15 secondes · source : endpoint /health
      </p>
    </div>
  )
}

export default Status
