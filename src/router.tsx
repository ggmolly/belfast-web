import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { Layout } from './components/Layout'
import { DashboardPage } from './pages/Dashboard'
import { ExchangeCodesPage } from './pages/ExchangeCodes'
import { PlayerDetailPage } from './pages/PlayerDetail'
import { PlayersPage } from './pages/Players'
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

const routeTree = rootRoute.addChildren([
	indexRoute,
	playersRoute,
	playerDetailRoute,
	shipsRoute,
	exchangeCodesRoute,
	systemRoute,
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
