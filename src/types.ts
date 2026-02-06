export interface PaginationMeta {
	limit: number
	offset: number
	total: number
}

export interface APIResponse<T> {
	data: T
	ok: boolean
}

export interface PlayerSummary {
	account_id: number
	banned: boolean
	id: number
	last_login: string
	level: number
	name: string
	online: boolean
}

export interface PlayerDetailResponse extends PlayerSummary {
	exp: number
}

export interface PlayerListResponse {
	players: PlayerSummary[]
	meta: PaginationMeta
}

export interface PlayerResourceEntry {
	amount: number
	name: string
	resource_id: number
}

export interface PlayerResourceResponse {
	resources: PlayerResourceEntry[]
}

export interface PlayerShipEntry {
	level: number
	name: string
	owned_id: number
	rarity: number
	ship_id: number
	skin_id: number
}

export interface PlayerShipResponse {
	ships: PlayerShipEntry[]
}

export interface PlayerItemEntry {
	count: number
	item_id: number
	name: string
}

export interface PlayerItemResponse {
	items: PlayerItemEntry[]
}

export interface PlayerSkinEntry {
	expires_at: string
	name: string
	skin_id: number
}

export interface PlayerSkinResponse {
	skins: PlayerSkinEntry[]
}

export interface ShipSummary {
	build_time: number
	id: number
	name: string
	nationality: number
	pool_id: number
	rarity: number
	star: number
	type: number
}

export interface ShipListResponse {
	ships: ShipSummary[]
	meta: PaginationMeta
}

export interface SkinSummary {
	id: number
	name: string
	ship_id: number
	ship_name: string
	shop_id: number
	painting: string
}

export interface SkinListResponse {
	skins: SkinSummary[]
	meta: PaginationMeta
}

export interface ShipSkinSummary {
	id: number
	name: string
	ship_group: number
}

export interface ShipSkinListResponse {
	skins: ShipSkinSummary[]
	meta: PaginationMeta
}

export interface ItemSummary {
	id: number
	name: string
	rarity: number
	shop_id: number
	type: number
	virtual_type: number
}

export interface ItemListResponse {
	items: ItemSummary[]
	meta: PaginationMeta
}

export interface NoticeSummary {
	btn_title: string
	content: string
	icon: number
	id: number
	tag_type: number
	time_desc: string
	title: string
	title_image: string
	track: string
	version: string
}

export interface NoticeListResponse {
	notices: NoticeSummary[]
	meta: PaginationMeta
}

export interface ActivityAllowlistPayload {
	ids: number[]
}

export interface ServerMaintenanceResponse {
	enabled: boolean
}

export interface ServerMaintenanceUpdate {
	enabled: boolean
}

export interface ServerStatusResponse {
	accepting: boolean
	client_count: number
	running: boolean
	uptime_human: string
	uptime_sec: number
}

export interface ServerMetricsResponse {
	client_count: number
	handler_errors: number
	pps: number
	queue_blocks: number
	queue_max: number
	write_errors: number
}

export interface ConnectionSummary {
	commander_id: number
	connected_at: string
	hash: number
	remote_address: string
}

export interface SendMailAttachmentDTO {
	item_id: number
	quantity: number
	type: number
}

export interface SendMailRequest {
	attachments: SendMailAttachmentDTO[]
	body: string
	custom_sender?: string
	title: string
}

export interface GiveItemRequest {
	item_id: number
	amount: number
}

export interface UpdatePlayerItemQuantityRequest {
	quantity: number
}

export interface GiveShipRequest {
	ship_id: number
}

export interface GiveSkinRequest {
	skin_id: number
	expires_at?: string
}

export interface BanPlayerRequest {
	duration_sec?: number
	lift_timestamp?: string
	permanent?: boolean
}

export interface KickPlayerRequest {
	reason?: number
}

export interface KickPlayerResponse {
	disconnected: boolean
}

export interface ResourceUpdateEntry {
	resource_id: number
	amount: number
}

export interface ResourceUpdateRequest {
	resources: ResourceUpdateEntry[]
}

export interface ExchangeReward {
	id: number
	type: number
	count: number
}

export interface ExchangeCodeRequest {
	code: string
	platform: string
	quota: number
	rewards: ExchangeReward[]
}

export interface ExchangeCodeSummary {
	code: string
	id: number
	platform: string
	quota: number
	rewards: ExchangeReward[]
}

export interface ExchangeCodeListResponse {
	codes: ExchangeCodeSummary[]
	meta: PaginationMeta
}

export interface ExchangeCodeRedeemRequest {
	commander_id: number
}

export interface ExchangeCodeRedeemSummary {
	commander_id: number
	redeemed_at: string
}

export interface ExchangeCodeRedeemListResponse {
	redeems: ExchangeCodeRedeemSummary[]
	meta: PaginationMeta
}

export interface ServerUptimeResponse {
	uptime_human: string
	uptime_sec: number
}

export interface APIError {
	code: string
	message: string
	details?: Record<string, unknown>
}

export type PermissionOp = 'read_self' | 'read_any' | 'write_self' | 'write_any'

export interface PermissionPolicyEntry {
	key: string
	read_self: boolean
	read_any: boolean
	write_self: boolean
	write_any: boolean
}

export interface MePermissionsResponse {
	roles: string[]
	permissions: PermissionPolicyEntry[]
}

export interface MeCommanderResponse {
	commander_id: number
	name: string
	level: number
}

export interface RoleSummary {
	name: string
	description: string
	updated_at: string
	updated_by: string
}

export interface RoleListResponse {
	roles: RoleSummary[]
}

export interface PermissionSummary {
	key: string
	description: string
}

export interface PermissionListResponse {
	permissions: PermissionSummary[]
}

export interface RolePolicyResponse {
	role: string
	permissions: PermissionPolicyEntry[]
	available_keys: string[]
	updated_at: string
	updated_by: string
}

export interface RolePolicyUpdateRequest {
	permissions: PermissionPolicyEntry[]
}

export interface AccountRolesResponse {
	account_id: string
	roles: string[]
}

export interface AccountRolesUpdateRequest {
	roles: string[]
}

export type AccountOverrideMode = 'allow' | 'deny'

export interface AccountOverrideEntry {
	key: string
	mode: AccountOverrideMode
	read_self: boolean
	read_any: boolean
	write_self: boolean
	write_any: boolean
}

export interface AccountOverridesResponse {
	account_id: string
	overrides: AccountOverrideEntry[]
}

export interface AccountOverridesUpdateRequest {
	overrides: AccountOverrideEntry[]
}

export interface UserPermissionPolicyResponse extends RolePolicyResponse {}

export interface UserPermissionPolicyUpdateRequest extends RolePolicyUpdateRequest {}

export interface AdminUser {
	created_at: string
	disabled: boolean
	id: string
	is_admin: boolean
	last_login_at: string
	username: string
}

export interface AdminUserListResponse {
	users: AdminUser[]
	meta: PaginationMeta
}

export interface AdminUserResponse {
	user: AdminUser
}

export interface AdminUserCreateRequest {
	username: string
	password: string
}

export interface AdminUserUpdateRequest {
	username?: string
	disabled?: boolean
}

export interface AdminUserPasswordUpdateRequest {
	password: string
}

export interface AuthBootstrapRequest {
	username: string
	password: string
}

export interface AuthBootstrapStatusResponse {
	admin_count: number
	can_bootstrap: boolean
}

export interface AuthLoginRequest {
	username: string
	password: string
}

export interface AuthSession {
	id: string
	expires_at: string
}

export interface AuthLoginResponse {
	user: AdminUser
	session: AuthSession
}

export interface AuthSessionResponse {
	user: AdminUser
	session: AuthSession
	csrf_token: string
}

export interface AuthPasswordChangeRequest {
	current_password: string
	new_password: string
}

export interface UserAccount {
	commander_id: number
	created_at: string
	disabled: boolean
	id: string
	last_login_at: string
}

export interface UserSession {
	id: string
	expires_at: string
}

export interface UserAuthLoginRequest {
	commander_id: number
	password: string
}

export interface UserAuthLoginResponse {
	user: UserAccount
	session: UserSession
}

export interface UserRegistrationChallengeRequest {
	commander_id: number
	password: string
}

export interface UserRegistrationChallengeResponse {
	challenge_id: string
	expires_at: string
}

export interface UserRegistrationVerifyRequest {
	pin: string
}

export interface UserRegistrationStatusResponse {
	status: 'pending' | 'consumed' | 'expired'
}

export interface PasskeySummary {
	credential_id: string
	label: string
	created_at: string
	last_used_at: string
	aaguid: string
	backup_eligible: boolean
	backup_state: boolean
	transports: string[]
}

export interface PasskeyListResponse {
	passkeys: PasskeySummary[]
}

export interface PasskeyRegisterOptionsRequest {
	label?: string
	resident_key?: string
	user_verification?: string
}

export interface PasskeyRegisterOptionsResponse {
	publicKey: Record<string, unknown>
}

export interface PasskeyRegisterResponse {
	credential_id: string
	label: string
	created_at: string
}

export interface PasskeyAttestationResponse {
	attestationObject: string
	clientDataJSON: string
}

export interface PasskeyRegistrationCredential {
	id: string
	rawId: string
	type: string
	response: PasskeyAttestationResponse
}

export interface PasskeyRegisterVerifyRequest {
	credential: PasskeyRegistrationCredential
	label?: string
}

export interface PasskeyAuthenticateOptionsRequest {
	username?: string
}

export interface PasskeyAuthenticateOptionsResponse {
	publicKey: Record<string, unknown>
}

export interface PasskeyAssertionResponse {
	authenticatorData: string
	clientDataJSON: string
	signature: string
	userHandle?: string
}

export interface PasskeyAuthenticationCredential {
	id: string
	rawId: string
	type: string
	response: PasskeyAssertionResponse
}

export interface PasskeyAuthenticateVerifyRequest {
	credential: PasskeyAuthenticationCredential
	username?: string
}
