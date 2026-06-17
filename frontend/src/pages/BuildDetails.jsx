import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { jenkinsApi } from '../api/client'
import { getStatusConfig, formatDuration, formatDate, formatSize } from '../utils/format'
import StageTimeline from '../components/StageTimeline'
import BuildLog from '../components/BuildLog'
import DeploymentHistory from '../components/DeploymentHistory'

/**
 * Page de détails d'un build (thème sombre) — Req 3.x, 11.x
 */
const CARD = 'bg-gh-subtle border border-gh-border rounded-md p-6'

const BuildDetails = () => {
  const { jobName, buildNumber } = useParams()
  const [build, setBuild] = useState(null)
  const [logLines, setLogLines] = useState([])
  const [logPagination, setLogPagination] = useState(null)
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
      })
      .catch(() => setLogLines(['Impossible de charger le log']))
  }, [jobName, buildNumber])

  useEffect(() => { loadLog(1) }, [loadLog])

  const status = build ? getStatusConfig(build.status) : null

  return (
    <div className="space-y-6">
      <nav aria-label="Fil d'Ariane">
        <ol className="flex items-center gap-2 gh-mono-label text-xs">
          <li><Link to="/" className="text-gh-accent hover:underline">Changelog</Link></li>
          <li className="text-gh-fg-subtle">/</li>
          <li className="text-gh-fg-muted">{jobName} #{buildNumber}</li>
        </ol>
      </nav>

      {loading ? (
        <div className="text-center py-12 text-gh-fg-muted">Chargement...</div>
      ) : error ? (
        <div className="bg-gh-danger-subtle border border-gh-danger-fg/40 rounded-md p-4 text-gh-fg">{error}</div>
      ) : build && (
        <>
          {/* En-tête du build */}
          <div className={CARD}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gh-fg">Build #{build.buildNumber}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.pill}`}>
                {status.label}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-gh-fg-muted">Durée</span><div className="font-medium text-gh-fg">{formatDuration(build.duration)}</div></div>
              <div><span className="text-gh-fg-muted">Date</span><div className="font-medium text-gh-fg">{formatDate(build.timestamp)}</div></div>
              <div><span className="text-gh-fg-muted">Auteur</span><div className="font-medium text-gh-fg">{build.commit?.author || 'N/A'}</div></div>
              <div>
                <span className="text-gh-fg-muted">Commit</span>
                <div className="font-medium">
                  {build.commit?.url ? (
                    <a href={build.commit.url} target="_blank" rel="noopener noreferrer" className="text-gh-accent hover:underline">
                      {build.commit.sha || 'voir'}
                    </a>
                  ) : (<span className="text-gh-fg">{build.commit?.sha || 'N/A'}</span>)}
                </div>
              </div>
            </div>
            {build.commit?.message && (
              <p className="mt-3 text-sm text-gh-fg-muted italic">"{build.commit.message}"</p>
            )}
          </div>

          {/* Étapes du pipeline */}
          <div className={CARD}>
            <h3 className="text-lg font-semibold text-gh-fg mb-4">Étapes du pipeline</h3>
            <StageTimeline stages={build.stages} />
          </div>

          {/* Artefacts */}
          {build.artifacts?.length > 0 && (
            <div className={CARD}>
              <h3 className="text-lg font-semibold text-gh-fg mb-4">Artefacts</h3>
              <ul className="space-y-2">
                {build.artifacts.map((a, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <a href={a.url} className="text-gh-accent hover:underline">{a.name}</a>
                    <span className="text-gh-fg-muted">{formatSize(a.size)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Log console */}
          <div className={CARD}>
            <h3 className="text-lg font-semibold text-gh-fg mb-4">Log de la console</h3>
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
