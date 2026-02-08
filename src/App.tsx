import './App.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { AuthProvider } from './components/AuthContext'
import { PermissionsProvider } from './components/PermissionsContext'
import { ThemeProvider, useTheme } from './components/ThemeContext'
import { TooltipProvider } from './components/ui/tooltip'
import { router } from './router'

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 30,
			retry: 1,
		},
	},
})

const AppToaster = () => {
	const { theme } = useTheme()
	return <Toaster position="top-right" richColors theme={theme} closeButton />
}

const App = () => {
	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider defaultTheme="system" storageKey="belfast-admin-theme">
				<AuthProvider>
					<PermissionsProvider>
						<AppToaster />
						<TooltipProvider>
							<RouterProvider router={router} />
						</TooltipProvider>
					</PermissionsProvider>
				</AuthProvider>
			</ThemeProvider>
		</QueryClientProvider>
	)
}

export default App
