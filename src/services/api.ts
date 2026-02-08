import type {
	APIResponse,
	AccountOverridesResponse,
	AccountOverridesUpdateRequest,
	AccountRolesResponse,
	AccountRolesUpdateRequest,
	ActivityAllowlistPayload,
	AdminUserCreateRequest,
	AdminUserListResponse,
	AdminUserPasswordUpdateRequest,
	AdminUserResponse,
	AdminUserUpdateRequest,
	AuthBootstrapRequest,
	AuthBootstrapStatusResponse,
	AuthLoginRequest,
	AuthLoginResponse,
	AuthPasswordChangeRequest,
	AuthSessionResponse,
	BanPlayerRequest,
	ConnectionSummary,
	ExchangeCodeListResponse,
	ExchangeCodeRedeemListResponse,
	ExchangeCodeRedeemRequest,
	ExchangeCodeRequest,
	GiveItemRequest,
	GiveShipRequest,
	GiveSkinRequest,
	ItemListResponse,
	KickPlayerRequest,
	KickPlayerResponse,
	MeCommanderResponse,
	MePermissionsResponse,
	NoticeListResponse,
	NoticeSummary,
	PasskeyAuthenticateOptionsRequest,
	PasskeyAuthenticateOptionsResponse,
	PasskeyAuthenticateVerifyRequest,
	PasskeyListResponse,
	PasskeyRegisterOptionsRequest,
	PasskeyRegisterOptionsResponse,
	PasskeyRegisterResponse,
	PasskeyRegisterVerifyRequest,
	PermissionListResponse,
	PlayerDetailResponse,
	PlayerItemResponse,
	PlayerListResponse,
	PlayerResourceResponse,
	PlayerShipResponse,
	PlayerShipUpdateRequest,
	PlayerSkinResponse,
	ResourceUpdateRequest,
	RoleListResponse,
	RolePolicyResponse,
	RolePolicyUpdateRequest,
	SendMailRequest,
	ServerMaintenanceResponse,
	ServerMaintenanceUpdate,
	ServerMetricsResponse,
	ServerStatusResponse,
	ServerUptimeResponse,
	ShipListResponse,
	ShipSkinListResponse,
	SkinListResponse,
	UpdatePlayerItemQuantityRequest,
	UserAuthLoginRequest,
	UserAuthLoginResponse,
	UserPermissionPolicyResponse,
	UserPermissionPolicyUpdateRequest,
	UserRegistrationChallengeRequest,
	UserRegistrationChallengeResponse,
	UserRegistrationStatusResponse,
	UserRegistrationVerifyRequest,
} from '../types'

const API_BASE = (() => {
	const raw = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:2289/api/v1'
	return raw.replace(/\/+$/, '')
})()

let csrfToken: string | null = null

export class ApiError extends Error {
	code?: string
	status?: number

	constructor(message: string, code?: string, status?: number) {
		super(message)
		this.name = 'ApiError'
		this.code = code
		this.status = status
	}
}

export const setCsrfToken = (token: string | null) => {
	csrfToken = token
}

const buildHeaders = (options?: RequestInit) => {
	const headers = new Headers(options?.headers)
	headers.set('Content-Type', 'application/json')
	const method = options?.method?.toUpperCase() ?? 'GET'
	if (csrfToken && method !== 'GET' && method !== 'HEAD') {
		headers.set('X-CSRF-Token', csrfToken)
	}
	return headers
}

type ApiErrorBody = { error?: { message?: string; code?: string } }

const readError = async (res: Response): Promise<{ message: string; code?: string }> => {
	try {
		const data = (await res.clone().json()) as ApiErrorBody
		const message = data?.error?.message?.trim()
		if (message) {
			return { message, code: data?.error?.code }
		}
	} catch {
		// Ignore non-JSON bodies.
	}

	try {
		const text = (await res.text()).trim()
		if (text) {
			return { message: text }
		}
	} catch {
		// Ignore body read failures.
	}

	return { message: 'Request failed' }
}

const readApiResponse = async <T>(res: Response): Promise<APIResponse<T>> => {
	if (res.status === 204) {
		return { ok: true, data: undefined as T }
	}

	try {
		const data = (await res.json()) as APIResponse<T> & ApiErrorBody
		return data
	} catch {
		const text = (await res.text()).trim()
		if (!text) {
			return { ok: true, data: undefined as T }
		}
		throw new ApiError('Unexpected response body', undefined, res.status)
	}
}

const request = async <T>(path: string, options?: RequestInit) => {
	const res = await fetch(`${API_BASE}${path}`, {
		credentials: 'include',
		headers: buildHeaders(options),
		...options,
	})
	if (!res.ok) {
		const err = await readError(res)
		throw new ApiError(err.message, err.code, res.status)
	}

	return readApiResponse<T>(res)
}

const requestVoid = async (path: string, options?: RequestInit) => {
	const res = await fetch(`${API_BASE}${path}`, {
		credentials: 'include',
		headers: buildHeaders(options),
		...options,
	})
	if (!res.ok) {
		const err = await readError(res)
		throw new ApiError(err.message, err.code, res.status)
	}
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
	authBootstrap: (payload: AuthBootstrapRequest) =>
		request<AuthLoginResponse>('/auth/bootstrap', { method: 'POST', body: JSON.stringify(payload) }),
	authBootstrapStatus: () => request<AuthBootstrapStatusResponse>('/auth/bootstrap/status'),
	authLogin: (payload: AuthLoginRequest) =>
		request<AuthLoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
	authLogout: () => requestVoid('/auth/logout', { method: 'POST' }),
	authSession: () => request<AuthSessionResponse>('/auth/session'),
	authChangePassword: (payload: AuthPasswordChangeRequest) =>
		requestVoid('/auth/password/change', { method: 'POST', body: JSON.stringify(payload) }),
	getPasskeys: () => request<PasskeyListResponse>('/auth/passkeys'),
	deletePasskey: (credentialId: string) => requestVoid(`/auth/passkeys/${credentialId}`, { method: 'DELETE' }),
	passkeyRegisterOptions: (payload: PasskeyRegisterOptionsRequest) =>
		request<PasskeyRegisterOptionsResponse>('/auth/passkeys/register/options', {
			method: 'POST',
			body: JSON.stringify(payload),
		}),
	passkeyRegisterVerify: (payload: PasskeyRegisterVerifyRequest) =>
		request<PasskeyRegisterResponse>('/auth/passkeys/register/verify', {
			method: 'POST',
			body: JSON.stringify(payload),
		}),
	passkeyAuthenticateOptions: (payload: PasskeyAuthenticateOptionsRequest) =>
		request<PasskeyAuthenticateOptionsResponse>('/auth/passkeys/authenticate/options', {
			method: 'POST',
			body: JSON.stringify(payload),
		}),
	passkeyAuthenticateVerify: (payload: PasskeyAuthenticateVerifyRequest) =>
		request<AuthLoginResponse>('/auth/passkeys/authenticate/verify', {
			method: 'POST',
			body: JSON.stringify(payload),
		}),
	userAuthLogin: (payload: UserAuthLoginRequest) =>
		request<UserAuthLoginResponse>('/user/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
	mePermissions: () => request<MePermissionsResponse>('/me/permissions'),
	meCommander: () => request<MeCommanderResponse>('/me/commander'),
	createRegistrationChallenge: (payload: UserRegistrationChallengeRequest) =>
		request<UserRegistrationChallengeResponse>('/registration/challenges', {
			method: 'POST',
			body: JSON.stringify(payload),
		}),
	getRegistrationChallengeStatus: (challengeId: string) =>
		request<UserRegistrationStatusResponse>(`/registration/challenges/${challengeId}`),
	verifyRegistrationChallenge: (challengeId: string, payload: UserRegistrationVerifyRequest) =>
		request<UserRegistrationStatusResponse>(`/registration/challenges/${challengeId}/verify`, {
			method: 'POST',
			body: JSON.stringify(payload),
		}),

	listAdminUsers: (params: { offset?: number; limit?: number }) =>
		request<AdminUserListResponse>(`/admin/users${buildParams(params)}`),
	createAdminUser: (payload: AdminUserCreateRequest) =>
		request<AdminUserResponse>('/admin/users', { method: 'POST', body: JSON.stringify(payload) }),
	updateAdminUser: (id: string, payload: AdminUserUpdateRequest) =>
		request<AdminUserResponse>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
	deleteAdminUser: (id: string) => requestVoid(`/admin/users/${id}`, { method: 'DELETE' }),
	resetAdminPassword: (id: string, payload: AdminUserPasswordUpdateRequest) =>
		requestVoid(`/admin/users/${id}/password`, { method: 'PUT', body: JSON.stringify(payload) }),

	adminAuthzListRoles: () => request<RoleListResponse>('/admin/authz/roles'),
	adminAuthzListPermissions: () => request<PermissionListResponse>('/admin/authz/permissions'),
	adminAuthzGetRolePolicy: (role: string) =>
		request<RolePolicyResponse>(`/admin/authz/roles/${encodeURIComponent(role)}`),
	adminAuthzReplaceRolePolicy: (role: string, payload: RolePolicyUpdateRequest) =>
		request<RolePolicyResponse>(`/admin/authz/roles/${encodeURIComponent(role)}`, {
			method: 'PUT',
			body: JSON.stringify(payload),
		}),
	adminAuthzGetAccountRoles: (accountId: string) =>
		request<AccountRolesResponse>(`/admin/authz/accounts/${encodeURIComponent(accountId)}/roles`),
	adminAuthzReplaceAccountRoles: (accountId: string, payload: AccountRolesUpdateRequest) =>
		request<AccountRolesResponse>(`/admin/authz/accounts/${encodeURIComponent(accountId)}/roles`, {
			method: 'PUT',
			body: JSON.stringify(payload),
		}),
	adminAuthzGetAccountOverrides: (accountId: string) =>
		request<AccountOverridesResponse>(`/admin/authz/accounts/${encodeURIComponent(accountId)}/overrides`),
	adminAuthzReplaceAccountOverrides: (accountId: string, payload: AccountOverridesUpdateRequest) =>
		request<AccountOverridesResponse>(`/admin/authz/accounts/${encodeURIComponent(accountId)}/overrides`, {
			method: 'PUT',
			body: JSON.stringify(payload),
		}),

	getPlayerPermissionPolicy: () => request<UserPermissionPolicyResponse>('/admin/permission-policy'),
	updatePlayerPermissionPolicy: (payload: UserPermissionPolicyUpdateRequest) =>
		request<UserPermissionPolicyResponse>('/admin/permission-policy', {
			method: 'PATCH',
			body: JSON.stringify(payload),
		}),
	getServerStatus: () => request<ServerStatusResponse>('/server/status'),
	getServerMetrics: () => request<ServerMetricsResponse>('/server/metrics'),
	getServerUptime: () => request<ServerUptimeResponse>('/server/uptime'),
	getConnections: () => request<ConnectionSummary[]>('/server/connections'),
	getMaintenanceStatus: () => request<ServerMaintenanceResponse>('/server/maintenance'),
	toggleMaintenance: (payload: ServerMaintenanceUpdate) =>
		request<ServerMaintenanceResponse>('/server/maintenance', {
			method: 'POST',
			body: JSON.stringify(payload),
		}),
	startServer: () => requestVoid('/server/start', { method: 'POST' }),
	stopServer: () => requestVoid('/server/stop', { method: 'POST' }),
	restartServer: () => requestVoid('/server/restart', { method: 'POST' }),

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
	updatePlayerShip: (id: number, ownedId: number, payload: PlayerShipUpdateRequest) =>
		request<void>(`/players/${id}/ships/${ownedId}`, {
			method: 'PATCH',
			body: JSON.stringify(payload),
		}),
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
	giveSkin: (id: number, payload: GiveSkinRequest) =>
		requestVoid(`/players/${id}/give-skin`, {
			method: 'POST',
			body: JSON.stringify(payload),
		}),
	getPlayerSkins: (id: number) => request<PlayerSkinResponse>(`/players/${id}/skins`),
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
	getShipSkins: (shipId: number) => request<ShipSkinListResponse>(`/ships/${shipId}/skins`),
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
	getExchangeCodes: (params: { offset?: number; limit?: number }) =>
		request<ExchangeCodeListResponse>(`/exchange-codes${buildParams(params)}`),
	getExchangeCodeRedeems: (id: number, params: { offset?: number; limit?: number }) =>
		request<ExchangeCodeRedeemListResponse>(`/exchange-codes/${id}/redeems${buildParams(params)}`),
	createExchangeCodeRedeem: (id: number, payload: ExchangeCodeRedeemRequest) =>
		requestVoid(`/exchange-codes/${id}/redeems`, { method: 'POST', body: JSON.stringify(payload) }),
}
