export const DROP_TYPES = {
	RESOURCE: 1,
	ITEM: 2,
	EQUIP: 3,
	SHIP: 4,
	FURNITURE: 5,
	STRATEGY: 6,
	SKIN: 7,
	VITEM: 8,
	EQUIPMENT_SKIN: 9,
	NPC_SHIP: 10,
	WORLD_ITEM: 12,
	WORLD_COLLECTION: 13,
	ICON_FRAME: 14,
	CHAT_FRAME: 15,
	EMOJI: 17,
	LOVE_LETTER: 19,
	SPWEAPON: 21,
	META_PT: 22,
	SKIN_TIMELIMIT: 23,
	BUFF: 24,
	COMMANDER_CAT: 25,
	TRANS_ITEM: 100,
	USE_ACTIVITY_DROP: 1000,
	RYZA_DROP: 1001,
	WORKBENCH_DROP: 1002,
	FEAST_DROP: 1003,
} as const

export type DropType = (typeof DROP_TYPES)[keyof typeof DROP_TYPES]

export const DROP_TYPE_LABELS = {
	[DROP_TYPES.RESOURCE]: 'Resource',
	[DROP_TYPES.ITEM]: 'Item',
	[DROP_TYPES.EQUIP]: 'Equipment',
	[DROP_TYPES.SHIP]: 'Ship',
	[DROP_TYPES.FURNITURE]: 'Furniture',
	[DROP_TYPES.STRATEGY]: 'Strategy',
	[DROP_TYPES.SKIN]: 'Skin',
	[DROP_TYPES.VITEM]: 'Virtual Item',
	[DROP_TYPES.EQUIPMENT_SKIN]: 'Equip Skin',
	[DROP_TYPES.NPC_SHIP]: 'NPC Ship',
	[DROP_TYPES.WORLD_ITEM]: 'World Item',
	[DROP_TYPES.WORLD_COLLECTION]: 'World Collection',
	[DROP_TYPES.ICON_FRAME]: 'Icon Frame',
	[DROP_TYPES.CHAT_FRAME]: 'Chat Frame',
	[DROP_TYPES.EMOJI]: 'Emoji',
	[DROP_TYPES.LOVE_LETTER]: 'Love Letter',
	[DROP_TYPES.SPWEAPON]: 'SP Weapon',
	[DROP_TYPES.META_PT]: 'Meta PT',
	[DROP_TYPES.SKIN_TIMELIMIT]: 'Timed Skin',
	[DROP_TYPES.BUFF]: 'Buff',
	[DROP_TYPES.COMMANDER_CAT]: 'Commander Cat',
	[DROP_TYPES.TRANS_ITEM]: 'Trans Item',
	[DROP_TYPES.USE_ACTIVITY_DROP]: 'Activity Drop',
	[DROP_TYPES.RYZA_DROP]: 'Ryza Drop',
	[DROP_TYPES.WORKBENCH_DROP]: 'Workbench Drop',
	[DROP_TYPES.FEAST_DROP]: 'Feast Drop',
} satisfies Record<DropType, string>

export const DROP_TYPE_BADGE_CLASSES = {
	[DROP_TYPES.RESOURCE]: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
	[DROP_TYPES.ITEM]: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
	[DROP_TYPES.EQUIP]: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
	[DROP_TYPES.SHIP]: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
	[DROP_TYPES.FURNITURE]: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
	[DROP_TYPES.STRATEGY]: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
	[DROP_TYPES.SKIN]: 'bg-pink-500/15 text-pink-600 dark:text-pink-400',
	[DROP_TYPES.VITEM]: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
	[DROP_TYPES.EQUIPMENT_SKIN]: 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400',
	[DROP_TYPES.NPC_SHIP]: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
	[DROP_TYPES.WORLD_ITEM]: 'bg-lime-500/15 text-lime-600 dark:text-lime-400',
	[DROP_TYPES.WORLD_COLLECTION]: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
	[DROP_TYPES.ICON_FRAME]: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
	[DROP_TYPES.CHAT_FRAME]: 'bg-stone-500/15 text-stone-600 dark:text-stone-400',
	[DROP_TYPES.EMOJI]: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
	[DROP_TYPES.LOVE_LETTER]: 'bg-red-500/15 text-red-600 dark:text-red-400',
	[DROP_TYPES.SPWEAPON]: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
	[DROP_TYPES.META_PT]: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
	[DROP_TYPES.SKIN_TIMELIMIT]: 'bg-neutral-500/15 text-neutral-600 dark:text-neutral-400',
	[DROP_TYPES.BUFF]: 'bg-green-500/15 text-green-600 dark:text-green-400',
	[DROP_TYPES.COMMANDER_CAT]: 'bg-amber-600/15 text-amber-600 dark:text-amber-400',
	[DROP_TYPES.TRANS_ITEM]: 'bg-gray-500/15 text-gray-600 dark:text-gray-400',
	[DROP_TYPES.USE_ACTIVITY_DROP]: 'bg-emerald-600/15 text-emerald-600 dark:text-emerald-400',
	[DROP_TYPES.RYZA_DROP]: 'bg-indigo-600/15 text-indigo-600 dark:text-indigo-400',
	[DROP_TYPES.WORKBENCH_DROP]: 'bg-cyan-600/15 text-cyan-600 dark:text-cyan-400',
	[DROP_TYPES.FEAST_DROP]: 'bg-rose-600/15 text-rose-600 dark:text-rose-400',
} satisfies Record<DropType, string>

export interface DropOption {
	label: string
	id: number
	type: DropType
	subLabel?: string
}

export interface DropSelection {
	id: number
	type: DropType
}
