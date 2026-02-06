import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import {
	Anchor,
	ArrowLeft,
	Coins,
	Droplets,
	Edit2,
	Gem,
	Image as ImageIcon,
	Mail,
	Package,
	Plus,
	PowerOff,
	ShieldAlert,
	UserX,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { usePermissions } from '../components/PermissionsContext'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { DROP_TYPES, type DropOption, type DropType, SearchableSelect } from '../components/ui/SearchableSelect'
import { api } from '../services/api'
import type { ItemSummary, ShipSummary, SkinSummary } from '../types'

type TabKey = 'overview' | 'ships' | 'inventory' | 'skins' | 'actions'

export const PlayerDetailPage: React.FC = () => {
	const { playerId } = useParams({ from: '/players/$playerId' })
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const perms = usePermissions()
	const canRead = perms.can('players', 'read_any')
	const canWrite = perms.can('players', 'write_any')

	const [activeTab, setActiveTab] = useState<TabKey>('overview')
	const [editProfileOpen, setEditProfileOpen] = useState(false)
	const [banModalOpen, setBanModalOpen] = useState(false)
	const [addItemOpen, setAddItemOpen] = useState(false)
	const [addShipOpen, setAddShipOpen] = useState(false)
	const [addSkinOpen, setAddSkinOpen] = useState(false)
	const [shipTypeFilter, setShipTypeFilter] = useState<number | null>(null)
	const [skinShipFilter, setSkinShipFilter] = useState<number | null>(null)
	const [inventoryEditOpen, setInventoryEditOpen] = useState(false)
	const [resourceEditOpen, setResourceEditOpen] = useState(false)
	const [kickModalOpen, setKickModalOpen] = useState(false)
	const [selectedInventoryItem, setSelectedInventoryItem] = useState<{
		itemId: number
		name: string
		count: number
	} | null>(null)
	const [selectedResource, setSelectedResource] = useState<{
		resourceId: number
		name: string
		amount: number
	} | null>(null)

	useEffect(() => {
		if (!canWrite && activeTab === 'actions') {
			setActiveTab('overview')
		}
	}, [activeTab, canWrite])

	const playerNumericId = Number(playerId)

	if (!canRead) {
		return (
			<div className="space-y-6">
				<h1 className="text-3xl font-bold tracking-tight">Player</h1>
				<p className="text-sm text-muted-foreground">You do not have permission to view players.</p>
			</div>
		)
	}

	const playerQuery = useQuery({
		queryKey: ['player', playerNumericId],
		queryFn: () => api.getPlayer(playerNumericId),
		enabled: Number.isFinite(playerNumericId),
	})
	const resourcesQuery = useQuery({
		queryKey: ['player', playerNumericId, 'resources'],
		queryFn: () => api.getPlayerResources(playerNumericId),
		enabled: Number.isFinite(playerNumericId),
	})
	const shipsQuery = useQuery({
		queryKey: ['player', playerNumericId, 'ships'],
		queryFn: () => api.getPlayerShips(playerNumericId),
		enabled: Number.isFinite(playerNumericId),
	})
	const skinsQuery = useQuery({
		queryKey: ['player', playerNumericId, 'skins'],
		queryFn: () => api.getPlayerSkins(playerNumericId),
		enabled: Number.isFinite(playerNumericId),
	})
	const itemsQuery = useQuery({
		queryKey: ['player', playerNumericId, 'items'],
		queryFn: () => api.getPlayerItems(playerNumericId),
		enabled: Number.isFinite(playerNumericId),
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
	const shipSkinsQuery = useQuery({
		queryKey: ['ship', 'skins', skinShipFilter],
		queryFn: () => {
			if (skinShipFilter === null) throw new Error('skinShipFilter is null')
			const shipIdForSkins = Number(skinShipFilter.toString().slice(0, -1))
			return api.getShipSkins(shipIdForSkins)
		},
		enabled: skinShipFilter !== null,
	})

	const updateProfile = useMutation({
		mutationFn: (payload: { name?: string; level?: number }) => api.updatePlayerProfile(playerNumericId, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['player', playerNumericId] })
			setEditProfileOpen(false)
		},
	})

	const updateResourceMutation = useMutation({
		mutationFn: (payload: { resourceId: number; amount: number }) =>
			api.updatePlayerResources(playerNumericId, {
				resources: [{ resource_id: payload.resourceId, amount: payload.amount }],
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['player', playerNumericId, 'resources'] })
			setResourceEditOpen(false)
		},
	})

	const sendMailMutation = useMutation({
		mutationFn: (payload: {
			title: string
			body: string
			custom_sender?: string
			attachments: { item_id: number; type: number; quantity: number }[]
		}) => api.sendMail(playerNumericId, payload),
	})

	const giveItemMutation = useMutation({
		mutationFn: (payload: { itemId: number; amount: number }) =>
			api.giveItem(playerNumericId, { item_id: payload.itemId, amount: payload.amount }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['player', playerNumericId, 'items'] }),
	})

	const updateItemQuantityMutation = useMutation({
		mutationFn: (payload: { itemId: number; quantity: number }) =>
			api.updatePlayerItemQuantity(playerNumericId, payload.itemId, { quantity: payload.quantity }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['player', playerNumericId, 'items'] })
			setInventoryEditOpen(false)
		},
	})

	const giveShipMutation = useMutation({
		mutationFn: (payload: { shipId: number }) => api.giveShip(playerNumericId, { ship_id: payload.shipId }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['player', playerNumericId, 'ships'] }),
	})

	const giveSkinMutation = useMutation({
		mutationFn: (payload: { skinId: number; expiresAt?: string }) =>
			api.giveSkin(playerNumericId, { skin_id: payload.skinId, expires_at: payload.expiresAt }),
		onSuccess: () => {
			setAddSkinOpen(false)
			setSkinShipFilter(null)
			queryClient.invalidateQueries({ queryKey: ['player', playerNumericId] })
			queryClient.invalidateQueries({ queryKey: ['player', playerNumericId, 'skins'] })
			queryClient.refetchQueries({ queryKey: ['player', playerNumericId] })
			queryClient.refetchQueries({ queryKey: ['player', playerNumericId, 'skins'] })
		},
	})

	const banMutation = useMutation({
		mutationFn: (payload: { permanent: boolean; durationHours: number }) =>
			api.banPlayer(playerNumericId, {
				permanent: payload.permanent,
				duration_sec: payload.permanent ? undefined : payload.durationHours * 3600,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['player', playerNumericId] })
			setBanModalOpen(false)
		},
	})

	const unbanMutation = useMutation({
		mutationFn: () => api.unbanPlayer(playerNumericId),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['player', playerNumericId] }),
	})

	const kickMutation = useMutation({
		mutationFn: (payload: { reason: number }) => api.kickPlayer(playerNumericId, { reason: payload.reason }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['player', playerNumericId] }),
	})

	const player = playerQuery.data?.data
	const resources = resourcesQuery.data?.data.resources ?? []
	const ships = shipsQuery.data?.data.ships ?? []
	const playerSkins = skinsQuery.data?.data.skins ?? []
	const items = itemsQuery.data?.data.items ?? []

	const shipsCatalog = shipsCatalogQuery.data?.data.ships ?? []
	const itemsCatalog = itemsCatalogQuery.data?.data.items ?? []
	const skinsCatalog = skinsCatalogQuery.data?.data.skins ?? []
	const shipSkins = shipSkinsQuery.data?.data.skins ?? []

	const itemMap = useMemo(() => {
		return new Map(itemsCatalog.map((item) => [item.id, item]))
	}, [itemsCatalog])

	const resourceOptions = useMemo<DropOption[]>(
		() =>
			resources.map((resource) => ({
				label: resource.name,
				id: resource.resource_id,
				type: DROP_TYPES.RESOURCE,
				subLabel: `ID: ${resource.resource_id}`,
			})),
		[resources],
	)

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

	const shipTypeOptions = useMemo(
		() => [
			{ id: 1, label: 'Destroyer (DD)' },
			{ id: 2, label: 'Light Cruiser (CL)' },
			{ id: 3, label: 'Heavy Cruiser (CA)' },
			{ id: 4, label: 'Battleship (BB)' },
			{ id: 5, label: 'Aircraft Carrier (CV)' },
			{ id: 6, label: 'Submarine (SS)' },
			{ id: 7, label: 'Repair Ship' },
			{ id: 8, label: 'Munitions Ship' },
			{ id: 9, label: 'Submarine Tender' },
			{ id: 10, label: 'Light Carrier (CVL)' },
			{ id: 11, label: 'Aviation Battleship (BBV)' },
			{ id: 12, label: 'Aviation Cruiser (CLV)' },
		],
		[],
	)

	const filteredShipOptions = useMemo<DropOption[]>(
		() =>
			shipOptions.filter((option) =>
				shipTypeFilter === null ? true : shipsCatalog.find((ship) => ship.id === option.id)?.type === shipTypeFilter,
			),
		[shipOptions, shipTypeFilter, shipsCatalog],
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

	const skinShipFilterOptions = useMemo<DropOption[]>(
		() => [
			{ id: 0, label: 'All Ships', type: DROP_TYPES.SHIP },
			...shipsCatalog.map((ship) => ({ id: ship.id, label: ship.name, type: DROP_TYPES.SHIP })),
		],
		[shipsCatalog],
	)

	const filteredSkinOptions = useMemo<DropOption[]>(
		() =>
			skinShipFilter === null
				? skinOptions
				: shipSkins.map((skin) => ({
						label: skin.name,
						id: skin.id,
						type: DROP_TYPES.SKIN,
						subLabel: `Skin ID: ${skin.id}`,
					})),
		[skinOptions, skinShipFilter, shipSkins],
	)

	const dropOptions = useMemo<DropOption[]>(
		() => [...resourceOptions, ...itemOptions, ...shipOptions, ...skinOptions],
		[resourceOptions, itemOptions, shipOptions, skinOptions],
	)

	const profileForm = useForm({
		defaultValues: {
			name: '',
			level: 1,
		},
		onSubmit: async ({ value }) => {
			await updateProfile.mutateAsync({ name: value.name, level: Number(value.level) })
		},
	})

	const banForm = useForm({
		defaultValues: {
			permanent: false,
			durationHours: 24,
		},
		onSubmit: async ({ value }) => {
			await banMutation.mutateAsync({
				permanent: value.permanent,
				durationHours: Number(value.durationHours),
			})
		},
	})

	const mailForm = useForm({
		defaultValues: {
			title: '',
			body: '',
			customSender: '',
			attachments: [] as { id: string; dropId: number | null; dropType: number; quantity: number }[],
		},
		onSubmit: async ({ value }) => {
			const attachments = value.attachments
				.filter((attachment) => attachment.dropId !== null)
				.map((attachment) => ({
					item_id: Number(attachment.dropId),
					type: Number(attachment.dropType),
					quantity: Number(attachment.quantity),
				}))
			await sendMailMutation.mutateAsync({
				title: value.title,
				body: value.body,
				custom_sender: value.customSender || undefined,
				attachments,
			})
			mailForm.reset()
		},
	})

	const quickGiveItemForm = useForm({
		defaultValues: {
			itemId: null as number | null,
			amount: 1,
		},
		onSubmit: async ({ value }) => {
			if (value.itemId === null) return
			await giveItemMutation.mutateAsync({ itemId: value.itemId, amount: Number(value.amount) })
			quickGiveItemForm.reset()
		},
	})

	const addItemForm = useForm({
		defaultValues: {
			itemId: null as number | null,
			amount: 1,
		},
		onSubmit: async ({ value }) => {
			if (value.itemId === null) return
			await giveItemMutation.mutateAsync({ itemId: value.itemId, amount: Number(value.amount) })
			setAddItemOpen(false)
			addItemForm.reset()
		},
	})

	const addShipForm = useForm({
		defaultValues: {
			shipId: null as number | null,
		},
		onSubmit: async ({ value }) => {
			if (value.shipId === null) return
			await giveShipMutation.mutateAsync({ shipId: value.shipId })
			setAddShipOpen(false)
			addShipForm.reset()
		},
	})

	const addSkinForm = useForm({
		defaultValues: {
			skinId: null as number | null,
			expiresAt: '',
		},
		onSubmit: async ({ value }) => {
			if (value.skinId === null) return
			const expiresAt = value.expiresAt ? new Date(value.expiresAt).toISOString() : undefined
			await giveSkinMutation.mutateAsync({ skinId: value.skinId, expiresAt })
			addSkinForm.reset()
		},
	})

	const inventoryEditForm = useForm({
		defaultValues: {
			quantity: 0,
		},
		onSubmit: async ({ value }) => {
			if (!selectedInventoryItem) return
			await updateItemQuantityMutation.mutateAsync({
				itemId: selectedInventoryItem.itemId,
				quantity: Number(value.quantity),
			})
		},
	})

	const resourceEditForm = useForm({
		defaultValues: {
			amount: 0,
		},
		onSubmit: async ({ value }) => {
			if (!selectedResource) return
			await updateResourceMutation.mutateAsync({
				resourceId: selectedResource.resourceId,
				amount: Number(value.amount),
			})
		},
	})

	const kickForm = useForm({
		defaultValues: {
			reason: 1,
		},
		onSubmit: async ({ value }) => {
			await kickMutation.mutateAsync({ reason: Number(value.reason) })
			setKickModalOpen(false)
		},
	})

	const kickReasons = useMemo(
		() => [
			{ id: 1, label: 'Logged in on another device' },
			{ id: 2, label: 'Server maintenance' },
			{ id: 3, label: 'Game update' },
			{ id: 4, label: 'Offline too long' },
			{ id: 5, label: 'Connection lost' },
			{ id: 6, label: 'Connection to server lost' },
			{ id: 7, label: 'Data validation failed' },
			{ id: 199, label: 'Login data expired' },
		],
		[],
	)

	useEffect(() => {
		if (player) {
			profileForm.reset({ name: player.name, level: player.level })
		}
	}, [player, profileForm])

	useEffect(() => {
		if (selectedInventoryItem) {
			inventoryEditForm.reset({ quantity: selectedInventoryItem.count })
		}
	}, [inventoryEditForm, selectedInventoryItem])

	useEffect(() => {
		if (selectedResource) {
			resourceEditForm.reset({ amount: selectedResource.amount })
		}
	}, [resourceEditForm, selectedResource])

	const getResourceIcon = (name: string) => {
		if (name.includes('Oil')) return <Droplets className="h-4 w-4 text-sky-500" />
		if (name.includes('Coin')) return <Coins className="h-4 w-4 text-yellow-500" />
		if (name.includes('Gem')) return <Gem className="h-4 w-4 text-rose-500" />
		return <div className="h-4 w-4 rounded-full bg-gray-500" />
	}

	if (!player) return <div className="p-8 text-center animate-pulse">Loading commander info...</div>

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" onClick={() => navigate({ to: '/players' })}>
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<div>
					<div className="flex items-center gap-3">
						<h1 className="text-3xl font-bold tracking-tight">{player.name}</h1>
						<button
							type="button"
							onClick={() => {
								if (!canWrite) return
								setEditProfileOpen(true)
							}}
							className={`text-muted-foreground ${canWrite ? 'hover:text-primary' : 'opacity-50 cursor-not-allowed'}`}
						>
							<Edit2 className="h-4 w-4" />
						</button>
					</div>
					<div className="flex items-center gap-2 text-muted-foreground">
						<span className="font-mono">UID: {player.id}</span>
						<span>•</span>
						<span>Level {player.level}</span>
					</div>
				</div>
				<div className="ml-auto flex items-center gap-2">
					{player.online ? <Badge variant="success">Online</Badge> : null}
					{player.banned ? <Badge variant="destructive">Banned</Badge> : <Badge variant="secondary">Active</Badge>}
				</div>
			</div>

			<div className="flex border-b border-border">
				{(['overview', 'ships', 'inventory', 'skins', canWrite ? 'actions' : null].filter(Boolean) as TabKey[]).map(
					(tab) => (
						<button
							type="button"
							key={tab}
							onClick={() => setActiveTab(tab)}
							className={`border-b-2 px-6 py-3 text-sm font-medium transition-colors ${
								activeTab === tab
									? 'border-primary text-primary'
									: 'border-transparent text-muted-foreground hover:text-foreground'
							}`}
						>
							{tab.charAt(0).toUpperCase() + tab.slice(1)}
						</button>
					),
				)}
			</div>

			{activeTab === 'overview' ? (
				<div className="grid gap-6 md:grid-cols-3">
					<Card className="md:col-span-2">
						<CardHeader>
							<CardTitle>Resources</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
								{resources.map((resource) => (
									<button
										type="button"
										key={resource.resource_id}
										className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3 text-left transition-colors hover:bg-muted/40"
										onClick={() => {
											if (!canWrite) return
											setSelectedResource({
												resourceId: resource.resource_id,
												name: resource.name,
												amount: resource.amount,
											})
											setResourceEditOpen(true)
										}}
									>
										{getResourceIcon(resource.name)}
										<div>
											<p className="text-xs text-muted-foreground">{resource.name}</p>
											<p className="font-mono font-bold">{resource.amount.toLocaleString()}</p>
										</div>
									</button>
								))}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Account Info</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<span className="text-xs text-muted-foreground">Account ID</span>
								<p>{player.account_id}</p>
							</div>
							<div>
								<span className="text-xs text-muted-foreground">Experience</span>
								<p>{player.exp.toLocaleString()}</p>
							</div>
							<div>
								<span className="text-xs text-muted-foreground">Last Login</span>
								<p>{new Date(player.last_login).toLocaleString()}</p>
							</div>
							<div className="flex flex-col gap-2 border-t border-border pt-4">
								<Button
									variant="outline"
									className="w-full text-destructive"
									onClick={() => setKickModalOpen(true)}
									disabled={!canWrite || !player.online}
								>
									<PowerOff className="mr-2 h-4 w-4" />
									Kick Player
								</Button>
								{player.banned ? (
									<Button
										variant="outline"
										className="w-full"
										onClick={() => unbanMutation.mutate()}
										disabled={!canWrite}
									>
										<UserX className="mr-2 h-4 w-4" />
										Unban Player
									</Button>
								) : (
									<Button
										variant="destructive"
										className="w-full"
										onClick={() => setBanModalOpen(true)}
										disabled={!canWrite}
									>
										<ShieldAlert className="mr-2 h-4 w-4" />
										Ban Player
									</Button>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			) : null}

			{activeTab === 'ships' ? (
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle>Dock ({ships.length})</CardTitle>
						<Button size="sm" onClick={() => setAddShipOpen(true)} disabled={!canWrite}>
							<Anchor className="mr-2 h-4 w-4" />
							Add Ship
						</Button>
					</CardHeader>
					<CardContent>
						<table className="w-full text-left text-sm">
							<thead className="bg-muted text-muted-foreground">
								<tr>
									<th className="px-4 py-2">ID</th>
									<th className="px-4 py-2">Name</th>
									<th className="px-4 py-2">Level</th>
									<th className="px-4 py-2">Rarity</th>
								</tr>
							</thead>
							<tbody>
								{ships.map((ship) => (
									<tr key={ship.owned_id} className="border-t border-border hover:bg-muted/20">
										<td className="px-4 py-2 font-mono text-muted-foreground">{ship.ship_id}</td>
										<td className="px-4 py-2 font-medium">{ship.name}</td>
										<td className="px-4 py-2">Lv.{ship.level}</td>
										<td className="px-4 py-2 text-yellow-500">{'★'.repeat(ship.rarity)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</CardContent>
				</Card>
			) : null}

			{activeTab === 'inventory' ? (
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle>Depot ({items.length})</CardTitle>
						<Button size="sm" onClick={() => setAddItemOpen(true)} disabled={!canWrite}>
							<Plus className="mr-2 h-4 w-4" />
							Add Item
						</Button>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
							{items.map((item) => {
								const summary = itemMap.get(item.item_id)
								const rarity = summary?.rarity ?? 1
								const rarityClass =
									rarity >= 5
										? 'bg-yellow-500/10 text-yellow-500'
										: rarity === 4
											? 'bg-purple-500/10 text-purple-500'
											: 'bg-blue-500/10 text-blue-500'
								return (
									<button
										type="button"
										key={item.item_id}
										className="relative flex flex-col items-center rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50"
										onClick={() => {
											if (!canWrite) return
											setSelectedInventoryItem({
												itemId: item.item_id,
												name: item.name,
												count: item.count,
											})
											setInventoryEditOpen(true)
										}}
									>
										<div className={`mb-2 flex h-12 w-12 items-center justify-center rounded-full ${rarityClass}`}>
											<Package className="h-6 w-6" />
										</div>
										<span className="w-full truncate text-center text-sm font-medium">{item.name}</span>
										<span className="text-xs text-muted-foreground">Item</span>
										<div className="absolute right-2 top-2 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-mono">
											x{item.count}
										</div>
									</button>
								)
							})}
						</div>
					</CardContent>
				</Card>
			) : null}

			{activeTab === 'skins' ? (
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle>Skins ({playerSkins.length})</CardTitle>
						<Button size="sm" onClick={() => setAddSkinOpen(true)} disabled={!canWrite}>
							<ImageIcon className="mr-2 h-4 w-4" />
							Give Skin
						</Button>
					</CardHeader>
					<CardContent>
						<table className="w-full text-left text-sm">
							<thead className="bg-muted text-muted-foreground">
								<tr>
									<th className="px-4 py-2">Skin ID</th>
									<th className="px-4 py-2">Name</th>
									<th className="px-4 py-2">Expires At</th>
								</tr>
							</thead>
							<tbody>
								{playerSkins.map((skin) => (
									<tr key={skin.skin_id} className="border-t border-border hover:bg-muted/20">
										<td className="px-4 py-2 font-mono text-muted-foreground">{skin.skin_id}</td>
										<td className="px-4 py-2 font-medium">{skin.name}</td>
										<td className="px-4 py-2">
											{skin.expires_at ? new Date(skin.expires_at).toLocaleString() : 'Never'}
										</td>
									</tr>
								))}
								{playerSkins.length === 0 ? (
									<tr>
										<td className="px-4 py-8 text-center text-muted-foreground" colSpan={3}>
											No skins yet.
										</td>
									</tr>
								) : null}
							</tbody>
						</table>
					</CardContent>
				</Card>
			) : null}

			{activeTab === 'actions' ? (
				<div className="grid gap-6 md:grid-cols-1">
					<Card>
						<CardHeader className="flex flex-row items-center gap-2">
							<Mail className="h-5 w-5 text-primary" />
							<CardTitle>Send System Mail</CardTitle>
						</CardHeader>
						<CardContent>
							<form
								onSubmit={(event) => {
									event.preventDefault()
									mailForm.handleSubmit()
								}}
								className="space-y-4"
							>
								<mailForm.Field name="title">
									{(field) => {
										const fieldId = 'mail-title'
										return (
											<div className="space-y-2">
												<label htmlFor={fieldId} className="text-sm font-medium">
													Subject
												</label>
												<Input
													id={fieldId}
													value={field.state.value}
													onChange={(event) => field.handleChange(event.target.value)}
													placeholder="Compensation"
													required
												/>
											</div>
										)
									}}
								</mailForm.Field>
								<mailForm.Field name="customSender">
									{(field) => {
										const fieldId = 'mail-sender'
										return (
											<div className="space-y-2">
												<label htmlFor={fieldId} className="text-sm font-medium">
													Sender (optional)
												</label>
												<Input
													id={fieldId}
													value={field.state.value}
													onChange={(event) => field.handleChange(event.target.value)}
													placeholder="Headquarters"
												/>
											</div>
										)
									}}
								</mailForm.Field>
								<mailForm.Field name="body">
									{(field) => {
										const fieldId = 'mail-body'
										return (
											<div className="space-y-2">
												<label htmlFor={fieldId} className="text-sm font-medium">
													Content
												</label>
												<textarea
													id={fieldId}
													className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
													value={field.state.value}
													onChange={(event) => field.handleChange(event.target.value)}
													placeholder="Message details..."
													required
												/>
											</div>
										)
									}}
								</mailForm.Field>
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium">Attachments</span>
										<Button
											type="button"
											variant="outline"
											onClick={() =>
												mailForm.setFieldValue('attachments', [
													...mailForm.state.values.attachments,
													{ id: crypto.randomUUID(), dropId: null, dropType: DROP_TYPES.ITEM, quantity: 1 },
												])
											}
										>
											Add Attachment
										</Button>
									</div>
									<mailForm.Subscribe selector={(state) => state.values.attachments}>
										{(attachments) =>
											attachments.map((attachment, idx) => (
												<div key={attachment.id} className="grid gap-3 md:grid-cols-4">
													<mailForm.Field name={`attachments[${idx}].dropId`}>
														{(field) => (
															<div className="space-y-1 md:col-span-2">
																<span className="text-xs text-muted-foreground">Drop</span>
																<SearchableSelect
																	options={dropOptions}
																	value={
																		attachment.dropId !== null
																			? { id: attachment.dropId, type: attachment.dropType as DropType }
																			: null
																	}
																	onChange={(selection) => {
																		field.handleChange(selection.id)
																		mailForm.setFieldValue(`attachments[${idx}].dropType`, selection.type)
																	}}
																	placeholder="Search drops..."
																/>
															</div>
														)}
													</mailForm.Field>
													<mailForm.Field name={`attachments[${idx}].quantity`}>
														{(field) => (
															<div className="space-y-1">
																<label htmlFor={`mail-attach-qty-${idx}`} className="text-xs text-muted-foreground">
																	Quantity
																</label>
																<Input
																	id={`mail-attach-qty-${idx}`}
																	type="number"
																	value={field.state.value}
																	onChange={(event) => field.handleChange(event.target.valueAsNumber)}
																/>
															</div>
														)}
													</mailForm.Field>
													<div className="flex items-end">
														<Button
															type="button"
															variant="ghost"
															onClick={() =>
																mailForm.setFieldValue(
																	'attachments',
																	attachments.filter((_, index) => index !== idx),
																)
															}
														>
															Remove
														</Button>
													</div>
												</div>
											))
										}
									</mailForm.Subscribe>
								</div>
								<Button type="submit" className="w-full">
									Send Mail
								</Button>
							</form>
						</CardContent>
					</Card>
				</div>
			) : null}

			<Modal isOpen={editProfileOpen} onClose={() => setEditProfileOpen(false)} title="Edit Commander Profile">
				<form
					onSubmit={(event) => {
						event.preventDefault()
						profileForm.handleSubmit()
					}}
					className="space-y-4"
				>
					<profileForm.Field name="name">
						{(field) => {
							const fieldId = 'profile-name'
							return (
								<div className="space-y-2">
									<label htmlFor={fieldId} className="text-sm font-medium">
										Commander Name
									</label>
									<Input
										id={fieldId}
										value={field.state.value}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
								</div>
							)
						}}
					</profileForm.Field>
					<profileForm.Field name="level">
						{(field) => {
							const fieldId = 'profile-level'
							return (
								<div className="space-y-2">
									<label htmlFor={fieldId} className="text-sm font-medium">
										Level
									</label>
									<Input
										id={fieldId}
										type="number"
										value={field.state.value}
										onChange={(event) => field.handleChange(event.target.valueAsNumber)}
									/>
								</div>
							)
						}}
					</profileForm.Field>
					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="ghost" onClick={() => setEditProfileOpen(false)}>
							Cancel
						</Button>
						<Button type="submit">Save Changes</Button>
					</div>
				</form>
			</Modal>

			<Modal isOpen={addItemOpen} onClose={() => setAddItemOpen(false)} title="Add Item to Depot">
				<form
					onSubmit={(event) => {
						event.preventDefault()
						addItemForm.handleSubmit()
					}}
					className="space-y-4"
				>
					<addItemForm.Field name="itemId">
						{(field) => (
							<div className="space-y-2">
								<span className="text-sm font-medium">Select Item</span>
								<SearchableSelect
									options={dropOptions}
									whitelist={[DROP_TYPES.ITEM]}
									value={field.state.value !== null ? { id: field.state.value, type: DROP_TYPES.ITEM } : null}
									onChange={(selection) => field.handleChange(selection.id)}
									placeholder="Search by name or ID..."
								/>
							</div>
						)}
					</addItemForm.Field>
					<addItemForm.Field name="amount">
						{(field) => {
							const fieldId = 'add-item-amount'
							return (
								<div className="space-y-2">
									<label htmlFor={fieldId} className="text-sm font-medium">
										Amount
									</label>
									<Input
										id={fieldId}
										type="number"
										value={field.state.value}
										onChange={(event) => field.handleChange(event.target.valueAsNumber)}
										placeholder="1"
									/>
								</div>
							)
						}}
					</addItemForm.Field>
					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="ghost" onClick={() => setAddItemOpen(false)}>
							Cancel
						</Button>
						<Button type="submit">Add Item</Button>
					</div>
				</form>
			</Modal>

			<Modal
				isOpen={addShipOpen}
				onClose={() => {
					setAddShipOpen(false)
					setShipTypeFilter(null)
				}}
				title="Commission Ship"
			>
				<form
					onSubmit={(event) => {
						event.preventDefault()
						addShipForm.handleSubmit()
					}}
					className="space-y-4"
				>
					<div className="space-y-2">
						<span className="text-sm font-medium">Filter by Ship Type</span>
						<select
							className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
							value={shipTypeFilter ?? ''}
							onChange={(event) => setShipTypeFilter(event.target.value ? Number(event.target.value) : null)}
						>
							<option value="">All Types</option>
							{shipTypeOptions.map((type) => (
								<option key={type.id} value={type.id}>
									{type.label}
								</option>
							))}
						</select>
					</div>
					<addShipForm.Field name="shipId">
						{(field) => (
							<div className="space-y-2">
								<span className="text-sm font-medium">Select Ship</span>
								<SearchableSelect
									options={filteredShipOptions}
									whitelist={[DROP_TYPES.SHIP]}
									value={field.state.value !== null ? { id: field.state.value, type: DROP_TYPES.SHIP } : null}
									onChange={(selection) => field.handleChange(selection.id)}
									placeholder="Search by name or ID..."
								/>
							</div>
						)}
					</addShipForm.Field>
					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="ghost"
							onClick={() => {
								setAddShipOpen(false)
								setShipTypeFilter(null)
							}}
						>
							Cancel
						</Button>
						<Button type="submit">Commission</Button>
					</div>
				</form>
			</Modal>

			<Modal
				isOpen={addSkinOpen}
				onClose={() => {
					setAddSkinOpen(false)
					setSkinShipFilter(null)
				}}
				title="Give Skin"
			>
				<form
					onSubmit={(event) => {
						event.preventDefault()
						addSkinForm.handleSubmit()
					}}
					className="space-y-4"
				>
					<div className="space-y-2">
						<span className="text-sm font-medium">Filter by Ship</span>
						<SearchableSelect
							options={skinShipFilterOptions}
							whitelist={[DROP_TYPES.SHIP]}
							value={skinShipFilter !== null ? { id: skinShipFilter, type: DROP_TYPES.SHIP } : null}
							onChange={(selection) => setSkinShipFilter(selection.id === 0 ? null : selection.id)}
							placeholder="Search ships..."
						/>
					</div>
					<addSkinForm.Field name="skinId">
						{(field) => (
							<div className="space-y-2">
								<span className="text-sm font-medium">Select Skin</span>
								<SearchableSelect
									options={filteredSkinOptions}
									whitelist={[DROP_TYPES.SKIN]}
									value={field.state.value !== null ? { id: field.state.value, type: DROP_TYPES.SKIN } : null}
									onChange={(selection) => field.handleChange(selection.id)}
									placeholder="Search by name or ID..."
								/>
							</div>
						)}
					</addSkinForm.Field>
					<addSkinForm.Field name="expiresAt">
						{(field) => {
							const fieldId = 'skin-expires-at'
							return (
								<div className="space-y-2">
									<label htmlFor={fieldId} className="text-sm font-medium">
										Expires At (optional)
									</label>
									<Input
										id={fieldId}
										type="datetime-local"
										value={field.state.value}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
								</div>
							)
						}}
					</addSkinForm.Field>
					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="ghost"
							onClick={() => {
								setAddSkinOpen(false)
								setSkinShipFilter(null)
							}}
						>
							Cancel
						</Button>
						<Button type="submit">Give Skin</Button>
					</div>
				</form>
			</Modal>

			<Modal isOpen={banModalOpen} onClose={() => setBanModalOpen(false)} title="Ban Player">
				<form
					onSubmit={(event) => {
						event.preventDefault()
						banForm.handleSubmit()
					}}
					className="space-y-4"
				>
					<div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
						Warning: This action will prevent the player from logging in.
					</div>
					<banForm.Field name="permanent">
						{(field) => (
							<label className="flex items-center gap-2 text-sm font-medium">
								<input
									type="checkbox"
									checked={field.state.value}
									onChange={(event) => field.handleChange(event.target.checked)}
								/>
								Permanent Ban
							</label>
						)}
					</banForm.Field>
					<banForm.Field name="durationHours">
						{(field) => {
							const fieldId = 'ban-duration'
							return (
								<div className="space-y-2">
									<label htmlFor={fieldId} className="text-sm font-medium">
										Duration (Hours)
									</label>
									<Input
										id={fieldId}
										type="number"
										value={field.state.value}
										onChange={(event) => field.handleChange(event.target.valueAsNumber)}
										disabled={banForm.state.values.permanent}
									/>
								</div>
							)
						}}
					</banForm.Field>
					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="ghost" onClick={() => setBanModalOpen(false)}>
							Cancel
						</Button>
						<Button type="submit" variant="destructive">
							Confirm Ban
						</Button>
					</div>
				</form>
			</Modal>

			<Modal isOpen={kickModalOpen} onClose={() => setKickModalOpen(false)} title="Kick Player">
				<form
					onSubmit={(event) => {
						event.preventDefault()
						kickForm.handleSubmit()
					}}
					className="space-y-4"
				>
					<div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
						Select a disconnect reason that will be sent to the client.
					</div>
					<kickForm.Field name="reason">
						{(field) => (
							<div className="space-y-2">
								<label htmlFor="kick-reason" className="text-sm font-medium">
									Kick Reason
								</label>
								<select
									id="kick-reason"
									className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
									value={field.state.value}
									onChange={(event) => field.handleChange(Number(event.target.value))}
								>
									{kickReasons.map((reason) => (
										<option key={reason.id} value={reason.id}>
											{reason.id} — {reason.label}
										</option>
									))}
								</select>
							</div>
						)}
					</kickForm.Field>
					<div className="flex justify-end gap-2 pt-2">
						<Button type="button" variant="ghost" onClick={() => setKickModalOpen(false)}>
							Cancel
						</Button>
						<Button type="submit" variant="destructive">
							Confirm Kick
						</Button>
					</div>
				</form>
			</Modal>

			<Modal
				isOpen={resourceEditOpen}
				onClose={() => {
					setResourceEditOpen(false)
					setSelectedResource(null)
				}}
				title="Update Resource"
			>
				<form
					onSubmit={(event) => {
						event.preventDefault()
						resourceEditForm.handleSubmit()
					}}
					className="space-y-4"
				>
					<div className="rounded-md border border-border bg-muted/30 p-3">
						<div className="text-sm font-medium">{selectedResource?.name}</div>
						<div className="text-xs text-muted-foreground">Resource ID: {selectedResource?.resourceId}</div>
					</div>
					<resourceEditForm.Field name="amount">
						{(field) => {
							const fieldId = 'resource-amount'
							return (
								<div className="space-y-2">
									<label htmlFor={fieldId} className="text-sm font-medium">
										New Amount
									</label>
									<Input
										id={fieldId}
										type="number"
										value={field.state.value}
										onChange={(event) => field.handleChange(event.target.valueAsNumber)}
										placeholder="0"
									/>
								</div>
							)
						}}
					</resourceEditForm.Field>
					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="ghost"
							onClick={() => {
								setResourceEditOpen(false)
								setSelectedResource(null)
							}}
						>
							Cancel
						</Button>
						<Button type="submit">Update Resource</Button>
					</div>
				</form>
			</Modal>

			<Modal
				isOpen={inventoryEditOpen}
				onClose={() => {
					setInventoryEditOpen(false)
					setSelectedInventoryItem(null)
				}}
				title="Update Item Quantity"
			>
				<form
					onSubmit={(event) => {
						event.preventDefault()
						inventoryEditForm.handleSubmit()
					}}
					className="space-y-4"
				>
					<div className="rounded-md border border-border bg-muted/30 p-3">
						<div className="text-sm font-medium">{selectedInventoryItem?.name}</div>
						<div className="text-xs text-muted-foreground">Item ID: {selectedInventoryItem?.itemId}</div>
					</div>
					<inventoryEditForm.Field name="quantity">
						{(field) => {
							const fieldId = 'inventory-quantity'
							return (
								<div className="space-y-2">
									<label htmlFor={fieldId} className="text-sm font-medium">
										New Quantity
									</label>
									<Input
										id={fieldId}
										type="number"
										value={field.state.value}
										onChange={(event) => field.handleChange(event.target.valueAsNumber)}
										placeholder="0"
									/>
								</div>
							)
						}}
					</inventoryEditForm.Field>
					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="ghost"
							onClick={() => {
								setInventoryEditOpen(false)
								setSelectedInventoryItem(null)
							}}
						>
							Cancel
						</Button>
						<Button type="submit">Update Quantity</Button>
					</div>
				</form>
			</Modal>
		</div>
	)
}
