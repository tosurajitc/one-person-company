'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Auth state types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR'
}

// Initial authentication state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
}

// Auth reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null
      }
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error
      }
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      }
    
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload.loading
      }
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      }
    
    default:
      return state
  }
}

// Create context
const AuthContext = createContext()

// Auth provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const router = useRouter()

  // Check for existing token on app start
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const userData = localStorage.getItem('user_data')
      
      if (token && userData) {
        const user = JSON.parse(userData)
        
        // Verify token with backend
        const isValid = await verifyToken(token)
        
        if (isValid) {
          dispatch({
            type: AUTH_ACTIONS.SET_USER,
            payload: { user, token }
          })
        } else {
          // Token invalid, clear storage
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_data')
          dispatch({ type: AUTH_ACTIONS.LOGOUT })
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: { loading: false } })
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: { loading: false } })
    }
  }

  const verifyToken = async (token) => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      return response.ok
    } catch (error) {
      console.error('Token verification failed:', error)
      return false
    }
  }

  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START })
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      if (response.ok) {
        const data = await response.json()
        const { user, token } = data

        // Store in localStorage (for client-side access)
        localStorage.setItem('auth_token', token)
        localStorage.setItem('user_data', JSON.stringify(user))

        // Also set as a cookie so Next.js edge middleware can read it
        document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 8}; SameSite=Lax`

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user, token }
        })

        // Redirect based on user role
        redirectAfterLogin(user)
        
        return { success: true }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Login failed')
      }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: error.message }
      })
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      
      // Call logout endpoint if token exists
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      // Clear all auth-related localStorage keys immediately so UI updates
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      localStorage.removeItem('oauth_state')
      localStorage.removeItem('oauth_provider')
      localStorage.removeItem('user_role')

      dispatch({ type: AUTH_ACTIONS.LOGOUT })

      // Navigate via /signout — the server-side route handler sets the
      // expired cookie in the HTTP response *before* the redirect, so the
      // middleware never sees the old token and cannot bounce /login back
      // to /dashboard.
      window.location.href = '/signout'
    }
  }

  const redirectAfterLogin = (user) => {
    // Redirect based on user role
    if (user.role === 'super_admin' || user.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }
  }

  const updateUser = (userData) => {
    // Update user data in state and localStorage
    const updatedUser = { ...state.user, ...userData }
    
    localStorage.setItem('user_data', JSON.stringify(updatedUser))
    
    dispatch({
      type: AUTH_ACTIONS.SET_USER,
      payload: { user: updatedUser, token: state.token }
    })
  }

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
  }

  // Helper functions for role checking
  const isAdmin = () => {
    return state.user && (state.user.role === 'admin' || state.user.role === 'super_admin')
  }

  const isSuperAdmin = () => {
    return state.user && state.user.role === 'super_admin'
  }

  const hasPermission = (permission) => {
    if (!state.user) return false
    
    // Define permission mappings
    const permissions = {
      'user_management': ['admin', 'super_admin'],
      'admin_panel': ['admin', 'super_admin'],
      'system_settings': ['super_admin'],
      'content_management': ['admin', 'super_admin']
    }
    
    const allowedRoles = permissions[permission] || []
    return allowedRoles.includes(state.user.role)
  }

  const contextValue = {
    // State
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    login,
    logout,
    updateUser,
    clearError,
    checkAuthStatus,
    
    // Helper functions
    isAdmin,
    isSuperAdmin,
    hasPermission
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

// Higher-order component for protected routes
export function withAuth(WrappedComponent, options = {}) {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isLoading, user } = useAuth()
    const router = useRouter()
    
    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/login')
      }
      
      // Check role requirements
      if (options.role && user && user.role !== options.role) {
        if (options.role === 'admin' && (user.role === 'admin' || user.role === 'super_admin')) {
          // Allow admin access for both admin and super_admin
          return
        }
        router.push('/unauthorized')
      }
    }, [isAuthenticated, isLoading, user, router])
    
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      )
    }
    
    if (!isAuthenticated) {
      return null
    }
    
    return <WrappedComponent {...props} />
  }
}

export default AuthContext