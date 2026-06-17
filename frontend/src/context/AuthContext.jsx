import { createContext, useContext, useState, useCallback } from 'react'
import { authApi, getToken, setToken, clearToken } from '../api/client'

const AuthContext = createContext()

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}

export const AuthProvider = ({ children }) => {
  const [token, setTokenState] = useState(() => getToken())
  const [user, setUser] = useState(null)

  const login = useCallback(async (username, password) => {
    const res = await authApi.login(username, password)
    const { token: jwt, user: u } = res.data.data
    setToken(jwt)
    setTokenState(jwt)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setTokenState(null)
    setUser(null)
  }, [])

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token),
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
