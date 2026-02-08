import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type React from 'react'
import { useEffect } from 'react'
import { usePermissions } from '../components/PermissionsContext'
import { queryKeys } from '../lib/queryKeys'
import { api } from '../services/api'

export const MyPlayerPage: React.FC = () => {
	const perms = usePermissions()
	const navigate = useNavigate()
	const canReadAny = perms.can('players', 'read_any')
	const canReadSelf = perms.can('players', 'read_self')
	const commanderQuery = useQuery({
		queryKey: queryKeys.me.commander(),
		queryFn: api.meCommander,
		enabled: canReadSelf && !canReadAny,
		retry: false,
		refetchOnWindowFocus: false,
	})

	const commanderId = commanderQuery.data?.data.commander_id

	useEffect(() => {
		if (canReadAny) {
			navigate({ to: '/players' })
			return
		}
		if (!canReadSelf) return
		if (!commanderId) return
		navigate({
			to: '/players/$playerId',
			params: { playerId: String(commanderId) },
			replace: true,
		})
	}, [canReadAny, canReadSelf, commanderId, navigate])

	if (canReadAny) {
		return (
			<div className="space-y-4">
				<h1 className="text-3xl font-bold tracking-tight">Player</h1>
				<div className="h-3 w-40 animate-pulse rounded bg-muted" />
			</div>
		)
	}

	if (!canReadSelf) {
		return (
			<div className="space-y-4">
				<h1 className="text-3xl font-bold tracking-tight">Player</h1>
				<p className="text-sm text-muted-foreground">Permission denied, missing permission: players (read self).</p>
			</div>
		)
	}

	if (commanderQuery.isLoading) {
		return (
			<div className="space-y-4">
				<h1 className="text-3xl font-bold tracking-tight">Player</h1>
				<div className="h-3 w-32 animate-pulse rounded bg-muted" />
			</div>
		)
	}

	if (commanderQuery.isError) {
		return (
			<div className="space-y-4">
				<h1 className="text-3xl font-bold tracking-tight">Player</h1>
				<p className="text-sm text-muted-foreground">Failed to load player.</p>
			</div>
		)
	}

	return (
		<div className="space-y-4">
			<h1 className="text-3xl font-bold tracking-tight">Player</h1>
			<div className="h-3 w-32 animate-pulse rounded bg-muted" />
		</div>
	)
}
