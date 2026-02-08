import type React from 'react'
import type { PlayerDetailTabKey } from '../types'

type PlayerTabsProps = {
	activeTab: PlayerDetailTabKey
	showActions: boolean
	onChange: (tab: PlayerDetailTabKey) => void
}

export const PlayerTabs: React.FC<PlayerTabsProps> = ({ activeTab, showActions, onChange }) => {
	return (
		<div className="flex border-b border-border">
			{(
				['overview', 'ships', 'inventory', 'skins', showActions ? 'actions' : null].filter(
					Boolean,
				) as PlayerDetailTabKey[]
			).map((tab) => (
				<button
					type="button"
					key={tab}
					onClick={() => onChange(tab)}
					className={`border-b-2 px-6 py-3 text-sm font-medium transition-colors ${
						activeTab === tab
							? 'border-primary text-primary'
							: 'border-transparent text-muted-foreground hover:text-foreground'
					}`}
				>
					{tab.charAt(0).toUpperCase() + tab.slice(1)}
				</button>
			))}
		</div>
	)
}
