import { useState, useCallback } from 'react'
import { useAppContext } from '../context/AppContext'
import { jenkinsApi } from '../api/client'
import usePolling from '../hooks/usePolling'
import PipelineCard from '../components/PipelineCard'
import ErrorBanner from '../components/ErrorBanner'
import RollbackModal from '../components/RollbackModal'

const ENVIRONMENTS = [
  { value: 'dev', label: 'Développement' },
  { value: 'staging', label: 'Pré-production' },
  { value: 'production', label: 'Production' },
]

const STATUS_LEGEND = [
  { label: 'Réussi', dot: 'bg-gh-success-emphasis' },
  { label: 'Échoué', dot: 'bg-gh-danger-fg' },
  { label: 'En cours', dot: 'bg-gh-attention-fg' },
  { label: 'Annulé', dot: 'bg-gh-fg-subtle' },
]

/**
 * Tableau de bord — feed façon Changelog GitHub.
 * Colonne principale : timeline des pipelines.
 * Sidebar : filtres d'environnement et légende des statuts.
 */
const Dashboard = () => {
  const { selectedEnvironment, setSelectedEnvironment, pipelines, setPipelines } = useAppContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [rollbackTarget, setRollbackTarget] = useState(null)

  const fetchPipelines = useCallback(async () => {
    try {
      const res = await jenkinsApi.getPipelines(selectedEnvironment)
      setPipelines(res.data.data.pipelines || [])
      setError(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Jenkins est indisponible')
    } finally {
      setLoading(false)
    }
  }, [selectedEnvironment, setPipelines])

  usePolling(fetchPipelines, 10000, true)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_296px] gap-12">
      {/* Colonne principale : feed timeline */}
      <section className="order-2 lg:order-1 min-w-0">
        {error && <div className="mb-6"><ErrorBanner message={error} /></div>}

        {loading && pipelines.length === 0 ? (
          <p className="text-gh-fg-muted py-12">Chargement des pipelines…</p>
        ) : pipelines.length === 0 ? (
          <div className="border border-gh-border rounded-md p-12 text-center text-gh-fg-muted bg-gh-subtle">
            Aucun pipeline pour l'environnement « {selectedEnvironment} ».
          </div>
        ) : (
          <div className="changelog-timeline border-l-2 border-gh-muted pl-6 sm:pl-8 space-y-10">
            {pipelines.map((p) => (
              <PipelineCard key={p.id || p.name} pipeline={p} onRollback={setRollbackTarget} />
            ))}
          </div>
        )}
      </section>

      {/* Sidebar : filtres */}
      <aside className="order-1 lg:order-2 space-y-8">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gh-fg-muted mb-3">
            Environnement
          </h2>
          <nav className="flex flex-col gap-1">
            {ENVIRONMENTS.map((env) => {
              const active = selectedEnvironment === env.value
              return (
                <button
                  key={env.value}
                  onClick={() => setSelectedEnvironment(env.value)}
                  className={`text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                    active
                      ? 'bg-gh-accent-subtle text-gh-accent font-semibold'
                      : 'text-gh-fg hover:bg-gh-subtle'
                  }`}
                >
                  {env.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gh-fg-muted mb-3">
            Légende des statuts
          </h2>
          <ul className="space-y-2">
            {STATUS_LEGEND.map((s) => (
              <li key={s.label} className="flex items-center gap-2 text-sm text-gh-fg">
                <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                {s.label}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {rollbackTarget && (
        <RollbackModal
          pipeline={rollbackTarget}
          onClose={() => setRollbackTarget(null)}
          onConfirm={fetchPipelines}
        />
      )}
    </div>
  )
}

export default Dashboard
