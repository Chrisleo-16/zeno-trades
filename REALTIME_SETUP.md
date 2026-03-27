# Supabase Realtime Integration - Setup Guide

## Overview
Your Zeno Trading Journal now has enhanced Supabase integration with realtime capabilities. This guide will help you set up and test the realtime functionality.

## What's Been Added

### 1. Enhanced Supabase Client (`lib/client.ts`)
- Realtime configuration with 10 events/second
- Helper functions for subscribing to trades and user updates
- Channel management utilities

### 2. Realtime Service (`lib/realtime.ts`)
- Singleton service for managing all realtime connections
- Support for trades, analytics, and presence
- Broadcast functionality for instant updates
- Automatic cleanup and connection management

### 3. React Hooks (`hooks/use-realtime.ts`)
- `useRealtimeTrades()` - Subscribe to trade changes
- `useRealtimeAnalytics()` - Subscribe to analytics updates
- `useRealtimePresence()` - Track user presence
- `useRealtimeBroadcasts()` - Send/receive broadcasts

### 4. Database Enhancements (`supabase/migrations/realtime_enhancements.sql`)
- Realtime enabled on all tables
- `user_analytics` table for calculated metrics
- Automatic analytics calculation triggers
- `user_presence` table for online status

### 5. Enhanced Store (`lib/store.ts`)
- Complete rewrite with proper TypeScript types
- localStorage fallback for offline functionality
- Ready for Supabase sync integration

## Setup Instructions

### Step 1: Run the Database Migration
```sql
-- Run this in Supabase SQL Editor
-- File: supabase/migrations/realtime_enhancements.sql
```

### Step 2: Set Environment Variables
Create `.env.local` with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### Step 3: Enable Realtime in Supabase
1. Go to Supabase Dashboard → Replication
2. Enable realtime for: `trades`, `profiles`, `strategies`, `user_analytics`, `user_presence`
3. Set RLS policies (already included in migration)

## Testing Realtime Features

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Open Two Browser Windows
- Window 1: http://localhost:3000/dashboard
- Window 2: http://localhost:3000/dashboard/journal

### 3. Test Trade Sync
1. In Window 2, add a new trade
2. In Window 1, watch the dashboard update automatically
3. Check the "Realtime sync active" indicator

### 4. Test Analytics Updates
1. Add multiple trades
2. Watch win rate and P&L update in real-time
3. Analytics should recalculate automatically

### 5. Test Presence
1. Open the app in multiple tabs
2. See connection count increase
3. Close tabs and watch count decrease

## Realtime Features Available

### ✅ Trade Synchronization
- Instant updates when trades are added/edited/deleted
- Automatic dashboard statistics refresh
- Cross-tab synchronization

### ✅ Analytics Updates
- Real-time win rate calculation
- Live P&L tracking
- Automatic performance metrics

### ✅ User Presence
- Online/offline status
- Connection count tracking
- Last seen timestamps

### ✅ Broadcast Messages
- Trade update notifications
- System announcements
- Multi-user collaboration

## Troubleshooting

### Realtime Not Connecting
1. Check environment variables
2. Verify realtime is enabled in Supabase
3. Check browser console for errors
4. Ensure RLS policies allow access

### Data Not Syncing
1. Verify database migration was applied
2. Check table replication settings
3. Test with Supabase client directly

### Performance Issues
1. Reduce events per second in client config
2. Implement proper cleanup in useEffect
3. Use debouncing for frequent updates

## Next Steps

### Production Considerations
1. Add error boundaries for realtime failures
2. Implement connection retry logic
3. Add offline detection and fallback
4. Consider WebSocket connection pooling

### Advanced Features
1. Real-time collaboration features
2. Live price feed integration
3. Push notifications for trades
4. Real-time chat/messaging

## Monitoring

### Connection Status
The dashboard shows connection status:
- 🟢 Realtime sync active
- 🟡 Using local data (fallback)

### Performance Metrics
Monitor:
- Connection establishment time
- Message latency
- Reconnection frequency
- Memory usage

## Security Notes

### RLS Policies
All realtime subscriptions respect Row Level Security:
- Users only see their own data
- No cross-user data leakage
- Proper authentication required

### Best Practices
1. Always validate data on the server
2. Use proper TypeScript types
3. Implement error handling
4. Test connection failures

---

## Quick Test Script

```javascript
// Test in browser console
const { realtimeService } = await import('./lib/realtime.js');

// Subscribe to trades
const channel = realtimeService.subscribeToTrades('user_id', {
  onInsert: (trade) => console.log('New trade:', trade),
  onUpdate: (trade) => console.log('Updated trade:', trade),
  onDelete: (trade) => console.log('Deleted trade:', trade)
});

// Test broadcast
realtimeService.broadcastTradeUpdate('user_id', {
  id: 'test',
  pair: 'EUR/USD',
  pnl: 100
});
```

Your trading journal now has enterprise-grade realtime capabilities! 🚀
