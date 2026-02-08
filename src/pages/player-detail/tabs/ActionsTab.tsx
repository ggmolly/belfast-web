import { useForm } from '@tanstack/react-form'
import { Mail } from 'lucide-react'
import type React from 'react'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { SearchableSelect } from '../../../components/ui/SearchableSelect'
import { DROP_TYPES, type DropOption, type DropType } from '../../../lib/drops'

type MailAttachmentDraft = { id: string; dropId: number | null; dropType: number; quantity: number }

type ActionsTabProps = {
	dropOptions: DropOption[]
	onSendMail: (payload: {
		title: string
		body: string
		custom_sender?: string
		attachments: { item_id: number; type: number; quantity: number }[]
	}) => Promise<unknown>
}

export const ActionsTab: React.FC<ActionsTabProps> = ({ dropOptions, onSendMail }) => {
	const mailForm = useForm({
		defaultValues: {
			title: '',
			body: '',
			customSender: '',
			attachments: [] as MailAttachmentDraft[],
		},
		onSubmit: async ({ value }) => {
			const attachments = value.attachments
				.filter((attachment) => attachment.dropId !== null)
				.map((attachment) => ({
					item_id: Number(attachment.dropId),
					type: Number(attachment.dropType),
					quantity: Number(attachment.quantity),
				}))
			await onSendMail({
				title: value.title,
				body: value.body,
				custom_sender: value.customSender || undefined,
				attachments,
			})
			mailForm.reset()
		},
	})

	return (
		<div className="grid gap-6 md:grid-cols-1">
			<Card>
				<CardHeader className="flex flex-row items-center gap-2">
					<Mail className="h-5 w-5 text-primary" />
					<CardTitle>Send System Mail</CardTitle>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={(event) => {
							event.preventDefault()
							mailForm.handleSubmit()
						}}
						className="space-y-4"
					>
						<mailForm.Field name="title">
							{(field) => {
								const fieldId = 'mail-title'
								return (
									<div className="space-y-2">
										<label htmlFor={fieldId} className="text-sm font-medium">
											Subject
										</label>
										<Input
											id={fieldId}
											value={field.state.value}
											onChange={(event) => field.handleChange(event.target.value)}
											placeholder="Compensation"
											required
										/>
									</div>
								)
							}}
						</mailForm.Field>
						<mailForm.Field name="customSender">
							{(field) => {
								const fieldId = 'mail-sender'
								return (
									<div className="space-y-2">
										<label htmlFor={fieldId} className="text-sm font-medium">
											Sender (optional)
										</label>
										<Input
											id={fieldId}
											value={field.state.value}
											onChange={(event) => field.handleChange(event.target.value)}
											placeholder="Headquarters"
										/>
									</div>
								)
							}}
						</mailForm.Field>
						<mailForm.Field name="body">
							{(field) => {
								const fieldId = 'mail-body'
								return (
									<div className="space-y-2">
										<label htmlFor={fieldId} className="text-sm font-medium">
											Content
										</label>
										<textarea
											id={fieldId}
											className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
											value={field.state.value}
											onChange={(event) => field.handleChange(event.target.value)}
											placeholder="Message details..."
											required
										/>
									</div>
								)
							}}
						</mailForm.Field>
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium">Attachments</span>
								<Button
									type="button"
									variant="outline"
									onClick={() =>
										mailForm.setFieldValue('attachments', [
											...mailForm.state.values.attachments,
											{ id: crypto.randomUUID(), dropId: null, dropType: DROP_TYPES.ITEM, quantity: 1 },
										])
									}
								>
									Add Attachment
								</Button>
							</div>
							<mailForm.Subscribe selector={(state) => state.values.attachments}>
								{(attachments) =>
									attachments.map((attachment, idx) => (
										<div key={attachment.id} className="grid gap-3 md:grid-cols-4">
											<mailForm.Field name={`attachments[${idx}].dropId`}>
												{(field) => (
													<div className="space-y-1 md:col-span-2">
														<span className="text-xs text-muted-foreground">Drop</span>
														<SearchableSelect
															options={dropOptions}
															value={
																attachment.dropId !== null
																	? { id: attachment.dropId, type: attachment.dropType as DropType }
																	: null
															}
															onChange={(selection) => {
																field.handleChange(selection.id)
																mailForm.setFieldValue(`attachments[${idx}].dropType`, selection.type)
															}}
															placeholder="Search drops..."
														/>
													</div>
												)}
											</mailForm.Field>
											<mailForm.Field name={`attachments[${idx}].quantity`}>
												{(field) => (
													<div className="space-y-1">
														<label htmlFor={`mail-attach-qty-${idx}`} className="text-xs text-muted-foreground">
															Quantity
														</label>
														<Input
															id={`mail-attach-qty-${idx}`}
															type="number"
															value={field.state.value}
															onChange={(event) => field.handleChange(event.target.valueAsNumber)}
														/>
													</div>
												)}
											</mailForm.Field>
											<div className="flex items-end">
												<Button
													type="button"
													variant="ghost"
													onClick={() =>
														mailForm.setFieldValue(
															'attachments',
															attachments.filter((_, index) => index !== idx),
														)
													}
												>
													Remove
												</Button>
											</div>
										</div>
									))
								}
							</mailForm.Subscribe>
						</div>
						<Button type="submit" className="w-full">
							Send Mail
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
