'use client'
import { QueryClient, QueryClientProvider } from 'react-query'

const queryClient = new QueryClient()
import Dashboard from '@/components/dashboard'

export default function DashboardPage({ pageProps }) {
    return <QueryClientProvider client={queryClient}>
        <Dashboard {...pageProps} />
    </QueryClientProvider>
}