import type React from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

type DropTooltipItem = {
	label: string
	subLabel?: string
	count?: number
}

type DropTooltipsProps = {
	items: DropTooltipItem[]
	children: React.ReactNode
	emptyLabel?: string
}

export const DropTooltips: React.FC<DropTooltipsProps> = ({ items, children, emptyLabel = 'No drops selected' }) => {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className="inline-flex">{children}</span>
			</TooltipTrigger>
			<TooltipContent side="top" sideOffset={6} className="max-w-xs">
				<div className="space-y-1">
					{items.length === 0 ? (
						<span className="text-[11px] opacity-70">{emptyLabel}</span>
					) : (
						items.map((item, index) => (
							<div key={`${item.label}-${index}`} className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<p className="truncate font-medium">{item.label}</p>
									{item.subLabel ? <p className="text-[11px] opacity-70">{item.subLabel}</p> : null}
								</div>
								{typeof item.count === 'number' ? <span className="text-[11px] opacity-80">x{item.count}</span> : null}
							</div>
						))
					)}
				</div>
			</TooltipContent>
		</Tooltip>
	)
}
