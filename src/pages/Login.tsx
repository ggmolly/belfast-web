import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Fingerprint, KeyRound } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../components/AuthContext'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { queryKeys } from '../lib/queryKeys'
import { parseRequestOptions, serializeAuthenticationCredential } from '../lib/webauthn'
import { api } from '../services/api'

export const LoginPage = () => {
	const auth = useAuth()
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [passkeyLoading, setPasskeyLoading] = useState(false)

	const bootstrapStatusQuery = useQuery({
		queryKey: queryKeys.auth.bootstrapStatus(),
		queryFn: api.authBootstrapStatus,
		retry: false,
	})

	const canBootstrap = bootstrapStatusQuery.data?.data.can_bootstrap ?? false

	useEffect(() => {
		if (!canBootstrap) return
		setUsername('')
		setPassword('')
	}, [canBootstrap])

	const bootstrapMutation = useMutation({
		mutationFn: (payload: { username: string; password: string }) => auth.bootstrap(payload),
	})

	const loginMutation = useMutation({
		mutationFn: (payload: { username: string; password: string }) => auth.login(payload),
	})

	const playerLoginMutation = useMutation({
		mutationFn: (payload: { commander_id: number; password: string }) => api.userAuthLogin(payload),
		onSuccess: async () => {
			try {
				await auth.refreshSession()
				toast.success('Signed in')
			} catch (error) {
				toast.error('Signed in, but failed to refresh session', { description: (error as Error).message })
			}
		},
		onError: (error) => {
			toast.error('Sign in failed', { description: (error as Error).message })
		},
	})

	const handlePasskeyLogin = async () => {
		if (!window.PublicKeyCredential) {
			toast.error('Passkeys are not supported in this browser')
			return
		}
		setPasskeyLoading(true)
		try {
			const optionsResponse = await api.passkeyAuthenticateOptions({ username: username || undefined })
			const requestOptions = parseRequestOptions(optionsResponse.data.publicKey)
			const credential = (await navigator.credentials.get({ publicKey: requestOptions })) as PublicKeyCredential | null
			if (!credential) {
				throw new Error('Passkey request was cancelled')
			}
			await api.passkeyAuthenticateVerify({
				credential: serializeAuthenticationCredential(credential),
				username: username || undefined,
			})
			try {
				await auth.refreshSession()
				toast.success('Signed in with passkey')
			} catch (error) {
				toast.error('Signed in, but failed to refresh session', { description: (error as Error).message })
			}
		} catch (error) {
			toast.error('Passkey sign-in failed', { description: (error as Error).message })
		} finally {
			setPasskeyLoading(false)
		}
	}

	const handleBootstrap = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		if (!username.trim() || !password) return
		try {
			await bootstrapMutation.mutateAsync({ username, password })
		} catch {
			// AuthContext mutation already surfaces an error toast.
		}
	}

	const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const identifier = username.trim()
		if (!identifier || !password) return
		if (/^\d+$/.test(identifier)) {
			const commanderId = Number(identifier)
			if (!Number.isFinite(commanderId) || commanderId <= 0) {
				toast.error('Commander ID must be greater than 0.')
				return
			}
			await playerLoginMutation.mutateAsync({ commander_id: commanderId, password })
			return
		}
		try {
			await loginMutation.mutateAsync({ username: identifier, password })
		} catch {
			// AuthContext mutation already surfaces an error toast.
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-center">Belfast</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					{bootstrapStatusQuery.isLoading ? (
						<div className="space-y-3">
							<div className="h-9 w-full animate-pulse rounded-md bg-muted" />
							<div className="h-9 w-full animate-pulse rounded-md bg-muted" />
							<div className="h-9 w-full animate-pulse rounded-md bg-muted" />
						</div>
					) : null}

					{!bootstrapStatusQuery.isLoading && canBootstrap ? (
						<form onSubmit={handleBootstrap} className="space-y-4">
							<p className="text-sm text-muted-foreground">No admin account exists yet. Create the first admin.</p>
							<div className="space-y-2">
								<label className="text-sm font-medium" htmlFor="username">
									Admin username
								</label>
								<Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
							</div>
							<div className="space-y-2">
								<label className="text-sm font-medium" htmlFor="password">
									Password
								</label>
								<Input
									id="password"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
								/>
							</div>
							<Button type="submit" className="w-full" disabled={bootstrapMutation.isPending}>
								Create admin account
							</Button>
						</form>
					) : null}

					{!bootstrapStatusQuery.isLoading && !canBootstrap ? (
						<form onSubmit={handleLogin} className="space-y-4">
							<div className="space-y-2">
								<label className="text-sm font-medium" htmlFor="username">
									Username or Commander ID
								</label>
								<Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
							</div>
							<div className="space-y-2">
								<label className="text-sm font-medium" htmlFor="password">
									Password
								</label>
								<Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
							</div>
							<Button
								type="submit"
								className="w-full"
								disabled={loginMutation.isPending || playerLoginMutation.isPending}
							>
								<KeyRound className="mr-2 h-4 w-4" />
								Sign in
							</Button>
							<Button
								type="button"
								variant="outline"
								className="w-full"
								disabled={passkeyLoading}
								onClick={handlePasskeyLogin}
							>
								<Fingerprint className="mr-2 h-4 w-4" />
								{passkeyLoading ? 'Waiting for passkey…' : 'Sign in with passkey'}
							</Button>
							<div className="text-center text-sm">
								<Link to="/register" className="text-muted-foreground underline-offset-2 hover:underline">
									Create a player account
								</Link>
							</div>
						</form>
					) : null}
				</CardContent>
			</Card>
		</div>
	)
}
