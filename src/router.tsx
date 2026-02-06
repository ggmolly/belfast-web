import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { Layout } from './components/Layout'
import { AccessControlPage } from './pages/AccessControl'
import { DashboardPage } from './pages/Dashboard'
import { ExchangeCodesPage } from './pages/ExchangeCodes'
import { MyAccessPage } from './pages/MyAccess'
import { PlayerDetailPage } from './pages/PlayerDetail'
import { PlayersPage } from './pages/Players'
import { RegisterPage } from './pages/Register'
import { SecurityPage } from './pages/Security'
import { ShipDatabasePage } from './pages/ShipDatabase'
import { SystemPage } from './pages/System'

const rootRoute = createRootRoute({
	component: Layout,
})

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/',
	component: DashboardPage,
})

const playersRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/players',
	component: PlayersPage,
})

const playerDetailRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/players/$playerId',
	component: PlayerDetailPage,
})

const shipsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/ships',
	component: ShipDatabasePage,
})

const myAccessRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/me',
	component: MyAccessPage,
})

const accessControlRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/access',
	component: AccessControlPage,
})

const exchangeCodesRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/exchange-codes',
	component: ExchangeCodesPage,
})

const systemRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/system',
	component: SystemPage,
})

const securityRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/security',
	component: SecurityPage,
})

const registerRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/register',
	component: RegisterPage,
})

const routeTree = rootRoute.addChildren([
	indexRoute,
	myAccessRoute,
	playersRoute,
	playerDetailRoute,
	shipsRoute,
	exchangeCodesRoute,
	systemRoute,
	securityRoute,
	accessControlRoute,
	registerRoute,
])

export const router = createRouter({
	routeTree,
	defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}
