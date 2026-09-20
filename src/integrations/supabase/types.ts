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
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      cashflow_months: {
        Row: {
          capex: number
          created_at: string
          id: string
          label: string
          month_index: number
          operating_expense: number
          revenue: number
          updated_at: string
          variable_cost_pct: number
        }
        Insert: {
          capex?: number
          created_at?: string
          id?: string
          label: string
          month_index: number
          operating_expense?: number
          revenue?: number
          updated_at?: string
          variable_cost_pct?: number
        }
        Update: {
          capex?: number
          created_at?: string
          id?: string
          label?: string
          month_index?: number
          operating_expense?: number
          revenue?: number
          updated_at?: string
          variable_cost_pct?: number
        }
        Relationships: []
      }
      compliance_items: {
        Row: {
          category: string
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          owner: string | null
          reference: string | null
          sort_order: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          owner?: string | null
          reference?: string | null
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          owner?: string | null
          reference?: string | null
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          id: string
          link_url: string | null
          notes: string | null
          section: string
          storage_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          link_url?: string | null
          notes?: string | null
          section?: string
          storage_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          link_url?: string | null
          notes?: string | null
          section?: string
          storage_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      experiences: {
        Row: {
          active: boolean
          capacity: number | null
          created_at: string
          direct_cost: number
          duration_minutes: number | null
          id: string
          inclusions: string | null
          is_addon: boolean
          name: string
          notes: string | null
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          capacity?: number | null
          created_at?: string
          direct_cost?: number
          duration_minutes?: number | null
          id?: string
          inclusions?: string | null
          is_addon?: boolean
          name: string
          notes?: string | null
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          capacity?: number | null
          created_at?: string
          direct_cost?: number
          duration_minutes?: number | null
          id?: string
          inclusions?: string | null
          is_addon?: boolean
          name?: string
          notes?: string | null
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          deposit: number | null
          desired_date: string | null
          desired_package: string | null
          email: string | null
          experience_id: string | null
          id: string
          message: string | null
          name: string
          notes: string | null
          party_size: number | null
          phone: string | null
          quoted_price: number | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deposit?: number | null
          desired_date?: string | null
          desired_package?: string | null
          email?: string | null
          experience_id?: string | null
          id?: string
          message?: string | null
          name: string
          notes?: string | null
          party_size?: number | null
          phone?: string | null
          quoted_price?: number | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deposit?: number | null
          desired_date?: string | null
          desired_package?: string | null
          email?: string | null
          experience_id?: string | null
          id?: string
          message?: string | null
          name?: string
          notes?: string | null
          party_size?: number | null
          phone?: string | null
          quoted_price?: number | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          commission_pct: number | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          message: string | null
          name: string
          next_follow_up: string | null
          notes: string | null
          partner_type: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          commission_pct?: number | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name: string
          next_follow_up?: string | null
          notes?: string | null
          partner_type?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          commission_pct?: number | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          next_follow_up?: string | null
          notes?: string | null
          partner_type?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      procurement_items: {
        Row: {
          category: string
          created_at: string
          duty: number
          freight: number
          id: string
          local_delivery: number
          name: string
          notes: string | null
          phase: number
          price_basis: string
          priority: string
          qty: number
          quote_date: string | null
          quote_expiry: string | null
          quote_path: string | null
          sort_order: number
          status: string
          supplier: string | null
          unit_price: number
          updated_at: string
          url: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          duty?: number
          freight?: number
          id?: string
          local_delivery?: number
          name: string
          notes?: string | null
          phase?: number
          price_basis?: string
          priority?: string
          qty?: number
          quote_date?: string | null
          quote_expiry?: string | null
          quote_path?: string | null
          sort_order?: number
          status?: string
          supplier?: string | null
          unit_price?: number
          updated_at?: string
          url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          duty?: number
          freight?: number
          id?: string
          local_delivery?: number
          name?: string
          notes?: string | null
          phase?: number
          price_basis?: string
          priority?: string
          qty?: number
          quote_date?: string | null
          quote_expiry?: string | null
          quote_path?: string | null
          sort_order?: number
          status?: string
          supplier?: string | null
          unit_price?: number
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      site_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          site_id: string
          storage_path: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          site_id: string
          storage_path: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          site_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_photos_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          access_notes: string | null
          area: string | null
          created_at: string
          data_status: string
          decision: string
          gps_notes: string | null
          id: string
          name: string
          notes: string | null
          scores: Json
          tide_weather_notes: string | null
          updated_at: string
          visited_on: string | null
          weekday_observations: string | null
          weekend_observations: string | null
        }
        Insert: {
          access_notes?: string | null
          area?: string | null
          created_at?: string
          data_status?: string
          decision?: string
          gps_notes?: string | null
          id?: string
          name: string
          notes?: string | null
          scores?: Json
          tide_weather_notes?: string | null
          updated_at?: string
          visited_on?: string | null
          weekday_observations?: string | null
          weekend_observations?: string | null
        }
        Update: {
          access_notes?: string | null
          area?: string | null
          created_at?: string
          data_status?: string
          decision?: string
          gps_notes?: string | null
          id?: string
          name?: string
          notes?: string | null
          scores?: Json
          tide_weather_notes?: string | null
          updated_at?: string
          visited_on?: string | null
          weekday_observations?: string | null
          weekend_observations?: string | null
        }
        Relationships: []
      }
      stakeholders: {
        Row: {
          created_at: string
          email: string | null
          follow_up_date: string | null
          id: string
          meeting_date: string | null
          models: Json
          name: string
          notes: string | null
          organization: string | null
          phone: string | null
          questions: Json
          site_id: string | null
          stakeholder_role: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          follow_up_date?: string | null
          id?: string
          meeting_date?: string | null
          models?: Json
          name: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          questions?: Json
          site_id?: string | null
          stakeholder_role?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          follow_up_date?: string | null
          id?: string
          meeting_date?: string | null
          models?: Json
          name?: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          questions?: Json
          site_id?: string | null
          stakeholder_role?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stakeholders_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          category: string
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          owner: string | null
          priority: string
          sort_order: number
          status: string
          title: string
          updated_at: string
          week: number | null
        }
        Insert: {
          category?: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          owner?: string | null
          priority?: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
          week?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          owner?: string | null
          priority?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
          week?: number | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit: { Args: { _user_id: string }; Returns: boolean }
      ensure_profile: {
        Args: { _full_name?: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "founder_admin" | "operations" | "finance" | "viewer"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["founder_admin", "operations", "finance", "viewer"],
    },
  },
} as const
