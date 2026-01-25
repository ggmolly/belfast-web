import './App.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { ThemeProvider } from './components/ThemeContext'
import { router } from './router'

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 30,
			retry: 1,
		},
	},
})

const App = () => {
	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider defaultTheme="system" storageKey="belfast-admin-theme">
				<RouterProvider router={router} />
			</ThemeProvider>
		</QueryClientProvider>
	)
}

export default App
