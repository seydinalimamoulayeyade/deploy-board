import { useState, useCallback } from 'react'
import { useAppContext } from '../context/AppContext'
import { jenkinsApi } from '../api/client'
import usePolling from '../hooks/usePolling'
import EnvironmentSelector from '../components/EnvironmentSelector'
import PipelineCard from '../components/PipelineCard'
import ErrorBanner from '../components/ErrorBanner'
import RollbackModal from '../components/RollbackModal'

/**
 * Tableau de bord principal (Req 1.x, 2.x, 7.x)
 * Polling toutes les 10 secondes des pipelines Jenkins.
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
      const msg = err.response?.data?.message || 'Jenkins est indisponible'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [selectedEnvironment, setPipelines])

  // Polling 10s (Req 2.1) — s'arrête quand l'onglet est masqué (Req 14.3)
  usePolling(fetchPipelines, 10000, true)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Environnement</h2>
        <EnvironmentSelector
          currentEnvironment={selectedEnvironment}
          onChange={setSelectedEnvironment}
        />
      </div>

      <ErrorBanner message={error} />

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipelines</h2>
        {loading && pipelines.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Chargement des pipelines...</div>
        ) : pipelines.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
            Aucun pipeline disponible pour l'environnement « {selectedEnvironment} »
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pipelines.map((p) => (
              <PipelineCard key={p.id || p.name} pipeline={p} onRollback={setRollbackTarget} />
            ))}
          </div>
        )}
      </div>

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
