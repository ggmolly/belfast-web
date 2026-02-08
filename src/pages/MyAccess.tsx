import { useQuery } from '@tanstack/react-query'
import type React from 'react'
import { usePermissions } from '../components/PermissionsContext'
import { Badge } from '../components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { queryKeys } from '../lib/queryKeys'
import { api } from '../services/api'

export const MyAccessPage: React.FC = () => {
	const perms = usePermissions()
	const commanderQuery = useQuery({
		queryKey: queryKeys.me.commander(),
		queryFn: api.meCommander,
		enabled: Boolean(perms.data?.roles.includes('player')),
		retry: false,
	})
	const roles = perms.data?.roles ?? []
	const permissions = perms.data?.permissions ?? []

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">My Access</h1>
					<p className="text-sm text-muted-foreground">
						Effective permissions for the current session.
						{commanderQuery.data?.data.name?.trim()
							? ` Signed in as ${commanderQuery.data.data.name}.`
							: commanderQuery.data?.data.commander_id
								? ` Commander ${commanderQuery.data.data.commander_id}.`
								: ''}
					</p>
				</div>
				{perms.isLoading ? (
					<Badge variant="secondary">
						<span aria-hidden className="block h-2 w-8 animate-pulse rounded bg-foreground/10" />
					</Badge>
				) : null}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Roles</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-2">
						{roles.length === 0 ? <span className="text-sm text-muted-foreground">No roles assigned.</span> : null}
						{roles.map((role) => (
							<Badge key={role} variant="secondary">
								{role}
							</Badge>
						))}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Permissions</CardTitle>
				</CardHeader>
				<CardContent>
					{permissions.length === 0 ? (
						<p className="text-sm text-muted-foreground">No permissions available.</p>
					) : (
						<div className="overflow-auto rounded-lg border border-border">
							<table className="w-full table-fixed text-sm">
								<thead className="bg-muted/30 text-xs text-muted-foreground">
									<tr>
										<th className="w-[40%] px-3 py-2 text-left font-medium">Key</th>
										<th className="w-[15%] px-3 py-2 text-center font-medium">Read self</th>
										<th className="w-[15%] px-3 py-2 text-center font-medium">Read any</th>
										<th className="w-[15%] px-3 py-2 text-center font-medium">Write self</th>
										<th className="w-[15%] px-3 py-2 text-center font-medium">Write any</th>
									</tr>
								</thead>
								<tbody>
									{permissions.map((entry) => (
										<tr key={entry.key} className="border-t border-border">
											<td className="px-3 py-2 font-mono text-xs">{entry.key}</td>
											<td className="px-3 py-2 text-center">
												{entry.read_self ? <Badge variant="success">Yes</Badge> : <Badge variant="outline">No</Badge>}
											</td>
											<td className="px-3 py-2 text-center">
												{entry.read_any ? <Badge variant="success">Yes</Badge> : <Badge variant="outline">No</Badge>}
											</td>
											<td className="px-3 py-2 text-center">
												{entry.write_self ? <Badge variant="success">Yes</Badge> : <Badge variant="outline">No</Badge>}
											</td>
											<td className="px-3 py-2 text-center">
												{entry.write_any ? <Badge variant="success">Yes</Badge> : <Badge variant="outline">No</Badge>}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
