import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
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

type AuthMode = 'player-login' | 'admin-login' | 'bootstrap' | 'register'

export const LoginPage = () => {
	const auth = useAuth()
	const navigate = useNavigate()
	const [mode, setMode] = useState<AuthMode>('player-login')
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [passkeyLoading, setPasskeyLoading] = useState(false)
	const [playerCommanderId, setPlayerCommanderId] = useState('')
	const [playerPassword, setPlayerPassword] = useState('')
	const [registerCommanderId, setRegisterCommanderId] = useState('')
	const [registerPassword, setRegisterPassword] = useState('')
	const [registerPin, setRegisterPin] = useState('')
	const [registerNotice, setRegisterNotice] = useState<string | null>(null)
	const [registrationChallenge, setRegistrationChallenge] = useState<UserRegistrationChallengeResponse | null>(null)
	const [registrationConsumed, setRegistrationConsumed] = useState(false)
	const [registrationComplete, setRegistrationComplete] = useState(false)
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
			setRegisterPin('')
			setRegistrationComplete(false)
		},
		onError: (error) => {
			if (error instanceof ApiError) {
				switch (error.code) {
					case 'auth.account_exists':
						setRegisterNotice('Account already exists.')
						return
					case 'auth.challenge_exists':
						setRegisterNotice('Challenge already active.')
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
	const verifyChallengeMutation = useMutation({
		mutationFn: (payload: { challengeId: string; pin: string }) =>
			api.verifyRegistrationChallenge(payload.challengeId, { pin: payload.pin }),
		onSuccess: () => {
			setRegisterNotice(null)
		},
		onError: (error) => {
			if (error instanceof ApiError) {
				if (error.status === 404) {
					setRegisterNotice('Challenge not found.')
					return
				}
				switch (error.code) {
					case 'auth.challenge_invalid':
						setRegisterNotice('Invalid PIN.')
						return
					case 'auth.challenge_expired':
						setRegisterNotice('PIN expired.')
						return
					case 'auth.challenge_consumed':
						setRegisterNotice('Challenge already used.')
						return
					case 'auth.account_exists':
						setRegisterNotice('Account already exists.')
						return
					case 'not_found':
						setRegisterNotice('Challenge not found.')
						return
					default:
						setRegisterNotice(error.message)
						return
				}
			}
			setRegisterNotice((error as Error).message)
		},
	})
	const resetVerifyChallenge = verifyChallengeMutation.reset
	const challengeStatusQuery = useQuery({
		queryKey: ['registration', 'challenge', registrationChallenge?.challenge_id],
		queryFn: () => api.getRegistrationChallengeStatus(registrationChallenge?.challenge_id ?? ''),
		enabled: Boolean(registrationChallenge?.challenge_id) && !registrationConsumed,
		retry: false,
		refetchInterval: (query) =>
			registrationConsumed ? false : query.state.data?.data.status === 'pending' ? 3000 : false,
	})
	const userLoginMutation = useMutation({
		mutationFn: (payload: { commander_id: number; password: string }) => api.userAuthLogin(payload),
	})

	useEffect(() => {
		if (!canBootstrap && mode === 'bootstrap') {
			setMode('admin-login')
		}
	}, [canBootstrap, mode])

	useEffect(() => {
		if (mode !== 'register') {
			setRegistrationChallenge(null)
			setRegisterNotice(null)
			setRegistrationConsumed(false)
			setRegisterPin('')
			setRegistrationComplete(false)
			resetVerifyChallenge()
		}
	}, [mode, resetVerifyChallenge])

	useEffect(() => {
		const error = challengeStatusQuery.error
		if (!error) return
		if (error instanceof ApiError && (error.code === 'not_found' || error.status === 404)) {
			setRegisterNotice('Challenge not found.')
			setRegistrationChallenge(null)
			setRegisterPin('')
			setRegistrationConsumed(false)
			setRegistrationComplete(false)
			return
		}
		setRegisterNotice((error as Error).message)
	}, [challengeStatusQuery.error])

	useEffect(() => {
		const challengeConsumed =
			challengeStatusQuery.data?.data.status === 'consumed' || verifyChallengeMutation.data?.data.status === 'consumed'
		if (
			mode !== 'register' ||
			!registrationChallenge ||
			registrationConsumed ||
			registrationComplete ||
			!challengeConsumed
		) {
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
				setRegistrationComplete(true)
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
		registrationComplete,
		userLoginMutation,
		verifyChallengeMutation.data?.data.status,
	])

	const handleAdminLogin = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		await auth.login({ username, password })
	}

	const handleBootstrap = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		await auth.bootstrap({ username, password })
	}

	const handlePlayerLogin = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const commanderId = Number(playerCommanderId)
		if (!playerCommanderId || Number.isNaN(commanderId) || commanderId <= 0) {
			toast.error('Commander ID must be greater than 0.')
			return
		}
		if (!playerPassword) {
			toast.error('Password is required.')
			return
		}
		const response = await auth.playerLogin({ commander_id: commanderId, password: playerPassword })
		if (response) {
			navigate({ to: '/' })
		}
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
		const commanderId = Number(registerCommanderId)
		if (!registerCommanderId || Number.isNaN(commanderId) || commanderId <= 0) {
			setRegisterNotice('Commander ID must be greater than 0.')
			return
		}
		if (!registerPassword) {
			setRegisterNotice('Password is required.')
			return
		}
		try {
			await createChallengeMutation.mutateAsync({
				commander_id: commanderId,
				password: registerPassword,
			})
		} catch {
			return
		}
	}

	const handleVerifyPin = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setRegisterNotice(null)
		const normalizedPin = registerPin.trim().toUpperCase()
		if (!/^(B-)?\d{6}$/.test(normalizedPin)) {
			setRegisterNotice('PIN must be B-123456 or 123456.')
			return
		}
		if (!registrationChallenge) {
			return
		}
		try {
			await verifyChallengeMutation.mutateAsync({
				challengeId: registrationChallenge.challenge_id,
				pin: normalizedPin,
			})
		} catch {
			return
		}
	}

	const challengeStatus = challengeStatusQuery.data?.data.status
	const verifyExpired =
		verifyChallengeMutation.error instanceof ApiError && verifyChallengeMutation.error.code === 'auth.challenge_expired'
	const isExpired = challengeStatus === 'expired' || verifyExpired
	const resetRegistrationFlow = () => {
		setRegistrationChallenge(null)
		setRegisterNotice(null)
		setRegistrationConsumed(false)
		setRegisterPin('')
		setRegistrationComplete(false)
		resetVerifyChallenge()
	}
	const challengeConsumed = challengeStatus === 'consumed' || verifyChallengeMutation.data?.data.status === 'consumed'
	const statusMessage = isExpired
		? 'PIN expired.'
		: challengeConsumed
			? userLoginMutation.isPending
				? 'Confirmed. Signing you in...'
				: 'Confirmed. Account ready.'
			: verifyChallengeMutation.isPending
				? 'Verifying PIN...'
				: 'Waiting for PIN...'

	return (
		<div className="min-h-screen bg-gradient-to-br from-muted/60 via-background to-card">
			<div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-6 py-12">
				<Card className="w-full max-w-md shadow-xl shadow-black/5">
					<CardHeader className="space-y-2">
						<div className="flex items-center gap-2">
							<KeyRound className="h-5 w-5 text-primary" />
							<CardTitle>
								{mode === 'player-login'
									? 'Player sign in'
									: mode === 'admin-login'
										? 'Admin sign in'
										: mode === 'bootstrap'
											? 'Bootstrap admin'
											: 'Register account'}
							</CardTitle>
						</div>
						<p className="text-sm text-muted-foreground">
							{mode === 'player-login'
								? 'Sign in with your commander ID to continue.'
								: mode === 'admin-login'
									? 'Use your admin credentials or passkey to continue.'
									: mode === 'bootstrap'
										? 'Create the very first admin account for this server.'
										: 'Create a player account with a PIN challenge.'}
						</p>
						<div className="flex gap-2 rounded-full bg-muted p-1 text-xs">
							<Button
								type="button"
								size="sm"
								variant={mode === 'player-login' ? 'secondary' : 'ghost'}
								className="rounded-full px-4"
								onClick={() => setMode('player-login')}
							>
								Player sign in
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
							<Button
								type="button"
								size="sm"
								variant={mode === 'admin-login' ? 'secondary' : 'ghost'}
								className="rounded-full px-4"
								onClick={() => setMode('admin-login')}
							>
								Admin sign in
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
								{registrationComplete ? (
									<div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
										<p className="text-sm font-medium text-foreground">Account created.</p>
										<p className="text-xs text-muted-foreground">
											Your commander is verified. You can now sign in with this account in-game.
										</p>
										<div className="flex flex-wrap gap-2">
											<Button type="button" variant="outline" onClick={resetRegistrationFlow}>
												Register another account
											</Button>
											<Button type="button" onClick={() => setMode('player-login')}>
												Back to player sign in
											</Button>
										</div>
									</div>
								) : registrationChallenge ? (
									<div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<span className="text-xs font-medium text-muted-foreground">
												Check your in-game mail for a PIN
											</span>
											<span className="text-xs text-muted-foreground">
												Expires {new Date(registrationChallenge.expires_at).toLocaleString()}
											</span>
										</div>
										<p className="text-xs text-muted-foreground">Enter the PIN from your mail (B-123456 or 123456).</p>
										<form className="space-y-3" onSubmit={handleVerifyPin}>
											<div className="space-y-2">
												<label className="text-sm font-medium" htmlFor="register-pin">
													PIN
												</label>
												<Input
													id="register-pin"
													value={registerPin}
													onChange={(event) => setRegisterPin(event.target.value.toUpperCase())}
													placeholder="B-123456"
													required
													disabled={isExpired || registrationConsumed}
												/>
											</div>
											{registerNotice ? <p className="text-xs text-destructive">{registerNotice}</p> : null}
											<Button
												type="submit"
												className="w-full"
												disabled={verifyChallengeMutation.isPending || isExpired || registrationConsumed}
											>
												Verify PIN
											</Button>
										</form>
										<p className="text-xs font-medium text-muted-foreground">
											Status:{' '}
											<span className="text-foreground">
												{isExpired ? 'expired' : challengeConsumed ? 'consumed' : (challengeStatus ?? 'pending')}
											</span>
										</p>
										<p className={`text-xs ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
											{statusMessage}
										</p>
										{isExpired ? (
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
												min="1"
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
						) : mode === 'player-login' ? (
							<form className="space-y-4" onSubmit={handlePlayerLogin}>
								<div className="space-y-2">
									<label className="text-sm font-medium" htmlFor="player-commander-id">
										Commander ID
									</label>
									<Input
										id="player-commander-id"
										type="number"
										min="1"
										value={playerCommanderId}
										onChange={(event) => setPlayerCommanderId(event.target.value)}
										placeholder="9001"
										required
									/>
								</div>
								<div className="space-y-2">
									<label className="text-sm font-medium" htmlFor="player-password">
										Password
									</label>
									<Input
										id="player-password"
										type="password"
										value={playerPassword}
										onChange={(event) => setPlayerPassword(event.target.value)}
										placeholder="••••••••"
										required
									/>
								</div>
								<Button type="submit" className="w-full">
									Sign in
								</Button>
							</form>
						) : (
							<>
								<form className="space-y-4" onSubmit={mode === 'admin-login' ? handleAdminLogin : handleBootstrap}>
									<div className="space-y-2">
										<label className="text-sm font-medium" htmlFor="username">
											Admin username
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
											placeholder={mode === 'admin-login' ? '••••••••' : 'Create a strong password'}
											required
										/>
									</div>
									<Button type="submit" className="w-full">
										{mode === 'admin-login' ? 'Sign in' : 'Create admin'}
									</Button>
								</form>
								{mode === 'admin-login' ? (
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
