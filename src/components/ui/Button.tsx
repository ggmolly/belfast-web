import type React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary'
	size?: 'sm' | 'md' | 'lg' | 'icon'
}

export const Button: React.FC<ButtonProps> = ({
	className = '',
	variant = 'default',
	size = 'md',
	children,
	...props
}) => {
	const baseStyles =
		'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95'

	const variants = {
		default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20',
		destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
		outline: 'border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground',
		secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
		ghost: 'hover:bg-accent hover:text-accent-foreground',
	}

	const sizes = {
		sm: 'h-8 px-3 text-xs',
		md: 'h-10 px-4 py-2',
		lg: 'h-11 px-8',
		icon: 'h-9 w-9',
	}

	return (
		<button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
			{children}
		</button>
	)
}
