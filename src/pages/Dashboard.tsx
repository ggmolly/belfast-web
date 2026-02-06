import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Activity, Play, Power, RotateCcw, Server, Users } from 'lucide-react'
import type React from 'react'
import { useMemo } from 'react'
import { usePermissions } from '../components/PermissionsContext'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { api } from '../services/api'

const formatUptime = (seconds: number): string => {
	const days = Math.floor(seconds / 86_400)
	const hours = Math.floor((seconds % 86_400) / 3600)
	const minutes = Math.floor((seconds % 3600) / 60)
	const secs = Math.floor(seconds % 60)

	const parts: string[] = []
	if (days > 0) parts.push(`${days}d`)
	if (hours > 0) parts.push(`${hours}h`)
	if (minutes > 0) parts.push(`${minutes}m`)
	if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

	return parts.join(' ')
}

export const DashboardPage: React.FC = () => {
	const queryClient = useQueryClient()
	const perms = usePermissions()
	const canServerRead = perms.can('server', 'read_any')
	const canServerWrite = perms.can('server', 'write_any')
	const canPlayersRead = perms.can('players', 'read_any')
	const statusQuery = useQuery({
		queryKey: ['server', 'status'],
		queryFn: api.getServerStatus,
		refetchInterval: 10000,
	})
	const uptimeQuery = useQuery({
		queryKey: ['server', 'uptime'],
		queryFn: api.getServerUptime,
		enabled: canServerRead,
		refetchInterval: 10000,
	})
	const metricsQuery = useQuery({
		queryKey: ['server', 'metrics'],
		queryFn: api.getServerMetrics,
		enabled: canServerRead,
		refetchInterval: 10000,
	})
	const maintenanceQuery = useQuery({
		queryKey: ['server', 'maintenance'],
		queryFn: api.getMaintenanceStatus,
		enabled: canServerRead,
		refetchInterval: 10000,
	})
	const playersQuery = useQuery({
		queryKey: ['players', { offset: 0, limit: 1 }],
		queryFn: () => api.getPlayers({ offset: 0, limit: 1 }),
		enabled: canPlayersRead,
		refetchInterval: 10000,
	})
	const connectionsQuery = useQuery({
		queryKey: ['server', 'connections'],
		queryFn: api.getConnections,
		enabled: canServerRead,
		refetchInterval: 10000,
	})

	const toggleMaintenance = useMutation({
		mutationFn: (enabled: boolean) => api.toggleMaintenance({ enabled }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['server', 'maintenance'] })
		},
	})

	const startServerMutation = useMutation({
		mutationFn: () => api.startServer(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['server'] })
		},
	})

	const stopServerMutation = useMutation({
		mutationFn: () => api.stopServer(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['server'] })
		},
	})

	const restartServerMutation = useMutation({
		mutationFn: () => api.restartServer(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['server'] })
		},
	})

	const totalPlayers = playersQuery.data?.data.meta.total ?? 0
	const maintenanceEnabled = maintenanceQuery.data?.data.enabled ?? false
	const status = statusQuery.data?.data
	const uptime = uptimeQuery.data?.data
	const metrics = metricsQuery.data?.data
	const activeConnections = connectionsQuery.data?.data ?? []

	const formattedUptime = useMemo(() => {
		const secs = uptime?.uptime_sec ?? status?.uptime_sec ?? 0
		return formatUptime(secs)
	}, [uptime, status])

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						onClick={() => {
							queryClient.invalidateQueries({ queryKey: ['server'] })
							queryClient.invalidateQueries({ queryKey: ['players'] })
						}}
					>
						Refresh Data
					</Button>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Commanders</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{canPlayersRead ? totalPlayers : '—'}</div>
						<p className="text-xs text-muted-foreground">All registered accounts</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Server Status</CardTitle>
						<Server className={`h-4 w-4 ${maintenanceEnabled ? 'text-destructive' : 'text-emerald-500'}`} />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{maintenanceEnabled ? 'Maintenance' : status?.running ? 'Online' : 'Offline'}
						</div>
						<p className="text-xs text-muted-foreground">
							{maintenanceEnabled
								? 'Players cannot login'
								: status?.accepting
									? 'Server is accepting connections'
									: 'Server is not accepting connections'}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
						<Activity className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{canServerRead ? (status?.client_count ?? metrics?.client_count ?? 0) : (status?.client_count ?? 0)}
						</div>
						<p className="text-xs text-muted-foreground">Uptime: {canServerRead ? formattedUptime : '—'}</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
				<Card className="col-span-4">
					<CardHeader>
						<CardTitle>Server Control</CardTitle>
					</CardHeader>
					<CardContent>
						{!canServerRead ? (
							<p className="mb-4 text-sm text-muted-foreground">
								Server controls are hidden because you lack `server` permission.
							</p>
						) : null}
						<div className="space-y-4">
							<div className="flex items-center justify-between rounded-lg border border-border p-4">
								<div>
									<h4 className="font-semibold">Maintenance Mode</h4>
									<p className="text-sm text-muted-foreground">Prevent players from logging in. Whitelist only.</p>
								</div>
								<Button
									variant={maintenanceEnabled ? 'secondary' : 'destructive'}
									onClick={() => toggleMaintenance.mutate(!maintenanceEnabled)}
									disabled={!canServerWrite || toggleMaintenance.isPending}
								>
									{maintenanceEnabled ? 'End Maintenance' : 'Start Maintenance'}
								</Button>
							</div>
							<div className="flex items-center justify-between rounded-lg border border-border p-4">
								<div>
									<h4 className="font-semibold">Start/Stop/Restart</h4>
									<p className="text-sm text-muted-foreground">Control server connection acceptance.</p>
								</div>
								<div className="flex gap-2">
									<Button
										variant="secondary"
										onClick={() => startServerMutation.mutate()}
										disabled={!canServerWrite || startServerMutation.isPending}
									>
										<Play className="mr-2 h-4 w-4" />
										Start
									</Button>
									<Button
										variant="destructive"
										onClick={() => stopServerMutation.mutate()}
										disabled={!canServerWrite || stopServerMutation.isPending}
									>
										<Power className="mr-2 h-4 w-4" />
										Stop
									</Button>
									<Button
										variant="secondary"
										onClick={() => restartServerMutation.mutate()}
										disabled={!canServerWrite || restartServerMutation.isPending}
									>
										<RotateCcw className="mr-2 h-4 w-4" />
										Restart
									</Button>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="col-span-3">
					<CardHeader>
						<CardTitle>Recent Connections</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{activeConnections.slice(0, 3).map((connection) => (
								<div key={connection.hash} className="flex items-center">
									<div className="ml-4 space-y-1">
										<p className="text-sm font-medium leading-none">Commander {connection.commander_id}</p>
										<p className="text-xs text-muted-foreground">
											{new Date(connection.connected_at).toLocaleString()} • {connection.remote_address}
										</p>
									</div>
								</div>
							))}
							{activeConnections.length === 0 ? (
								<p className="text-sm text-muted-foreground">No active connections.</p>
							) : null}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
