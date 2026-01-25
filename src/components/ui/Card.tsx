import type React from 'react'

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
	<div
		className={`rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:shadow-md ${className}`}
	>
		{children}
	</div>
)

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
	children,
	className = '',
}) => <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
	children,
	className = '',
}) => <h3 className={`text-xl font-semibold leading-none tracking-tight text-foreground ${className}`}>{children}</h3>

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
	children,
	className = '',
}) => <div className={`p-6 pt-0 ${className}`}>{children}</div>
