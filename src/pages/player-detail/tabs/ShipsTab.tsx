import { Anchor, Pencil } from 'lucide-react'
import type React from 'react'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import type { PlayerShipEntry } from '../../../types'

type ShipsTabProps = {
	ships: PlayerShipEntry[]
	canWrite: boolean
	onAddShip: () => void
	onEditShip: (ship: PlayerShipEntry) => void
}

export const ShipsTab: React.FC<ShipsTabProps> = ({ ships, canWrite, onAddShip, onEditShip }) => {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>Dock ({ships.length})</CardTitle>
				<Button size="sm" onClick={onAddShip} disabled={!canWrite}>
					<Anchor className="mr-2 h-4 w-4" />
					Add Ship
				</Button>
			</CardHeader>
			<CardContent>
				<table className="w-full text-left text-sm">
					<thead className="bg-muted text-muted-foreground">
						<tr>
							<th className="px-4 py-2">ID</th>
							<th className="px-4 py-2">Name</th>
							<th className="px-4 py-2">Level</th>
							<th className="px-4 py-2">Rarity</th>
							{canWrite ? <th className="px-4 py-2 text-right">Actions</th> : null}
						</tr>
					</thead>
					<tbody>
						{ships.map((ship) => (
							<tr key={ship.owned_id} className="border-t border-border hover:bg-muted/20">
								<td className="px-4 py-2 font-mono text-muted-foreground">{ship.ship_id}</td>
								<td className="px-4 py-2 font-medium">{ship.name}</td>
								<td className="px-4 py-2">Lv.{ship.level}</td>
								<td className="px-4 py-2 text-yellow-500">{'★'.repeat(ship.rarity)}</td>
								{canWrite ? (
									<td className="px-4 py-2 text-right">
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() => onEditShip(ship)}
											className="h-8 px-2"
										>
											<Pencil className="mr-2 h-4 w-4" />
											Edit Level
										</Button>
									</td>
								) : null}
							</tr>
						))}
					</tbody>
				</table>
			</CardContent>
		</Card>
	)
}
