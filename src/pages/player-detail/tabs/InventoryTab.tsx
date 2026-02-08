import { Package, Plus } from 'lucide-react'
import type React from 'react'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import type { ItemSummary, PlayerItemEntry } from '../../../types'

type SelectedInventoryItem = {
	itemId: number
	name: string
	count: number
}

type InventoryTabProps = {
	items: PlayerItemEntry[]
	itemMap: Map<number, ItemSummary>
	canWrite: boolean
	onAddItem: () => void
	onEditItem: (item: SelectedInventoryItem) => void
}

export const InventoryTab: React.FC<InventoryTabProps> = ({ items, itemMap, canWrite, onAddItem, onEditItem }) => {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>Depot ({items.length})</CardTitle>
				<Button size="sm" onClick={onAddItem} disabled={!canWrite}>
					<Plus className="mr-2 h-4 w-4" />
					Add Item
				</Button>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
					{items.map((item) => {
						const summary = itemMap.get(item.item_id)
						const rarity = summary?.rarity ?? 1
						const rarityClass =
							rarity >= 5
								? 'bg-yellow-500/10 text-yellow-500'
								: rarity === 4
									? 'bg-purple-500/10 text-purple-500'
									: 'bg-blue-500/10 text-blue-500'
						return (
							<button
								type="button"
								key={item.item_id}
								className="relative flex flex-col items-center rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50"
								onClick={() => {
									if (!canWrite) return
									onEditItem({ itemId: item.item_id, name: item.name, count: item.count })
								}}
							>
								<div className={`mb-2 flex h-12 w-12 items-center justify-center rounded-full ${rarityClass}`}>
									<Package className="h-6 w-6" />
								</div>
								<span className="w-full truncate text-center text-sm font-medium">{item.name}</span>
								<span className="text-xs text-muted-foreground">Item</span>
								<div className="absolute right-2 top-2 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-mono">
									x{item.count}
								</div>
							</button>
						)
					})}
				</div>
			</CardContent>
		</Card>
	)
}
