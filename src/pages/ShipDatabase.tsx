import { useQuery } from '@tanstack/react-query'
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Search } from 'lucide-react'
import type React from 'react'
import { useMemo, useRef, useState } from 'react'
import { usePermissions } from '../components/PermissionsContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { api } from '../services/api'
import type { ShipSummary } from '../types'

export const ShipDatabasePage: React.FC = () => {
	const perms = usePermissions()
	const canRead = perms.can('game_data', 'read_any')
	const [name, setName] = useState('')
	const [rarity, setRarity] = useState('')
	const [nationality, setNationality] = useState('')
	const [type, setType] = useState('')

	const debouncedName = useDebouncedValue(name, 300)
	const debouncedRarity = useDebouncedValue(rarity, 300)
	const debouncedNationality = useDebouncedValue(nationality, 300)
	const debouncedType = useDebouncedValue(type, 300)

	const shipsQuery = useQuery({
		queryKey: [
			'ships',
			{ name: debouncedName, rarity: debouncedRarity, nationality: debouncedNationality, type: debouncedType },
		],
		queryFn: async () => {
			const response = await api.getShips({
				name: debouncedName || undefined,
				rarity: debouncedRarity ? Number(debouncedRarity) : undefined,
				nationality: debouncedNationality ? Number(debouncedNationality) : undefined,
				type: debouncedType ? Number(debouncedType) : undefined,
			})
			return { ships: response.data.ships, total: response.data.meta.total }
		},
		enabled: canRead,
	})

	if (!canRead) {
		return (
			<div className="space-y-6">
				<h1 className="text-3xl font-bold tracking-tight">Ship Database</h1>
				<p className="text-sm text-muted-foreground">You do not have permission to view game data.</p>
			</div>
		)
	}

	const ships = shipsQuery.data?.ships ?? []
	const total = shipsQuery.data?.total ?? 0

	const columns = useMemo<ColumnDef<ShipSummary>[]>(
		() => [
			{
				accessorKey: 'id',
				header: 'ID',
				cell: (info) => <span className="font-mono">{info.getValue<number>()}</span>,
				meta: { headerClassName: 'w-28', cellClassName: 'w-28' },
			},
			{
				accessorKey: 'name',
				header: 'Name',
				cell: (info) => <span className="font-bold">{info.getValue<string>()}</span>,
				meta: { headerClassName: 'w-[45%]' },
			},
			{
				accessorKey: 'rarity',
				header: 'Rarity',
				cell: (info) => <span className="text-yellow-500">{'★'.repeat(info.getValue<number>())}</span>,
				meta: { headerClassName: 'w-32 text-center', cellClassName: 'text-center' },
			},
			{
				accessorKey: 'nationality',
				header: 'Nationality',
				meta: { headerClassName: 'w-28 text-center', cellClassName: 'text-center' },
			},
		],
		[],
	)

	const table = useReactTable({
		data: ships,
		columns,
		getCoreRowModel: getCoreRowModel(),
	})

	const rows = table.getRowModel().rows
	const parentRef = useRef<HTMLDivElement>(null)
	const rowVirtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 44,
		overscan: 8,
	})

	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-bold tracking-tight">Ship Database</h1>
			<Card>
				<CardHeader>
					<CardTitle>Registered Ships</CardTitle>
					<div className="mt-4 flex flex-wrap items-center gap-2">
						<div className="relative flex-1 min-w-[200px]">
							<Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder="Search by name..."
								className="pl-8"
								value={name}
								onChange={(event) => setName(event.target.value)}
							/>
						</div>
						<Input
							type="number"
							placeholder="Rarity"
							className="w-28"
							value={rarity}
							onChange={(event) => setRarity(event.target.value)}
						/>
						<Input
							type="number"
							placeholder="Nationality"
							className="w-36"
							value={nationality}
							onChange={(event) => setNationality(event.target.value)}
						/>
						<Input
							type="number"
							placeholder="Type"
							className="w-24"
							value={type}
							onChange={(event) => setType(event.target.value)}
						/>
						<div className="text-xs text-muted-foreground">Total: {total}</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="rounded-md border border-border">
						<div ref={parentRef} className="max-h-[480px] overflow-auto">
							<table className="w-full table-fixed text-left text-sm">
								<thead className="bg-muted text-muted-foreground">
									{table.getHeaderGroups().map((headerGroup) => (
										<tr key={headerGroup.id}>
											{headerGroup.headers.map((header) => (
												<th
													key={header.id}
													className={`px-4 py-2 font-medium ${(header.column.columnDef.meta as { headerClassName?: string } | undefined)?.headerClassName ?? ''}`}
												>
													{header.isPlaceholder
														? null
														: flexRender(header.column.columnDef.header, header.getContext())}
												</th>
											))}
										</tr>
									))}
								</thead>
								<tbody className="relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
									{rowVirtualizer.getVirtualItems().map((virtualRow) => {
										const row = rows[virtualRow.index]
										return (
											<tr
												key={row.id}
												className="border-t border-border"
												style={{
													position: 'absolute',
													transform: `translateY(${virtualRow.start}px)`,
													width: '100%',
													display: 'table',
													tableLayout: 'fixed',
												}}
											>
												{row.getVisibleCells().map((cell) => (
													<td
														key={cell.id}
														className={`px-4 py-2 ${(cell.column.columnDef.meta as { cellClassName?: string } | undefined)?.cellClassName ?? ''}`}
													>
														{flexRender(cell.column.columnDef.cell, cell.getContext())}
													</td>
												))}
											</tr>
										)
									})}
									{rows.length === 0 ? (
										<tr>
											<td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
												No ships found.
											</td>
										</tr>
									) : null}
								</tbody>
							</table>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
