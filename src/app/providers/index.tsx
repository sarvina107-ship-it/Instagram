// app/providers/index.tsx
// Barcha React providerlarni bir joyda yig'adi

import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Suspense } from 'react'
import { router } from '@/app/router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 daqiqa cache
      retry: 1,
    },
  },
})

// Lazy load bo'layotganda ko'rinadigan fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
  </div>
)

export const Providers = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<PageLoader />}>
        <RouterProvider router={router} />
      </Suspense>
    </QueryClientProvider>
  )
}