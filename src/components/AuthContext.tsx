import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type React from 'react'
import { createContext, useContext, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { queryKeys } from '../lib/queryKeys'
import { api, setCsrfToken } from '../services/api'
import type { AdminUser, AuthBootstrapRequest, AuthLoginRequest, AuthSession } from '../types'

interface AuthContextValue {
	user: AdminUser | null
	session: AuthSession | null
	csrfToken: string | null
	isLoading: boolean
	isAuthenticated: boolean
	login: (payload: AuthLoginRequest) => Promise<void>
	bootstrap: (payload: AuthBootstrapRequest) => Promise<void>
	logout: () => Promise<void>
	refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const queryClient = useQueryClient()
	const sessionQuery = useQuery({
		queryKey: queryKeys.auth.session(),
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
			queryClient.removeQueries({ queryKey: queryKeys.auth.session() })
			queryClient.removeQueries({ queryKey: queryKeys.auth.passkeys() })
			queryClient.removeQueries({ queryKey: queryKeys.me.permissions() })
			queryClient.removeQueries({ queryKey: queryKeys.me.commander() })
			toast.success('Signed out')
		},
		onError: (error) => {
			toast.error('Sign out failed', { description: error.message })
		},
	})

	const user = sessionQuery.data?.data.user ?? null
	const session = sessionQuery.data?.data.session ?? null
	const csrfToken = sessionQuery.data?.data.csrf_token ?? null
	const isAuthenticated = Boolean(user)

	const value = useMemo<AuthContextValue>(
		() => ({
			user,
			session,
			csrfToken,
			isLoading: sessionQuery.isLoading,
			isAuthenticated,
			login: async (payload) => {
				await loginMutation.mutateAsync(payload)
			},
			bootstrap: async (payload) => {
				await bootstrapMutation.mutateAsync(payload)
			},
			logout: async () => {
				await logoutMutation.mutateAsync()
			},
			refreshSession: async () => {
				await sessionQuery.refetch()
			},
		}),
		[
			user,
			session,
			csrfToken,
			sessionQuery.isLoading,
			loginMutation,
			bootstrapMutation,
			logoutMutation,
			isAuthenticated,
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
