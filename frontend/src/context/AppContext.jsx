import { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext()

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

export const AppProvider = ({ children }) => {
  // Global state
  const [pipelines, setPipelines] = useState([])
  const [selectedEnvironment, setSelectedEnvironment] = useState(() => {
    // Retrieve from session storage on mount
    return sessionStorage.getItem('selectedEnvironment') || 'dev'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [cache, setCache] = useState({
    timestamp: null,
    data: null
  })

  // Persist selected environment to session storage
  useEffect(() => {
    sessionStorage.setItem('selectedEnvironment', selectedEnvironment)
  }, [selectedEnvironment])

  // Context value
  const value = {
    pipelines,
    setPipelines,
    selectedEnvironment,
    setSelectedEnvironment,
    loading,
    setLoading,
    error,
    setError,
    cache,
    setCache,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
