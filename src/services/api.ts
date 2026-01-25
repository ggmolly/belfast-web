import type {
	APIResponse,
	ActivityAllowlistPayload,
	BanPlayerRequest,
	ConnectionSummary,
	ExchangeCodeRequest,
	GiveItemRequest,
	GiveShipRequest,
	ItemListResponse,
	KickPlayerRequest,
	KickPlayerResponse,
	NoticeListResponse,
	NoticeSummary,
	PlayerDetailResponse,
	PlayerItemResponse,
	PlayerListResponse,
	PlayerResourceResponse,
	PlayerShipResponse,
	ResourceUpdateRequest,
	SendMailRequest,
	ServerMaintenanceResponse,
	ServerMaintenanceUpdate,
	ServerMetricsResponse,
	ServerStatusResponse,
	ShipListResponse,
	SkinListResponse,
	UpdatePlayerItemQuantityRequest,
} from '../types'

const API_BASE = 'http://localhost:2289/api/v1'

const request = async <T>(path: string, options?: RequestInit) => {
	const res = await fetch(`${API_BASE}${path}`, {
		headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
		...options,
	})
	const data = (await res.json()) as APIResponse<T>
	if (!res.ok) {
		throw new Error('Request failed')
	}
	return data
}

const buildParams = (params: Record<string, string | number | boolean | undefined>) => {
	const search = new URLSearchParams()
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== '') {
			search.set(key, String(value))
		}
	}
	const query = search.toString()
	return query ? `?${query}` : ''
}

export const api = {
	getServerStatus: () => request<ServerStatusResponse>('/server/status'),
	getServerMetrics: () => request<ServerMetricsResponse>('/server/metrics'),
	getConnections: () => request<ConnectionSummary[]>('/server/connections'),
	getMaintenanceStatus: () => request<ServerMaintenanceResponse>('/server/maintenance'),
	toggleMaintenance: (payload: ServerMaintenanceUpdate) =>
		request<ServerMaintenanceResponse>('/server/maintenance', {
			method: 'POST',
			body: JSON.stringify(payload),
		}),

	getPlayers: (params: {
		offset?: number
		limit?: number
		sort?: string
		filter?: string
		min_level?: number
		name?: string
	}) => request<PlayerListResponse>(`/players${buildParams(params)}`),
	getPlayer: (id: number) => request<PlayerDetailResponse>(`/players/${id}`),
	getPlayerResources: (id: number) => request<PlayerResourceResponse>(`/players/${id}/resources`),
	updatePlayerResources: (id: number, payload: ResourceUpdateRequest) =>
		request<void>(`/players/${id}/resources`, {
			method: 'PUT',
			body: JSON.stringify(payload),
		}),
	getPlayerShips: (id: number) => request<PlayerShipResponse>(`/players/${id}/ships`),
	getPlayerItems: (id: number) => request<PlayerItemResponse>(`/players/${id}/items`),
	sendMail: (id: number, payload: SendMailRequest) =>
		request<void>(`/players/${id}/send-mail`, {
			method: 'POST',
			body: JSON.stringify(payload),
		}),
	giveItem: (id: number, payload: GiveItemRequest) =>
		request<void>(`/players/${id}/give-item`, {
			method: 'POST',
			body: JSON.stringify(payload),
		}),
	updatePlayerItemQuantity: (id: number, itemId: number, payload: UpdatePlayerItemQuantityRequest) =>
		// TODO: implement backend endpoint for absolute quantity updates.
		request<void>(`/players/${id}/items/${itemId}`, {
			method: 'PATCH',
			body: JSON.stringify(payload),
		}),
	giveShip: (id: number, payload: GiveShipRequest) =>
		request<void>(`/players/${id}/give-ship`, {
			method: 'POST',
			body: JSON.stringify(payload),
		}),
	banPlayer: (id: number, payload: BanPlayerRequest) =>
		request<void>(`/players/${id}/ban`, {
			method: 'POST',
			body: JSON.stringify(payload),
		}),
	unbanPlayer: (id: number) => request<void>(`/players/${id}/ban`, { method: 'DELETE' }),
	kickPlayer: (id: number, payload?: KickPlayerRequest) =>
		request<KickPlayerResponse>(`/players/${id}/kick`, {
			method: 'POST',
			body: payload ? JSON.stringify(payload) : undefined,
		}),
	updatePlayerProfile: (id: number, payload: { name?: string; level?: number }) =>
		// TODO: replace with the official player update endpoint when available.
		request<void>(`/players/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(payload),
		}),

	getShips: (params: {
		offset?: number
		limit?: number
		rarity?: number
		type?: number
		nationality?: number
		name?: string
	}) => request<ShipListResponse>(`/ships${buildParams(params)}`),
	getSkins: (params: { offset?: number; limit?: number }) => request<SkinListResponse>(`/skins${buildParams(params)}`),
	getItems: (params: { offset?: number; limit?: number }) => request<ItemListResponse>(`/items${buildParams(params)}`),

	getNotices: (params: { offset?: number; limit?: number }) =>
		request<NoticeListResponse>(`/notices${buildParams(params)}`),
	createNotice: (payload: NoticeSummary) =>
		request<void>('/notices', { method: 'POST', body: JSON.stringify(payload) }),
	updateNotice: (id: number, payload: NoticeSummary) =>
		request<void>(`/notices/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
	deleteNotice: (id: number) => request<void>(`/notices/${id}`, { method: 'DELETE' }),

	getActivitiesAllowlist: () => request<ActivityAllowlistPayload>('/activities/allowlist'),
	updateActivitiesAllowlist: (payload: ActivityAllowlistPayload) =>
		request<ActivityAllowlistPayload>('/activities/allowlist', {
			method: 'PUT',
			body: JSON.stringify(payload),
		}),

	createExchangeCode: (payload: ExchangeCodeRequest) =>
		request<void>('/exchange-codes', { method: 'POST', body: JSON.stringify(payload) }),
}
