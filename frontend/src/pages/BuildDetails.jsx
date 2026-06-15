import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { jenkinsApi } from '../api/client'
import { getStatusConfig, formatDuration, formatDate, formatSize } from '../utils/format'
import StageTimeline from '../components/StageTimeline'
import BuildLog from '../components/BuildLog'
import DeploymentHistory from '../components/DeploymentHistory'

/**
 * Page de détails d'un build (Req 3.x, 11.x)
 */
const BuildDetails = () => {
  const { jobName, buildNumber } = useParams()
  const [build, setBuild] = useState(null)
  const [logLines, setLogLines] = useState([])
  const [logPagination, setLogPagination] = useState(null)
  const [logPage, setLogPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    jenkinsApi
      .getBuildDetails(jobName, buildNumber)
      .then((res) => active && setBuild(res.data.data))
      .catch(() => active && setError('Impossible de charger les détails du build'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [jobName, buildNumber])

  const loadLog = useCallback((page) => {
    jenkinsApi
      .getBuildLog(jobName, buildNumber, page, 1000)
      .then((res) => {
        setLogLines(res.data.data.log || [])
        setLogPagination(res.data.data.pagination || null)
        setLogPage(page)
      })
      .catch(() => setLogLines(['Impossible de charger le log']))
  }, [jobName, buildNumber])

  useEffect(() => { loadLog(1) }, [loadLog])

  const status = build ? getStatusConfig(build.status) : null

  return (
    <div className="space-y-6">
      <nav className="flex" aria-label="Fil d'Ariane">
        <ol className="flex items-center space-x-2 text-sm">
          <li><Link to="/" className="text-blue-600 hover:text-blue-800">Tableau de bord</Link></li>
          <li className="text-gray-500">/</li>
          <li className="text-gray-700 font-medium">{jobName} #{buildNumber}</li>
        </ol>
      </nav>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">{error}</div>
      ) : build && (
        <>
          {/* En-tête du build */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Build #{build.buildNumber}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.text}`}>
                {status.label}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-gray-500">Durée</span><div className="font-medium">{formatDuration(build.duration)}</div></div>
              <div><span className="text-gray-500">Date</span><div className="font-medium">{formatDate(build.timestamp)}</div></div>
              <div><span className="text-gray-500">Auteur</span><div className="font-medium">{build.commit?.author || 'N/A'}</div></div>
              <div>
                <span className="text-gray-500">Commit</span>
                <div className="font-medium">
                  {build.commit?.url ? (
                    <a href={build.commit.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {build.commit.sha || 'voir'}
                    </a>
                  ) : (build.commit?.sha || 'N/A')}
                </div>
              </div>
            </div>
            {build.commit?.message && (
              <p className="mt-3 text-sm text-gray-600 italic">"{build.commit.message}"</p>
            )}
          </div>

          {/* Étapes du pipeline */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Étapes du pipeline</h3>
            <StageTimeline stages={build.stages} />
          </div>

          {/* Artefacts */}
          {build.artifacts?.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Artefacts</h3>
              <ul className="space-y-2">
                {build.artifacts.map((a, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <a href={a.url} className="text-blue-600 hover:underline">{a.name}</a>
                    <span className="text-gray-500">{formatSize(a.size)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Log console */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Log de la console</h3>
            <BuildLog lines={logLines} pagination={logPagination} onPageChange={loadLog} />
          </div>

          {/* Historique des déploiements */}
          <DeploymentHistory pipelineId={jobName} />
        </>
      )}
    </div>
  )
}

export default BuildDetails
