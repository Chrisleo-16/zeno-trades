import { createBrowserClient } from '@supabase/ssr'
import { RealtimeChannel } from '@supabase/supabase-js'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    }
  )
}

export function subscribeToTrades(
  userId: string,
  callback: (payload: any) => void
): RealtimeChannel {
  const supabase = createClient()
  
  const channel = supabase
    .channel(`trades_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'trades',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe()

  return channel
}

export function subscribeToUserUpdates(
  userId: string,
  callback: (payload: any) => void
): RealtimeChannel {
  const supabase = createClient()
  
  const channel = supabase
    .channel(`user_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`,
      },
      callback
    )
    .subscribe()

  return channel
}

export function unsubscribeFromChannel(channel: RealtimeChannel) {
  const supabase = createClient()
  supabase.removeChannel(channel)
}
