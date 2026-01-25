import type React from 'react'

interface BadgeProps {
	children: React.ReactNode
	variant?: 'default' | 'success' | 'destructive' | 'outline' | 'secondary'
	className?: string
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
	const variants = {
		default: 'border-transparent bg-primary/15 text-primary hover:bg-primary/25',
		secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
		destructive: 'border-transparent bg-destructive/15 text-destructive hover:bg-destructive/25',
		success: 'border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25',
		outline: 'text-foreground border-border',
	}

	return (
		<div
			className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className}`}
		>
			{children}
		</div>
	)
}
