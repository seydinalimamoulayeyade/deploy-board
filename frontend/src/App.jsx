import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { AppProvider } from './context/AppContext'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'

// Code splitting : chargement différé des pages lourdes (Req 14.1)
const BuildDetails = lazy(() => import('./pages/BuildDetails'))
const Status = lazy(() => import('./pages/Status'))
const NotFound = lazy(() => import('./pages/NotFound'))

const PageLoader = () => (
  <div className="text-center py-12 text-gh-fg-muted">Chargement...</div>
)

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="pipeline/:jobName/build/:buildNumber" element={<BuildDetails />} />
              <Route path="status" element={<Status />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </AppProvider>
    </ErrorBoundary>
  )
}

export default App
