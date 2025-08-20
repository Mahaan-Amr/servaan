import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import * as authService from '../../services/authService'

// Mock the auth service
jest.mock('../../services/authService')
const mockAuthService = authService as jest.Mocked<typeof authService>

// Test component that uses the auth context
const TestComponent = () => {
  const {
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    isAdmin,
    isManager,
    hasAccess,
    authLoaded
  } = useAuth()

  return (
    <div>
      <div data-testid="user">{user ? user.name : 'No user'}</div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not loading'}</div>
      <div data-testid="error">{error || 'No error'}</div>
      <div data-testid="authLoaded">{authLoaded ? 'Loaded' : 'Not loaded'}</div>
      <div data-testid="isAdmin">{isAdmin() ? 'Admin' : 'Not admin'}</div>
      <div data-testid="isManager">{isManager() ? 'Manager' : 'Not manager'}</div>
      <div data-testid="hasStaffAccess">{hasAccess('STAFF') ? 'Has staff access' : 'No staff access'}</div>
      
      <button
        data-testid="login-btn"
        onClick={() => login({ email: 'test@test.com', password: 'password' })}
      >
        Login
      </button>
      
      <button
        data-testid="register-btn"
        onClick={() => register({ name: 'Test User', email: 'test@test.com', password: 'password' })}
      >
        Register
      </button>
      
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
      
      <button data-testid="clear-error-btn" onClick={clearError}>
        Clear Error
      </button>
    </div>
  )
}

const renderWithAuthProvider = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    
    // Mock default implementations
    mockAuthService.getToken.mockReturnValue(null)
    mockAuthService.getCurrentUser.mockReturnValue(null)
  })

  describe('Initial State', () => {
    test('should have correct initial state when no user is logged in', async () => {
      renderWithAuthProvider(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('authLoaded')).toHaveTextContent('Loaded')
      })

      expect(screen.getByTestId('user')).toHaveTextContent('No user')
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      expect(screen.getByTestId('error')).toHaveTextContent('No error')
      expect(screen.getByTestId('isAdmin')).toHaveTextContent('Not admin')
      expect(screen.getByTestId('isManager')).toHaveTextContent('Not manager')
      expect(screen.getByTestId('hasStaffAccess')).toHaveTextContent('No staff access')
    })

    test('should load existing user from localStorage', async () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'ADMIN' as const
      }

      const mockToken = 'valid.jwt.token'
      
      // Mock valid token (not expired)
      const futureTime = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      const tokenPayload = btoa(JSON.stringify({ exp: futureTime }))
      const validToken = `header.${tokenPayload}.signature`

      mockAuthService.getToken.mockReturnValue(validToken)
      mockAuthService.getCurrentUser.mockReturnValue(mockUser)

      renderWithAuthProvider(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Test User')
        expect(screen.getByTestId('isAdmin')).toHaveTextContent('Admin')
        expect(screen.getByTestId('isManager')).toHaveTextContent('Manager')
        expect(screen.getByTestId('hasStaffAccess')).toHaveTextContent('Has staff access')
      })
    })

    test('should clear expired token on load', async () => {
      // Mock expired token
      const pastTime = Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      const tokenPayload = btoa(JSON.stringify({ exp: pastTime }))
      const expiredToken = `header.${tokenPayload}.signature`

      mockAuthService.getToken.mockReturnValue(expiredToken)
      mockAuthService.logout.mockImplementation(() => {})

      renderWithAuthProvider(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('authLoaded')).toHaveTextContent('Loaded')
      })

      expect(mockAuthService.logout).toHaveBeenCalled()
      expect(screen.getByTestId('user')).toHaveTextContent('No user')
    })
  })

  describe('Login', () => {
    test('should login user successfully', async () => {
      const user = userEvent.setup()
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'STAFF' as const,
        token: 'jwt.token.here'
      }

      mockAuthService.login.mockResolvedValue(mockUser)

      renderWithAuthProvider(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('authLoaded')).toHaveTextContent('Loaded')
      })

      await act(async () => {
        await user.click(screen.getByTestId('login-btn'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Test User')
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
        expect(screen.getByTestId('error')).toHaveTextContent('No error')
      })

      expect(mockAuthService.login).toHaveBeenCalledWith(
        { email: 'test@test.com', password: 'password' },
        false
      )
    })

    test('should handle login error', async () => {
      const user = userEvent.setup()
      const errorMessage = 'ایمیل یا رمز عبور اشتباه است'

      mockAuthService.login.mockRejectedValue(new Error(errorMessage))

      renderWithAuthProvider(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('authLoaded')).toHaveTextContent('Loaded')
      })

      await act(async () => {
        await user.click(screen.getByTestId('login-btn'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(errorMessage)
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
        expect(screen.getByTestId('user')).toHaveTextContent('No user')
      })
    })

    test('should show loading state during login', async () => {
      const user = userEvent.setup()
      let resolveLogin: (value: any) => void

      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve
      })

      mockAuthService.login.mockReturnValue(loginPromise)

      renderWithAuthProvider(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('authLoaded')).toHaveTextContent('Loaded')
      })

      await act(async () => {
        await user.click(screen.getByTestId('login-btn'))
      })

      // Should show loading state
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading')

      // Resolve the login
      await act(async () => {
        resolveLogin!({
          id: '1',
          name: 'Test User',
          email: 'test@test.com',
          role: 'STAFF',
          token: 'token'
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })
    })
  })

  describe('Register', () => {
    test('should register user successfully', async () => {
      const user = userEvent.setup()
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'STAFF' as const,
        token: 'jwt.token.here'
      }

      mockAuthService.register.mockResolvedValue(mockUser)

      renderWithAuthProvider(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('authLoaded')).toHaveTextContent('Loaded')
      })

      await act(async () => {
        await user.click(screen.getByTestId('register-btn'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Test User')
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
        expect(screen.getByTestId('error')).toHaveTextContent('No error')
      })

      expect(mockAuthService.register).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@test.com',
        password: 'password'
      })
    })

    test('should handle register error', async () => {
      const user = userEvent.setup()
      const errorMessage = 'این ایمیل قبلا ثبت شده است'

      mockAuthService.register.mockRejectedValue(new Error(errorMessage))

      renderWithAuthProvider(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('authLoaded')).toHaveTextContent('Loaded')
      })

      await act(async () => {
        await user.click(screen.getByTestId('register-btn'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(errorMessage)
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
        expect(screen.getByTestId('user')).toHaveTextContent('No user')
      })
    })
  })

  describe('Logout', () => {
    test('should logout user', async () => {
      const user = userEvent.setup()
      
      // Start with a logged-in user
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'STAFF' as const
      }

      const futureTime = Math.floor(Date.now() / 1000) + 3600
      const tokenPayload = btoa(JSON.stringify({ exp: futureTime }))
      const validToken = `header.${tokenPayload}.signature`

      mockAuthService.getToken.mockReturnValue(validToken)
      mockAuthService.getCurrentUser.mockReturnValue(mockUser)
      mockAuthService.logout.mockImplementation(() => {})

      renderWithAuthProvider(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Test User')
      })

      await act(async () => {
        await user.click(screen.getByTestId('logout-btn'))
      })

      expect(mockAuthService.logout).toHaveBeenCalled()
      expect(screen.getByTestId('user')).toHaveTextContent('No user')
    })
  })

  describe('Role-based Access Control', () => {
    test('should correctly identify admin user', async () => {
      const mockUser = {
        id: '1',
        name: 'Admin User',
        email: 'admin@test.com',
        role: 'ADMIN' as const
      }

      const futureTime = Math.floor(Date.now() / 1000) + 3600
      const tokenPayload = btoa(JSON.stringify({ exp: futureTime }))
      const validToken = `header.${tokenPayload}.signature`

      mockAuthService.getToken.mockReturnValue(validToken)
      mockAuthService.getCurrentUser.mockReturnValue(mockUser)

      renderWithAuthProvider(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('isAdmin')).toHaveTextContent('Admin')
        expect(screen.getByTestId('isManager')).toHaveTextContent('Manager')
        expect(screen.getByTestId('hasStaffAccess')).toHaveTextContent('Has staff access')
      })
    })

    test('should correctly identify manager user', async () => {
      const mockUser = {
        id: '1',
        name: 'Manager User',
        email: 'manager@test.com',
        role: 'MANAGER' as const
      }

      const futureTime = Math.floor(Date.now() / 1000) + 3600
      const tokenPayload = btoa(JSON.stringify({ exp: futureTime }))
      const validToken = `header.${tokenPayload}.signature`

      mockAuthService.getToken.mockReturnValue(validToken)
      mockAuthService.getCurrentUser.mockReturnValue(mockUser)

      renderWithAuthProvider(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('isAdmin')).toHaveTextContent('Not admin')
        expect(screen.getByTestId('isManager')).toHaveTextContent('Manager')
        expect(screen.getByTestId('hasStaffAccess')).toHaveTextContent('Has staff access')
      })
    })

    test('should correctly identify staff user', async () => {
      const mockUser = {
        id: '1',
        name: 'Staff User',
        email: 'staff@test.com',
        role: 'STAFF' as const
      }

      const futureTime = Math.floor(Date.now() / 1000) + 3600
      const tokenPayload = btoa(JSON.stringify({ exp: futureTime }))
      const validToken = `header.${tokenPayload}.signature`

      mockAuthService.getToken.mockReturnValue(validToken)
      mockAuthService.getCurrentUser.mockReturnValue(mockUser)

      renderWithAuthProvider(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('isAdmin')).toHaveTextContent('Not admin')
        expect(screen.getByTestId('isManager')).toHaveTextContent('Not manager')
        expect(screen.getByTestId('hasStaffAccess')).toHaveTextContent('Has staff access')
      })
    })
  })

  describe('Error Handling', () => {
    test('should clear error', async () => {
      const user = userEvent.setup()

      mockAuthService.login.mockRejectedValue(new Error('Test error'))

      renderWithAuthProvider(<TestComponent />)

      await waitFor(() => {
        expect(screen.getByTestId('authLoaded')).toHaveTextContent('Loaded')
      })

      // Trigger an error
      await act(async () => {
        await user.click(screen.getByTestId('login-btn'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Test error')
      })

      // Clear the error
      await act(async () => {
        await user.click(screen.getByTestId('clear-error-btn'))
      })

      expect(screen.getByTestId('error')).toHaveTextContent('No error')
    })
  })
}) 