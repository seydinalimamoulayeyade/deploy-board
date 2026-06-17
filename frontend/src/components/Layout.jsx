import { Outlet, Link, NavLink } from 'react-router-dom'
import Logo from './Logo'

/**
 * Mise en page sombre — identité Deploy Board.
 * - barre de navigation (logo de marque, liens, actions)
 * - en-tête héro avec grille et titre du projet
 */
// Style des liens de nav : souligné de marque sur la route active
const navLinkClass = ({ isActive }) =>
  `pb-[22px] pt-[22px] transition-colors ${
    isActive
      ? 'font-medium text-gh-fg border-b-2 border-brand'
      : 'text-gh-fg-muted hover:text-gh-fg'
  }`

const Layout = () => {
  return (
    <div className="min-h-screen bg-gh-canvas text-gh-fg flex flex-col">
      {/* Barre de navigation */}
      <header className="bg-gh-header border-b border-gh-border">
        <div className="max-w-changelog mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-6">
            <Link to="/" className="flex items-center">
              <Logo size={30} />
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm ml-4">
              <NavLink to="/" end className={navLinkClass}>
                Deploy Board
              </NavLink>
              <NavLink to="/status" className={navLinkClass}>État des services</NavLink>
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <a
                href="http://localhost:8080"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex px-3 py-1.5 text-sm font-medium rounded-md border border-gh-border text-gh-fg hover:bg-gh-elevated transition-colors"
              >
                Jenkins
              </a>
              <a
                href="http://localhost:9000"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex px-3 py-1.5 text-sm font-medium rounded-md text-white bg-gradient-to-r from-brand to-brand-cyan hover:opacity-90 transition-opacity"
              >
                SonarQube
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* En-tête héro avec grille */}
      <div className="gh-grid border-b border-gh-border">
        <div className="max-w-changelog mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12">
          <p className="gh-mono-label text-xs text-gh-fg-muted mb-6">Tableau de bord CI/CD</p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
              <span className="text-gh-fg">Deploy</span>
              <span className="bg-gradient-to-r from-brand to-brand-cyan bg-clip-text text-transparent"> Board</span>
            </h1>
            <p className="gh-mono-label text-xs text-gh-fg-subtle">
              Jenkins · SonarQube · Docker
            </p>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <main className="flex-1 max-w-changelog mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Pied de page */}
      <footer className="border-t border-gh-border mt-auto">
        <div className="max-w-changelog mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center gap-3">
          <Logo size={20} withText={false} />
          <p className="gh-mono-label text-xs text-gh-fg-muted">
            Deploy Board — Suivi des déploiements en temps réel
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
