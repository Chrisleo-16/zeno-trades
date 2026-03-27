-- =====================================================
-- ZENO TRADING JOURNAL DATABASE SCHEMA
-- =====================================================
-- Complete database schema for ZENO trading journal system
-- Supports trades, analytics, strategies, learning modules, and user profiles
-- Includes RLS policies, triggers, and realtime functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (extends profiles with additional trading-specific fields)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    trading_style TEXT,
    experience TEXT,
    risk_tolerance TEXT,
    preferred_session TEXT DEFAULT 'london',
    target_account DECIMAL(12,2) DEFAULT 10000,
    starting_balance DECIMAL(12,2) DEFAULT 10000,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strategies table
CREATE TABLE IF NOT EXISTS public.strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    rules TEXT[],
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 100),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning modules table
CREATE TABLE IF NOT EXISTS public.learning_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('psychology', 'strategy', 'risk', 'technical')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    duration INTEGER DEFAULT 30,
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    prerequisites TEXT[],
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Module completions table
CREATE TABLE IF NOT EXISTS public.module_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced trades table
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    strategy_id UUID REFERENCES public.strategies(id) ON DELETE SET NULL,
    pair TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('buy', 'sell', 'long', 'short')),
    status TEXT NOT NULL CHECK (status IN ('win', 'loss', 'breakeven', 'pending', 'open')),
    entry_price DECIMAL(10,4) NOT NULL,
    entry_price_legacy DECIMAL(10,4), -- Legacy support
    exit_price DECIMAL(10,4),
    exit_price_legacy DECIMAL(10,4), -- Legacy support
    stop_loss DECIMAL(10,4),
    take_profit DECIMAL(10,4),
    pnl DECIMAL(10,4),
    size DECIMAL(10,4) NOT NULL,
    date DATE NOT NULL,
    session TEXT NOT NULL,
    entry_time TIME,
    emotional_state TEXT NOT NULL,
    violations TEXT[],
    notes TEXT,
    tags TEXT[],
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    reviewed BOOLEAN DEFAULT false,
    commission DECIMAL(10,4),
    screenshots TEXT[],
    setup_notes TEXT,
    review_notes TEXT,
    risk_amount DECIMAL(10,4),
    r_multiple DECIMAL(5,2),
    r_multiple_legacy DECIMAL(5,2), -- Legacy support
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trade tags table
CREATE TABLE IF NOT EXISTS public.trade_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('setup', 'mistake', 'custom')),
    color TEXT NOT NULL DEFAULT '#00ff87',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User analytics table
CREATE TABLE IF NOT EXISTS public.user_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    total_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    total_pnl DECIMAL(12,2) DEFAULT 0,
    max_drawdown DECIMAL(12,2) DEFAULT 0,
    current_drawdown DECIMAL(12,2) DEFAULT 0,
    consecutive_wins INTEGER DEFAULT 0,
    consecutive_losses INTEGER DEFAULT 0,
    avg_win DECIMAL(10,4) DEFAULT 0,
    avg_loss DECIMAL(10,4) DEFAULT 0,
    profit_factor DECIMAL(5,2) DEFAULT 0,
    sharpe_ratio DECIMAL(8,4),
    largest_win DECIMAL(12,2),
    largest_loss DECIMAL(12,2),
    max_drawdown_dollar DECIMAL(12,2),
    max_drawdown_percent DECIMAL(5,2),
    max_drawdown_date DATE,
    max_consecutive_losses INTEGER DEFAULT 0,
    current_consecutive_losses INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User presence table (for realtime features)
CREATE TABLE IF NOT EXISTS public.user_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('online', 'away', 'offline')),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Playbook rules table
CREATE TABLE IF NOT EXISTS public.playbook_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
    active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI conversations table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    conversation_type TEXT CHECK (conversation_type IN ('analysis', 'strategy', 'psychology', 'risk')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Trade performance indexes
CREATE INDEX IF NOT EXISTS idx_trades_user_date ON public.trades(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_trades_user_status ON public.trades(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trades_user_pair ON public.trades(user_id, pair);
CREATE INDEX IF NOT EXISTS idx_trades_date ON public.trades(date DESC);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.trades(status);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON public.user_analytics(user_id);

-- Strategy indexes
CREATE INDEX IF NOT EXISTS idx_strategies_user_id ON public.strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_strategies_active ON public.strategies(active);

-- Learning module indexes
CREATE INDEX IF NOT EXISTS idx_learning_modules_type ON public.learning_modules(type);
CREATE INDEX IF NOT EXISTS idx_module_completions_user_id ON public.module_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_module_completions_module_id ON public.module_completions(module_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can view all learning modules (public content)
CREATE POLICY "Users can view all learning modules" ON public.learning_modules FOR SELECT USING (auth.role() = 'authenticated');

-- Users can manage their own module completions
CREATE POLICY "Users can manage own completions" ON public.module_completions FOR ALL USING (auth.uid() = id);

-- Users can view all playbook rules
CREATE POLICY "Users can view all playbook rules" ON public.playbook_rules FOR SELECT USING (auth.role() = 'authenticated');

-- Users can manage their own playbook rules
CREATE POLICY "Users can manage own playbook rules" ON public.playbook_rules FOR ALL USING (auth.uid() = id);

-- Users can view their own AI conversations
CREATE POLICY "Users can view own AI conversations" ON public.ai_conversations FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can manage own AI conversations" ON public.ai_conversations FOR ALL USING (auth.uid() = id);

-- Trade-specific policies
CREATE POLICY "Users can view own trades" ON public.trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trades" ON public.trades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trades" ON public.trades FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trades" ON public.trades FOR DELETE USING (auth.uid() = user_id);

-- Strategy-specific policies
CREATE POLICY "Users can view own strategies" ON public.strategies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own strategies" ON public.strategies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own strategies" ON public.strategies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own strategies" ON public.strategies FOR DELETE USING (auth.uid() = user_id);

-- Analytics policies (users can view their own analytics)
CREATE POLICY "Users can view own analytics" ON public.user_analytics FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to update user analytics after trade changes
CREATE OR REPLACE FUNCTION public.update_user_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total trades and basic metrics
    UPDATE public.user_analytics SET
        total_trades = (
            SELECT COUNT(*) FROM public.trades 
            WHERE user_id = NEW.user_id
        ),
        total_pnl = COALESCE(
            SELECT SUM(pnl) FROM public.trades 
            WHERE user_id = NEW.user_id, 
            0
        ),
        win_rate = CASE 
            WHEN (
                SELECT COUNT(*) FROM public.trades 
                WHERE user_id = NEW.user_id AND status IN ('win', 'loss')
            ) = 0 THEN 0
            ELSE (
                SELECT ROUND(
                    (COUNT(*) FILTER (WHERE status = 'win'))::DECIMAL * 100 / 
                    COUNT(*)::DECIMAL
                )::DECIMAL, 2
                ) FROM public.trades 
                WHERE user_id = NEW.user_id AND status IN ('win', 'loss')
            )
        END,
        -- Update consecutive wins/losses
        consecutive_wins = CASE 
            WHEN (
                SELECT COUNT(*) FROM public.trades 
                WHERE user_id = NEW.user_id AND status = 'win'
            ) = 0 THEN 0
            ELSE (
                WITH wins AS (
                    SELECT 
                        COUNT(*) as win_count,
                        MAX(created_at) as last_win_date,
                        LAG(created_at) OVER (
                            PARTITION BY user_id 
                            ORDER BY created_at DESC
                        ) as prev_win_date
                    FROM public.trades 
                    WHERE user_id = NEW.user_id AND status = 'win'
                ),
                losses AS (
                    SELECT 
                        COUNT(*) as loss_count,
                        MAX(created_at) as last_loss_date,
                        LAG(created_at) OVER (
                            PARTITION BY user_id 
                            ORDER BY created_at DESC
                        ) as prev_loss_date
                    FROM public.trades 
                    WHERE user_id = NEW.user_id AND status = 'loss'
                )
                SELECT 
                    CASE 
                        WHEN wins.last_win_date > losses.last_loss_date THEN wins.win_count
                        ELSE 0
                    END
                FROM wins, losses
            )
        END,
        -- Update consecutive losses
        consecutive_losses = CASE 
            WHEN (
                SELECT COUNT(*) FROM public.trades 
                WHERE user_id = NEW.user_id AND status = 'win'
            ) = 0 THEN 0
            ELSE (
                WITH wins AS (
                    SELECT 
                        COUNT(*) as win_count,
                        MAX(created_at) as last_win_date,
                        LAG(created_at) OVER (
                            PARTITION BY user_id 
                            ORDER BY created_at DESC
                        ) as prev_win_date
                    FROM public.trades 
                    WHERE user_id = NEW.user_id AND status = 'win'
                ),
                losses AS (
                    SELECT 
                        COUNT(*) as loss_count,
                        MAX(created_at) as last_loss_date,
                        LAG(created_at) OVER (
                            PARTITION BY user_id 
                            ORDER BY created_at DESC
                        ) as prev_loss_date
                    FROM public.trades 
                    WHERE user_id = NEW.user_id AND status = 'loss'
                )
                SELECT 
                    CASE 
                        WHEN losses.last_loss_date > wins.last_win_date THEN losses.loss_count
                        ELSE 0
                    END
                FROM wins, losses
            )
        END,
        -- Update drawdown metrics
        max_drawdown = COALESCE(
            SELECT GREATEST(
                0, 
                (SELECT MAX(peak - running_total) FROM (
                    SELECT 
                        created_at,
                        pnl,
                        SUM(pnl) OVER (PARTITION BY user_id ORDER BY created_at) as running_total,
                        SUM(pnl) OVER (PARTITION BY user_id ORDER BY created_at) as peak
                    FROM public.trades 
                    WHERE user_id = NEW.user_id
                ) subquery
            ), 0
        ),
        current_drawdown = COALESCE(
            SELECT 
                GREATEST(0, peak - running_total) 
            FROM (
                    SELECT 
                        created_at,
                        pnl,
                        SUM(pnl) OVER (PARTITION BY user_id ORDER BY created_at) as running_total,
                        SUM(pnl) OVER (PARTITION BY user_id ORDER BY created_at) as peak
                    FROM public.trades 
                    WHERE user_id = NEW.user_id
                ) subquery
            )
        ),
        -- Update largest win/loss
        largest_win = COALESCE(
            SELECT MAX(pnl) FROM public.trades 
            WHERE user_id = NEW.user_id AND status = 'win' AND pnl > 0
        ),
        largest_loss = COALESCE(
            SELECT MIN(pnl) FROM public.trades 
            WHERE user_id = NEW.user_id AND status = 'loss' AND pnl < 0
        ),
        max_drawdown_dollar = COALESCE(
            SELECT max_drawdown FROM public.user_analytics 
            WHERE user_id = NEW.user_id
        ),
        max_drawdown_percent = CASE 
            WHEN starting_balance > 0 THEN 
                ROUND((max_drawdown_dollar / starting_balance * 100), 2)
            ELSE 0
        END,
        max_drawdown_date = (
            SELECT created_at FROM public.user_analytics 
            WHERE user_id = NEW.user_id AND max_drawdown = (
                SELECT MAX(max_drawdown) FROM public.user_analytics 
                WHERE user_id = NEW.user_id
            )
        ),
        max_consecutive_losses = COALESCE(consecutive_losses, 0),
        current_consecutive_losses = (
            SELECT COUNT(*) FROM public.trades 
            WHERE user_id = NEW.user_id AND status = 'loss' 
            AND created_at > (
                SELECT MAX(created_at) FROM public.trades 
                WHERE user_id = NEW.user_id AND status = 'win'
            )
        ),
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic analytics updates
CREATE TRIGGER update_analytics_after_trade_insert
    AFTER INSERT ON public.trades
    FOR EACH ROW EXECUTE FUNCTION public.update_user_analytics();

CREATE TRIGGER update_analytics_after_trade_update
    AFTER UPDATE ON public.trades
    FOR EACH ROW EXECUTE FUNCTION public.update_user_analytics();

CREATE TRIGGER update_analytics_after_trade_delete
    AFTER DELETE ON public.trades
    FOR EACH ROW EXECUTE FUNCTION public.update_user_analytics();

-- Function to update user presence
CREATE OR REPLACE FUNCTION public.update_user_presence()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.user_presence SET 
        last_seen = NOW(),
        status = 'online',
        session_info = jsonb_build_object(
            'client_ip', client_addr(),
            'user_agent', current_setting('request_headers'),
            'session_id', session_id
        )
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create presence trigger
CREATE TRIGGER update_user_presence_trigger
    AFTER INSERT OR UPDATE ON public.trades
    FOR EACH ROW EXECUTE FUNCTION public.update_user_presence();

-- =====================================================
-- REALTIME CONFIGURATION
-- =====================================================

-- Enable realtime for all tables
ALTER PUBLICATION public;
ALTER PUBLICATION public SET (publish = 'insert, update, delete');

-- Configure realtime for specific tables
ALTER PUBLICATION public ADD TABLE trades;
ALTER PUBLICATION public ADD TABLE strategies;
ALTER PUBLICATION public ADD TABLE user_analytics;
ALTER PUBLICATION public ADD TABLE user_presence;
ALTER PUBLICATION public ADD TABLE learning_modules;
ALTER PUBLICATION public ADD TABLE module_completions;
ALTER PUBLICATION public ADD TABLE playbook_rules;
ALTER PUBLICATION public ADD TABLE ai_conversations;

-- =====================================================
-- SAMPLE DATA INSERTS
-- =====================================================

-- Insert sample learning modules
INSERT INTO public.learning_modules (id, type, title, description, content, duration, difficulty, prerequisites, tags) VALUES
    (gen_random_uuid(), 'psychology', 'Trading Psychology 101', 'Master the psychological aspects of trading. Learn how to identify and control emotional trading patterns.', '# Trading Psychology 101

## The Emotional Trading Trap

Most traders lose money not because of bad strategies, but because of emotional decisions.

### Key Concepts:
1. **Fear & Greed Cycle**: Understand how fear and greed drive market emotions
2. **Position Sizing Psychology**: How position size affects your emotional control
3. **Breakeven Trades**: Why we hold breakeven trades (losing money)
4. **Revenge Trading**: The biggest account killer - revenge trading after losses
5. **Confirmation Bias**: How we see what we want to see in charts

### Actionable Insights:
- Rate your emotional state honestly before each trade
- If you are not calm, step away. Your best trades come from clarity, not urgency
- Implement a hard rule: stop trading for the day after 2 consecutive losses
- Use position sizing based on your emotional state', 30, 'beginner', ARRAY['emotion_control', 'risk_management']),
    (gen_random_uuid(), 'strategy', 'Supply & Demand Trading', 'Master advanced supply and demand trading concepts including market structure analysis, support/resistance levels, and multi-timeframe analysis.', '# Supply & Demand Trading

Learn to identify institutional order flow, liquidity zones, and smart money concepts. Perfect for experienced traders looking to level up their analysis.', 60, 'advanced', ARRAY['technical_analysis', 'market_structure']),
    (gen_random_uuid(), 'risk', 'Advanced Risk Management', 'Comprehensive guide to position sizing, portfolio risk, and advanced risk-reward techniques.', '# Advanced Risk Management

Master portfolio management techniques, correlation analysis, and risk-adjusted returns. Essential for traders managing multiple positions or larger accounts.', 45, 'advanced', ARRAY['portfolio_management', 'technical_analysis']),
    (gen_random_uuid(), 'technical', 'Technical Analysis Masterclass', 'Complete technical analysis toolkit including chart patterns, indicators, and trading systems.', '# Technical Analysis Masterclass

From basic candlestick patterns to advanced charting techniques. Learn to read market structure like a professional chart analyst.', 90, 'advanced', ARRAY['technical_analysis', 'chart_patterns']);

-- Insert sample playbook rules
INSERT INTO public.playbook_rules (id, user_id, title, description, conditions, actions, risk_level, active, priority) VALUES
    (gen_random_uuid(), auth.uid(), 'Morning Momentum Rule', 'Only trade momentum stocks in first 2 hours', '{"time": "09:30-11:30", "session": "london"}', '{"entry": {"rsi_above_50": true, "volume_spike": true}}', 'low', true, 1),
    (gen_random_uuid(), auth.uid(), 'London Breakout Strategy', 'Trade London session breakouts with volume confirmation', '{"session": "london", "time": "08:00-09:00"}', 'medium', true, 2),
    (gen_random_uuid(), auth.uid(), 'FOMO Protection', 'Never chase price after missing entry', '{"missed_entry": false, "max_wait_time": "15min"}', 'high', true, 3);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for trade performance summary
CREATE OR REPLACE VIEW public.trade_summary AS
SELECT 
    u.email as user_email,
    u.name as user_name,
    COUNT(t.id) as total_trades,
    COUNT(t.id) FILTER (WHERE t.status = 'win') as winning_trades,
    ROUND(AVG(t.size), 2) as avg_position_size,
    SUM(t.pnl) as total_pnl,
    ROUND(AVG(t.risk_amount), 2) as avg_risk_per_trade,
    MAX(t.pnl) as largest_win,
    MIN(t.pnl) as largest_loss,
    ROUND(
        (COUNT(t.id) FILTER (WHERE t.status = 'win'))::DECIMAL * 100 / 
        COUNT(t.id), 2
    )::DECIMAL, 2) as win_rate_percentage
FROM public.users u
LEFT JOIN public.trades t ON u.id = t.user_id
GROUP BY u.id, u.email, u.name;

-- View for learning progress
CREATE OR REPLACE VIEW public.learning_progress AS
SELECT 
    u.email as user_email,
    u.name as user_name,
    COUNT(mc.id) as completed_modules,
    AVG(mc.score) as avg_score,
    MAX(mc.completed_at) as last_completion_date
FROM public.users u
LEFT JOIN public.module_completions mc ON u.id = mc.user_id
GROUP BY u.id, u.email, u.name;

-- =====================================================
-- PERFORMANCE OPTIMIZATION NOTES
-- =====================================================

-- Consider adding partitioning for large trade datasets
-- CREATE TABLE public.trades_y2026 PARTITION OF public.trades FOR VALUES FROM '2026-01-01' TO '2026-12-31';
-- CREATE TABLE public.trades_y2027 PARTITION OF public.trades FOR VALUES FROM '2027-01-01' TO '2027-12-31';

-- Consider adding materialized views for frequently accessed data
-- CREATE MATERIALIZED VIEW public.trade_stats_materialized AS
-- SELECT user_id, date, COUNT(*), SUM(pnl), AVG(pnl) 
-- FROM public.trades 
-- GROUP BY user_id, date;

-- =====================================================
-- SECURITY CONSIDERATIONS
-- =====================================================

-- Add audit columns for tracking data changes
ALTER TABLE public.trades ADD COLUMN created_by UUID REFERENCES public.users(id);
ALTER TABLE public.trades ADD COLUMN updated_by UUID REFERENCES public.users(id);
ALTER TABLE public.strategies ADD COLUMN created_by UUID REFERENCES public.users(id);
ALTER TABLE public.strategies ADD COLUMN updated_by UUID REFERENCES public.users(id);

-- Add row-level security for audit columns
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trades audit policy" ON public.trades FOR ALL TO admin;

-- Consider adding encryption for sensitive data
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- ALTER TABLE public.users ADD COLUMN encrypted_data BYTEA;
