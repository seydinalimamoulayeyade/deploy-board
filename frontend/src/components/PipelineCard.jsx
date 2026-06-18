import { useNavigate } from 'react-router-dom'
import { getStatusConfig, formatDuration, formatShort } from '../utils/format'
import { useAuth } from '../context/AuthContext'
import QualityMetrics from './QualityMetrics'

/**
 * Entrée façon Changelog GitHub (thème sombre) :
 *   16 JUIN  [RÉUSSI]                         PRODUCTION
 *   Nom du pipeline
 *   Build #42 · 4m 5s · main · john.doe
 */
const PipelineCard = ({ pipeline, onRollback }) => {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { name, displayName, lastBuild, qualityMetrics, environment } = pipeline

  const status = getStatusConfig(lastBuild?.status)

  const handleViewDetails = () => {
    if (lastBuild) navigate(`/pipeline/${name}/build/${lastBuild.number}`)
  }

  return (
    <article className="relative">
      {/* Point sur la timeline */}
      <span
        className={`absolute -left-[25px] sm:-left-[33px] top-1.5 w-3 h-3 rounded-full ring-4 ring-gh-canvas ${status.dot} ${
          lastBuild?.status === 'RUNNING' ? 'animate-pulse' : ''
        }`}
        aria-hidden="true"
      />

      {/* Ligne méta : date + statut à gauche, catégorie à droite */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <span className="gh-mono-label text-xs text-gh-fg-muted">
            {lastBuild ? formatShort(lastBuild.timestamp) : 'Aucun build'}
          </span>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] gh-mono-label ${status.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>
        {environment && (
          <span className="gh-mono-label text-[11px] text-gh-fg-muted">{environment}</span>
        )}
      </div>

      {/* Titre */}
      <button
        onClick={handleViewDetails}
        className="block text-left text-xl font-semibold text-gh-fg hover:text-gh-accent transition-colors mb-2"
      >
        {displayName || name}
      </button>

      {!lastBuild ? (
        <p className="text-sm text-gh-fg-muted">Ce pipeline n'a pas encore d'historique de build.</p>
      ) : (
        <>
          <p className="text-sm text-gh-fg-muted mb-3">
            Build <span className="text-gh-fg">#{lastBuild.number}</span>
            {' · '}{formatDuration(lastBuild.duration)}
            {lastBuild.branch && <>{' · '}<span className="font-mono text-gh-fg">{lastBuild.branch}</span></>}
            {lastBuild.author && <>{' · '}{lastBuild.author}</>}
          </p>

          {qualityMetrics && (
            <div className="mb-4 p-3 border border-gh-border rounded-md bg-gh-subtle">
              <QualityMetrics metrics={qualityMetrics} />
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleViewDetails}
              className="px-3 py-1.5 text-xs gh-mono-label rounded-md border border-gh-border bg-gh-subtle text-gh-fg hover:bg-gh-elevated transition-colors"
            >
              Détails
            </button>
            {isAdmin && (
              <button
                onClick={() => onRollback(pipeline)}
                className="px-3 py-1.5 text-xs gh-mono-label rounded-md border border-gh-border text-gh-fg-muted hover:text-gh-fg hover:bg-gh-subtle transition-colors"
              >
                Rollback
              </button>
            )}
          </div>
        </>
      )}
    </article>
  )
}

export default PipelineCard
