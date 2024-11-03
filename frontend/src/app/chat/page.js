'use client'
import { Suspense, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ConversationUI } from '@/components/conversation'
import { useRouter, useSearchParams } from 'next/navigation';

const queryClient = new QueryClient()

function DashboardContent({ pageProps }) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const team_id = searchParams.get('team_id')

    useEffect(() => {
        if (!team_id) {
            router.push('/404')
        }
    }, [team_id, router])

    if (!team_id) {
        return null // Return null while redirecting or if team_id is not set
    }

    return <ConversationUI {...pageProps} team_id={team_id} />
}

export default function DashboardPage({ pageProps }) {
    return (
        <QueryClientProvider client={queryClient}>
            <Suspense fallback={<div>Loading...</div>}>
                <DashboardContent pageProps={pageProps} />
            </Suspense>
        </QueryClientProvider>
    )
}