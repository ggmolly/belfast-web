import { useMutation, useQuery } from '@tanstack/react-query'
import { Fingerprint, KeyRound } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../components/AuthContext'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { parseRequestOptions, serializeAuthenticationCredential } from '../lib/webauthn'
import { ApiError, api } from '../services/api'
import type { UserRegistrationChallengeResponse } from '../types'

type AuthMode = 'login' | 'bootstrap' | 'register'

export const LoginPage = () => {
	const auth = useAuth()
	const [mode, setMode] = useState<AuthMode>('login')
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [passkeyLoading, setPasskeyLoading] = useState(false)
	const [registerCommanderId, setRegisterCommanderId] = useState('')
	const [registerPassword, setRegisterPassword] = useState('')
	const [registerNotice, setRegisterNotice] = useState<string | null>(null)
	const [registrationChallenge, setRegistrationChallenge] = useState<UserRegistrationChallengeResponse | null>(null)
	const [registrationConsumed, setRegistrationConsumed] = useState(false)
	const bootstrapStatusQuery = useQuery({
		queryKey: ['auth', 'bootstrap-status'],
		queryFn: api.authBootstrapStatus,
		retry: false,
	})
	const canBootstrap = bootstrapStatusQuery.data?.data.can_bootstrap ?? false
	const createChallengeMutation = useMutation({
		mutationFn: (payload: { commander_id: number; password: string }) => api.createRegistrationChallenge(payload),
		onSuccess: (response) => {
			setRegistrationChallenge(response.data)
			setRegisterNotice(null)
			setRegistrationConsumed(false)
		},
		onError: (error) => {
			if (error instanceof ApiError) {
				switch (error.code) {
					case 'auth.account_exists':
						setRegisterNotice('Account already exists.')
						return
					case 'auth.challenge_exists':
						setRegisterNotice('An active challenge already exists.')
						return
					case 'auth.rate_limited':
						setRegisterNotice('Too many attempts. Try again later.')
						return
					default:
						setRegisterNotice(error.message)
						return
				}
			}
			setRegisterNotice((error as Error).message)
		},
	})
	const challengeStatusQuery = useQuery({
		queryKey: ['registration', 'challenge', registrationChallenge?.challenge_id],
		queryFn: () => api.getRegistrationChallengeStatus(registrationChallenge?.challenge_id ?? ''),
		enabled: Boolean(registrationChallenge?.challenge_id),
		retry: false,
		refetchInterval: (query) => (query.state.data?.data.status === 'pending' ? 3000 : false),
	})
	const userLoginMutation = useMutation({
		mutationFn: (payload: { commander_id: number; password: string }) => api.userAuthLogin(payload),
	})

	useEffect(() => {
		if (!canBootstrap && mode === 'bootstrap') {
			setMode('login')
		}
	}, [canBootstrap, mode])

	useEffect(() => {
		if (mode !== 'register') {
			setRegistrationChallenge(null)
			setRegisterNotice(null)
			setRegistrationConsumed(false)
		}
	}, [mode])

	useEffect(() => {
		const error = challengeStatusQuery.error
		if (!error) return
		if (error instanceof ApiError && (error.code === 'not_found' || error.status === 404)) {
			setRegisterNotice('Challenge not found. Start over.')
			setRegistrationChallenge(null)
			return
		}
		setRegisterNotice((error as Error).message)
	}, [challengeStatusQuery.error])

	useEffect(() => {
		const status = challengeStatusQuery.data?.data.status
		if (mode !== 'register' || !registrationChallenge || registrationConsumed || status !== 'consumed') {
			return
		}
		setRegistrationConsumed(true)
		const authenticate = async () => {
			try {
				await userLoginMutation.mutateAsync({
					commander_id: Number(registerCommanderId),
					password: registerPassword,
				})
				toast.success('Account created')
				setMode('login')
				resetRegistrationFlow()
			} catch (error) {
				setRegisterNotice((error as Error).message)
			}
		}
		void authenticate()
	}, [
		challengeStatusQuery.data?.data.status,
		mode,
		registerCommanderId,
		registerPassword,
		registrationChallenge,
		registrationConsumed,
		userLoginMutation,
	])

	const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		await auth.login({ username, password })
	}

	const handleBootstrap = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		await auth.bootstrap({ username, password })
	}

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
			await auth.refreshSession()
			toast.success('Signed in with passkey')
		} catch (error) {
			toast.error('Passkey sign-in failed', { description: (error as Error).message })
		} finally {
			setPasskeyLoading(false)
		}
	}

	const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setRegisterNotice(null)
		try {
			await createChallengeMutation.mutateAsync({
				commander_id: Number(registerCommanderId),
				password: registerPassword,
			})
		} catch {
			return
		}
	}

	const challengeStatus = challengeStatusQuery.data?.data.status
	const resetRegistrationFlow = () => {
		setRegistrationChallenge(null)
		setRegisterNotice(null)
		setRegistrationConsumed(false)
	}
	const statusMessage =
		challengeStatus === 'consumed'
			? userLoginMutation.isPending
				? 'Confirmed. Creating account...'
				: 'Confirmed. Account ready.'
			: challengeStatus === 'expired'
				? 'Challenge expired. Start over to create a new PIN.'
				: 'Waiting for confirmation...'

	return (
		<div className="min-h-screen bg-gradient-to-br from-muted/60 via-background to-card">
			<div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-6 py-12">
				<Card className="w-full max-w-md shadow-xl shadow-black/5">
					<CardHeader className="space-y-2">
						<div className="flex items-center gap-2">
							<KeyRound className="h-5 w-5 text-primary" />
							<CardTitle>
								{mode === 'login' ? 'Sign in' : mode === 'bootstrap' ? 'Bootstrap admin' : 'Register account'}
							</CardTitle>
						</div>
						<p className="text-sm text-muted-foreground">
							{mode === 'login'
								? 'Use your admin credentials or passkey to continue.'
								: mode === 'bootstrap'
									? 'Create the very first admin account for this server.'
									: 'Create a player account with a PIN challenge.'}
						</p>
						<div className="flex gap-2 rounded-full bg-muted p-1 text-xs">
							<Button
								type="button"
								size="sm"
								variant={mode === 'login' ? 'secondary' : 'ghost'}
								className="rounded-full px-4"
								onClick={() => setMode('login')}
							>
								Sign in
							</Button>
							<Button
								type="button"
								size="sm"
								variant={mode === 'register' ? 'secondary' : 'ghost'}
								className="rounded-full px-4"
								onClick={() => setMode('register')}
							>
								Register
							</Button>
							{canBootstrap ? (
								<Button
									type="button"
									size="sm"
									variant={mode === 'bootstrap' ? 'secondary' : 'ghost'}
									className="rounded-full px-4"
									onClick={() => setMode('bootstrap')}
								>
									First admin
								</Button>
							) : null}
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						{mode === 'register' ? (
							<div className="space-y-4">
								{registrationChallenge ? (
									<div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<span className="text-xs font-medium text-muted-foreground">Your PIN</span>
											<span className="text-xs text-muted-foreground">
												Expires {new Date(registrationChallenge.expires_at).toLocaleString()}
											</span>
										</div>
										<div className="text-2xl font-semibold text-foreground font-mono">{registrationChallenge.pin}</div>
										<p className="text-xs text-muted-foreground">Send this PIN in guild chat to confirm the account.</p>
										<p className="text-xs font-medium text-muted-foreground">
											Status: <span className="text-foreground">{challengeStatus ?? 'pending'}</span>
										</p>
										<p
											className={`text-xs ${
												challengeStatus === 'expired' ? 'text-destructive' : 'text-muted-foreground'
											}`}
										>
											{statusMessage}
										</p>
										{registerNotice ? <p className="text-xs text-destructive">{registerNotice}</p> : null}
										{challengeStatus === 'expired' ? (
											<Button type="button" variant="outline" onClick={resetRegistrationFlow}>
												Start over
											</Button>
										) : null}
									</div>
								) : (
									<form className="space-y-4" onSubmit={handleRegister}>
										<div className="space-y-2">
											<label className="text-sm font-medium" htmlFor="register-commander-id">
												Commander ID
											</label>
											<Input
												id="register-commander-id"
												type="number"
												value={registerCommanderId}
												onChange={(event) => setRegisterCommanderId(event.target.value)}
												placeholder="9001"
												required
											/>
										</div>
										<div className="space-y-2">
											<label className="text-sm font-medium" htmlFor="register-password">
												Password
											</label>
											<Input
												id="register-password"
												type="password"
												value={registerPassword}
												onChange={(event) => setRegisterPassword(event.target.value)}
												placeholder="Create a strong password"
												required
											/>
										</div>
										{registerNotice ? <p className="text-xs text-destructive">{registerNotice}</p> : null}
										<Button type="submit" className="w-full" disabled={createChallengeMutation.isPending}>
											Create challenge
										</Button>
									</form>
								)}
							</div>
						) : (
							<>
								<form className="space-y-4" onSubmit={mode === 'login' ? handleLogin : handleBootstrap}>
									<div className="space-y-2">
										<label className="text-sm font-medium" htmlFor="username">
											Username
										</label>
										<Input
											id="username"
											value={username}
											onChange={(event) => setUsername(event.target.value)}
											placeholder="admin"
											required
										/>
									</div>
									<div className="space-y-2">
										<label className="text-sm font-medium" htmlFor="password">
											Password
										</label>
										<Input
											id="password"
											type="password"
											value={password}
											onChange={(event) => setPassword(event.target.value)}
											placeholder={mode === 'login' ? '••••••••' : 'Create a strong password'}
											required
										/>
									</div>
									<Button type="submit" className="w-full">
										{mode === 'login' ? 'Sign in' : 'Create admin'}
									</Button>
								</form>
								{mode === 'login' ? (
									<>
										<div className="flex items-center gap-3 text-xs text-muted-foreground">
											<div className="h-px flex-1 bg-border" />
											<span>or</span>
											<div className="h-px flex-1 bg-border" />
										</div>
										<Button
											type="button"
											variant="outline"
											className="w-full gap-2"
											onClick={handlePasskeyLogin}
											disabled={passkeyLoading}
										>
											<Fingerprint className="h-4 w-4" />
											Use a passkey
										</Button>
										<p className="text-xs text-muted-foreground">
											Passkeys are tied to this device and protect against phishing attacks.
										</p>
									</>
								) : null}
							</>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
