import { ArrowLeft, Edit2 } from 'lucide-react'
import type React from 'react'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'

type PlayerHeaderProps = {
	name: string
	id: number
	level: number
	online: boolean
	banned: boolean
	canWrite: boolean
	onBack: () => void
	onEditProfile: () => void
}

export const PlayerHeader: React.FC<PlayerHeaderProps> = ({
	name,
	id,
	level,
	online,
	banned,
	canWrite,
	onBack,
	onEditProfile,
}) => {
	return (
		<div className="flex items-center gap-4">
			<Button variant="ghost" size="icon" onClick={onBack}>
				<ArrowLeft className="h-5 w-5" />
			</Button>
			<div>
				<div className="flex items-center gap-3">
					<h1 className="text-3xl font-bold tracking-tight">{name}</h1>
					<button
						type="button"
						onClick={onEditProfile}
						className={`text-muted-foreground ${canWrite ? 'hover:text-primary' : 'opacity-50 cursor-not-allowed'}`}
					>
						<Edit2 className="h-4 w-4" />
					</button>
				</div>
				<div className="flex items-center gap-2 text-muted-foreground">
					<span className="font-mono">UID: {id}</span>
					<span>•</span>
					<span>Level {level}</span>
				</div>
			</div>
			<div className="ml-auto flex items-center gap-2">
				{online ? <Badge variant="success">Online</Badge> : null}
				{banned ? <Badge variant="destructive">Banned</Badge> : <Badge variant="secondary">Active</Badge>}
			</div>
		</div>
	)
}
