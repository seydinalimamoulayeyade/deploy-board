/**
 * Affichage des métriques de qualité SonarQube (Req 4.2-4.7)
 */
const RATING_COLORS = {
  A: 'bg-green-500', B: 'bg-lime-500', C: 'bg-yellow-500',
  D: 'bg-orange-500', E: 'bg-red-500',
}

const Trend = ({ value, invert = false }) => {
  if (value === 0 || value == null) return <span className="text-gray-400">→ 0</span>
  // Pour bugs/code smells, une baisse est positive (invert=true)
  const isGood = invert ? value < 0 : value > 0
  const arrow = value > 0 ? '↑' : '↓'
  return (
    <span className={isGood ? 'text-green-600' : 'text-red-600'}>
      {arrow} {Math.abs(value)}
    </span>
  )
}

const QualityMetrics = ({ metrics }) => {
  if (!metrics || metrics.available === false) {
    return (
      <div className="text-sm text-gray-400 italic">Métriques de qualité indisponibles</div>
    )
  }

  const { rating, bugs, codeSmells, coverage, qualityGateStatus, trends = {} } = metrics
  const gateFailed = qualityGateStatus === 'FAILED'

  return (
    <div className="space-y-3">
      {/* Quality Gate prominent en cas d'échec (Req 4.7) */}
      {gateFailed && (
        <div className="bg-red-100 border border-red-300 rounded px-3 py-2 text-sm font-semibold text-red-800">
          ⚠️ Quality Gate échouée
        </div>
      )}

      <div className="flex items-center space-x-4">
        {/* Note de qualité A-E (Req 4.2) */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${RATING_COLORS[rating] || 'bg-gray-400'}`}>
          {rating}
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm flex-1">
          <div>
            <div className="text-gray-500">Bugs</div>
            <div className="font-semibold">{bugs} <Trend value={trends.bugs} invert /></div>
          </div>
          <div>
            <div className="text-gray-500">Code Smells</div>
            <div className="font-semibold">{codeSmells} <Trend value={trends.codeSmells} invert /></div>
          </div>
          {coverage != null && (
            <div>
              <div className="text-gray-500">Couverture</div>
              <div className="font-semibold">{coverage}% <Trend value={trends.coverage} /></div>
            </div>
          )}
        </div>
      </div>

      {/* Barre de couverture (Req 4.5) */}
      {coverage != null && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(coverage, 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}

export default QualityMetrics
