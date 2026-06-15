/**
 * Sélecteur d'environnement (Dev / Staging / Production)
 * La persistance en sessionStorage est gérée par AppContext (Req 7.1, 7.2, 7.6)
 */
const ENVIRONMENTS = [
  { value: 'dev', label: 'Développement' },
  { value: 'staging', label: 'Pré-production' },
  { value: 'production', label: 'Production' },
]

const EnvironmentSelector = ({ currentEnvironment, onChange }) => {
  return (
    <div className="flex space-x-2">
      {ENVIRONMENTS.map((env) => (
        <button
          key={env.value}
          onClick={() => onChange(env.value)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentEnvironment === env.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {env.label}
        </button>
      ))}
    </div>
  )
}

export default EnvironmentSelector
