import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar, KeyRound, Megaphone, ShieldCheck, Trash2, UserCheck, UserMinus, UserPlus } from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../components/AuthContext'
import { usePermissions } from '../components/PermissionsContext'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { api } from '../services/api'
import type { NoticeSummary } from '../types'

export const SystemPage: React.FC = () => {
	const queryClient = useQueryClient()
	const auth = useAuth()
	const perms = usePermissions()
	const canAdminUsersRead = perms.can('admin.users', 'read_any')
	const canAdminUsersWrite = perms.can('admin.users', 'write_any')
	const canNoticesRead = perms.can('notices', 'read_any')
	const canNoticesWrite = perms.can('notices', 'write_any')
	const canActivitiesRead = perms.can('activities', 'read_any')
	const canActivitiesWrite = perms.can('activities', 'write_any')
	const canViewSystem = canAdminUsersRead || canNoticesRead || canActivitiesRead || perms.can('server', 'read_any')
	const [noticeModalOpen, setNoticeModalOpen] = useState(false)
	const [editingNotice, setEditingNotice] = useState<NoticeSummary | null>(null)
	const [resetAdminId, setResetAdminId] = useState('')
	const [resetAdminName, setResetAdminName] = useState('')
	const resetModalOpen = Boolean(resetAdminId)

	const noticesQuery = useQuery({
		queryKey: ['notices', { offset: 0, limit: 50 }],
		queryFn: () => api.getNotices({ offset: 0, limit: 50 }),
		enabled: canNoticesRead,
	})
	const allowlistQuery = useQuery({
		queryKey: ['activities', 'allowlist'],
		queryFn: api.getActivitiesAllowlist,
		enabled: canActivitiesRead,
	})
	const adminUsersQuery = useQuery({
		queryKey: ['admin-users', { offset: 0, limit: 50 }],
		queryFn: () => api.listAdminUsers({ offset: 0, limit: 50 }),
		enabled: canAdminUsersRead,
	})
	const createNoticeMutation = useMutation({
		mutationFn: (payload: NoticeSummary) => api.createNotice(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['notices'] })
			setNoticeModalOpen(false)
		},
	})

	const updateNoticeMutation = useMutation({
		mutationFn: (payload: NoticeSummary) => api.updateNotice(payload.id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['notices'] })
			setEditingNotice(null)
		},
	})

	const deleteNoticeMutation = useMutation({
		mutationFn: (id: number) => api.deleteNotice(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notices'] }),
	})

	const updateAllowlistMutation = useMutation({
		mutationFn: (payload: { ids: number[] }) => api.updateActivitiesAllowlist(payload),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities', 'allowlist'] }),
	})

	const createAdminMutation = useMutation({
		mutationFn: (payload: { username: string; password: string }) => api.createAdminUser(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['admin-users'] })
			toast.success('Admin account created')
		},
		onError: (error) => {
			toast.error('Admin creation failed', { description: error.message })
		},
	})

	const updateAdminMutation = useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: { disabled?: boolean } }) => api.updateAdminUser(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['admin-users'] })
			toast.success('Admin updated')
		},
		onError: (error) => {
			toast.error('Admin update failed', { description: error.message })
		},
	})

	const deleteAdminMutation = useMutation({
		mutationFn: (id: string) => api.deleteAdminUser(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['admin-users'] })
			toast.success('Admin removed')
		},
		onError: (error) => {
			toast.error('Admin delete failed', { description: error.message })
		},
	})

	const resetAdminPasswordMutation = useMutation({
		mutationFn: ({ id, password }: { id: string; password: string }) => api.resetAdminPassword(id, { password }),
		onSuccess: () => {
			setResetAdminId('')
			setResetAdminName('')
			toast.success('Password reset')
		},
		onError: (error) => {
			toast.error('Password reset failed', { description: error.message })
		},
	})

	const notices = noticesQuery.data?.data.notices ?? []
	const allowlistIds = allowlistQuery.data?.data.ids ?? []
	const adminUsers = adminUsersQuery.data?.data.users ?? []

	const allowlistForm = useForm({
		defaultValues: {
			idsText: '',
		},
		onSubmit: async ({ value }) => {
			if (!canActivitiesWrite) {
				toast.error('You do not have permission to update the activities allowlist.')
				return
			}
			const ids = value.idsText
				.split(/[\s,]+/)
				.filter(Boolean)
				.map((entry) => Number(entry))
				.filter((entry) => Number.isFinite(entry))
			await updateAllowlistMutation.mutateAsync({ ids })
		},
	})

	const noticeForm = useForm({
		defaultValues: {
			title: '',
			content: '',
			version: '',
			time_desc: '',
		},
		onSubmit: async ({ value }) => {
			if (!canNoticesWrite) {
				toast.error('You do not have permission to modify notices.')
				return
			}
			const payload: NoticeSummary = {
				id: editingNotice?.id ?? 0,
				title: value.title,
				content: value.content,
				version: value.version,
				time_desc: value.time_desc,
				btn_title: editingNotice?.btn_title ?? '',
				icon: editingNotice?.icon ?? 0,
				tag_type: editingNotice?.tag_type ?? 0,
				title_image: editingNotice?.title_image ?? '',
				track: editingNotice?.track ?? '',
			}
			if (editingNotice) {
				await updateNoticeMutation.mutateAsync(payload)
				return
			}
			await createNoticeMutation.mutateAsync(payload)
		},
	})

	const adminForm = useForm({
		defaultValues: {
			username: '',
			password: '',
		},
		onSubmit: async ({ value }) => {
			if (!canAdminUsersWrite) {
				toast.error('You do not have permission to manage admin accounts.')
				return
			}
			await createAdminMutation.mutateAsync(value)
			adminForm.reset({ username: '', password: '' })
		},
	})

	const resetPasswordForm = useForm({
		defaultValues: {
			password: '',
		},
		onSubmit: async ({ value }) => {
			await resetAdminPasswordMutation.mutateAsync({ id: resetAdminId, password: value.password })
			resetPasswordForm.reset({ password: '' })
		},
	})

	useEffect(() => {
		allowlistForm.reset({ idsText: allowlistIds.join(', ') })
	}, [allowlistIds, allowlistForm])

	useEffect(() => {
		if (resetModalOpen) {
			resetPasswordForm.reset({ password: '' })
		}
	}, [resetModalOpen, resetPasswordForm])

	useEffect(() => {
		if (editingNotice) {
			noticeForm.reset({
				title: editingNotice.title,
				content: editingNotice.content,
				version: editingNotice.version,
				time_desc: editingNotice.time_desc,
			})
			setNoticeModalOpen(true)
			return
		}
		noticeForm.reset({ title: '', content: '', version: '', time_desc: '' })
	}, [editingNotice, noticeForm])

	const allowlistSummary = useMemo(() => allowlistIds.slice(0, 8), [allowlistIds])

	if (!canViewSystem) {
		return (
			<div className="space-y-6">
				<h1 className="text-3xl font-bold tracking-tight">System Management</h1>
				<p className="text-sm text-muted-foreground">You do not have permission to access system management.</p>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-bold tracking-tight">System Management</h1>

			<div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle className="flex items-center gap-2">
							<ShieldCheck className="h-5 w-5" />
							Admin Accounts
						</CardTitle>
						<Badge variant="secondary">{adminUsers.length} total</Badge>
					</CardHeader>
					<CardContent className="space-y-5">
						{!canAdminUsersRead ? (
							<p className="text-sm text-muted-foreground">You do not have permission to view admin accounts.</p>
						) : null}
						<form
							onSubmit={(event) => {
								event.preventDefault()
								adminForm.handleSubmit()
							}}
							className="space-y-4 rounded-lg border border-border bg-muted/20 p-4"
						>
							<div className="flex items-center gap-2 text-sm font-semibold">
								<UserPlus className="h-4 w-4 text-primary" />
								Create new admin
							</div>
							<div className="grid gap-3 md:grid-cols-2">
								<adminForm.Field name="username">
									{(field) => (
										<div className="space-y-2">
											<label className="text-xs font-medium text-muted-foreground" htmlFor="admin-username">
												Username
											</label>
											<Input
												id="admin-username"
												value={field.state.value}
												onChange={(event) => field.handleChange(event.target.value)}
												placeholder="ops-admin"
											/>
										</div>
									)}
								</adminForm.Field>
								<adminForm.Field name="password">
									{(field) => (
										<div className="space-y-2">
											<label className="text-xs font-medium text-muted-foreground" htmlFor="admin-password">
												Password
											</label>
											<Input
												id="admin-password"
												type="password"
												value={field.state.value}
												onChange={(event) => field.handleChange(event.target.value)}
												placeholder="Set a strong password"
											/>
										</div>
									)}
								</adminForm.Field>
							</div>
							<Button type="submit" variant="secondary" className="w-full" disabled={!canAdminUsersWrite}>
								Create admin account
							</Button>
						</form>

						<div className="space-y-3">
							{adminUsers.length === 0 ? <p className="text-sm text-muted-foreground">No admin users found.</p> : null}
							{adminUsers.map((user) => (
								<div
									key={user.id}
									className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 md:flex-row md:items-center md:justify-between"
								>
									<div>
										<p className="text-sm font-semibold text-foreground">{user.username}</p>
										<p className="text-xs text-muted-foreground">
											Last login: {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}
										</p>
									</div>
									<div className="flex flex-wrap items-center gap-2">
										<Badge variant={user.disabled ? 'outline' : 'secondary'}>
											{user.disabled ? 'Disabled' : 'Active'}
										</Badge>
										{auth.user?.id === user.id ? <Badge variant="outline">You</Badge> : null}
										<Button
											size="sm"
											variant="outline"
											onClick={() => {
												setResetAdminId(user.id)
												setResetAdminName(user.username)
											}}
											disabled={!canAdminUsersWrite}
										>
											<KeyRound className="mr-2 h-3.5 w-3.5" />
											Reset password
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onClick={() =>
												updateAdminMutation.mutate({
													id: user.id,
													payload: { disabled: !user.disabled },
												})
											}
											disabled={!canAdminUsersWrite || auth.user?.id === user.id}
										>
											{user.disabled ? (
												<>
													<UserCheck className="mr-2 h-3.5 w-3.5" />
													Enable
												</>
											) : (
												<>
													<UserMinus className="mr-2 h-3.5 w-3.5" />
													Disable
												</>
											)}
										</Button>
										<Button
											size="sm"
											variant="destructive"
											onClick={() => {
												if (!window.confirm(`Remove ${user.username}?`)) return
												deleteAdminMutation.mutate(user.id)
											}}
											disabled={!canAdminUsersWrite || auth.user?.id === user.id}
										>
											<Trash2 className="mr-2 h-3.5 w-3.5" />
											Remove
										</Button>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<div className="space-y-6" />
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<div className="space-y-6">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle className="flex items-center gap-2">
								<Calendar className="h-5 w-5" />
								Activities Allowlist
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex flex-wrap gap-2">
								{allowlistSummary.map((id) => (
									<Badge key={id} variant="secondary">
										{id}
									</Badge>
								))}
								{allowlistIds.length === 0 ? (
									<span className="text-sm text-muted-foreground">No allowlisted activities.</span>
								) : null}
							</div>
							<form
								onSubmit={(event) => {
									event.preventDefault()
									allowlistForm.handleSubmit()
								}}
								className="space-y-3"
							>
								<allowlistForm.Field name="idsText">
									{(field) => (
										<div className="space-y-2">
											<label htmlFor="allowlist-ids" className="text-sm font-medium">
												Allowlist IDs (comma-separated)
											</label>
											<textarea
												id="allowlist-ids"
												className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
												value={field.state.value}
												onChange={(event) => field.handleChange(event.target.value)}
												placeholder="101, 102, 103"
											/>
										</div>
									)}
								</allowlistForm.Field>
								<Button type="submit" className="w-full" variant="secondary" disabled={!canActivitiesWrite}>
									Update Allowlist
								</Button>
							</form>
						</CardContent>
					</Card>
				</div>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle className="flex items-center gap-2">
							<Megaphone className="h-5 w-5" />
							Game Notices
						</CardTitle>
						<Button size="sm" variant="outline" onClick={() => setNoticeModalOpen(true)} disabled={!canNoticesWrite}>
							New Notice
						</Button>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{notices.map((notice) => (
								<div key={notice.id} className="rounded-lg border border-border bg-card p-4">
									<div className="mb-2 flex items-start justify-between">
										<h4 className="font-semibold">{notice.title}</h4>
										<Badge variant="outline">{notice.version}</Badge>
									</div>
									<p className="mb-3 text-sm text-muted-foreground">{notice.content}</p>
									<div className="flex items-center justify-between text-xs text-muted-foreground">
										<span>{notice.time_desc}</span>
										<div className="space-x-2">
											<button
												type="button"
												className={`hover:text-primary ${canNoticesWrite ? '' : 'opacity-50 cursor-not-allowed'}`}
												onClick={() => {
													if (!canNoticesWrite) return
													setEditingNotice(notice)
												}}
											>
												Edit
											</button>
											<button
												type="button"
												className="hover:text-destructive"
												onClick={() => {
													if (!canNoticesWrite) return
													deleteNoticeMutation.mutate(notice.id)
												}}
											>
												Delete
											</button>
										</div>
									</div>
								</div>
							))}
							{notices.length === 0 ? <p className="text-sm text-muted-foreground">No notices yet.</p> : null}
						</div>
					</CardContent>
				</Card>
			</div>

			<Modal
				isOpen={resetModalOpen}
				onClose={() => {
					setResetAdminId('')
					setResetAdminName('')
				}}
				title={resetAdminName ? `Reset password: ${resetAdminName}` : 'Reset password'}
			>
				<form
					onSubmit={(event) => {
						event.preventDefault()
						resetPasswordForm.handleSubmit()
					}}
					className="space-y-4"
				>
					<resetPasswordForm.Field name="password">
						{(field) => (
							<div className="space-y-2">
								<label htmlFor="reset-password" className="text-sm font-medium">
									New password
								</label>
								<Input
									id="reset-password"
									type="password"
									value={field.state.value}
									onChange={(event) => field.handleChange(event.target.value)}
									placeholder="Temporary or permanent password"
								/>
							</div>
						)}
					</resetPasswordForm.Field>
					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="ghost"
							onClick={() => {
								setResetAdminId('')
								setResetAdminName('')
							}}
						>
							Cancel
						</Button>
						<Button type="submit" variant="secondary">
							Reset password
						</Button>
					</div>
				</form>
			</Modal>

			<Modal
				isOpen={noticeModalOpen}
				onClose={() => {
					setNoticeModalOpen(false)
					setEditingNotice(null)
				}}
				title={editingNotice ? 'Edit Notice' : 'Create Notice'}
			>
				<form
					onSubmit={(event) => {
						event.preventDefault()
						noticeForm.handleSubmit()
					}}
					className="space-y-4"
				>
					<noticeForm.Field name="title">
						{(field) => (
							<div className="space-y-2">
								<label htmlFor="notice-title" className="text-sm font-medium">
									Title
								</label>
								<Input
									id="notice-title"
									value={field.state.value}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
							</div>
						)}
					</noticeForm.Field>
					<noticeForm.Field name="content">
						{(field) => (
							<div className="space-y-2">
								<label htmlFor="notice-content" className="text-sm font-medium">
									Content
								</label>
								<textarea
									id="notice-content"
									className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
									value={field.state.value}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
							</div>
						)}
					</noticeForm.Field>
					<div className="grid gap-4 md:grid-cols-2">
						<noticeForm.Field name="version">
							{(field) => (
								<div className="space-y-2">
									<label htmlFor="notice-version" className="text-sm font-medium">
										Version
									</label>
									<Input
										id="notice-version"
										value={field.state.value}
										onChange={(event) => field.handleChange(event.target.value)}
										placeholder="1.0.0"
									/>
								</div>
							)}
						</noticeForm.Field>
						<noticeForm.Field name="time_desc">
							{(field) => (
								<div className="space-y-2">
									<label htmlFor="notice-time" className="text-sm font-medium">
										Time
									</label>
									<Input
										id="notice-time"
										value={field.state.value}
										onChange={(event) => field.handleChange(event.target.value)}
										placeholder="2024-01-01"
									/>
								</div>
							)}
						</noticeForm.Field>
					</div>
					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="ghost"
							onClick={() => {
								setNoticeModalOpen(false)
								setEditingNotice(null)
							}}
						>
							Cancel
						</Button>
						<Button type="submit">Save Notice</Button>
					</div>
				</form>
			</Modal>
		</div>
	)
}
