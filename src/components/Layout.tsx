import { Link, Outlet, useMatchRoute } from '@tanstack/react-router'
import { Anchor, DoorOpen, Laptop, LayoutDashboard, Moon, Settings, Ship, Sun, Tag, Users } from 'lucide-react'
import type React from 'react'
import { LoginPage } from '../pages/Login'
import { useAuth } from './AuthContext'
import { useTheme } from './ThemeContext'
import { Button } from './ui/Button'

const SidebarItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
	const matchRoute = useMatchRoute()
	const isActive = Boolean(matchRoute({ to }))

	return (
		<Link
			to={to}
			className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ease-in-out ${
				isActive
					? 'bg-primary/10 text-primary font-medium shadow-sm'
					: 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
			}`}
		>
			<div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
				{icon}
			</div>
			<span>{label}</span>
		</Link>
	)
}

export const Layout: React.FC = () => {
	const { theme, setTheme } = useTheme()
	const auth = useAuth()

	if (auth.isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background text-foreground">
				<div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
					<div className="h-2 w-24 animate-pulse rounded-full bg-muted" />
					<span>Loading secure session...</span>
				</div>
			</div>
		)
	}

	if (!auth.isAuthenticated) {
		return <LoginPage />
	}

	return (
		<div className="grid min-h-screen w-full bg-background text-foreground transition-colors duration-300 lg:grid-cols-[280px_1fr]">
			<div className="sticky top-0 z-30 hidden h-screen border-r border-border bg-card/50 backdrop-blur-xl lg:block">
				<div className="flex h-full flex-col gap-2">
					<div className="flex h-16 items-center border-b border-border/50 px-6">
						<div className="flex items-center gap-2 text-primary">
							<div className="rounded-lg bg-primary p-1.5 shadow-lg shadow-primary/20">
								<Anchor className="h-5 w-5 text-primary-foreground" />
							</div>
							<span className="text-lg font-bold tracking-tight text-foreground">Belfast</span>
						</div>
					</div>
					<div className="flex-1 overflow-auto px-4 py-6">
						<nav className="grid items-start gap-1 text-sm font-medium">
							<div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Overview
							</div>
							<SidebarItem to="/" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />

							<div className="mb-2 mt-6 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Management
							</div>
							<SidebarItem to="/players" icon={<Users className="h-4 w-4" />} label="Players" />
							<SidebarItem to="/ships" icon={<Ship className="h-4 w-4" />} label="Ship Database" />

							<div className="mb-2 mt-6 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								System
							</div>
							<SidebarItem to="/exchange-codes" icon={<Tag className="h-4 w-4" />} label="Exchange Codes" />
							<SidebarItem to="/system" icon={<Settings className="h-4 w-4" />} label="Configuration" />
						</nav>
					</div>
					<div className="mt-auto space-y-4 border-t border-border/50 bg-muted/20 p-4">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<p className="text-xs font-medium text-muted-foreground">
								Signed in as <span className="font-bold text-foreground">{auth.user?.username}</span>
							</p>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => auth.logout()}
								className="text-destructive"
							>
								<DoorOpen className="mr-2 h-4 w-4" />
								Sign out
							</Button>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-xs font-medium text-muted-foreground">Theme</span>
							<div className="flex rounded-full border border-border bg-muted p-1">
								<button
									type="button"
									onClick={() => setTheme('light')}
									className={`rounded-full p-1.5 transition-all duration-200 ${
										theme === 'light'
											? 'bg-background text-primary shadow-sm'
											: 'text-muted-foreground hover:text-foreground'
									}`}
								>
									<Sun className="h-3.5 w-3.5" />
								</button>
								<button
									type="button"
									onClick={() => setTheme('system')}
									className={`rounded-full p-1.5 transition-all duration-200 ${
										theme === 'system'
											? 'bg-background text-primary shadow-sm'
											: 'text-muted-foreground hover:text-foreground'
									}`}
								>
									<Laptop className="h-3.5 w-3.5" />
								</button>
								<button
									type="button"
									onClick={() => setTheme('dark')}
									className={`rounded-full p-1.5 transition-all duration-200 ${
										theme === 'dark'
											? 'bg-background text-primary shadow-sm'
											: 'text-muted-foreground hover:text-foreground'
									}`}
								>
									<Moon className="h-3.5 w-3.5" />
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="flex min-w-0 flex-col">
				<main className="flex flex-1 flex-col gap-6 p-4 lg:p-8 animate-fade-in">
					<Outlet />
				</main>
			</div>
		</div>
	)
}
