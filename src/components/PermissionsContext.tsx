import { useQuery } from '@tanstack/react-query'
import type React from 'react'
import { createContext, useContext, useMemo } from 'react'
import { queryKeys } from '../lib/queryKeys'
import { api } from '../services/api'
import type { MePermissionsResponse, PermissionOp, PermissionPolicyEntry } from '../types'
import { useAuth } from './AuthContext'

type PermissionsContextValue = {
	isLoading: boolean
	data: MePermissionsResponse | null
	permissionsByKey: Record<string, PermissionPolicyEntry>
	can: (key: string, op: PermissionOp) => boolean
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null)

const canFromEntry = (entry: PermissionPolicyEntry | undefined, op: PermissionOp): boolean => {
	if (!entry) return false
	if (op === 'read_self') return entry.read_self || entry.read_any
	if (op === 'read_any') return entry.read_any
	if (op === 'write_self') return entry.write_self || entry.write_any
	if (op === 'write_any') return entry.write_any
	return false
}

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const auth = useAuth()
	const permsQuery = useQuery({
		queryKey: queryKeys.me.permissions(),
		queryFn: api.mePermissions,
		enabled: auth.isAuthenticated,
		retry: false,
	})

	const data = permsQuery.data?.data ?? null
	const permissionsByKey = useMemo(() => {
		const map: Record<string, PermissionPolicyEntry> = {}
		for (const entry of data?.permissions ?? []) {
			map[entry.key] = entry
		}
		return map
	}, [data])

	const value = useMemo<PermissionsContextValue>(
		() => ({
			isLoading: permsQuery.isLoading,
			data,
			permissionsByKey,
			can: (key, op) => canFromEntry(permissionsByKey[key], op),
		}),
		[data, permissionsByKey, permsQuery.isLoading],
	)

	return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>
}

export const usePermissions = () => {
	const context = useContext(PermissionsContext)
	if (!context) throw new Error('usePermissions must be used within PermissionsProvider')
	return context
}
