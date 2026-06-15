/**
 * Bannière d'erreur / indisponibilité de service (Req 13.1, 13.2, 13.4, 13.5)
 * Affiche un message d'indisponibilité et, le cas échéant, l'âge des données en cache.
 */
const ErrorBanner = ({ message, cacheAge }) => {
  if (!message) return null

  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start space-x-3">
      <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <div className="flex-1">
        <p className="text-sm font-medium text-red-800">{message}</p>
        {cacheAge != null && (
          <p className="text-xs text-red-600 mt-1">
            Données en cache affichées (il y a {cacheAge}s)
          </p>
        )}
      </div>
    </div>
  )
}

export default ErrorBanner
