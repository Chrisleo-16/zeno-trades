import { useEffect, useRef, useState } from 'react'
import { realtimeService } from '@/lib/realtime'

export function useRealtimeTrades(userId: string) {
  const [trades, setTrades] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!userId) return

    channelRef.current = realtimeService.subscribeToTrades(userId, {
      onInsert: (newTrade) => {
        setTrades(prev => [...prev, newTrade])
      },
      onUpdate: (updatedTrade) => {
        setTrades(prev => prev.map(trade => 
          trade.id === updatedTrade.id ? updatedTrade : trade
        ))
      },
      onDelete: (deletedTrade) => {
        setTrades(prev => prev.filter(trade => trade.id !== deletedTrade.id))
      }
    })

    setIsConnected(true)

    return () => {
      if (channelRef.current) {
        realtimeService.unsubscribe(`trades_${userId}`)
      }
    }
  }, [userId])

  return { trades, isConnected }
}

export function useRealtimeAnalytics(userId: string) {
  const [analytics, setAnalytics] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!userId) return

    channelRef.current = realtimeService.subscribeToAnalytics(userId, (newAnalytics) => {
      setAnalytics(newAnalytics)
    })

    setIsConnected(true)

    return () => {
      if (channelRef.current) {
        realtimeService.unsubscribe(`analytics_${userId}`)
      }
    }
  }, [userId])

  return { analytics, isConnected }
}

export function useRealtimePresence(userId: string) {
  const [presences, setPresences] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!userId) return

    channelRef.current = realtimeService.subscribeToPresence(userId, {
      onJoin: (payload) => {
        console.log('User joined:', payload)
      },
      onLeave: (payload) => {
        console.log('User left:', payload)
      },
      onSync: (syncedPresences) => {
        setPresences(syncedPresences)
      }
    })

    setIsConnected(true)

    return () => {
      if (channelRef.current) {
        realtimeService.unsubscribe(`presence_${userId}`)
      }
    }
  }, [userId])

  return { presences, isConnected }
}

export function useRealtimeBroadcasts(userId: string) {
  const [broadcasts, setBroadcasts] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!userId) return

    channelRef.current = realtimeService.subscribeToTradeBroadcasts(userId, (payload) => {
      setBroadcasts(prev => [...prev, payload])
    })

    setIsConnected(true)

    return () => {
      if (channelRef.current) {
        realtimeService.unsubscribe(`trades_broadcast_${userId}`)
      }
    }
  }, [userId])

  const broadcastTradeUpdate = (trade: any) => {
    return realtimeService.broadcastTradeUpdate(userId, trade)
  }

  return { broadcasts, isConnected, broadcastTradeUpdate }
}
