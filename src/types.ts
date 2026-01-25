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

export interface ServerUptimeResponse {
	uptime_human: string
	uptime_sec: number
}
