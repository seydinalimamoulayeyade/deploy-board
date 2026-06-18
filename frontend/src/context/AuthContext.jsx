import { createContext, useContext, useState, useCallback } from 'react'
import { authApi, getToken, setToken, clearToken } from '../api/client'

const AuthContext = createContext()
const USER_KEY = 'deployboard_user'

const loadUser = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}

export const AuthProvider = ({ children }) => {
  const [token, setTokenState] = useState(() => getToken())
  const [user, setUser] = useState(() => loadUser())

  const applySession = useCallback((jwt, u) => {
    setToken(jwt)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setTokenState(jwt)
    setUser(u)
  }, [])

  const login = useCallback(async (username, password) => {
    const res = await authApi.login(username, password)
    const { token: jwt, user: u } = res.data.data
    applySession(jwt, u)
    return u
  }, [applySession])

  const loginAsGuest = useCallback(async () => {
    const res = await authApi.guest()
    const { token: jwt, user: u } = res.data.data
    applySession(jwt, u)
    return u
  }, [applySession])

  const logout = useCallback(() => {
    clearToken()
    localStorage.removeItem(USER_KEY)
    setTokenState(null)
    setUser(null)
  }, [])

  const value = {
    token,
    user,
    role: user?.role || null,
    isAuthenticated: Boolean(token),
    isAdmin: user?.role === 'admin',
    login,
    loginAsGuest,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
