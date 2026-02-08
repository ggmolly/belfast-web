import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, KeyRound } from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../components/AuthContext'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { ApiError, api } from '../services/api'

type Step = 'create' | 'verify' | 'done'

export const RegisterPage: React.FC = () => {
	const auth = useAuth()
	const navigate = useNavigate()
	const [commanderId, setCommanderId] = useState('')
	const [password, setPassword] = useState('')
	const [pin, setPin] = useState('')
	const [step, setStep] = useState<Step>('create')
	const [challengeId, setChallengeId] = useState<string | null>(null)
	const [notice, setNotice] = useState<string | null>(null)

	const commanderIdNumber = Number(commanderId)
	const commanderIdValid = commanderId.trim() !== '' && Number.isFinite(commanderIdNumber) && commanderIdNumber > 0

	const createChallengeMutation = useMutation({
		mutationFn: () => api.createRegistrationChallenge({ commander_id: commanderIdNumber, password }),
		onSuccess: (response) => {
			setChallengeId(response.data.challenge_id)
			setStep('verify')
			setNotice(null)
			setPin('')
			toast.success('Challenge created')
		},
		onError: (error) => {
			if (error instanceof ApiError) {
				switch (error.code) {
					case 'auth.account_exists':
						setNotice('Account already exists.')
						return
					case 'auth.challenge_exists':
						setNotice('A challenge is already active. Try again later or verify the PIN.')
						return
					case 'auth.rate_limited':
						setNotice('Too many attempts. Try again later.')
						return
					default:
						setNotice(error.message)
						return
				}
			}
			setNotice((error as Error).message)
		},
	})

	const statusQuery = useQuery({
		queryKey: ['registration', 'challenge', challengeId],
		queryFn: () => api.getRegistrationChallengeStatus(challengeId ?? ''),
		enabled: Boolean(challengeId) && step === 'verify',
		retry: false,
		refetchInterval: (query) => {
			const status = query.state.data?.data.status
			return status === 'pending' ? 3000 : false
		},
	})

	const status = statusQuery.data?.data.status ?? 'pending'
	const statusBadgeVariant = useMemo(() => {
		if (status === 'consumed') return 'success'
		if (status === 'expired') return 'destructive'
		return 'secondary'
	}, [status])

	const verifyPinMutation = useMutation({
		mutationFn: () => api.verifyRegistrationChallenge(challengeId ?? '', { pin }),
		onSuccess: (response) => {
			setNotice(null)
			if (response.data.status === 'consumed') {
				setStep('done')
			}
		},
		onError: (error) => {
			if (error instanceof ApiError) {
				if (error.status === 404 || error.code === 'not_found') {
					setNotice('Challenge not found.')
					return
				}
				switch (error.code) {
					case 'auth.challenge_invalid':
						setNotice('Invalid PIN.')
						return
					case 'auth.challenge_expired':
						setNotice('PIN expired.')
						return
					case 'auth.challenge_consumed':
						setNotice('Challenge already used.')
						return
					case 'auth.account_exists':
						setNotice('Account already exists.')
						return
					default:
						setNotice(error.message)
						return
				}
			}
			setNotice((error as Error).message)
		},
	})

	const loginMutation = useMutation({
		mutationFn: () => api.userAuthLogin({ commander_id: commanderIdNumber, password }),
		onSuccess: async () => {
			try {
				await auth.refreshSession()
				toast.success('Signed in')
				navigate({ to: '/me' })
			} catch (error) {
				toast.error('Signed in, but failed to refresh session', { description: (error as Error).message })
			}
		},
		onError: (error) => {
			toast.error('Sign in failed', { description: (error as Error).message })
		},
	})

	useEffect(() => {
		if (!challengeId) return
		if (status === 'consumed' && step !== 'done') {
			setStep('done')
		}
		if (status === 'expired') {
			setNotice('Challenge expired. Create a new one.')
		}
	}, [challengeId, status, step])

	const handleCreateChallenge = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setNotice(null)
		if (!commanderIdValid) {
			setNotice('Commander ID must be greater than 0.')
			return
		}
		if (!password) {
			setNotice('Password is required.')
			return
		}
		await createChallengeMutation.mutateAsync()
	}

	const handleVerifyPin = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setNotice(null)
		if (!challengeId) {
			setNotice('No active challenge.')
			return
		}
		if (!pin.trim()) {
			setNotice('PIN is required.')
			return
		}
		await verifyPinMutation.mutateAsync()
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-center">Player Account</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex items-center justify-between">
						<Link to="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back
						</Link>
						{challengeId ? (
							<Badge variant={statusBadgeVariant}>
								{status === 'pending' ? 'Pending' : status === 'consumed' ? 'Consumed' : 'Expired'}
							</Badge>
						) : null}
					</div>

					{step === 'create' ? (
						<form onSubmit={handleCreateChallenge} className="space-y-4">
							<p className="text-sm text-muted-foreground">
								Create an account for your Commander ID. A PIN will be delivered in-game.
							</p>
							<div className="space-y-2">
								<label className="text-sm font-medium" htmlFor="commander-id">
									Commander ID
								</label>
								<Input
									id="commander-id"
									type="number"
									value={commanderId}
									onChange={(e) => setCommanderId(e.target.value)}
									placeholder="9001"
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
									onChange={(e) => setPassword(e.target.value)}
									required
								/>
							</div>
							<Button type="submit" className="w-full" disabled={createChallengeMutation.isPending}>
								Create challenge
							</Button>
						</form>
					) : null}

					{step === 'verify' ? (
						<form onSubmit={handleVerifyPin} className="space-y-4">
							<p className="text-sm text-muted-foreground">
								Open the game and retrieve the PIN. Enter it below to finalize registration.
							</p>
							<div className="space-y-2">
								<label className="text-sm font-medium" htmlFor="pin">
									PIN
								</label>
								<Input id="pin" value={pin} onChange={(e) => setPin(e.target.value)} required />
							</div>
							<Button type="submit" className="w-full" disabled={verifyPinMutation.isPending || status === 'expired'}>
								Verify PIN
							</Button>
							<Button
								type="button"
								variant="outline"
								className="w-full"
								onClick={() => {
									setStep('create')
									setChallengeId(null)
									setPin('')
									setNotice(null)
								}}
							>
								Start over
							</Button>
						</form>
					) : null}

					{step === 'done' ? (
						<div className="space-y-4">
							<p className="text-sm text-muted-foreground">Account creation complete.</p>
							<Button
								variant="secondary"
								className="w-full"
								disabled={!commanderIdValid || !password || loginMutation.isPending}
								onClick={() => loginMutation.mutate()}
							>
								<KeyRound className="mr-2 h-4 w-4" />
								Sign in
							</Button>
							<Button variant="outline" className="w-full" onClick={() => navigate({ to: '/login' })}>
								Go to login
							</Button>
						</div>
					) : null}

					{notice ? <p className="text-sm text-destructive">{notice}</p> : null}
				</CardContent>
			</Card>
		</div>
	)
}
