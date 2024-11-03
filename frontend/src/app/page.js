'use client'
import { QueryClient, QueryClientProvider } from 'react-query'
import '../styles/globals.css'

const queryClient = new QueryClient()


import Homepage from '@/components/homepage'

export default function Home({ pageProps }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Homepage {...pageProps} />
    </QueryClientProvider>
  )
}