export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      api_request_log: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          remaining_quota: number | null
          request_count: number
          timestamp: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          remaining_quota?: number | null
          request_count?: number
          timestamp?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          remaining_quota?: number | null
          request_count?: number
          timestamp?: string
        }
        Relationships: []
      }
      arbitrage_opportunities: {
        Row: {
          arb_percent: number
          bookmaker_a_id: string | null
          bookmaker_b_id: string | null
          created_at: string
          event_id: string | null
          id: string
          is_cross_market: boolean | null
          is_live: boolean | null
          market_display_name: string | null
          market_key: string | null
          market_line: number | null
          opportunity_type: string | null
          outcomes: Json | null
          profit_margin: number
          team_a_bookmaker: string
          team_a_odds: number
          team_b_bookmaker: string
          team_b_odds: number
          updated_at: string
        }
        Insert: {
          arb_percent: number
          bookmaker_a_id?: string | null
          bookmaker_b_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          is_cross_market?: boolean | null
          is_live?: boolean | null
          market_display_name?: string | null
          market_key?: string | null
          market_line?: number | null
          opportunity_type?: string | null
          outcomes?: Json | null
          profit_margin: number
          team_a_bookmaker: string
          team_a_odds: number
          team_b_bookmaker: string
          team_b_odds: number
          updated_at?: string
        }
        Update: {
          arb_percent?: number
          bookmaker_a_id?: string | null
          bookmaker_b_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          is_cross_market?: boolean | null
          is_live?: boolean | null
          market_display_name?: string | null
          market_key?: string | null
          market_line?: number | null
          opportunity_type?: string | null
          outcomes?: Json | null
          profit_margin?: number
          team_a_bookmaker?: string
          team_a_odds?: number
          team_b_bookmaker?: string
          team_b_odds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "arbitrage_opportunities_bookmaker_a_id_fkey"
            columns: ["bookmaker_a_id"]
            isOneToOne: false
            referencedRelation: "bookmakers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arbitrage_opportunities_bookmaker_b_id_fkey"
            columns: ["bookmaker_b_id"]
            isOneToOne: false
            referencedRelation: "bookmakers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arbitrage_opportunities_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmakers: {
        Row: {
          created_at: string
          id: string
          key: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      config: {
        Row: {
          created_at: string
          description: string | null
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          away_team: string
          commence_time: string
          created_at: string
          event_key: string
          home_team: string
          id: string
          is_live: boolean | null
          live_score: Json | null
          match_time: number | null
          sport_key: string
          sport_title: string
          updated_at: string
        }
        Insert: {
          away_team: string
          commence_time: string
          created_at?: string
          event_key: string
          home_team: string
          id?: string
          is_live?: boolean | null
          live_score?: Json | null
          match_time?: number | null
          sport_key: string
          sport_title: string
          updated_at?: string
        }
        Update: {
          away_team?: string
          commence_time?: string
          created_at?: string
          event_key?: string
          home_team?: string
          id?: string
          is_live?: boolean | null
          live_score?: Json | null
          match_time?: number | null
          sport_key?: string
          sport_title?: string
          updated_at?: string
        }
        Relationships: []
      }
      market_odds: {
        Row: {
          bookmaker_id: string | null
          created_at: string
          event_id: string | null
          id: string
          is_live: boolean | null
          last_update: string
          market_key: string
          market_line: number | null
          odds_movement: string | null
          outcomes: Json
        }
        Insert: {
          bookmaker_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          is_live?: boolean | null
          last_update?: string
          market_key: string
          market_line?: number | null
          odds_movement?: string | null
          outcomes: Json
        }
        Update: {
          bookmaker_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          is_live?: boolean | null
          last_update?: string
          market_key?: string
          market_line?: number | null
          odds_movement?: string | null
          outcomes?: Json
        }
        Relationships: [
          {
            foreignKeyName: "market_odds_bookmaker_id_fkey"
            columns: ["bookmaker_id"]
            isOneToOne: false
            referencedRelation: "bookmakers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_odds_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      markets: {
        Row: {
          applicable_sports: string[] | null
          created_at: string
          description: string | null
          display_name: string
          id: string
          market_key: string
          market_type: string
          typical_outcomes: Json | null
          updated_at: string
        }
        Insert: {
          applicable_sports?: string[] | null
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          market_key: string
          market_type: string
          typical_outcomes?: Json | null
          updated_at?: string
        }
        Update: {
          applicable_sports?: string[] | null
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          market_key?: string
          market_type?: string
          typical_outcomes?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      odds: {
        Row: {
          bookmaker_id: string | null
          created_at: string
          event_id: string | null
          id: string
          last_update: string
          market_key: string
          outcome_name: string
          outcome_price: number
        }
        Insert: {
          bookmaker_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          last_update: string
          market_key?: string
          outcome_name: string
          outcome_price: number
        }
        Update: {
          bookmaker_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          last_update?: string
          market_key?: string
          outcome_name?: string
          outcome_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "odds_bookmaker_id_fkey"
            columns: ["bookmaker_id"]
            isOneToOne: false
            referencedRelation: "bookmakers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odds_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
