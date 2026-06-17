import { useState, useEffect } from 'react'
import { deploymentsApi } from '../api/client'
import { getStatusConfig, formatRelative } from '../utils/format'

/**
 * Statut par environnement (Req 2.6) :
 * affiche la dernière version déployée sur Dev / Staging / Production.
 */
const ENVIRONMENTS = [
  { value: 'dev', label: 'Développement' },
  { value: 'staging', label: 'Pré-production' },
  { value: 'production', label: 'Production' },
]

const EnvironmentStatus = () => {
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.allSettled(ENVIRONMENTS.map((e) => deploymentsApi.getEnvironmentStatus(e.value)))
      .then((results) => {
        if (!active) return
        const map = {}
        results.forEach((r, i) => {
          if (r.status === 'fulfilled') {
            const deployments = r.value.data.data.deployments || []
            // Déploiement le plus récent de l'environnement
            map[ENVIRONMENTS[i].value] = deployments
              .slice()
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] || null
          }
        })
        setData(map)
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">Environnements</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ENVIRONMENTS.map((env) => {
          const dep = data[env.value]
          const cfg = dep ? getStatusConfig(dep.status) : null
          return (
            <div key={env.value} className="border border-gh-border rounded-md p-5 bg-gh-subtle">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gh-fg">{env.label}</h3>
                {cfg && (
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] gh-mono-label ${cfg.pill}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                )}
              </div>
              {loading ? (
                <p className="text-sm text-gh-fg-muted">Chargement…</p>
              ) : dep ? (
                <div className="text-sm text-gh-fg-muted space-y-1">
                  <p className="text-gh-fg font-medium">{dep.pipelineId}</p>
                  <p>Build <span className="text-gh-fg">#{dep.buildNumber}</span> · {formatRelative(dep.timestamp)}</p>
                  {dep.commitSha && <p className="font-mono text-xs">{dep.commitSha}</p>}
                </div>
              ) : (
                <p className="text-sm text-gh-fg-subtle italic">Aucun déploiement enregistré</p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default EnvironmentStatus
