import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Tag, UserCheck } from 'lucide-react'
import type React from 'react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DropTooltips } from '../components/DropTooltips'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { DROP_TYPES, SearchableSelect } from '../components/ui/SearchableSelect'
import type { DropOption, DropType } from '../components/ui/SearchableSelect'
import { api } from '../services/api'
import type { ExchangeCodeRequest, ItemSummary, ShipSummary, SkinSummary } from '../types'

const PAGE_SIZE = 50

type ExchangeRewardForm = {
	id: string
	dropId: number | null
	dropType: DropType
	count: number
}

type ExchangeFormValues = {
	code: string
	platform: string
	quota: number
	rewards: ExchangeRewardForm[]
}

export const ExchangeCodesPage: React.FC = () => {
	const queryClient = useQueryClient()
	const [exchangeModalOpen, setExchangeModalOpen] = useState(false)
	const [redeemCodeId, setRedeemCodeId] = useState('')
	const [redeemCommanderId, setRedeemCommanderId] = useState('')

	const exchangeCodesQuery = useQuery({
		queryKey: ['exchange-codes', { offset: 0, limit: PAGE_SIZE }],
		queryFn: () => api.getExchangeCodes({ offset: 0, limit: PAGE_SIZE }),
	})
	const shipsCatalogQuery = useQuery({
		queryKey: ['ships', { all: true }],
		queryFn: () => api.getShips({}),
	})
	const itemsCatalogQuery = useQuery({
		queryKey: ['items', { all: true }],
		queryFn: () => api.getItems({}),
	})
	const skinsCatalogQuery = useQuery({
		queryKey: ['skins', { all: true }],
		queryFn: () => api.getSkins({}),
	})

	const shipsCatalog = shipsCatalogQuery.data?.data.ships ?? []
	const itemsCatalog = itemsCatalogQuery.data?.data.items ?? []
	const skinsCatalog = skinsCatalogQuery.data?.data.skins ?? []
	const exchangeCodes = exchangeCodesQuery.data?.data.codes ?? []

	const shipOptions = useMemo<DropOption[]>(
		() =>
			shipsCatalog.map((ship: ShipSummary) => ({
				label: ship.name,
				id: ship.id,
				type: DROP_TYPES.SHIP,
				subLabel: `ID: ${ship.id} • Rarity: ${ship.rarity}`,
			})),
		[shipsCatalog],
	)
	const itemOptions = useMemo<DropOption[]>(
		() =>
			itemsCatalog.map((item: ItemSummary) => ({
				label: item.name,
				id: item.id,
				type: DROP_TYPES.ITEM,
				subLabel: `ID: ${item.id}`,
			})),
		[itemsCatalog],
	)
	const skinOptions = useMemo<DropOption[]>(
		() =>
			skinsCatalog.map((skin: SkinSummary) => ({
				label: skin.name,
				id: skin.id,
				type: DROP_TYPES.SKIN,
				subLabel: `Ship: ${skin.ship_name} • Skin ID: ${skin.id}`,
			})),
		[skinsCatalog],
	)
	const dropOptions = useMemo<DropOption[]>(
		() => [...itemOptions, ...shipOptions, ...skinOptions],
		[itemOptions, shipOptions, skinOptions],
	)
	const dropLabelMap = useMemo(() => {
		const map = new Map<string, DropOption>()
		for (const option of dropOptions) {
			map.set(`${option.type}-${option.id}`, option)
		}
		return map
	}, [dropOptions])

	const exchangeDefaultValues: ExchangeFormValues = {
		code: '',
		platform: '',
		quota: 0,
		rewards: [{ id: crypto.randomUUID(), dropId: null, dropType: DROP_TYPES.ITEM as DropType, count: 1 }],
	}

	const createExchangeMutation = useMutation({
		mutationFn: (payload: ExchangeCodeRequest) => api.createExchangeCode(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['exchange-codes'] })
			toast.success('Exchange code created')
		},
		onError: (error) => {
			toast.error('Exchange code creation failed', { description: error.message })
		},
	})

	const exchangeForm = useForm({
		defaultValues: exchangeDefaultValues,
		onSubmit: async ({ value }) => {
			const rewards = value.rewards
				.filter((reward) => reward.dropId !== null)
				.map((reward) => ({
					id: Number(reward.dropId),
					type: Number(reward.dropType),
					count: Number(reward.count),
				}))
			await createExchangeMutation.mutateAsync({
				code: value.code,
				platform: value.platform,
				quota: Number(value.quota),
				rewards,
			})
			exchangeForm.reset(exchangeDefaultValues)
			setExchangeModalOpen(false)
		},
	})

	const redeemCodeIdNumber = redeemCodeId.trim() ? Number(redeemCodeId) : null
	const redeemCommanderIdNumber = redeemCommanderId.trim() ? Number(redeemCommanderId) : null
	const isRedeemReady =
		redeemCodeIdNumber !== null &&
		Number.isFinite(redeemCodeIdNumber) &&
		redeemCommanderIdNumber !== null &&
		Number.isFinite(redeemCommanderIdNumber)

	const redeemsQuery = useQuery({
		queryKey: ['exchange-codes', redeemCodeIdNumber, 'redeems', { offset: 0, limit: PAGE_SIZE }],
		queryFn: () => api.getExchangeCodeRedeems(redeemCodeIdNumber ?? 0, { offset: 0, limit: PAGE_SIZE }),
		enabled: redeemCodeIdNumber !== null && Number.isFinite(redeemCodeIdNumber),
	})

	const createRedeemMutation = useMutation({
		mutationFn: (payload: { codeId: number; commanderId: number }) =>
			api.createExchangeCodeRedeem(payload.codeId, { commander_id: payload.commanderId }),
		onSuccess: (_, payload) => {
			queryClient.invalidateQueries({ queryKey: ['exchange-codes', payload.codeId, 'redeems'] })
			setRedeemCommanderId('')
			toast.success('Redeem recorded')
		},
		onError: (error) => {
			toast.error('Redeem failed', { description: error.message })
		},
	})

	const redeems = redeemsQuery.data?.data.redeems ?? []

	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-bold tracking-tight">Exchange Codes</h1>

			<div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle className="flex items-center gap-2">
							<Tag className="h-5 w-5" />
							Codes
						</CardTitle>
						<Button size="sm" variant="secondary" onClick={() => setExchangeModalOpen(true)}>
							Generate Code
						</Button>
					</CardHeader>
					<CardContent className="space-y-4">
						{exchangeCodes.length === 0 ? (
							<p className="text-sm text-muted-foreground">No exchange codes yet.</p>
						) : (
							<div className="space-y-3">
								{exchangeCodes.map((code) => {
									const isSelected = redeemCodeId === String(code.id)
									return (
										<div key={code.id} className="rounded-lg border border-border bg-card p-4">
											<div className="flex flex-wrap items-start justify-between gap-3">
												<div>
													<p className="text-sm font-semibold text-foreground">{code.code}</p>
													<p className="text-xs text-muted-foreground">
														ID: <span className="font-mono">{code.id}</span> • Platform: {code.platform}
													</p>
												</div>
												<div className="flex items-center gap-2">
													<DropTooltips
														items={code.rewards.map((reward) => {
															const option = dropLabelMap.get(`${reward.type}-${reward.id}`)
															return {
																label: option?.label ?? `Type ${reward.type} • ID ${reward.id}`,
																subLabel: option?.subLabel,
																count: reward.count,
															}
														})}
														emptyLabel="No rewards"
													>
														<Badge variant="secondary" className="cursor-help">
															{code.rewards.length} rewards
														</Badge>
													</DropTooltips>
													<Badge variant="outline">Quota: {code.quota}</Badge>
													<Button
														size="sm"
														variant={isSelected ? 'secondary' : 'outline'}
														onClick={() => setRedeemCodeId(String(code.id))}
													>
														{isSelected ? 'Selected' : 'Use'}
													</Button>
												</div>
											</div>
										</div>
									)
								})}
							</div>
						)}
					</CardContent>
				</Card>

				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<UserCheck className="h-5 w-5" />
								Redeem Code
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<form
								onSubmit={(event) => {
									event.preventDefault()
									if (!isRedeemReady) return
									createRedeemMutation.mutate({
										codeId: Number(redeemCodeIdNumber),
										commanderId: Number(redeemCommanderIdNumber),
									})
								}}
								className="space-y-3"
							>
								<div className="space-y-2">
									<label htmlFor="redeem-code-id" className="text-sm font-medium">
										Exchange Code ID
									</label>
									<Input
										id="redeem-code-id"
										type="number"
										value={redeemCodeId}
										onChange={(event) => setRedeemCodeId(event.target.value)}
										placeholder="123"
									/>
								</div>
								<div className="space-y-2">
									<label htmlFor="redeem-commander-id" className="text-sm font-medium">
										Commander ID
									</label>
									<Input
										id="redeem-commander-id"
										type="number"
										value={redeemCommanderId}
										onChange={(event) => setRedeemCommanderId(event.target.value)}
										placeholder="9001"
									/>
								</div>
								<Button type="submit" className="w-full" disabled={!isRedeemReady || createRedeemMutation.isPending}>
									Redeem Code
								</Button>
							</form>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle className="flex items-center gap-2">
								<RefreshCw className="h-5 w-5" />
								Redeem History
							</CardTitle>
							{redeemCodeIdNumber !== null && Number.isFinite(redeemCodeIdNumber) ? (
								<Badge variant="secondary">Code ID {redeemCodeIdNumber}</Badge>
							) : null}
						</CardHeader>
						<CardContent className="space-y-3">
							{redeemCodeIdNumber === null || !Number.isFinite(redeemCodeIdNumber) ? (
								<p className="text-sm text-muted-foreground">Select a code to view redeems.</p>
							) : redeems.length === 0 ? (
								<p className="text-sm text-muted-foreground">No redeems recorded yet.</p>
							) : (
								<div className="space-y-2">
									{redeems.map((redeem) => (
										<div
											key={`${redeem.commander_id}-${redeem.redeemed_at}`}
											className="rounded-lg border border-border bg-card p-3"
										>
											<p className="text-sm font-semibold">Commander {redeem.commander_id}</p>
											<p className="text-xs text-muted-foreground">
												Redeemed {new Date(redeem.redeemed_at).toLocaleString()}
											</p>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>

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
						<div className="flex flex-wrap items-center justify-between gap-2">
							<div className="flex items-center gap-2">
								<span className="text-sm font-medium">Rewards</span>
								<exchangeForm.Subscribe selector={(state) => state.values.rewards}>
									{(rewards) => {
										const tooltipItems = rewards
											.filter((reward) => reward.dropId !== null)
											.map((reward) => {
												const option = dropLabelMap.get(`${reward.dropType}-${reward.dropId}`)
												return {
													label: option?.label ?? `Type ${reward.dropType} • ID ${reward.dropId}`,
													subLabel: option?.subLabel,
													count: reward.count,
												}
											})
										return (
											<DropTooltips items={tooltipItems}>
												<Badge variant="outline" className="cursor-help">
													{tooltipItems.length} selected
												</Badge>
											</DropTooltips>
										)
									}}
								</exchangeForm.Subscribe>
							</div>
							<Button
								type="button"
								variant="outline"
								onClick={() =>
									exchangeForm.setFieldValue('rewards', [
										...exchangeForm.state.values.rewards,
										{ id: crypto.randomUUID(), dropId: null, dropType: DROP_TYPES.ITEM as DropType, count: 1 },
									])
								}
							>
								Add Reward
							</Button>
						</div>
						<exchangeForm.Subscribe selector={(state) => state.values.rewards}>
							{(rewards) =>
								rewards.map((reward, idx) => (
									<div key={reward.id} className="grid gap-3 md:grid-cols-4">
										<exchangeForm.Field name={`rewards[${idx}].dropId`}>
											{(field) => (
												<div className="space-y-1 md:col-span-2">
													<span className="text-xs text-muted-foreground">Drop</span>
													<SearchableSelect
														options={dropOptions}
														value={
															reward.dropId !== null ? { id: reward.dropId, type: reward.dropType as DropType } : null
														}
														onChange={(selection) => {
															field.handleChange(selection.id)
															exchangeForm.setFieldValue(`rewards[${idx}].dropType`, selection.type)
														}}
														placeholder="Search drops..."
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
										<div className="flex items-end">
											<Button
												type="button"
												variant="ghost"
												onClick={() =>
													exchangeForm.setFieldValue(
														'rewards',
														rewards.filter((_, index) => index !== idx),
													)
												}
											>
												Remove
											</Button>
										</div>
									</div>
								))
							}
						</exchangeForm.Subscribe>
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
