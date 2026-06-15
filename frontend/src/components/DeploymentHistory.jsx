import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { deploymentsApi } from '../api/client'
import { getStatusConfig, formatDuration, formatDate } from '../utils/format'

/**
 * Historique et analytique des déploiements (Req 5.1-5.6)
 */
const STATUS_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'SUCCESS', label: 'Réussis' },
  { value: 'FAILED', label: 'Échoués' },
  { value: 'RUNNING', label: 'En cours' },
  { value: 'ABORTED', label: 'Annulés' },
]

const DeploymentHistory = ({ pipelineId }) => {
  const [builds, setBuilds] = useState([])
  const [stats, setStats] = useState(null)
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    const params = { days: 7, page }
    if (filter) params.status = filter
    deploymentsApi
      .getHistory(pipelineId, params)
      .then((res) => {
        if (!active) return
        const d = res.data.data
        setBuilds(d.builds || [])
        setStats(d.stats || null)
        setPagination(d.pagination || null)
      })
      .catch(() => active && setBuilds([]))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [pipelineId, filter, page])

  const chartData = builds.reduce(
    (acc, b) => {
      if (b.status === 'SUCCESS') acc[0].value += 1
      else if (b.status === 'FAILED') acc[1].value += 1
      return acc
    },
    [
      { name: 'Réussis', value: 0, color: '#10b981' },
      { name: 'Échoués', value: 0, color: '#ef4444' },
    ]
  )

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Historique des déploiements (7 jours)</h2>
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1) }}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Statistiques (Req 5.3, 5.5) */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-md p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.totalBuilds}</div>
            <div className="text-xs text-gray-500">Total builds</div>
          </div>
          <div className="bg-gray-50 rounded-md p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.successRate}%</div>
            <div className="text-xs text-gray-500">Taux de réussite</div>
          </div>
          <div className="bg-gray-50 rounded-md p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{formatDuration(stats.avgDuration)}</div>
            <div className="text-xs text-gray-500">Durée moyenne</div>
          </div>
        </div>
      )}

      {/* Graphique succès/échec (Req 5.2) */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value">
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tableau (Req 5.4) */}
      {loading ? (
        <div className="text-center py-6 text-gray-400">Chargement...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-4">Build</th>
                <th className="py-2 pr-4">Statut</th>
                <th className="py-2 pr-4">Durée</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Auteur</th>
              </tr>
            </thead>
            <tbody>
              {builds.map((b) => {
                const cfg = getStatusConfig(b.status)
                return (
                  <tr key={b._id || b.buildNumber} className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium">#{b.buildNumber}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                    </td>
                    <td className="py-2 pr-4">{formatDuration(b.duration)}</td>
                    <td className="py-2 pr-4">{formatDate(b.timestamp)}</td>
                    <td className="py-2 pr-4">{b.commitAuthor || 'N/A'}</td>
                  </tr>
                )
              })}
              {builds.length === 0 && (
                <tr><td colSpan="5" className="py-6 text-center text-gray-400">Aucun déploiement</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination (Req 14.4) */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded disabled:opacity-40">Précédent</button>
          <span className="text-gray-600">Page {pagination.currentPage} / {pagination.totalPages}</span>
          <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded disabled:opacity-40">Suivant</button>
        </div>
      )}
    </div>
  )
}

export default DeploymentHistory
