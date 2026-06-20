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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      astrologers: {
        Row: {
          avatar_emoji: string
          avatar_gradient: string
          bio: string | null
          created_at: string
          display_name: string
          experience_years: number
          free_minutes: number
          id: string
          is_active: boolean
          is_recommended: boolean
          languages: string[]
          primary_system: string
          priority: number
          rate_paise_per_min: number
          rating: number
          reviews_count: number
          skill_level: number
          slug: string
          specialties: string[]
          system_prompt: string
          systems: string[]
          tagline: string | null
          visible: boolean
        }
        Insert: {
          avatar_emoji?: string
          avatar_gradient?: string
          bio?: string | null
          created_at?: string
          display_name: string
          experience_years?: number
          free_minutes?: number
          id?: string
          is_active?: boolean
          is_recommended?: boolean
          languages?: string[]
          primary_system: string
          priority?: number
          rate_paise_per_min?: number
          rating?: number
          reviews_count?: number
          skill_level?: number
          slug: string
          specialties?: string[]
          system_prompt: string
          systems?: string[]
          tagline?: string | null
          visible?: boolean
        }
        Update: {
          avatar_emoji?: string
          avatar_gradient?: string
          bio?: string | null
          created_at?: string
          display_name?: string
          experience_years?: number
          free_minutes?: number
          id?: string
          is_active?: boolean
          is_recommended?: boolean
          languages?: string[]
          primary_system?: string
          priority?: number
          rate_paise_per_min?: number
          rating?: number
          reviews_count?: number
          skill_level?: number
          slug?: string
          specialties?: string[]
          system_prompt?: string
          systems?: string[]
          tagline?: string | null
          visible?: boolean
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          parts: Json
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parts: Json
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parts?: Json
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          astrologer_id: string
          created_at: string
          free_consumed: boolean
          free_started_at: string | null
          id: string
          last_message_at: string | null
          message_count: number
          title: string | null
          user_id: string
        }
        Insert: {
          astrologer_id: string
          created_at?: string
          free_consumed?: boolean
          free_started_at?: string | null
          id?: string
          last_message_at?: string | null
          message_count?: number
          title?: string | null
          user_id: string
        }
        Update: {
          astrologer_id?: string
          created_at?: string
          free_consumed?: boolean
          free_started_at?: string | null
          id?: string
          last_message_at?: string | null
          message_count?: number
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_astrologer_id_fkey"
            columns: ["astrologer_id"]
            isOneToOne: false
            referencedRelation: "astrologers"
            referencedColumns: ["id"]
          },
        ]
      }
      horoscope_cache: {
        Row: {
          body: Json
          created_at: string
          for_date: string
          user_id: string
        }
        Insert: {
          body: Json
          created_at?: string
          for_date: string
          user_id: string
        }
        Update: {
          body?: Json
          created_at?: string
          for_date?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_day: number | null
          birth_month: number | null
          birth_time: string | null
          birth_time_known: boolean
          birth_year: number | null
          city: string | null
          created_at: string
          free_minute_used: boolean
          full_name: string | null
          gender: string | null
          id: string
          onboarded: boolean
          phone: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          birth_day?: number | null
          birth_month?: number | null
          birth_time?: string | null
          birth_time_known?: boolean
          birth_year?: number | null
          city?: string | null
          created_at?: string
          free_minute_used?: boolean
          full_name?: string | null
          gender?: string | null
          id: string
          onboarded?: boolean
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          birth_day?: number | null
          birth_month?: number | null
          birth_time?: string | null
          birth_time_known?: boolean
          birth_year?: number | null
          city?: string | null
          created_at?: string
          free_minute_used?: boolean
          full_name?: string | null
          gender?: string | null
          id?: string
          onboarded?: boolean
          phone?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_balances: {
        Row: {
          balance_paise: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_paise?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_paise?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount_paise: number
          balance_after_paise: number
          created_at: string
          id: string
          kind: string
          meta: Json
          user_id: string
        }
        Insert: {
          amount_paise: number
          balance_after_paise: number
          created_at?: string
          id?: string
          kind: string
          meta?: Json
          user_id: string
        }
        Update: {
          amount_paise?: number
          balance_after_paise?: number
          created_at?: string
          id?: string
          kind?: string
          meta?: Json
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_or_create_thread: {
        Args: { _astrologer_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      wallet_admin_credit: {
        Args: { _amount_paise: number; _note?: string; _target_user: string }
        Returns: number
      }
      wallet_debit_for_chat: {
        Args: {
          _astrologer_id: string
          _rate_paise: number
          _thread_id: string
          _user_id: string
        }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
