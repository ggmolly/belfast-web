export const queryKeys = {
	auth: {
		session: () => ['auth', 'session'] as const,
		bootstrapStatus: () => ['auth', 'bootstrap-status'] as const,
		passkeys: () => ['auth', 'passkeys'] as const,
	},
	me: {
		permissions: () => ['me', 'permissions'] as const,
		commander: () => ['me', 'commander'] as const,
	},
	players: {
		detail: (playerId: number) => ['player', playerId] as const,
		resources: (playerId: number) => ['player', playerId, 'resources'] as const,
		ships: (playerId: number) => ['player', playerId, 'ships'] as const,
		items: (playerId: number) => ['player', playerId, 'items'] as const,
		skins: (playerId: number) => ['player', playerId, 'skins'] as const,
	},
	catalog: {
		ships: () => ['catalog', 'ships'] as const,
		items: () => ['catalog', 'items'] as const,
		skins: () => ['catalog', 'skins'] as const,
	},
	ships: {
		skins: (shipId: number) => ['ships', shipId, 'skins'] as const,
	},
}
