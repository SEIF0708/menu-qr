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
      analytics_events: {
        Row: {
          id: string
          restaurant_id: string
          event_type: string
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          event_type: string
          created_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          event_type?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          id: string
          restaurant_id: string
          table_id: string | null
          items_json: Json
          total_amount: number
          whatsapp_sent: boolean
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          table_id?: string | null
          items_json: Json
          total_amount: number
          whatsapp_sent?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          table_id?: string | null
          items_json?: Json
          total_amount?: number
          whatsapp_sent?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          }
        ]
      }
      categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name_ar: string | null
          name_en: string | null
          name_fr: string | null
          restaurant_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name_ar?: string | null
          name_en?: string | null
          name_fr?: string | null
          restaurant_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name_ar?: string | null
          name_en?: string | null
          name_fr?: string | null
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_views: {
        Row: {
          id: string
          restaurant_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_views_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allergens: string | null
          badges: string[] | null
          calories: number | null
          category_id: string | null
          chef_recommendation: boolean
          created_at: string
          description_ar: string | null
          description_en: string | null
          description_fr: string | null
          display_order: number
          featured: boolean
          id: string
          image_url: string | null
          ingredients: string | null
          is_available: boolean
          name_ar: string | null
          name_en: string | null
          name_fr: string | null
          popular: boolean
          prep_time_minutes: number | null
          price: number
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          allergens?: string | null
          badges?: string[] | null
          calories?: number | null
          category_id?: string | null
          chef_recommendation?: boolean
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          description_fr?: string | null
          display_order?: number
          featured?: boolean
          id?: string
          image_url?: string | null
          ingredients?: string | null
          is_available?: boolean
          name_ar?: string | null
          name_en?: string | null
          name_fr?: string | null
          popular?: boolean
          prep_time_minutes?: number | null
          price?: number
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          allergens?: string | null
          badges?: string[] | null
          calories?: number | null
          category_id?: string | null
          chef_recommendation?: boolean
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          description_fr?: string | null
          display_order?: number
          featured?: boolean
          id?: string
          image_url?: string | null
          ingredients?: string | null
          is_available?: boolean
          name_ar?: string | null
          name_en?: string | null
          name_fr?: string | null
          popular?: boolean
          prep_time_minutes?: number | null
          price?: number
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          id: string
          restaurant_id: string
          title_en: string | null
          title_fr: string | null
          title_ar: string | null
          description_en: string | null
          description_fr: string | null
          description_ar: string | null
          type: string
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          metadata_json: Json | null
          start_date: string | null
          end_date: string | null
        }
        Insert: { id?: string, restaurant_id: string, title_en?: string | null, title_fr?: string | null, title_ar?: string | null, description_en?: string | null, description_fr?: string | null, description_ar?: string | null, type: string, image_url?: string | null, is_active?: boolean, created_at?: string, updated_at?: string, metadata_json?: Json | null, start_date?: string | null, end_date?: string | null }
        Update: { id?: string, restaurant_id?: string, title_en?: string | null, title_fr?: string | null, title_ar?: string | null, description_en?: string | null, description_fr?: string | null, description_ar?: string | null, type?: string, image_url?: string | null, is_active?: boolean, created_at?: string, updated_at?: string, metadata_json?: Json | null, start_date?: string | null, end_date?: string | null }
        Relationships: [
          {
            foreignKeyName: "promotions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          }
        ]
      }
      product_recommendations: {
        Row: {
          id: string
          restaurant_id: string
          primary_product_id: string
          recommended_product_id: string
          display_order: number
          created_at: string
        }
        Insert: { id?: string, restaurant_id: string, primary_product_id: string, recommended_product_id: string, display_order?: number, created_at?: string }
        Update: { id?: string, restaurant_id?: string, primary_product_id?: string, recommended_product_id?: string, display_order?: number, created_at?: string }
        Relationships: [
          {
            foreignKeyName: "product_recommendations_product_id_fkey"
            columns: ["primary_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recommendations_recommended_product_id_fkey"
            columns: ["recommended_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      referral_codes: {
        Row: {
          id: string
          code: string
          user_id: string
          referrer_name: string
          commission_rate: number
        }
        Insert: {
          id?: string
          code: string
          user_id?: string
          referrer_name: string
          commission_rate: number
        }
        Update: {
          id?: string
          code?: string
          user_id?: string
          referrer_name?: string
          commission_rate?: number
        }
        Relationships: []
      }
      referral_payouts: {
        Row: {
          id: string
          restaurant_id: string
          referral_code_id: string | null
          amount: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          referral_code_id?: string | null
          amount: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          referral_code_id?: string | null
          amount?: number
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_payouts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_payouts_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "restaurants_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          }
        ]
      }
      restaurant_tables: {
        Row: {
          id: string
          restaurant_id: string
          name: string
          table_number: number
          qr_identifier: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          name: string
          table_number: number
          qr_identifier: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          name?: string
          table_number?: number
          qr_identifier?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          cover_image_url: string | null
          created_at: string
          cuisine_type: string | null
          currency: string
          default_language: string
          description: string | null
          email: string | null
          id: string
          is_open: boolean
          logo_url: string | null
          name: string
          onboarding_completed: boolean
          opening_hours: string | null
          owner_id: string
          phone: string | null
          slug: string
          social_links: Json | null
          updated_at: string
          website: string | null
          table_count: number
          whatsapp_phone: string | null
          subscription_status: string
          referral_code_id: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          cuisine_type?: string | null
          currency?: string
          default_language?: string
          description?: string | null
          email?: string | null
          id?: string
          is_open?: boolean
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean
          opening_hours?: string | null
          owner_id: string
          phone?: string | null
          slug: string
          social_links?: Json | null
          updated_at?: string
          website?: string | null
          table_count?: number
          whatsapp_phone?: string | null
          subscription_status?: string
          referral_code_id?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          cuisine_type?: string | null
          currency?: string
          default_language?: string
          description?: string | null
          email?: string | null
          id?: string
          is_open?: boolean
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean
          opening_hours?: string | null
          owner_id?: string
          phone?: string | null
          slug?: string
          social_links?: Json | null
          updated_at?: string
          website?: string | null
          table_count?: number
          whatsapp_phone?: string | null
          subscription_status?: string
          referral_code_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      restaurants_public: {
        Row: {
          cover_image_url: string | null
          created_at: string
          cuisine_type: string | null
          currency: string
          default_language: string
          description: string | null
          email: string | null
          id: string
          is_open: boolean
          logo_url: string | null
          name: string
          opening_hours: string | null
          slug: string
          social_links: Json | null
          updated_at: string
          website: string | null
          table_count: number
          whatsapp_phone: string | null
          subscription_status: string
          referral_code_id: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          cuisine_type?: string | null
          currency?: string
          default_language?: string
          description?: string | null
          email?: string | null
          id?: string
          is_open?: boolean
          logo_url?: string | null
          name?: string
          opening_hours?: string | null
          slug?: string
          social_links?: Json | null
          updated_at?: string
          website?: string | null
          table_count?: number
          whatsapp_phone?: string | null
          subscription_status?: string
          referral_code_id?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          cuisine_type?: string | null
          currency?: string
          default_language?: string
          description?: string | null
          email?: string | null
          id?: string
          is_open?: boolean
          logo_url?: string | null
          name?: string
          opening_hours?: string | null
          slug?: string
          social_links?: Json | null
          updated_at?: string
          website?: string | null
          table_count?: number
          whatsapp_phone?: string | null
          subscription_status?: string
          referral_code_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          }
        ]
      }
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
