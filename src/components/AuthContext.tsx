import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type React from 'react'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { api, setCsrfToken } from '../services/api'
import type {
	AdminUser,
	AuthBootstrapRequest,
	AuthLoginRequest,
	AuthSession,
	UserAccount,
	UserAuthLoginRequest,
	UserAuthLoginResponse,
	UserSession,
} from '../types'

interface AuthContextValue {
	user: AdminUser | null
	session: AuthSession | null
	playerUser: UserAccount | null
	playerSession: UserSession | null
	csrfToken: string | null
	isLoading: boolean
	isAuthenticated: boolean
	isAdminAuthenticated: boolean
	isPlayerAuthenticated: boolean
	login: (payload: AuthLoginRequest) => Promise<void>
	playerLogin: (payload: UserAuthLoginRequest) => Promise<UserAuthLoginResponse | null>
	bootstrap: (payload: AuthBootstrapRequest) => Promise<void>
	logout: () => Promise<void>
	playerLogout: () => void
	refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const queryClient = useQueryClient()
	const [playerUser, setPlayerUser] = useState<UserAccount | null>(null)
	const [playerSession, setPlayerSession] = useState<UserSession | null>(null)
	const sessionQuery = useQuery({
		queryKey: ['auth', 'session'],
		queryFn: api.authSession,
		retry: false,
	})

	useEffect(() => {
		if (sessionQuery.data?.data.csrf_token) {
			setCsrfToken(sessionQuery.data.data.csrf_token)
			return
		}
		if (sessionQuery.isError) {
			setCsrfToken(null)
		}
	}, [sessionQuery.data, sessionQuery.isError])

	const loginMutation = useMutation({
		mutationFn: (payload: AuthLoginRequest) => api.authLogin(payload),
		onSuccess: async () => {
			await sessionQuery.refetch()
			toast.success('Welcome back!')
		},
		onError: (error) => {
			toast.error('Login failed', { description: error.message })
		},
	})

	const playerLoginMutation = useMutation({
		mutationFn: (payload: UserAuthLoginRequest) => api.userAuthLogin(payload),
		onSuccess: (response) => {
			setPlayerUser(response.data.user)
			setPlayerSession(response.data.session)
			toast.success('Welcome, Commander')
		},
		onError: (error) => {
			toast.error('Login failed', { description: error.message })
		},
	})

	const bootstrapMutation = useMutation({
		mutationFn: (payload: AuthBootstrapRequest) => api.authBootstrap(payload),
		onSuccess: async () => {
			await sessionQuery.refetch()
			toast.success('Admin account created')
		},
		onError: (error) => {
			toast.error('Bootstrap failed', { description: error.message })
		},
	})

	const logoutMutation = useMutation({
		mutationFn: api.authLogout,
		onSuccess: () => {
			setCsrfToken(null)
			queryClient.removeQueries({ queryKey: ['auth', 'session'] })
			toast.success('Signed out')
		},
		onError: (error) => {
			toast.error('Sign out failed', { description: error.message })
		},
	})

	const user = sessionQuery.data?.data.user ?? null
	const session = sessionQuery.data?.data.session ?? null
	const csrfToken = sessionQuery.data?.data.csrf_token ?? null
	const isAdminAuthenticated = Boolean(user)
	const isPlayerAuthenticated = Boolean(playerUser)

	const value = useMemo<AuthContextValue>(
		() => ({
			user,
			session,
			playerUser,
			playerSession,
			csrfToken,
			isLoading: sessionQuery.isLoading,
			isAuthenticated: isAdminAuthenticated || isPlayerAuthenticated,
			isAdminAuthenticated,
			isPlayerAuthenticated,
			login: async (payload) => {
				try {
					await loginMutation.mutateAsync(payload)
				} catch {
					return
				}
			},
			playerLogin: async (payload) => {
				try {
					const response = await playerLoginMutation.mutateAsync(payload)
					return response.data
				} catch {
					return null
				}
			},
			bootstrap: async (payload) => {
				try {
					await bootstrapMutation.mutateAsync(payload)
				} catch {
					return
				}
			},
			logout: async () => {
				try {
					await logoutMutation.mutateAsync()
				} catch {
					return
				}
			},
			playerLogout: () => {
				setPlayerUser(null)
				setPlayerSession(null)
				toast.success('Signed out')
			},
			refreshSession: async () => {
				try {
					await sessionQuery.refetch()
				} catch {
					return
				}
			},
		}),
		[
			user,
			session,
			playerUser,
			playerSession,
			csrfToken,
			sessionQuery.isLoading,
			loginMutation,
			playerLoginMutation,
			bootstrapMutation,
			logoutMutation,
			isAdminAuthenticated,
			isPlayerAuthenticated,
			sessionQuery,
		],
	)

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
	const context = useContext(AuthContext)
	if (!context) throw new Error('useAuth must be used within AuthProvider')
	return context
}
