import { useState, useCallback, useMemo } from 'react'
import { useAppContext } from '../context/AppContext'
import { jenkinsApi } from '../api/client'
import usePolling from '../hooks/usePolling'
import PipelineCard from '../components/PipelineCard'
import ErrorBanner from '../components/ErrorBanner'
import RollbackModal from '../components/RollbackModal'
import { formatMonthYear } from '../utils/format'

const ENVIRONMENTS = [
  { value: 'dev', label: 'Développement' },
  { value: 'staging', label: 'Pré-production' },
  { value: 'production', label: 'Production' },
]

// Filtres de statut façon catégories du Changelog (avec icône colorée)
const STATUS_FILTERS = [
  { value: 'ALL', label: 'Tous', dot: 'bg-gh-fg-muted' },
  { value: 'SUCCESS', label: 'Réussis', dot: 'bg-gh-success-fg' },
  { value: 'RUNNING', label: 'En cours', dot: 'bg-gh-attention-fg' },
  { value: 'FAILED', label: 'Échoués', dot: 'bg-gh-danger-fg' },
  { value: 'ABORTED', label: 'Annulés', dot: 'bg-gh-fg-subtle' },
]

/**
 * Tableau de bord — feed sombre façon Changelog GitHub.
 * Barre de filtres (statut + environnement) puis feed groupé par mois.
 */
const Dashboard = () => {
  const { selectedEnvironment, setSelectedEnvironment, pipelines, setPipelines } = useAppContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [rollbackTarget, setRollbackTarget] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')

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

  // Filtrage par statut puis regroupement par mois
  const groups = useMemo(() => {
    const filtered = pipelines.filter(
      (p) => statusFilter === 'ALL' || p.lastBuild?.status === statusFilter
    )
    const byMonth = new Map()
    filtered.forEach((p) => {
      const key = formatMonthYear(p.lastBuild?.timestamp)
      if (!byMonth.has(key)) byMonth.set(key, [])
      byMonth.get(key).push(p)
    })
    return Array.from(byMonth.entries())
  }, [pipelines, statusFilter])

  return (
    <div className="space-y-8">
      {/* Barre de filtres */}
      <div className="flex flex-wrap items-center gap-3 pb-6 border-b border-gh-border">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.value
            return (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs gh-mono-label border transition-colors ${
                  active
                    ? 'bg-gh-elevated border-gh-border text-gh-fg'
                    : 'border-transparent text-gh-fg-muted hover:text-gh-fg hover:bg-gh-subtle'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${f.dot}`} />
                {f.label}
              </button>
            )
          })}
        </div>

        {/* Sélecteur d'environnement (à droite, façon « Filters ») */}
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full border border-gh-border bg-gh-subtle">
          <svg className="w-3.5 h-3.5 fill-gh-fg-muted" viewBox="0 0 16 16"><path d="M.75 3h14.5a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1 0-1.5ZM3 7.75A.75.75 0 0 1 3.75 7h8.5a.75.75 0 0 1 0 1.5h-8.5A.75.75 0 0 1 3 7.75Zm3 4a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"/></svg>
          <select
            value={selectedEnvironment}
            onChange={(e) => setSelectedEnvironment(e.target.value)}
            className="bg-transparent text-xs gh-mono-label text-gh-fg focus:outline-none cursor-pointer"
          >
            {ENVIRONMENTS.map((env) => (
              <option key={env.value} value={env.value} className="bg-gh-subtle text-gh-fg normal-case">
                {env.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Feed groupé par mois */}
      {loading && pipelines.length === 0 ? (
        <p className="text-gh-fg-muted py-12 gh-mono-label text-xs">Chargement des pipelines…</p>
      ) : groups.length === 0 ? (
        <div className="border border-gh-border rounded-md p-12 text-center text-gh-fg-muted bg-gh-subtle">
          Aucun pipeline pour ce filtre.
        </div>
      ) : (
        <div className="space-y-12">
          {groups.map(([month, items]) => (
            <section key={month}>
              <h2 className="text-2xl font-bold capitalize mb-6 flex items-center gap-2">
                {month}
                <span className="text-gh-fg-muted text-sm">⌄</span>
              </h2>
              <div className="border-l border-gh-border pl-6 sm:pl-8 space-y-10">
                {items.map((p) => (
                  <PipelineCard key={p.id || p.name} pipeline={p} onRollback={setRollbackTarget} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

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
