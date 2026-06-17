import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-7xl font-semibold text-gh-fg mb-3">404</h1>
      <p className="text-lg text-gh-fg-muted mb-8">Cette page n'existe pas.</p>
      <Link
        to="/"
        className="px-4 py-2 rounded-md border border-gh-border bg-gh-subtle text-gh-fg font-medium hover:bg-gh-inset transition-colors"
      >
        Retour au tableau de bord
      </Link>
    </div>
  )
}

export default NotFound
