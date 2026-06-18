import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

/**
 * Page de connexion (admin unique, JWT).
 */
const Login = () => {
  const { login, loginAsGuest } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login(username, password)
      toast.success('Connexion réussie')
      navigate('/', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message || 'Échec de la connexion'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleGuest = async () => {
    setSubmitting(true)
    try {
      await loginAsGuest()
      toast.info('Mode démo — lecture seule')
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Accès invité indisponible')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gh-canvas gh-grid flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Logo size={48} withText={false} />
          <h1 className="mt-4 text-2xl font-bold text-gh-fg">
            Deploy<span className="text-brand-cyan">Board</span>
          </h1>
          <p className="gh-mono-label text-xs text-gh-fg-muted mt-1">Tableau de bord CI/CD</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gh-subtle border border-gh-border rounded-md p-6 space-y-4">
          <div>
            <label className="block text-sm text-gh-fg-muted mb-1">Identifiant</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="w-full px-3 py-2 bg-gh-canvas border border-gh-border rounded-md text-gh-fg text-sm focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-sm text-gh-fg-muted mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full px-3 py-2 bg-gh-canvas border border-gh-border rounded-md text-gh-fg text-sm focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 rounded-md text-white font-medium bg-gradient-to-r from-brand to-brand-cyan hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {submitting ? 'Connexion…' : 'Se connecter'}
          </button>

          <div className="flex items-center gap-3 pt-1">
            <span className="flex-1 h-px bg-gh-border" />
            <span className="gh-mono-label text-xs text-gh-fg-subtle">ou</span>
            <span className="flex-1 h-px bg-gh-border" />
          </div>

          <button
            type="button"
            onClick={handleGuest}
            disabled={submitting}
            className="w-full py-2 rounded-md font-medium border border-gh-border text-gh-fg hover:bg-gh-elevated disabled:opacity-50 transition-colors"
          >
            Explorer la démo (lecture seule)
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
