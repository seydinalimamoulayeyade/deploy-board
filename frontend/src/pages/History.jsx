import { useState, useEffect } from 'react'
import { jenkinsApi } from '../api/client'
import DeploymentHistory from '../components/DeploymentHistory'
import EnvironmentStatus from '../components/EnvironmentStatus'

/**
 * Page « Historique des déploiements » (Req 2.4 + 2.6) :
 * - statut par environnement
 * - historique 7 jours d'un pipeline sélectionné (timeline, graphe, temps moyen)
 */
const History = () => {
  const [pipelines, setPipelines] = useState([])
  const [selected, setSelected] = useState('')

  useEffect(() => {
    let active = true
    jenkinsApi
      .getPipelines()
      .then((res) => {
        if (!active) return
        const list = res.data.data.pipelines || []
        setPipelines(list)
        if (list.length) setSelected(list[0].name)
      })
      .catch(() => active && setPipelines([]))
    return () => { active = false }
  }, [])

  return (
    <div className="space-y-12">
      <EnvironmentStatus />

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Historique par projet</h2>
          {pipelines.length > 0 && (
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="px-3 py-1.5 border border-gh-border bg-gh-subtle text-gh-fg rounded-md text-sm focus:outline-none"
            >
              {pipelines.map((p) => (
                <option key={p.name} value={p.name} className="bg-gh-subtle">
                  {p.displayName || p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {selected ? (
          <DeploymentHistory pipelineId={selected} />
        ) : (
          <div className="border border-gh-border rounded-md p-12 text-center text-gh-fg-muted bg-gh-subtle">
            Aucun pipeline disponible.
          </div>
        )}
      </section>
    </div>
  )
}

export default History
