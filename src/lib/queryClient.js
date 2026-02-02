import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minuuttia - data pysyy "tuoreena"
      gcTime: 1000 * 60 * 30, // 30 minuuttia - säilytetään cachessa (aiemmin cacheTime)
      refetchOnWindowFocus: false, // Ei uudelleenhakua kun ikkuna saa fokuksen
      refetchOnReconnect: true, // Haetaan uudelleen kun netti palaa
      retry: 1, // Yksi uudelleenyritys virhetilanteessa
    },
  },
})
