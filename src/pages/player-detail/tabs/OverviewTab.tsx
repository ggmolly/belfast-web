import { PowerOff, ShieldAlert, UserX } from 'lucide-react'
import type React from 'react'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import type { PlayerDetailResponse, PlayerResourceEntry } from '../../../types'

type SelectedResource = {
	resourceId: number
	name: string
	amount: number
}

type OverviewTabProps = {
	player: PlayerDetailResponse
	resources: PlayerResourceEntry[]
	canWrite: boolean
	getResourceIcon: (name: string) => React.ReactNode
	onEditResource: (resource: SelectedResource) => void
	onKick: () => void
	onBan: () => void
	onUnban: () => void
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
	player,
	resources,
	canWrite,
	getResourceIcon,
	onEditResource,
	onKick,
	onBan,
	onUnban,
}) => {
	return (
		<div className="grid gap-6 md:grid-cols-3">
			<Card className="md:col-span-2">
				<CardHeader>
					<CardTitle>Resources</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
						{resources.map((resource) => (
							<button
								type="button"
								key={resource.resource_id}
								className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3 text-left transition-colors hover:bg-muted/40"
								onClick={() => {
									if (!canWrite) return
									onEditResource({
										resourceId: resource.resource_id,
										name: resource.name,
										amount: resource.amount,
									})
								}}
							>
								{getResourceIcon(resource.name)}
								<div>
									<p className="text-xs text-muted-foreground">{resource.name}</p>
									<p className="font-mono font-bold">{resource.amount.toLocaleString()}</p>
								</div>
							</button>
						))}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Account Info</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<span className="text-xs text-muted-foreground">Account ID</span>
						<p>{player.account_id}</p>
					</div>
					<div>
						<span className="text-xs text-muted-foreground">Experience</span>
						<p>{player.exp.toLocaleString()}</p>
					</div>
					<div>
						<span className="text-xs text-muted-foreground">Last Login</span>
						<p>{new Date(player.last_login).toLocaleString()}</p>
					</div>
					<div className="flex flex-col gap-2 border-t border-border pt-4">
						<Button
							variant="outline"
							className="w-full text-destructive"
							onClick={onKick}
							disabled={!canWrite || !player.online}
						>
							<PowerOff className="mr-2 h-4 w-4" />
							Kick Player
						</Button>
						{player.banned ? (
							<Button variant="outline" className="w-full" onClick={onUnban} disabled={!canWrite}>
								<UserX className="mr-2 h-4 w-4" />
								Unban Player
							</Button>
						) : (
							<Button variant="destructive" className="w-full" onClick={onBan} disabled={!canWrite}>
								<ShieldAlert className="mr-2 h-4 w-4" />
								Ban Player
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
