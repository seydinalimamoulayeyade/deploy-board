/**
 * Bannière d'erreur / indisponibilité de service (thème sombre) — Req 13.1, 13.2, 13.4, 13.5
 */
const ErrorBanner = ({ message, cacheAge }) => {
  if (!message) return null

  return (
    <div className="bg-gh-danger-subtle border border-gh-danger-fg/40 rounded-md p-4 flex items-start gap-3">
      <svg className="w-5 h-5 fill-gh-danger-fg mt-0.5 flex-shrink-0" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0Zm0 4a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0v-3.5A.75.75 0 0 0 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
      </svg>
      <div className="flex-1">
        <p className="text-sm font-medium text-gh-fg">{message}</p>
        {cacheAge != null && (
          <p className="text-xs text-gh-fg-muted mt-1">
            Données en cache affichées (il y a {cacheAge}s)
          </p>
        )}
      </div>
    </div>
  )
}

export default ErrorBanner
