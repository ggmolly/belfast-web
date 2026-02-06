import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Fingerprint, KeyRound } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { parseCreationOptions, serializeRegistrationCredential } from '../lib/webauthn'
import { api } from '../services/api'

export const SecurityPage: React.FC = () => {
	const queryClient = useQueryClient()
	const [passkeyLabel, setPasskeyLabel] = useState('')
	const [passkeyLoading, setPasskeyLoading] = useState(false)

	const passkeysQuery = useQuery({
		queryKey: ['auth', 'passkeys'],
		queryFn: api.getPasskeys,
	})

	const deletePasskeyMutation = useMutation({
		mutationFn: (credentialId: string) => api.deletePasskey(credentialId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['auth', 'passkeys'] })
			toast.success('Passkey removed')
		},
		onError: (error) => {
			toast.error('Passkey removal failed', { description: error.message })
		},
	})

	const changePasswordMutation = useMutation({
		mutationFn: (payload: { current_password: string; new_password: string }) => api.authChangePassword(payload),
		onSuccess: () => {
			toast.success('Password updated')
		},
		onError: (error) => {
			toast.error('Password update failed', { description: error.message })
		},
	})

	const passwordForm = useForm({
		defaultValues: {
			current_password: '',
			new_password: '',
		},
		onSubmit: async ({ value }) => {
			await changePasswordMutation.mutateAsync(value)
			passwordForm.reset({ current_password: '', new_password: '' })
		},
	})

	const passkeys = passkeysQuery.data?.data.passkeys ?? []

	const handleRegisterPasskey = async () => {
		if (!window.PublicKeyCredential) {
			toast.error('Passkeys are not supported in this browser')
			return
		}
		setPasskeyLoading(true)
		try {
			const optionsResponse = await api.passkeyRegisterOptions({
				label: passkeyLabel || undefined,
				resident_key: 'preferred',
				user_verification: 'preferred',
			})
			const creationOptions = parseCreationOptions(optionsResponse.data.publicKey)
			const credential = (await navigator.credentials.create({
				publicKey: creationOptions,
			})) as PublicKeyCredential | null
			if (!credential) {
				throw new Error('Passkey creation was cancelled')
			}
			await api.passkeyRegisterVerify({
				credential: serializeRegistrationCredential(credential),
				label: passkeyLabel || undefined,
			})
			setPasskeyLabel('')
			queryClient.invalidateQueries({ queryKey: ['auth', 'passkeys'] })
			toast.success('Passkey registered')
		} catch (error) {
			toast.error('Passkey registration failed', { description: (error as Error).message })
		} finally {
			setPasskeyLoading(false)
		}
	}

	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-bold tracking-tight">Security</h1>

			<div className="grid gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle className="flex items-center gap-2">
							<Fingerprint className="h-5 w-5" />
							Passkeys
						</CardTitle>
						<Badge variant="secondary">{passkeys.length} saved</Badge>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<label className="text-xs font-medium text-muted-foreground" htmlFor="passkey-label">
								Label (optional)
							</label>
							<Input
								id="passkey-label"
								value={passkeyLabel}
								onChange={(event) => setPasskeyLabel(event.target.value)}
								placeholder="MacBook Pro"
							/>
						</div>
						<Button variant="secondary" className="w-full" disabled={passkeyLoading} onClick={handleRegisterPasskey}>
							{passkeyLoading ? 'Registering...' : 'Register passkey'}
						</Button>
						<div className="space-y-3">
							{passkeys.length === 0 ? (
								<p className="text-sm text-muted-foreground">No passkeys registered yet.</p>
							) : null}
							{passkeys.map((passkey) => (
								<div key={passkey.credential_id} className="rounded-lg border border-border bg-card p-3">
									<div className="flex items-center justify-between gap-3">
										<div>
											<p className="text-sm font-semibold text-foreground">{passkey.label || 'Unnamed passkey'}</p>
											<p className="text-xs text-muted-foreground">
												Created: {new Date(passkey.created_at).toLocaleDateString()}
											</p>
										</div>
										<Button
											size="sm"
											variant="outline"
											onClick={() => deletePasskeyMutation.mutate(passkey.credential_id)}
										>
											Remove
										</Button>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<KeyRound className="h-5 w-5" />
							Change Password
						</CardTitle>
					</CardHeader>
					<CardContent>
						<form
							onSubmit={(event) => {
								event.preventDefault()
								passwordForm.handleSubmit()
							}}
							className="space-y-3"
						>
							<passwordForm.Field name="current_password">
								{(field) => (
									<div className="space-y-2">
										<label className="text-xs font-medium text-muted-foreground" htmlFor="current-password">
											Current password
										</label>
										<Input
											id="current-password"
											type="password"
											value={field.state.value}
											onChange={(event) => field.handleChange(event.target.value)}
										/>
									</div>
								)}
							</passwordForm.Field>
							<passwordForm.Field name="new_password">
								{(field) => (
									<div className="space-y-2">
										<label className="text-xs font-medium text-muted-foreground" htmlFor="new-password">
											New password
										</label>
										<Input
											id="new-password"
											type="password"
											value={field.state.value}
											onChange={(event) => field.handleChange(event.target.value)}
										/>
									</div>
								)}
							</passwordForm.Field>
							<Button type="submit" className="w-full" variant="secondary">
								Update password
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
