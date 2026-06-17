import { Component } from 'react'

/**
 * Error Boundary React (Req 13.1, 13.2)
 * Capture les erreurs de rendu et affiche une UI de repli.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Erreur capturée:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gh-canvas">
          <div className="text-center p-8 bg-gh-subtle border border-gh-border rounded-lg max-w-md">
            <h1 className="text-2xl font-bold text-gh-fg mb-2">Une erreur est survenue</h1>
            <p className="text-gh-fg-muted mb-6">
              L'application a rencontré un problème inattendu. Veuillez réessayer.
            </p>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-gh-accent text-white rounded-md hover:opacity-90"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
