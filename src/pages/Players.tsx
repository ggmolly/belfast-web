import { useDebouncedValue } from '@mantine/hooks'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Eye, Search } from 'lucide-react'
import type React from 'react'
import { useMemo, useRef, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { api } from '../services/api'
import type { PlayerSummary } from '../types'

const PAGE_SIZE = 50

export const PlayersPage: React.FC = () => {
	const [name, setName] = useState('')
	const [filter, setFilter] = useState('')
	const [minLevelInput, setMinLevelInput] = useState('')
	const navigate = useNavigate()
	const [debouncedName] = useDebouncedValue(name, 300)
	const [debouncedFilter] = useDebouncedValue(filter, 300)
	const [debouncedMinLevel] = useDebouncedValue(minLevelInput, 300)

	const playersQuery = useQuery({
		queryKey: [
			'players',
			{ offset: 0, limit: PAGE_SIZE, name: debouncedName, filter: debouncedFilter, min_level: debouncedMinLevel },
		],
		queryFn: () =>
			api.getPlayers({
				offset: 0,
				limit: PAGE_SIZE,
				name: debouncedName || undefined,
				filter: debouncedFilter || undefined,
				min_level: debouncedMinLevel ? Number(debouncedMinLevel) : undefined,
			}),
	})

	const players = playersQuery.data?.data.players ?? []
	const total = playersQuery.data?.data.meta.total ?? 0

	const columns = useMemo<ColumnDef<PlayerSummary>[]>(
		() => [
			{
				accessorKey: 'id',
				header: 'ID',
				cell: (info) => <span className="font-mono">{info.getValue<number>()}</span>,
			},
			{
				accessorKey: 'name',
				header: 'Name',
				cell: (info) => <span className="font-medium">{info.getValue<string>()}</span>,
			},
			{
				accessorKey: 'level',
				header: 'Level',
			},
			{
				accessorKey: 'banned',
				header: 'Status',
				cell: ({ row }) => {
					if (row.original.banned) return <Badge variant="destructive">Banned</Badge>
					if (row.original.online) return <Badge variant="success">Online</Badge>
					return <Badge variant="secondary">Offline</Badge>
				},
			},
			{
				accessorKey: 'last_login',
				header: 'Last Login',
				cell: (info) => (
					<span className="text-muted-foreground">{new Date(info.getValue<string>()).toLocaleString()}</span>
				),
			},
			{
				id: 'actions',
				header: () => <div className="text-right">Actions</div>,
				cell: ({ row }) => (
					<div className="text-right">
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								navigate({
									to: '/players/$playerId',
									params: { playerId: String(row.original.id) },
								})
							}
						>
							<Eye className="mr-2 h-4 w-4" />
							Details
						</Button>
					</div>
				),
			},
		],
		[navigate],
	)

	const table = useReactTable({
		data: players,
		columns,
		getCoreRowModel: getCoreRowModel(),
	})

	const rows = table.getRowModel().rows
	const parentRef = useRef<HTMLDivElement>(null)
	const rowVirtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 48,
		overscan: 8,
	})

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold tracking-tight">Players</h1>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Search and Filters</CardTitle>
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
						<select
							className="h-10 rounded-md border border-input bg-background px-3 text-sm"
							value={filter}
							onChange={(event) => setFilter(event.target.value)}
						>
							<option value="">All status</option>
							<option value="online">Online</option>
							<option value="banned">Banned</option>
						</select>
						<Input
							type="number"
							placeholder="Min level"
							className="w-32"
							value={minLevelInput}
							onChange={(event) => setMinLevelInput(event.target.value)}
						/>
						<div className="text-xs text-muted-foreground">Total: {total}</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="rounded-md border border-border">
						<div ref={parentRef} className="max-h-[480px] overflow-auto">
							<table className="w-full text-left text-sm">
								<thead className="bg-muted text-muted-foreground">
									{table.getHeaderGroups().map((headerGroup) => (
										<tr key={headerGroup.id}>
											{headerGroup.headers.map((header) => (
												<th key={header.id} className="px-4 py-3 font-medium">
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
												className="border-t border-border hover:bg-muted/50"
												style={{
													position: 'absolute',
													transform: `translateY(${virtualRow.start}px)`,
													width: '100%',
													display: 'table',
												}}
											>
												{row.getVisibleCells().map((cell) => (
													<td key={cell.id} className="px-4 py-3">
														{flexRender(cell.column.columnDef.cell, cell.getContext())}
													</td>
												))}
											</tr>
										)
									})}
									{rows.length === 0 ? (
										<tr>
											<td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
												No players found.
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
