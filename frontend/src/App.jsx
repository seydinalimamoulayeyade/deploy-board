import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { AppProvider } from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'

// Code splitting : chargement différé des pages lourdes (Req 14.1)
const BuildDetails = lazy(() => import('./pages/BuildDetails'))
const History = lazy(() => import('./pages/History'))
const Status = lazy(() => import('./pages/Status'))
const NotFound = lazy(() => import('./pages/NotFound'))

const PageLoader = () => (
  <div className="text-center py-12 text-gh-fg-muted">Chargement...</div>
)

// Garde de route : redirige vers /login si non authentifié
const RequireAuth = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="pipeline/:jobName/build/:buildNumber" element={<BuildDetails />} />
          <Route path="history" element={<History />} />
          <Route path="status" element={<Status />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <AppRoutes />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
