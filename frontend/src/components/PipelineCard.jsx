import { useNavigate } from 'react-router-dom'
import { getStatusConfig, formatDuration, formatRelative, formatDate } from '../utils/format'
import QualityMetrics from './QualityMetrics'

/**
 * Entrée de pipeline façon Changelog GitHub :
 * - point sur la timeline
 * - date (façon « July 10 »)
 * - titre cliquable
 * - pastilles de statut/environnement
 * - métadonnées et actions
 */
const PipelineCard = ({ pipeline, onRollback }) => {
  const navigate = useNavigate()
  const { name, displayName, lastBuild, qualityMetrics, environment } = pipeline

  const status = getStatusConfig(lastBuild?.status)

  const handleViewDetails = () => {
    if (lastBuild) navigate(`/pipeline/${name}/build/${lastBuild.number}`)
  }

  return (
    <article className="relative">
      {/* Point sur la timeline */}
      <span
        className={`absolute -left-[33px] sm:-left-[41px] top-1.5 w-4 h-4 rounded-full border-4 border-gh-canvas ${status.dot} ${
          lastBuild?.status === 'RUNNING' ? 'animate-pulse' : ''
        }`}
        aria-hidden="true"
      />

      {/* Date */}
      <div className="text-sm text-gh-fg-muted mb-1">
        {lastBuild ? formatDate(lastBuild.timestamp) : 'Aucun build'}
      </div>

      {/* Titre + pastilles */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-2">
        <button
          onClick={handleViewDetails}
          className="text-xl font-semibold text-gh-accent hover:underline text-left"
        >
          {displayName || name}
        </button>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${status.pill}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
        {environment && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-gh-border text-gh-fg-muted">
            {environment}
          </span>
        )}
      </div>

      {!lastBuild ? (
        <p className="text-sm text-gh-fg-muted">Ce pipeline n'a pas encore d'historique de build.</p>
      ) : (
        <>
          {/* Métadonnées */}
          <p className="text-sm text-gh-fg-muted mb-3">
            Build <span className="font-medium text-gh-fg">#{lastBuild.number}</span>
            {' · '}durée {formatDuration(lastBuild.duration)}
            {lastBuild.branch && <>{' · '}branche <span className="font-mono text-gh-fg">{lastBuild.branch}</span></>}
            {lastBuild.author && <>{' · '}par {lastBuild.author}</>}
            {' · '}{formatRelative(lastBuild.timestamp)}
          </p>

          {qualityMetrics && (
            <div className="mb-4 p-3 border border-gh-border rounded-md bg-gh-subtle">
              <QualityMetrics metrics={qualityMetrics} />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleViewDetails}
              className="px-3 py-1.5 text-sm font-medium rounded-md border border-gh-border bg-gh-subtle text-gh-fg hover:bg-gh-inset transition-colors"
            >
              Voir les détails
            </button>
            <button
              onClick={() => onRollback(pipeline)}
              className="px-3 py-1.5 text-sm font-medium rounded-md border border-gh-border bg-gh-canvas text-gh-fg hover:bg-gh-subtle transition-colors"
            >
              Rollback
            </button>
          </div>
        </>
      )}
    </article>
  )
}

export default PipelineCard
