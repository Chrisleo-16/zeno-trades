import { createClient } from './client'
import type { Database } from '@/types/database'

export class RealtimeService {
  private static instance: RealtimeService
  private channels: Map<string, any> = new Map()
  private supabase = createClient()

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService()
    }
    return RealtimeService.instance
  }

  subscribeToTrades(
    userId: string,
    callbacks: {
      onInsert?: (trade: any) => void
      onUpdate?: (trade: any) => void
      onDelete?: (trade: any) => void
    }
  ) {
    const channelName = `trades_${userId}`
    
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName)
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trades',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => callbacks.onInsert?.(payload.new)
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trades',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => callbacks.onUpdate?.(payload.new)
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'trades',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => callbacks.onDelete?.(payload.old)
      )
      .subscribe()

    this.channels.set(channelName, channel)
    return channel
  }

  subscribeToAnalytics(
    userId: string,
    callback: (analytics: any) => void
  ) {
    const channelName = `analytics_${userId}`
    
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName)
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_analytics',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => callback(payload.new || payload.old)
      )
      .subscribe()

    this.channels.set(channelName, channel)
    return channel
  }

  subscribeToPresence(
    userId: string,
    callbacks: {
      onJoin?: (presence: any) => void
      onLeave?: (presence: any) => void
      onSync?: (presences: any[]) => void
    }
  ) {
    const channelName = `presence_${userId}`
    
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName)
    }

    const channel = this.supabase
      .channel(channelName)
      .on('presence', { event: 'join' }, (payload) => {
        callbacks.onJoin?.(payload)
      })
      .on('presence', { event: 'leave' }, (payload) => {
        callbacks.onLeave?.(payload)
      })
      .on('presence', { event: 'sync' }, () => {
        callbacks.onSync?.(Object.values(channel.presenceState()))
      })
      .subscribe()

    // Track user presence
    channel.track({
      user_id: userId,
      online_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
    })

    this.channels.set(channelName, channel)
    return channel
  }

  broadcastTradeUpdate(userId: string, trade: any) {
    const channelName = `trades_broadcast_${userId}`
    const channel = this.supabase.channel(channelName)
    
    return channel.send({
      type: 'broadcast',
      event: 'trade_update',
      payload: { trade, timestamp: new Date().toISOString() }
    })
  }

  subscribeToTradeBroadcasts(
    userId: string,
    callback: (payload: any) => void
  ) {
    const channelName = `trades_broadcast_${userId}`
    
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName)
    }

    const channel = this.supabase
      .channel(channelName)
      .on('broadcast', { event: 'trade_update' }, callback)
      .subscribe()

    this.channels.set(channelName, channel)
    return channel
  }

  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName)
    if (channel) {
      this.supabase.removeChannel(channel)
      this.channels.delete(channelName)
    }
  }

  unsubscribeAll() {
    this.channels.forEach((channel, name) => {
      this.supabase.removeChannel(channel)
    })
    this.channels.clear()
  }

  getChannelStatus(channelName: string): string | null {
    const channel = this.channels.get(channelName)
    return channel ? channel.status : null
  }

  getAllChannels(): string[] {
    return Array.from(this.channels.keys())
  }
}

export const realtimeService = RealtimeService.getInstance()
