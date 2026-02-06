import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Plus, RefreshCw, Save } from 'lucide-react'
import type React from 'react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { usePermissions } from '../components/PermissionsContext'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { api } from '../services/api'
import type {
	AccountOverrideEntry,
	AccountOverrideMode,
	PermissionPolicyEntry,
	RolePolicyUpdateRequest,
} from '../types'

type Tab = 'roles' | 'accounts'

const emptyEntry = (key: string): PermissionPolicyEntry => ({
	key,
	read_self: false,
	read_any: false,
	write_self: false,
	write_any: false,
})

const upsertEntry = (entries: PermissionPolicyEntry[], next: PermissionPolicyEntry): PermissionPolicyEntry[] => {
	const copy = [...entries]
	const index = copy.findIndex((entry) => entry.key === next.key)
	if (index === -1) return [...copy, next]
	copy[index] = next
	return copy
}

export const AccessControlPage: React.FC = () => {
	const perms = usePermissions()
	const queryClient = useQueryClient()
	const [tab, setTab] = useState<Tab>('roles')
	const [role, setRole] = useState('player')
	const [filter, setFilter] = useState('')
	const [accountId, setAccountId] = useState('')

	const canManage = perms.can('admin.authz', 'read_any')
	const roleListQuery = useQuery({
		queryKey: ['admin', 'authz', 'roles'],
		queryFn: api.adminAuthzListRoles,
		enabled: canManage,
	})
	const permissionListQuery = useQuery({
		queryKey: ['admin', 'authz', 'permissions'],
		queryFn: api.adminAuthzListPermissions,
		enabled: canManage,
	})
	const rolePolicyQuery = useQuery({
		queryKey: ['admin', 'authz', 'roles', role],
		queryFn: () => api.adminAuthzGetRolePolicy(role),
		enabled: canManage && Boolean(role),
	})

	const roleNames = roleListQuery.data?.data.roles.map((r) => r.name) ?? []
	const permissionDescriptions = useMemo(() => {
		const map = new Map<string, string>()
		for (const perm of permissionListQuery.data?.data.permissions ?? []) {
			map.set(perm.key, perm.description)
		}
		return map
	}, [permissionListQuery.data])
	const availableKeys = rolePolicyQuery.data?.data.available_keys ?? []
	const policyEntries = rolePolicyQuery.data?.data.permissions ?? []

	const [draftPolicy, setDraftPolicy] = useState<PermissionPolicyEntry[] | null>(null)
	const effectivePolicy = draftPolicy ?? policyEntries

	const filteredKeys = useMemo(() => {
		const needle = filter.trim().toLowerCase()
		if (!needle) return availableKeys
		return availableKeys.filter((key) => key.toLowerCase().includes(needle))
	}, [availableKeys, filter])

	const replaceRolePolicyMutation = useMutation({
		mutationFn: (payload: RolePolicyUpdateRequest) => api.adminAuthzReplaceRolePolicy(role, payload),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['admin', 'authz', 'roles', role] })
			await queryClient.invalidateQueries({ queryKey: ['me', 'permissions'] })
			setDraftPolicy(null)
			toast.success('Role policy saved')
		},
		onError: (error) => {
			toast.error('Failed to save policy', { description: error.message })
		},
	})

	const accountRolesQuery = useQuery({
		queryKey: ['admin', 'authz', 'accounts', accountId, 'roles'],
		queryFn: () => api.adminAuthzGetAccountRoles(accountId),
		enabled: canManage && tab === 'accounts' && Boolean(accountId.trim()),
		retry: false,
	})
	const accountOverridesQuery = useQuery({
		queryKey: ['admin', 'authz', 'accounts', accountId, 'overrides'],
		queryFn: () => api.adminAuthzGetAccountOverrides(accountId),
		enabled: canManage && tab === 'accounts' && Boolean(accountId.trim()),
		retry: false,
	})

	const [draftRoles, setDraftRoles] = useState<string[] | null>(null)
	const currentRoles = accountRolesQuery.data?.data.roles ?? []
	const rolesDraft = draftRoles ?? currentRoles

	const replaceAccountRolesMutation = useMutation({
		mutationFn: (payload: { accountId: string; roles: string[] }) =>
			api.adminAuthzReplaceAccountRoles(payload.accountId, { roles: payload.roles }),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['admin', 'authz', 'accounts', accountId, 'roles'] })
			toast.success('Account roles updated')
			setDraftRoles(null)
		},
		onError: (error) => toast.error('Failed to update roles', { description: error.message }),
	})

	const [draftOverrides, setDraftOverrides] = useState<AccountOverrideEntry[] | null>(null)
	const currentOverrides = accountOverridesQuery.data?.data.overrides ?? []
	const overridesDraft = draftOverrides ?? currentOverrides

	const replaceAccountOverridesMutation = useMutation({
		mutationFn: (payload: { accountId: string; overrides: AccountOverrideEntry[] }) =>
			api.adminAuthzReplaceAccountOverrides(payload.accountId, { overrides: payload.overrides }),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['admin', 'authz', 'accounts', accountId, 'overrides'] })
			toast.success('Overrides updated')
			setDraftOverrides(null)
		},
		onError: (error) => toast.error('Failed to update overrides', { description: error.message }),
	})

	if (!canManage) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Access Control</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">You do not have permission to manage access control.</p>
				</CardContent>
			</Card>
		)
	}

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Access Control</h1>
					<p className="text-sm text-muted-foreground">Manage roles, permissions, and per-account overrides.</p>
				</div>
				<Button
					variant="outline"
					onClick={() => {
						queryClient.invalidateQueries({ queryKey: ['admin', 'authz'] })
					}}
				>
					<RefreshCw className="mr-2 h-4 w-4" />
					Refresh
				</Button>
			</div>

			<div className="flex items-center gap-2">
				<Button variant={tab === 'roles' ? 'secondary' : 'outline'} onClick={() => setTab('roles')}>
					Role Policies
				</Button>
				<Button variant={tab === 'accounts' ? 'secondary' : 'outline'} onClick={() => setTab('accounts')}>
					Account Roles & Overrides
				</Button>
			</div>

			{tab === 'roles' ? (
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle>Role Policy</CardTitle>
						<div className="flex items-center gap-2">
							<select
								className="h-9 rounded-md border border-input bg-background px-2 text-sm"
								value={role}
								onChange={(event) => {
									setDraftPolicy(null)
									setRole(event.target.value)
								}}
							>
								{roleNames.map((name) => (
									<option key={name} value={name}>
										{name}
									</option>
								))}
							</select>
							<Input
								value={filter}
								onChange={(event) => setFilter(event.target.value)}
								placeholder="Filter keys…"
								className="w-64"
							/>
							<Button
								variant="secondary"
								disabled={replaceRolePolicyMutation.isPending}
								onClick={() => {
									replaceRolePolicyMutation.mutate({ permissions: effectivePolicy })
								}}
							>
								<Save className="mr-2 h-4 w-4" />
								Save
							</Button>
						</div>
					</CardHeader>
					<CardContent>
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
									{filteredKeys.map((key) => {
										const existing = effectivePolicy.find((entry) => entry.key === key) ?? emptyEntry(key)
										const update = (partial: Partial<PermissionPolicyEntry>) => {
											setDraftPolicy((prev) => {
												const base = prev ?? effectivePolicy
												return upsertEntry(base, { ...existing, ...partial })
											})
										}
										return (
											<tr key={key} className="border-t border-border">
												<td className="px-3 py-2">
													<div className="font-mono text-xs">{key}</div>
													{permissionDescriptions.get(key) ? (
														<div className="mt-0.5 text-xs text-muted-foreground">
															{permissionDescriptions.get(key)}
														</div>
													) : null}
												</td>
												<td className="px-3 py-2 text-center">
													<input
														type="checkbox"
														checked={existing.read_self}
														onChange={(e) => update({ read_self: e.target.checked })}
													/>
												</td>
												<td className="px-3 py-2 text-center">
													<input
														type="checkbox"
														checked={existing.read_any}
														onChange={(e) => update({ read_any: e.target.checked })}
													/>
												</td>
												<td className="px-3 py-2 text-center">
													<input
														type="checkbox"
														checked={existing.write_self}
														onChange={(e) => update({ write_self: e.target.checked })}
													/>
												</td>
												<td className="px-3 py-2 text-center">
													<input
														type="checkbox"
														checked={existing.write_any}
														onChange={(e) => update({ write_any: e.target.checked })}
													/>
												</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle>Account Roles</CardTitle>
							<div className="flex items-center gap-2">
								<Input
									value={accountId}
									onChange={(event) => {
										setDraftRoles(null)
										setDraftOverrides(null)
										setAccountId(event.target.value)
									}}
									placeholder="Account ID…"
									className="w-64"
								/>
								<Button
									variant="secondary"
									disabled={!accountId.trim() || replaceAccountRolesMutation.isPending}
									onClick={() => replaceAccountRolesMutation.mutate({ accountId: accountId.trim(), roles: rolesDraft })}
								>
									<Check className="mr-2 h-4 w-4" />
									Save
								</Button>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							{accountRolesQuery.isFetching ? <Badge variant="secondary">Loading…</Badge> : null}
							<div className="grid gap-2">
								{roleNames.map((name) => {
									const checked = rolesDraft.includes(name)
									return (
										<label key={name} className="flex items-center gap-2 text-sm">
											<input
												type="checkbox"
												checked={checked}
												onChange={(e) => {
													setDraftRoles((prev) => {
														const base = prev ?? rolesDraft
														return e.target.checked
															? Array.from(new Set([...base, name]))
															: base.filter((r) => r !== name)
													})
												}}
											/>
											<span className="font-mono text-xs">{name}</span>
										</label>
									)
								})}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle>Permission Overrides</CardTitle>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									disabled={!accountId.trim()}
									onClick={() => {
										setDraftOverrides((prev) => {
											const base = prev ?? overridesDraft
											return [
												...base,
												{
													key: availableKeys[0] ?? 'players',
													mode: 'allow',
													read_self: false,
													read_any: false,
													write_self: false,
													write_any: false,
												},
											]
										})
									}}
								>
									<Plus className="mr-2 h-4 w-4" />
									Add
								</Button>
								<Button
									variant="secondary"
									disabled={!accountId.trim() || replaceAccountOverridesMutation.isPending}
									onClick={() =>
										replaceAccountOverridesMutation.mutate({ accountId: accountId.trim(), overrides: overridesDraft })
									}
								>
									<Save className="mr-2 h-4 w-4" />
									Save
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							{accountOverridesQuery.isFetching ? <Badge variant="secondary">Loading…</Badge> : null}
							{overridesDraft.length === 0 ? (
								<p className="text-sm text-muted-foreground">No overrides.</p>
							) : (
								<div className="space-y-3">
									{overridesDraft.map((ov, index) => (
										<div key={`${ov.key}-${index}`} className="rounded-lg border border-border p-3">
											<div className="mb-3 flex flex-wrap items-center gap-2">
												<select
													className="h-9 rounded-md border border-input bg-background px-2 text-sm"
													value={ov.key}
													onChange={(event) => {
														const key = event.target.value
														setDraftOverrides((prev) => {
															const base = prev ?? overridesDraft
															const copy = [...base]
															copy[index] = { ...copy[index], key }
															return copy
														})
													}}
												>
													{availableKeys.map((key) => (
														<option key={key} value={key}>
															{key}
														</option>
													))}
												</select>
												<select
													className="h-9 rounded-md border border-input bg-background px-2 text-sm"
													value={ov.mode}
													onChange={(event) => {
														const mode = event.target.value as AccountOverrideMode
														setDraftOverrides((prev) => {
															const base = prev ?? overridesDraft
															const copy = [...base]
															copy[index] = { ...copy[index], mode }
															return copy
														})
													}}
												>
													<option value="allow">allow</option>
													<option value="deny">deny</option>
												</select>
												<Button
													size="sm"
													variant="outline"
													onClick={() => {
														setDraftOverrides((prev) => {
															const base = prev ?? overridesDraft
															return base.filter((_, i) => i !== index)
														})
													}}
												>
													Remove
												</Button>
											</div>
											<div className="grid grid-cols-2 gap-2 text-sm">
												{(
													[
														['read_self', 'Read self'],
														['read_any', 'Read any'],
														['write_self', 'Write self'],
														['write_any', 'Write any'],
													] as const
												).map(([field, label]) => (
													<label key={field} className="flex items-center gap-2">
														<input
															type="checkbox"
															checked={ov[field]}
															onChange={(e) => {
																setDraftOverrides((prev) => {
																	const base = prev ?? overridesDraft
																	const copy = [...base]
																	copy[index] = { ...copy[index], [field]: e.target.checked } as AccountOverrideEntry
																	return copy
																})
															}}
														/>
														{label}
													</label>
												))}
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	)
}
