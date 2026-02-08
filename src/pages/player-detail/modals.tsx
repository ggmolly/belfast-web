import { useForm } from '@tanstack/react-form'
import type React from 'react'
import { useEffect } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { SearchableSelect } from '../../components/ui/SearchableSelect'
import { DROP_TYPES, type DropOption } from '../../lib/drops'

export const EditProfileModal: React.FC<{
	isOpen: boolean
	onClose: () => void
	initialName: string
	initialLevel: number
	onSave: (payload: { name?: string; level?: number }) => Promise<unknown>
}> = ({ isOpen, onClose, initialName, initialLevel, onSave }) => {
	const profileForm = useForm({
		defaultValues: { name: initialName, level: initialLevel },
		onSubmit: async ({ value }) => {
			await onSave({ name: value.name, level: Number(value.level) })
			onClose()
		},
	})

	useEffect(() => {
		if (!isOpen) return
		profileForm.reset({ name: initialName, level: initialLevel })
	}, [initialLevel, initialName, isOpen, profileForm])

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Edit Commander Profile">
			<form
				onSubmit={(event) => {
					event.preventDefault()
					profileForm.handleSubmit()
				}}
				className="space-y-4"
			>
				<profileForm.Field name="name">
					{(field) => {
						const fieldId = 'profile-name'
						return (
							<div className="space-y-2">
								<label htmlFor={fieldId} className="text-sm font-medium">
									Commander Name
								</label>
								<Input
									id={fieldId}
									value={field.state.value}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
							</div>
						)
					}}
				</profileForm.Field>
				<profileForm.Field name="level">
					{(field) => {
						const fieldId = 'profile-level'
						return (
							<div className="space-y-2">
								<label htmlFor={fieldId} className="text-sm font-medium">
									Level
								</label>
								<Input
									id={fieldId}
									type="number"
									value={field.state.value}
									onChange={(event) => field.handleChange(event.target.valueAsNumber)}
								/>
							</div>
						)
					}}
				</profileForm.Field>
				<div className="flex justify-end gap-2 pt-2">
					<Button type="button" variant="ghost" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit">Save Changes</Button>
				</div>
			</form>
		</Modal>
	)
}

export const AddItemModal: React.FC<{
	isOpen: boolean
	onClose: () => void
	dropOptions: DropOption[]
	onGiveItem: (payload: { itemId: number; amount: number }) => Promise<unknown>
}> = ({ isOpen, onClose, dropOptions, onGiveItem }) => {
	const addItemForm = useForm({
		defaultValues: { itemId: null as number | null, amount: 1 },
		onSubmit: async ({ value }) => {
			if (value.itemId === null) return
			await onGiveItem({ itemId: value.itemId, amount: Number(value.amount) })
			addItemForm.reset()
			onClose()
		},
	})

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Add Item to Depot">
			<form
				onSubmit={(event) => {
					event.preventDefault()
					addItemForm.handleSubmit()
				}}
				className="space-y-4"
			>
				<addItemForm.Field name="itemId">
					{(field) => (
						<div className="space-y-2">
							<span className="text-sm font-medium">Select Item</span>
							<SearchableSelect
								options={dropOptions}
								whitelist={[DROP_TYPES.ITEM]}
								value={field.state.value !== null ? { id: field.state.value, type: DROP_TYPES.ITEM } : null}
								onChange={(selection) => field.handleChange(selection.id)}
								placeholder="Search by name or ID..."
							/>
						</div>
					)}
				</addItemForm.Field>
				<addItemForm.Field name="amount">
					{(field) => {
						const fieldId = 'add-item-amount'
						return (
							<div className="space-y-2">
								<label htmlFor={fieldId} className="text-sm font-medium">
									Amount
								</label>
								<Input
									id={fieldId}
									type="number"
									value={field.state.value}
									onChange={(event) => field.handleChange(event.target.valueAsNumber)}
									placeholder="1"
								/>
							</div>
						)
					}}
				</addItemForm.Field>
				<div className="flex justify-end gap-2 pt-2">
					<Button type="button" variant="ghost" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit">Add Item</Button>
				</div>
			</form>
		</Modal>
	)
}

export const AddShipModal: React.FC<{
	isOpen: boolean
	onClose: () => void
	shipTypeOptions: { id: number; label: string }[]
	filteredShipOptions: DropOption[]
	onCommission: (payload: { shipId: number }) => Promise<unknown>
	onSetShipTypeFilter: (value: number | null) => void
	shipTypeFilter: number | null
}> = ({ isOpen, onClose, shipTypeOptions, filteredShipOptions, onCommission, onSetShipTypeFilter, shipTypeFilter }) => {
	const addShipForm = useForm({
		defaultValues: { shipId: null as number | null },
		onSubmit: async ({ value }) => {
			if (value.shipId === null) return
			await onCommission({ shipId: value.shipId })
			addShipForm.reset()
			onClose()
		},
	})

	return (
		<Modal
			isOpen={isOpen}
			onClose={() => {
				onClose()
				onSetShipTypeFilter(null)
			}}
			title="Commission Ship"
		>
			<form
				onSubmit={(event) => {
					event.preventDefault()
					addShipForm.handleSubmit()
				}}
				className="space-y-4"
			>
				<div className="space-y-2">
					<span className="text-sm font-medium">Filter by Ship Type</span>
					<select
						className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
						value={shipTypeFilter ?? ''}
						onChange={(event) => onSetShipTypeFilter(event.target.value ? Number(event.target.value) : null)}
					>
						<option value="">All Types</option>
						{shipTypeOptions.map((type) => (
							<option key={type.id} value={type.id}>
								{type.label}
							</option>
						))}
					</select>
				</div>
				<addShipForm.Field name="shipId">
					{(field) => (
						<div className="space-y-2">
							<span className="text-sm font-medium">Select Ship</span>
							<SearchableSelect
								options={filteredShipOptions}
								whitelist={[DROP_TYPES.SHIP]}
								value={field.state.value !== null ? { id: field.state.value, type: DROP_TYPES.SHIP } : null}
								onChange={(selection) => field.handleChange(selection.id)}
								placeholder="Search by name or ID..."
							/>
						</div>
					)}
				</addShipForm.Field>
				<div className="flex justify-end gap-2 pt-2">
					<Button
						type="button"
						variant="ghost"
						onClick={() => {
							onClose()
							onSetShipTypeFilter(null)
						}}
					>
						Cancel
					</Button>
					<Button type="submit">Commission</Button>
				</div>
			</form>
		</Modal>
	)
}

export const AddSkinModal: React.FC<{
	isOpen: boolean
	onClose: () => void
	skinShipFilterOptions: DropOption[]
	filteredSkinOptions: DropOption[]
	skinShipFilter: number | null
	onSetSkinShipFilter: (value: number | null) => void
	onGiveSkin: (payload: { skinId: number; expiresAt?: string }) => Promise<unknown>
}> = ({
	isOpen,
	onClose,
	skinShipFilterOptions,
	filteredSkinOptions,
	skinShipFilter,
	onSetSkinShipFilter,
	onGiveSkin,
}) => {
	const addSkinForm = useForm({
		defaultValues: { skinId: null as number | null, expiresAt: '' },
		onSubmit: async ({ value }) => {
			if (value.skinId === null) return
			const expiresAt = value.expiresAt ? new Date(value.expiresAt).toISOString() : undefined
			await onGiveSkin({ skinId: value.skinId, expiresAt })
			addSkinForm.reset()
			onClose()
			onSetSkinShipFilter(null)
		},
	})

	return (
		<Modal
			isOpen={isOpen}
			onClose={() => {
				onClose()
				onSetSkinShipFilter(null)
			}}
			title="Give Skin"
		>
			<form
				onSubmit={(event) => {
					event.preventDefault()
					addSkinForm.handleSubmit()
				}}
				className="space-y-4"
			>
				<div className="space-y-2">
					<span className="text-sm font-medium">Filter by Ship</span>
					<SearchableSelect
						options={skinShipFilterOptions}
						whitelist={[DROP_TYPES.SHIP]}
						value={skinShipFilter !== null ? { id: skinShipFilter, type: DROP_TYPES.SHIP } : null}
						onChange={(selection) => onSetSkinShipFilter(selection.id === 0 ? null : selection.id)}
						placeholder="Search ships..."
					/>
				</div>
				<addSkinForm.Field name="skinId">
					{(field) => (
						<div className="space-y-2">
							<span className="text-sm font-medium">Select Skin</span>
							<SearchableSelect
								options={filteredSkinOptions}
								whitelist={[DROP_TYPES.SKIN]}
								value={field.state.value !== null ? { id: field.state.value, type: DROP_TYPES.SKIN } : null}
								onChange={(selection) => field.handleChange(selection.id)}
								placeholder="Search by name or ID..."
							/>
						</div>
					)}
				</addSkinForm.Field>
				<addSkinForm.Field name="expiresAt">
					{(field) => {
						const fieldId = 'skin-expires-at'
						return (
							<div className="space-y-2">
								<label htmlFor={fieldId} className="text-sm font-medium">
									Expires At (optional)
								</label>
								<Input
									id={fieldId}
									type="datetime-local"
									value={field.state.value}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
							</div>
						)
					}}
				</addSkinForm.Field>
				<div className="flex justify-end gap-2 pt-2">
					<Button
						type="button"
						variant="ghost"
						onClick={() => {
							onClose()
							onSetSkinShipFilter(null)
						}}
					>
						Cancel
					</Button>
					<Button type="submit">Give Skin</Button>
				</div>
			</form>
		</Modal>
	)
}

export const BanModal: React.FC<{
	isOpen: boolean
	onClose: () => void
	onBan: (payload: { permanent: boolean; durationHours: number }) => Promise<unknown>
}> = ({ isOpen, onClose, onBan }) => {
	const banForm = useForm({
		defaultValues: { permanent: false, durationHours: 24 },
		onSubmit: async ({ value }) => {
			await onBan({ permanent: value.permanent, durationHours: Number(value.durationHours) })
			onClose()
		},
	})

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Ban Player">
			<form
				onSubmit={(event) => {
					event.preventDefault()
					banForm.handleSubmit()
				}}
				className="space-y-4"
			>
				<div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
					Warning: This action will prevent the player from logging in.
				</div>
				<banForm.Field name="permanent">
					{(field) => (
						<label className="flex items-center gap-2 text-sm font-medium">
							<input
								type="checkbox"
								checked={field.state.value}
								onChange={(event) => field.handleChange(event.target.checked)}
							/>
							Permanent Ban
						</label>
					)}
				</banForm.Field>
				<banForm.Field name="durationHours">
					{(field) => {
						const fieldId = 'ban-duration'
						return (
							<div className="space-y-2">
								<label htmlFor={fieldId} className="text-sm font-medium">
									Duration (Hours)
								</label>
								<Input
									id={fieldId}
									type="number"
									value={field.state.value}
									onChange={(event) => field.handleChange(event.target.valueAsNumber)}
									disabled={banForm.state.values.permanent}
								/>
							</div>
						)
					}}
				</banForm.Field>
				<div className="flex justify-end gap-2 pt-2">
					<Button type="button" variant="ghost" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit" variant="destructive">
						Confirm Ban
					</Button>
				</div>
			</form>
		</Modal>
	)
}

export const KickModal: React.FC<{
	isOpen: boolean
	onClose: () => void
	kickReasons: { id: number; label: string }[]
	onKick: (payload: { reason: number }) => Promise<unknown>
}> = ({ isOpen, onClose, kickReasons, onKick }) => {
	const kickForm = useForm({
		defaultValues: { reason: 1 },
		onSubmit: async ({ value }) => {
			await onKick({ reason: Number(value.reason) })
			onClose()
		},
	})

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Kick Player">
			<form
				onSubmit={(event) => {
					event.preventDefault()
					kickForm.handleSubmit()
				}}
				className="space-y-4"
			>
				<div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
					Select a disconnect reason that will be sent to the client.
				</div>
				<kickForm.Field name="reason">
					{(field) => (
						<div className="space-y-2">
							<label htmlFor="kick-reason" className="text-sm font-medium">
								Kick Reason
							</label>
							<select
								id="kick-reason"
								className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
								value={field.state.value}
								onChange={(event) => field.handleChange(Number(event.target.value))}
							>
								{kickReasons.map((reason) => (
									<option key={reason.id} value={reason.id}>
										{reason.id} — {reason.label}
									</option>
								))}
							</select>
						</div>
					)}
				</kickForm.Field>
				<div className="flex justify-end gap-2 pt-2">
					<Button type="button" variant="ghost" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit" variant="destructive">
						Confirm Kick
					</Button>
				</div>
			</form>
		</Modal>
	)
}

export const EditResourceModal: React.FC<{
	isOpen: boolean
	onClose: () => void
	resource: { resourceId: number; name: string; amount: number } | null
	onUpdate: (payload: { resourceId: number; amount: number }) => Promise<unknown>
}> = ({ isOpen, onClose, resource, onUpdate }) => {
	const resourceEditForm = useForm({
		defaultValues: { amount: resource?.amount ?? 0 },
		onSubmit: async ({ value }) => {
			if (!resource) return
			await onUpdate({ resourceId: resource.resourceId, amount: Number(value.amount) })
			onClose()
		},
	})

	useEffect(() => {
		if (!isOpen) return
		resourceEditForm.reset({ amount: resource?.amount ?? 0 })
	}, [isOpen, resource?.amount, resourceEditForm])

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Update Resource">
			<form
				onSubmit={(event) => {
					event.preventDefault()
					resourceEditForm.handleSubmit()
				}}
				className="space-y-4"
			>
				<div className="rounded-md border border-border bg-muted/30 p-3">
					<div className="text-sm font-medium">{resource?.name}</div>
					<div className="text-xs text-muted-foreground">Resource ID: {resource?.resourceId}</div>
				</div>
				<resourceEditForm.Field name="amount">
					{(field) => {
						const fieldId = 'resource-amount'
						return (
							<div className="space-y-2">
								<label htmlFor={fieldId} className="text-sm font-medium">
									New Amount
								</label>
								<Input
									id={fieldId}
									type="number"
									value={field.state.value}
									onChange={(event) => field.handleChange(event.target.valueAsNumber)}
									placeholder="0"
								/>
							</div>
						)
					}}
				</resourceEditForm.Field>
				<div className="flex justify-end gap-2 pt-2">
					<Button type="button" variant="ghost" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit">Update Resource</Button>
				</div>
			</form>
		</Modal>
	)
}

export const EditInventoryModal: React.FC<{
	isOpen: boolean
	onClose: () => void
	item: { itemId: number; name: string; count: number } | null
	onUpdate: (payload: { itemId: number; quantity: number }) => Promise<unknown>
}> = ({ isOpen, onClose, item, onUpdate }) => {
	const inventoryEditForm = useForm({
		defaultValues: { quantity: item?.count ?? 0 },
		onSubmit: async ({ value }) => {
			if (!item) return
			await onUpdate({ itemId: item.itemId, quantity: Number(value.quantity) })
			onClose()
		},
	})

	useEffect(() => {
		if (!isOpen) return
		inventoryEditForm.reset({ quantity: item?.count ?? 0 })
	}, [inventoryEditForm, isOpen, item?.count])

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Update Item Quantity">
			<form
				onSubmit={(event) => {
					event.preventDefault()
					inventoryEditForm.handleSubmit()
				}}
				className="space-y-4"
			>
				<div className="rounded-md border border-border bg-muted/30 p-3">
					<div className="text-sm font-medium">{item?.name}</div>
					<div className="text-xs text-muted-foreground">Item ID: {item?.itemId}</div>
				</div>
				<inventoryEditForm.Field name="quantity">
					{(field) => {
						const fieldId = 'inventory-quantity'
						return (
							<div className="space-y-2">
								<label htmlFor={fieldId} className="text-sm font-medium">
									New Quantity
								</label>
								<Input
									id={fieldId}
									type="number"
									value={field.state.value}
									onChange={(event) => field.handleChange(event.target.valueAsNumber)}
									placeholder="0"
								/>
							</div>
						)
					}}
				</inventoryEditForm.Field>
				<div className="flex justify-end gap-2 pt-2">
					<Button type="button" variant="ghost" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit">Update Quantity</Button>
				</div>
			</form>
		</Modal>
	)
}
