import { Outlet, Link } from 'react-router-dom'

/**
 * Mise en page façon GitHub Changelog :
 * - barre de navigation supérieure sombre
 * - en-tête éditorial avec titre et sous-titre
 * - conteneur centré
 */
const Layout = () => {
  return (
    <div className="min-h-screen bg-gh-canvas flex flex-col">
      {/* Barre de navigation supérieure (sombre, façon GitHub) */}
      <header className="bg-gh-header text-white">
        <div className="max-w-changelog mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <svg height="28" viewBox="0 0 16 16" width="28" className="fill-white" aria-hidden="true">
                <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0ZM4.5 7.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm3.5 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm3.5 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
              </svg>
              <span className="text-base">Deploy Board</span>
            </Link>
            <nav className="ml-auto flex items-center gap-5 text-sm text-gray-300">
              <Link to="/" className="hover:text-white transition-colors">Tableau de bord</Link>
              <a href="/health" className="hover:text-white transition-colors">État</a>
            </nav>
          </div>
        </div>
      </header>

      {/* En-tête éditorial */}
      <div className="border-b border-gh-border bg-gh-canvas">
        <div className="max-w-changelog mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-semibold tracking-tight text-gh-fg">Changelog des déploiements</h1>
          <p className="mt-2 text-lg text-gh-fg-muted">
            Suivez en temps réel l'état des pipelines CI/CD, la qualité du code et l'historique des déploiements.
          </p>
        </div>
      </div>

      {/* Contenu principal */}
      <main className="flex-1 max-w-changelog mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Pied de page */}
      <footer className="border-t border-gh-border mt-auto">
        <div className="max-w-changelog mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-gh-fg-muted">
            Deploy Board — Tableau de bord CI/CD · Jenkins · SonarQube · Docker
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
