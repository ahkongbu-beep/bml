// @/libs/providers/QueryProvider.tsx
"use client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactNode, useState } from "react"

export default function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1분간 데이터를 fresh로 유지
            gcTime: 5 * 60 * 1000, // 5분간 캐시 유지
            refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 갱신 비활성화
            retry: 1, // 실패 시 1번 재시도
          },
        },
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
