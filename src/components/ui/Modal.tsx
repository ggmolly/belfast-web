import { X } from 'lucide-react'
import type React from 'react'

interface ModalProps {
	isOpen: boolean
	onClose: () => void
	title: string
	children: React.ReactNode
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
	if (!isOpen) return null
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
			<div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg animate-in fade-in zoom-in-95 duration-200">
				<div className="mb-4 flex items-center justify-between">
					<h3 className="text-lg font-semibold">{title}</h3>
					<button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
						<X className="h-4 w-4" />
					</button>
				</div>
				{children}
			</div>
		</div>
	)
}
