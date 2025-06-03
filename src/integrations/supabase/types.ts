export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          sport_key?: string
          sport_title?: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
