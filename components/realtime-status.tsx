import { useEffect, useState } from 'react'
import { realtimeService } from '@/lib/realtime'
import { createClient } from '@/lib/client'

export function useRealtimePresenceIndicator() {
  const [isOnline, setIsOnline] = useState(false)
  const [connectionCount, setConnectionCount] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let channel: any = null

    const setupPresence = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      channel = realtimeService.subscribeToPresence(user.id, {
        onJoin: (payload) => {
          setIsOnline(true)
          setLastUpdate(new Date())
        },
        onLeave: (payload) => {
          setIsOnline(false)
        },
        onSync: (presences) => {
          setConnectionCount(presences.length)
        }
      })
    }

    setupPresence()

    return () => {
      if (channel) {
        realtimeService.unsubscribe(`presence_${channel}`)
      }
    }
  }, [])

  return { isOnline, connectionCount, lastUpdate }
}

export function RealtimeStatusIndicator() {
  const { isOnline, connectionCount } = useRealtimePresenceIndicator()

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
      <span className="text-white/50">
        {isOnline ? 'Realtime active' : 'Offline mode'}
      </span>
      {connectionCount > 0 && (
        <span className="text-white/30">
          ({connectionCount} connected)
        </span>
      )}
    </div>
  )
}
