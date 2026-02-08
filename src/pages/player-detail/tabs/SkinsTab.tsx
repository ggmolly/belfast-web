import { Image as ImageIcon } from 'lucide-react'
import type React from 'react'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import type { PlayerSkinEntry } from '../../../types'

type SkinsTabProps = {
	skins: PlayerSkinEntry[]
	canWrite: boolean
	onGiveSkin: () => void
}

export const SkinsTab: React.FC<SkinsTabProps> = ({ skins, canWrite, onGiveSkin }) => {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>Skins ({skins.length})</CardTitle>
				<Button size="sm" onClick={onGiveSkin} disabled={!canWrite}>
					<ImageIcon className="mr-2 h-4 w-4" />
					Give Skin
				</Button>
			</CardHeader>
			<CardContent>
				<table className="w-full text-left text-sm">
					<thead className="bg-muted text-muted-foreground">
						<tr>
							<th className="px-4 py-2">Skin ID</th>
							<th className="px-4 py-2">Name</th>
							<th className="px-4 py-2">Expires At</th>
						</tr>
					</thead>
					<tbody>
						{skins.map((skin) => (
							<tr key={skin.skin_id} className="border-t border-border hover:bg-muted/20">
								<td className="px-4 py-2 font-mono text-muted-foreground">{skin.skin_id}</td>
								<td className="px-4 py-2 font-medium">{skin.name}</td>
								<td className="px-4 py-2">{skin.expires_at ? new Date(skin.expires_at).toLocaleString() : 'Never'}</td>
							</tr>
						))}
						{skins.length === 0 ? (
							<tr>
								<td className="px-4 py-8 text-center text-muted-foreground" colSpan={3}>
									No skins yet.
								</td>
							</tr>
						) : null}
					</tbody>
				</table>
			</CardContent>
		</Card>
	)
}
