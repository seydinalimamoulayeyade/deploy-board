import { getStatusConfig, formatDuration } from '../utils/format'

/**
 * Visualisation chronologique des étapes du pipeline (Req 3.3, 9.1)
 */
const StageTimeline = ({ stages = [] }) => {
  if (!stages.length) {
    return <p className="text-sm text-gray-400">Aucune étape disponible</p>
  }

  return (
    <div className="flex flex-wrap items-stretch gap-2">
      {stages.map((stage, idx) => {
        const cfg = getStatusConfig(stage.status)
        return (
          <div key={idx} className="flex items-center">
            <div className={`px-3 py-2 rounded-md ${cfg.bg} ${cfg.text} min-w-[110px]`}>
              <div className="text-xs font-semibold capitalize">{stage.name}</div>
              <div className="text-xs opacity-75">{formatDuration(stage.duration)}</div>
            </div>
            {idx < stages.length - 1 && <span className="mx-1 text-gray-300">→</span>}
          </div>
        )
      })}
    </div>
  )
}

export default StageTimeline
