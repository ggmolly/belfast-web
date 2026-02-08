import { Check, ChevronDown, Search } from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
	DROP_TYPES,
	DROP_TYPE_BADGE_CLASSES,
	DROP_TYPE_LABELS,
	type DropOption,
	type DropSelection,
	type DropType,
} from '../../lib/drops'

export { DROP_TYPES }
export type { DropOption, DropSelection, DropType }

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

	const filteredOptions = useMemo(() => {
		const term = searchTerm.trim().toLowerCase()
		return options.filter((option) => {
			if (whitelist?.includes(option.type) === false) return false
			if (blacklist?.includes(option.type)) return false
			if (!term) return true
			const typeLabel = DROP_TYPE_LABELS[option.type].toLowerCase()
			return (
				option.label.toLowerCase().includes(term) ||
				(option.subLabel?.toLowerCase().includes(term) ?? false) ||
				option.id.toString().includes(term) ||
				typeLabel.includes(term)
			)
		})
	}, [options, searchTerm, whitelist, blacklist])

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
												className={`rounded px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${DROP_TYPE_BADGE_CLASSES[option.type]}`}
											>
												{DROP_TYPE_LABELS[option.type]}
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
