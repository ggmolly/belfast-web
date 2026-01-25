import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar, Megaphone, RefreshCw } from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { api } from '../services/api'
import type { ExchangeCodeRequest, NoticeSummary } from '../types'

export const SystemPage: React.FC = () => {
	const queryClient = useQueryClient()
	const [noticeModalOpen, setNoticeModalOpen] = useState(false)
	const [exchangeModalOpen, setExchangeModalOpen] = useState(false)
	const [editingNotice, setEditingNotice] = useState<NoticeSummary | null>(null)

	const noticesQuery = useQuery({
		queryKey: ['notices', { offset: 0, limit: 50 }],
		queryFn: () => api.getNotices({ offset: 0, limit: 50 }),
	})
	const allowlistQuery = useQuery({
		queryKey: ['activities', 'allowlist'],
		queryFn: api.getActivitiesAllowlist,
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

	const createExchangeMutation = useMutation({
		mutationFn: (payload: ExchangeCodeRequest) => api.createExchangeCode(payload),
		onSuccess: () => {
			setExchangeModalOpen(false)
		},
	})

	const notices = noticesQuery.data?.data.notices ?? []
	const allowlistIds = allowlistQuery.data?.data.ids ?? []

	const allowlistForm = useForm({
		defaultValues: {
			idsText: '',
		},
		onSubmit: async ({ value }) => {
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

	const exchangeForm = useForm({
		defaultValues: {
			code: '',
			platform: '',
			quota: 0,
			rewards: [{ id: 0, type: 0, count: 1 }],
		},
		onSubmit: async ({ value }) => {
			await createExchangeMutation.mutateAsync({
				code: value.code,
				platform: value.platform,
				quota: Number(value.quota),
				rewards: value.rewards.map((reward) => ({
					id: Number(reward.id),
					type: Number(reward.type),
					count: Number(reward.count),
				})),
			})
		},
	})

	useEffect(() => {
		allowlistForm.reset({ idsText: allowlistIds.join(', ') })
	}, [allowlistIds, allowlistForm])

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

	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-bold tracking-tight">System Management</h1>

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
								<Button type="submit" className="w-full" variant="secondary">
									Update Allowlist
								</Button>
							</form>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<RefreshCw className="h-5 w-5" />
								Exchange Codes
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<Button className="w-full" variant="secondary" onClick={() => setExchangeModalOpen(true)}>
								Generate New Code
							</Button>
						</CardContent>
					</Card>
				</div>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle className="flex items-center gap-2">
							<Megaphone className="h-5 w-5" />
							Game Notices
						</CardTitle>
						<Button size="sm" variant="outline" onClick={() => setNoticeModalOpen(true)}>
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
											<button type="button" className="hover:text-primary" onClick={() => setEditingNotice(notice)}>
												Edit
											</button>
											<button
												type="button"
												className="hover:text-destructive"
												onClick={() => deleteNoticeMutation.mutate(notice.id)}
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

			<Modal isOpen={exchangeModalOpen} onClose={() => setExchangeModalOpen(false)} title="Create Exchange Code">
				<form
					onSubmit={(event) => {
						event.preventDefault()
						exchangeForm.handleSubmit()
					}}
					className="space-y-4"
				>
					<div className="grid gap-4 md:grid-cols-2">
						<exchangeForm.Field name="code">
							{(field) => (
								<div className="space-y-2">
									<label htmlFor="exchange-code" className="text-sm font-medium">
										Code
									</label>
									<Input
										id="exchange-code"
										value={field.state.value}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
								</div>
							)}
						</exchangeForm.Field>
						<exchangeForm.Field name="platform">
							{(field) => (
								<div className="space-y-2">
									<label htmlFor="exchange-platform" className="text-sm font-medium">
										Platform
									</label>
									<Input
										id="exchange-platform"
										value={field.state.value}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
								</div>
							)}
						</exchangeForm.Field>
					</div>
					<exchangeForm.Field name="quota">
						{(field) => (
							<div className="space-y-2">
								<label htmlFor="exchange-quota" className="text-sm font-medium">
									Quota
								</label>
								<Input
									id="exchange-quota"
									type="number"
									value={field.state.value}
									onChange={(event) => field.handleChange(event.target.valueAsNumber)}
								/>
							</div>
						)}
					</exchangeForm.Field>
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Rewards</span>
							<Button
								type="button"
								variant="outline"
								onClick={() =>
									exchangeForm.setFieldValue('rewards', [
										...exchangeForm.state.values.rewards,
										{ id: 0, type: 0, count: 1 },
									])
								}
							>
								Add Reward
							</Button>
						</div>
						{exchangeForm.state.values.rewards.map((reward, idx) => (
							<div key={`reward-${reward.id}-${reward.type}-${reward.count}`} className="grid gap-3 md:grid-cols-3">
								<exchangeForm.Field name={`rewards[${idx}].id`}>
									{(field) => (
										<div className="space-y-1">
											<label htmlFor={`reward-id-${idx}`} className="text-xs text-muted-foreground">
												Item ID
											</label>
											<Input
												id={`reward-id-${idx}`}
												type="number"
												value={field.state.value}
												onChange={(event) => field.handleChange(event.target.valueAsNumber)}
											/>
										</div>
									)}
								</exchangeForm.Field>
								<exchangeForm.Field name={`rewards[${idx}].type`}>
									{(field) => (
										<div className="space-y-1">
											<label htmlFor={`reward-type-${idx}`} className="text-xs text-muted-foreground">
												Type
											</label>
											<Input
												id={`reward-type-${idx}`}
												type="number"
												value={field.state.value}
												onChange={(event) => field.handleChange(event.target.valueAsNumber)}
											/>
										</div>
									)}
								</exchangeForm.Field>
								<exchangeForm.Field name={`rewards[${idx}].count`}>
									{(field) => (
										<div className="space-y-1">
											<label htmlFor={`reward-count-${idx}`} className="text-xs text-muted-foreground">
												Count
											</label>
											<Input
												id={`reward-count-${idx}`}
												type="number"
												value={field.state.value}
												onChange={(event) => field.handleChange(event.target.valueAsNumber)}
											/>
										</div>
									)}
								</exchangeForm.Field>
							</div>
						))}
					</div>
					<div className="flex justify-end gap-2">
						<Button type="button" variant="ghost" onClick={() => setExchangeModalOpen(false)}>
							Cancel
						</Button>
						<Button type="submit">Create Code</Button>
					</div>
				</form>
			</Modal>
		</div>
	)
}
