import { useNavigate } from 'react-router-dom'
import { getStatusConfig, formatDuration, formatRelative } from '../utils/format'
import QualityMetrics from './QualityMetrics'

/**
 * Carte d'un pipeline (Req 1.2-1.7)
 * Affiche le statut, les métadonnées du build et les actions.
 */
const PipelineCard = ({ pipeline, onRollback }) => {
  const navigate = useNavigate()
  const { name, displayName, lastBuild, qualityMetrics } = pipeline

  // Aucun build (Req 1.8)
  if (!lastBuild) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-gray-300">
        <h3 className="font-semibold text-gray-900">{displayName || name}</h3>
        <p className="text-sm text-gray-400 mt-2">Aucun build</p>
      </div>
    )
  }

  const status = getStatusConfig(lastBuild.status)

  const handleViewDetails = () => {
    navigate(`/pipeline/${name}/build/${lastBuild.number}`)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-gray-900">{displayName || name}</h3>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
          <span className={`w-2 h-2 rounded-full mr-1.5 ${status.dot} ${lastBuild.status === 'RUNNING' ? 'animate-pulse' : ''}`} />
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
        <div>Build : <span className="font-medium text-gray-900">#{lastBuild.number}</span></div>
        <div>Durée : <span className="font-medium text-gray-900">{formatDuration(lastBuild.duration)}</span></div>
        <div>Branche : <span className="font-medium text-gray-900">{lastBuild.branch || 'N/A'}</span></div>
        <div>Auteur : <span className="font-medium text-gray-900">{lastBuild.author || 'N/A'}</span></div>
      </div>

      <div className="text-xs text-gray-400 mb-3">{formatRelative(lastBuild.timestamp)}</div>

      {qualityMetrics && (
        <div className="border-t border-gray-100 pt-3 mb-3">
          <QualityMetrics metrics={qualityMetrics} />
        </div>
      )}

      <div className="flex space-x-2">
        <button
          onClick={handleViewDetails}
          className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          Voir les détails
        </button>
        <button
          onClick={() => onRollback(pipeline)}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
        >
          Rollback
        </button>
      </div>
    </div>
  )
}

export default PipelineCard
