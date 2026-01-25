import { Check, ChevronDown, Search } from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'

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

const DROP_TYPE_LABELS: Record<number, string> = {
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
}

const DROP_TYPE_BADGE_CLASSES: Record<number, string> = {
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
}

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

interface SearchableSelectProps {
	options: DropOption[]
	value: DropSelection | null
	onChange: (value: DropSelection) => void
	whitelist?: DropType[]
	blacklist?: DropType[]
	placeholder?: string
	className?: string
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
	options,
	value,
	onChange,
	whitelist,
	blacklist,
	placeholder = 'Select...',
	className = '',
}) => {
	const [isOpen, setIsOpen] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const wrapperRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
				setIsOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	const selectedOption = value
		? options.find((option) => option.id === value.id && option.type === value.type)
		: undefined

	useEffect(() => {
		if (!isOpen && selectedOption) {
			setSearchTerm(selectedOption.label)
			return
		}
		if (!isOpen && !selectedOption) {
			setSearchTerm('')
		}
	}, [isOpen, selectedOption])

	const filteredOptions = options.filter((option) => {
		if (whitelist?.includes(option.type) === false) return false
		if (blacklist?.includes(option.type)) return false
		const term = searchTerm.toLowerCase()
		const typeLabel = DROP_TYPE_LABELS[option.type]?.toLowerCase() ?? ''
		return (
			option.label.toLowerCase().includes(term) ||
			(option.subLabel?.toLowerCase().includes(term) ?? false) ||
			option.id.toString().includes(term) ||
			typeLabel.includes(term)
		)
	})

	const handleSelect = (optionValue: DropSelection) => {
		onChange(optionValue)
		setIsOpen(false)
	}

	return (
		<div className={`relative ${className}`} ref={wrapperRef}>
			<div className="relative cursor-text">
				<div
					className={`flex h-10 w-full items-center rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-all ${isOpen ? 'border-primary ring-2 ring-ring ring-offset-2' : 'border-input hover:border-accent-foreground/50'}`}
				>
					<Search className={`mr-2 h-4 w-4 shrink-0 transition-opacity ${isOpen ? 'text-primary' : 'opacity-50'}`} />
					<input
						ref={inputRef}
						className="w-full flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
						placeholder={placeholder}
						value={searchTerm}
						onChange={(event) => {
							setSearchTerm(event.target.value)
							if (!isOpen) setIsOpen(true)
						}}
						onFocus={() => {
							setIsOpen(true)
							if (selectedOption && searchTerm === selectedOption.label) {
								setSearchTerm('')
							}
						}}
					/>
					<ChevronDown
						className={`ml-2 h-4 w-4 shrink-0 transition-transform opacity-50 ${isOpen ? 'rotate-180' : ''}`}
					/>
				</div>
			</div>

			{isOpen ? (
				<div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-lg animate-in fade-in zoom-in-95 duration-100">
					{filteredOptions.length === 0 ? (
						<div className="px-2 py-4 text-center text-sm text-muted-foreground">No results found.</div>
					) : (
						<div className="p-1">
							{filteredOptions.map((option) => (
								<button
									type="button"
									key={`${option.type}-${option.id}`}
									className={`relative flex w-full cursor-pointer select-none items-center justify-between rounded-sm px-2 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground ${value?.id === option.id && value?.type === option.type ? 'bg-accent/50 text-accent-foreground font-medium' : ''}`}
									onClick={() => handleSelect({ id: option.id, type: option.type })}
								>
									<div className="flex flex-col">
										<div className="flex items-center gap-2">
											<span>{option.label}</span>
											<span
												className={`rounded px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
													DROP_TYPE_BADGE_CLASSES[option.type] ?? 'bg-primary/10 text-primary'
												}`}
											>
												{DROP_TYPE_LABELS[option.type] ?? `Type ${option.type}`}
											</span>
										</div>
										{option.subLabel ? <span className="text-xs text-muted-foreground">{option.subLabel}</span> : null}
									</div>
									{value?.id === option.id && value?.type === option.type ? (
										<Check className="h-3 w-3 text-primary" />
									) : null}
								</button>
							))}
						</div>
					)}
				</div>
			) : null}
		</div>
	)
}
