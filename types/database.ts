// Database type definitions for Supabase
export type Database = {
  public: {
    Tables: {
      trades: {
        Row: {
          id: string
          user_id: string
          pair: string
          type: 'buy' | 'sell'
          status: 'win' | 'loss' | 'breakeven'
          entry_price: number
          exit_price?: number
          stop_loss?: number
          take_profit?: number
          pnl?: number
          size: number
          date: string
          session: string
          emotional_state: string
          strategy?: string
          violations?: string[]
          notes?: string
          tags?: string[]
          rating?: 1 | 2 | 3 | 4 | 5
          reviewed: boolean
          commission?: number
          screenshots?: string[]
          setup_notes?: string
          review_notes?: string
          risk_amount?: number
          r_multiple?: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['trades']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['trades']['Row']>
      }
      profiles: {
        Row: {
          id: string
          email: string
          name?: string
          trading_style?: string
          experience_level?: string
          account_size?: number
          goal?: string
          preferences?: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      user_analytics: {
        Row: {
          id: string
          user_id: string
          total_trades: number
          win_rate: number
          total_pnl: number
          max_drawdown: number
          current_drawdown: number
          consecutive_wins: number
          consecutive_losses: number
          avg_win: number
          avg_loss: number
          profit_factor: number
          sharpe_ratio?: number
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_analytics']['Row'], 'id' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_analytics']['Row']>
      }
      strategies: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string
          rules: string[]
          risk_level: 'low' | 'medium' | 'high'
          confidence: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['strategies']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['strategies']['Row']>
      }
    }
    Functions: {
      calculate_analytics: {
        Args: {
          user_id: string
        }
        Returns: Database['public']['Tables']['user_analytics']['Row']
      }
    }
    Views: {
      trade_summary: {
        Row: {
          user_id: string
          total_trades: number
          wins: number
          losses: number
          win_rate: number
          total_pnl: number
          avg_pnl: number
        }
      }
    }
  }
}
