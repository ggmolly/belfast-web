import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { usePermissions } from '../../components/PermissionsContext'
import { DROP_TYPES, type DropOption } from '../../lib/drops'
import { queryKeys } from '../../lib/queryKeys'
import { ApiError, api } from '../../services/api'
import type { ItemSummary, ShipSummary, SkinSummary } from '../../types'
import { PlayerHeader } from './components/PlayerHeader'
import { PlayerTabs } from './components/PlayerTabs'
import {
	AddItemModal,
	AddShipModal,
	AddSkinModal,
	BanModal,
	EditInventoryModal,
	EditProfileModal,
	EditResourceModal,
	EditShipLevelModal,
	KickModal,
} from './modals'
import { ActionsTab } from './tabs/ActionsTab'
import { InventoryTab } from './tabs/InventoryTab'
import { OverviewTab } from './tabs/OverviewTab'
import { ShipsTab } from './tabs/ShipsTab'
import { SkinsTab } from './tabs/SkinsTab'
import type { PlayerDetailTabKey } from './types'
import { KICK_REASONS, SHIP_TYPE_OPTIONS, getResourceIcon } from './utils'

export const PlayerDetailPage: React.FC = () => {
	const { playerId } = useParams({ from: '/players/$playerId' })
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const perms = usePermissions()
	const canReadAny = perms.can('players', 'read_any')
	const canReadSelf = perms.can('players', 'read_self')
	const canWriteAny = perms.can('players', 'write_any')
	const canWriteSelf = perms.can('players', 'write_self')
	const canGameData = perms.can('game_data', 'read_any')

	const [activeTab, setActiveTab] = useState<PlayerDetailTabKey>('overview')
	const [editProfileOpen, setEditProfileOpen] = useState(false)
	const [banModalOpen, setBanModalOpen] = useState(false)
	const [addItemOpen, setAddItemOpen] = useState(false)
	const [addShipOpen, setAddShipOpen] = useState(false)
	const [addSkinOpen, setAddSkinOpen] = useState(false)
	const [shipTypeFilter, setShipTypeFilter] = useState<number | null>(null)
	const [skinShipFilter, setSkinShipFilter] = useState<number | null>(null)
	const [inventoryEditOpen, setInventoryEditOpen] = useState(false)
	const [resourceEditOpen, setResourceEditOpen] = useState(false)
	const [shipEditOpen, setShipEditOpen] = useState(false)
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
	const [selectedShip, setSelectedShip] = useState<{
		ownedId: number
		shipId: number
		name: string
		level: number
	} | null>(null)

	useEffect(() => {
		if (!canWriteAny && activeTab === 'actions') {
			setActiveTab('overview')
		}
	}, [activeTab, canWriteAny])

	const playerNumericId = Number(playerId)

	const commanderQuery = useQuery({
		queryKey: queryKeys.me.commander(),
		queryFn: api.meCommander,
		enabled: (canReadSelf || canWriteSelf) && !canWriteAny,
		retry: false,
		refetchOnWindowFocus: false,
	})

	const ownCommanderId = commanderQuery.data?.data.commander_id
	const isSelf = Boolean(ownCommanderId) && Number.isFinite(playerNumericId) && ownCommanderId === playerNumericId
	const canRead = canReadAny || ((canReadSelf || canWriteSelf) && isSelf)
	const canWrite = canWriteAny || (canWriteSelf && isSelf)

	const playerQuery = useQuery({
		queryKey: queryKeys.players.detail(playerNumericId),
		queryFn: () => api.getPlayer(playerNumericId),
		enabled: Number.isFinite(playerNumericId) && canRead,
		retry: false,
		refetchOnWindowFocus: false,
	})
	const resourcesQuery = useQuery({
		queryKey: queryKeys.players.resources(playerNumericId),
		queryFn: () => api.getPlayerResources(playerNumericId),
		enabled: Number.isFinite(playerNumericId) && canRead,
		retry: false,
		refetchOnWindowFocus: false,
	})
	const shipsQuery = useQuery({
		queryKey: queryKeys.players.ships(playerNumericId),
		queryFn: () => api.getPlayerShips(playerNumericId),
		enabled: Number.isFinite(playerNumericId) && canRead,
		retry: false,
		refetchOnWindowFocus: false,
	})
	const skinsQuery = useQuery({
		queryKey: queryKeys.players.skins(playerNumericId),
		queryFn: () => api.getPlayerSkins(playerNumericId),
		enabled: Number.isFinite(playerNumericId) && canRead,
		retry: false,
		refetchOnWindowFocus: false,
	})
	const itemsQuery = useQuery({
		queryKey: queryKeys.players.items(playerNumericId),
		queryFn: () => api.getPlayerItems(playerNumericId),
		enabled: Number.isFinite(playerNumericId) && canRead,
		retry: false,
		refetchOnWindowFocus: false,
	})

	const shipsCatalogQuery = useQuery({
		queryKey: queryKeys.catalog.ships(),
		queryFn: () => api.getShips({}),
		enabled: canRead && canGameData,
		retry: false,
		refetchOnWindowFocus: false,
	})
	const itemsCatalogQuery = useQuery({
		queryKey: queryKeys.catalog.items(),
		queryFn: () => api.getItems({}),
		enabled: canRead && canGameData,
		retry: false,
		refetchOnWindowFocus: false,
	})
	const skinsCatalogQuery = useQuery({
		queryKey: queryKeys.catalog.skins(),
		queryFn: () => api.getSkins({}),
		enabled: canRead && canGameData,
		retry: false,
		refetchOnWindowFocus: false,
	})

	const shipIdForSkins = skinShipFilter === null ? null : Number(skinShipFilter.toString().slice(0, -1))
	const shipIdForSkinsResolved = shipIdForSkins ?? 0
	const shipSkinsQuery = useQuery({
		queryKey: shipIdForSkins === null ? (['ships', 'skins', null] as const) : queryKeys.ships.skins(shipIdForSkins),
		queryFn: () => api.getShipSkins(shipIdForSkinsResolved),
		enabled: shipIdForSkins !== null && canRead && canGameData,
		retry: false,
		refetchOnWindowFocus: false,
	})

	const updateProfileMutation = useMutation({
		mutationFn: (payload: { name?: string; level?: number }) => api.updatePlayerProfile(playerNumericId, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.players.detail(playerNumericId) })
		},
	})

	const updateResourceMutation = useMutation({
		mutationFn: (payload: { resourceId: number; amount: number }) =>
			api.updatePlayerResources(playerNumericId, {
				resources: [{ resource_id: payload.resourceId, amount: payload.amount }],
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.players.resources(playerNumericId) })
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
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.players.items(playerNumericId) })
		},
	})

	const updateItemQuantityMutation = useMutation({
		mutationFn: (payload: { itemId: number; quantity: number }) =>
			api.updatePlayerItemQuantity(playerNumericId, payload.itemId, { quantity: payload.quantity }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.players.items(playerNumericId) })
		},
	})

	const updateShipMutation = useMutation({
		mutationFn: (payload: { ownedId: number; level: number }) =>
			api.updatePlayerShip(playerNumericId, payload.ownedId, { level: payload.level }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.players.ships(playerNumericId) })
		},
	})

	const giveShipMutation = useMutation({
		mutationFn: (payload: { shipId: number }) => api.giveShip(playerNumericId, { ship_id: payload.shipId }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.players.ships(playerNumericId) })
		},
	})

	const giveSkinMutation = useMutation({
		mutationFn: (payload: { skinId: number; expiresAt?: string }) =>
			api.giveSkin(playerNumericId, { skin_id: payload.skinId, expires_at: payload.expiresAt }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.players.detail(playerNumericId) })
			queryClient.invalidateQueries({ queryKey: queryKeys.players.skins(playerNumericId) })
		},
	})

	const banMutation = useMutation({
		mutationFn: (payload: { permanent: boolean; durationHours: number }) =>
			api.banPlayer(playerNumericId, {
				permanent: payload.permanent,
				duration_sec: payload.permanent ? undefined : payload.durationHours * 3600,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.players.detail(playerNumericId) })
		},
	})

	const unbanMutation = useMutation({
		mutationFn: () => api.unbanPlayer(playerNumericId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.players.detail(playerNumericId) })
		},
	})

	const kickMutation = useMutation({
		mutationFn: (payload: { reason: number }) => api.kickPlayer(playerNumericId, { reason: payload.reason }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.players.detail(playerNumericId) })
		},
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

	const itemMap = useMemo(() => new Map(itemsCatalog.map((item) => [item.id, item])), [itemsCatalog])
	const shipsById = useMemo(() => new Map(shipsCatalog.map((ship) => [ship.id, ship])), [shipsCatalog])

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

	const filteredShipOptions = useMemo<DropOption[]>(
		() =>
			shipOptions.filter((option) => {
				if (shipTypeFilter === null) return true
				return shipsById.get(option.id)?.type === shipTypeFilter
			}),
		[shipOptions, shipTypeFilter, shipsById],
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

	if (!canRead) {
		if (canReadSelf && !canReadAny && commanderQuery.isLoading) {
			return (
				<div className="p-8">
					<div className="h-3 w-32 animate-pulse rounded bg-muted" />
				</div>
			)
		}
		return (
			<div className="space-y-6">
				<h1 className="text-3xl font-bold tracking-tight">Player</h1>
				<p className="text-sm text-muted-foreground">Permission denied, missing permission: players (read any).</p>
			</div>
		)
	}

	if (playerQuery.isError) {
		const err = playerQuery.error
		const status = err instanceof ApiError ? err.status : undefined
		return (
			<div className="space-y-6">
				<h1 className="text-3xl font-bold tracking-tight">Player</h1>
				<p className="text-sm text-muted-foreground">
					{status === 403
						? 'Permission denied, missing permission: players (read any).'
						: `Failed to load player: ${(err as Error).message}`}
				</p>
			</div>
		)
	}

	if (!player) {
		return (
			<div className="p-8">
				<div className="h-8 w-64 animate-pulse rounded bg-muted" />
				<div className="mt-3 h-4 w-40 animate-pulse rounded bg-muted" />
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<PlayerHeader
				name={player.name}
				id={player.id}
				level={player.level}
				online={player.online}
				banned={player.banned}
				canWrite={canWrite}
				onBack={() => navigate({ to: '/players' })}
				onEditProfile={() => {
					if (!canWrite) return
					setEditProfileOpen(true)
				}}
			/>

			<PlayerTabs activeTab={activeTab} showActions={canWriteAny} onChange={setActiveTab} />

			{activeTab === 'overview' ? (
				<OverviewTab
					player={player}
					resources={resources}
					canWrite={canWrite}
					getResourceIcon={getResourceIcon}
					onEditResource={(resource) => {
						setSelectedResource(resource)
						setResourceEditOpen(true)
					}}
					onKick={() => setKickModalOpen(true)}
					onBan={() => setBanModalOpen(true)}
					onUnban={() => unbanMutation.mutate()}
				/>
			) : null}

			{activeTab === 'ships' ? (
				<ShipsTab
					ships={ships}
					canWrite={canWrite}
					onAddShip={() => setAddShipOpen(true)}
					onEditShip={(ship) => {
						if (!canWrite) return
						setSelectedShip({ ownedId: ship.owned_id, shipId: ship.ship_id, name: ship.name, level: ship.level })
						setShipEditOpen(true)
					}}
				/>
			) : null}

			{activeTab === 'inventory' ? (
				<InventoryTab
					items={items}
					itemMap={itemMap}
					canWrite={canWrite}
					onAddItem={() => setAddItemOpen(true)}
					onEditItem={(item) => {
						setSelectedInventoryItem(item)
						setInventoryEditOpen(true)
					}}
				/>
			) : null}

			{activeTab === 'skins' ? (
				<SkinsTab skins={playerSkins} canWrite={canWrite} onGiveSkin={() => setAddSkinOpen(true)} />
			) : null}

			{activeTab === 'actions' ? (
				<ActionsTab dropOptions={dropOptions} onSendMail={(payload) => sendMailMutation.mutateAsync(payload)} />
			) : null}

			<EditProfileModal
				isOpen={editProfileOpen}
				onClose={() => setEditProfileOpen(false)}
				initialName={player.name}
				initialLevel={player.level}
				onSave={(payload) => updateProfileMutation.mutateAsync(payload)}
			/>

			<AddItemModal
				isOpen={addItemOpen}
				onClose={() => setAddItemOpen(false)}
				dropOptions={dropOptions}
				onGiveItem={(payload) => giveItemMutation.mutateAsync(payload)}
			/>

			<AddShipModal
				isOpen={addShipOpen}
				onClose={() => setAddShipOpen(false)}
				shipTypeOptions={[...SHIP_TYPE_OPTIONS]}
				filteredShipOptions={filteredShipOptions}
				onCommission={(payload) => giveShipMutation.mutateAsync(payload)}
				shipTypeFilter={shipTypeFilter}
				onSetShipTypeFilter={setShipTypeFilter}
			/>

			<AddSkinModal
				isOpen={addSkinOpen}
				onClose={() => setAddSkinOpen(false)}
				skinShipFilterOptions={skinShipFilterOptions}
				filteredSkinOptions={filteredSkinOptions}
				skinShipFilter={skinShipFilter}
				onSetSkinShipFilter={setSkinShipFilter}
				onGiveSkin={(payload) => giveSkinMutation.mutateAsync(payload)}
			/>

			<BanModal
				isOpen={banModalOpen}
				onClose={() => setBanModalOpen(false)}
				onBan={(payload) => banMutation.mutateAsync(payload)}
			/>

			<KickModal
				isOpen={kickModalOpen}
				onClose={() => setKickModalOpen(false)}
				kickReasons={[...KICK_REASONS]}
				onKick={(payload) => kickMutation.mutateAsync(payload)}
			/>

			<EditResourceModal
				isOpen={resourceEditOpen}
				resource={selectedResource}
				onClose={() => {
					setResourceEditOpen(false)
					setSelectedResource(null)
				}}
				onUpdate={(payload) => updateResourceMutation.mutateAsync(payload)}
			/>

			<EditInventoryModal
				isOpen={inventoryEditOpen}
				item={selectedInventoryItem}
				onClose={() => {
					setInventoryEditOpen(false)
					setSelectedInventoryItem(null)
				}}
				onUpdate={(payload) => updateItemQuantityMutation.mutateAsync(payload)}
			/>

			<EditShipLevelModal
				isOpen={shipEditOpen}
				ship={selectedShip}
				onClose={() => {
					setShipEditOpen(false)
					setSelectedShip(null)
				}}
				onUpdate={(payload) => updateShipMutation.mutateAsync(payload)}
			/>
		</div>
	)
}
