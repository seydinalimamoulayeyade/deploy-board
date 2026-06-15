import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { jenkinsApi } from '../api/client'
import { formatDate } from '../utils/format'

/**
 * Modale de rollback (Req 6.1-6.5)
 * Affiche les 5 derniers builds stables et déclenche un replay.
 */
const RollbackModal = ({ pipeline, onClose, onConfirm }) => {
  const [stableBuilds, setStableBuilds] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    jenkinsApi
      .getStableBuilds(pipeline.name, 5)
      .then((res) => {
        if (active) setStableBuilds(res.data.data.builds || [])
      })
      .catch(() => {
        if (active) toast.error('Impossible de récupérer les builds stables')
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [pipeline.name])

  const handleSelect = async (build) => {
    setSubmitting(true)
    try {
      await jenkinsApi.replayBuild(pipeline.name, build.number)
      toast.success(`Rollback initié vers le build #${build.number}`)
      onConfirm?.()
      onClose()
    } catch {
      toast.error('Échec du déclenchement du rollback')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Rollback — {pipeline.displayName || pipeline.name}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="px-6 py-4">
          <p className="text-sm text-gray-600 mb-4">
            Sélectionnez une version stable vers laquelle revenir :
          </p>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Chargement...</div>
          ) : stableBuilds.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Aucun build stable disponible</div>
          ) : (
            <ul className="space-y-2">
              {stableBuilds.map((build) => (
                <li key={build.number}>
                  <button
                    disabled={submitting}
                    onClick={() => handleSelect(build)}
                    className="w-full flex justify-between items-center px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    <span className="font-medium text-gray-900">Build #{build.number}</span>
                    <span className="text-sm text-gray-500">{formatDate(build.timestamp)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default RollbackModal
