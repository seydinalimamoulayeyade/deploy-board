/**
 * Affichage des métriques de qualité SonarQube (Req 4.2-4.7)
 */
const RATING_COLORS = {
  A: 'bg-green-500', B: 'bg-lime-500', C: 'bg-yellow-500',
  D: 'bg-orange-500', E: 'bg-red-500',
}

const Trend = ({ value, invert = false }) => {
  if (value === 0 || value == null) return <span className="text-gh-fg-subtle">→ 0</span>
  // Pour bugs/code smells, une baisse est positive (invert=true)
  const isGood = invert ? value < 0 : value > 0
  const arrow = value > 0 ? '↑' : '↓'
  return (
    <span className={isGood ? 'text-gh-success-fg' : 'text-gh-danger-fg'}>
      {arrow} {Math.abs(value)}
    </span>
  )
}

const QualityMetrics = ({ metrics }) => {
  if (!metrics || metrics.available === false) {
    return (
      <div className="text-sm text-gh-fg-muted italic">Métriques de qualité indisponibles</div>
    )
  }

  const { rating, bugs, codeSmells, coverage, qualityGateStatus, trends = {} } = metrics
  const gateFailed = qualityGateStatus === 'FAILED'

  return (
    <div className="space-y-3">
      {/* Quality Gate prominent en cas d'échec (Req 4.7) */}
      {gateFailed && (
        <div className="bg-gh-danger-subtle border border-gh-danger-fg/40 rounded px-3 py-2 text-sm font-semibold text-gh-danger-fg">
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
            <div className="text-gh-fg-muted">Bugs</div>
            <div className="font-semibold text-gh-fg">{bugs} <Trend value={trends.bugs} invert /></div>
          </div>
          <div>
            <div className="text-gh-fg-muted">Code Smells</div>
            <div className="font-semibold text-gh-fg">{codeSmells} <Trend value={trends.codeSmells} invert /></div>
          </div>
          {coverage != null && (
            <div>
              <div className="text-gh-fg-muted">Couverture</div>
              <div className="font-semibold text-gh-fg">{coverage}% <Trend value={trends.coverage} /></div>
            </div>
          )}
        </div>
      </div>

      {/* Barre de couverture (Req 4.5) */}
      {coverage != null && (
        <div className="w-full bg-gh-elevated rounded-full h-2">
          <div
            className="bg-gh-accent h-2 rounded-full transition-all"
            style={{ width: `${Math.min(coverage, 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}

export default QualityMetrics
