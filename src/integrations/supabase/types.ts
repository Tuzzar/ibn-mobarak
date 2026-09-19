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
          created_at: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      courier_checks: {
        Row: {
          bdcourier_data: Json
          cancelled: number
          created_at: string
          delivered: number
          id: string
          last_checked_at: string
          phone: string
          steadfast_data: Json
          success_rate: number
          total_parcel: number
          updated_at: string
        }
        Insert: {
          bdcourier_data?: Json
          cancelled?: number
          created_at?: string
          delivered?: number
          id?: string
          last_checked_at?: string
          phone: string
          steadfast_data?: Json
          success_rate?: number
          total_parcel?: number
          updated_at?: string
        }
        Update: {
          bdcourier_data?: Json
          cancelled?: number
          created_at?: string
          delivered?: number
          id?: string
          last_checked_at?: string
          phone?: string
          steadfast_data?: Json
          success_rate?: number
          total_parcel?: number
          updated_at?: string
        }
        Relationships: []
      }
      home_sections: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_visible: boolean
          position: number
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          position?: number
          title?: string
          type: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          position?: number
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      incomplete_orders: {
        Row: {
          address: string
          admin_note: string | null
          city: string
          converted_order_id: string | null
          created_at: string
          customer_name: string
          customer_phone: string
          delivery_fee: number
          id: string
          items: Json
          landing_slug: string | null
          notes: string | null
          notified_at: string | null
          notify_after: string | null
          product_id: string | null
          session_key: string
          source: string
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          address?: string
          admin_note?: string | null
          city?: string
          converted_order_id?: string | null
          created_at?: string
          customer_name?: string
          customer_phone?: string
          delivery_fee?: number
          id?: string
          items?: Json
          landing_slug?: string | null
          notes?: string | null
          notified_at?: string | null
          notify_after?: string | null
          product_id?: string | null
          session_key: string
          source?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          address?: string
          admin_note?: string | null
          city?: string
          converted_order_id?: string | null
          created_at?: string
          customer_name?: string
          customer_phone?: string
          delivery_fee?: number
          id?: string
          items?: Json
          landing_slug?: string | null
          notes?: string | null
          notified_at?: string | null
          notify_after?: string | null
          product_id?: string | null
          session_key?: string
          source?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      landing_pages: {
        Row: {
          amrapali_kicker: string | null
          amrapali_points: Json | null
          amrapali_title: string | null
          created_at: string
          cta_button_text: string
          cta_phone: string | null
          discount_amount: number | null
          discount_percent: number | null
          faq: Json
          faq_kicker: string | null
          faq_title: string | null
          features: Json
          features_kicker: string | null
          features_title: string | null
          final_cta_description: string | null
          final_cta_kicker: string | null
          final_cta_title: string | null
          free_delivery: boolean
          hero_badge_bottom: string | null
          hero_badge_top: string | null
          hero_bullets: Json | null
          hero_headline: string
          hero_image_url: string | null
          hero_subheadline: string
          id: string
          is_active: boolean
          journey_kicker: string | null
          journey_steps: Json | null
          journey_title: string | null
          meta_pixel_id: string | null
          offer_text: string | null
          og_image_url: string | null
          product_id: string | null
          promise_items: Json | null
          promise_kicker: string | null
          promise_title: string | null
          quantity_note: string | null
          review_images: Json
          seo_description: string | null
          seo_title: string | null
          slug: string
          stats_items: Json | null
          stats_kicker: string | null
          stats_title: string | null
          testimonial_ids: Json
          testimonials_kicker: string | null
          testimonials_title: string | null
          trust_strip: Json | null
          updated_at: string
          urgency_text: string | null
          video_description: string | null
          video_heading: string | null
          video_label: string | null
          video_url: string | null
          video_urls: string | null
        }
        Insert: {
          amrapali_kicker?: string | null
          amrapali_points?: Json | null
          amrapali_title?: string | null
          created_at?: string
          cta_button_text?: string
          cta_phone?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          faq?: Json
          faq_kicker?: string | null
          faq_title?: string | null
          features?: Json
          features_kicker?: string | null
          features_title?: string | null
          final_cta_description?: string | null
          final_cta_kicker?: string | null
          final_cta_title?: string | null
          free_delivery?: boolean
          hero_badge_bottom?: string | null
          hero_badge_top?: string | null
          hero_bullets?: Json | null
          hero_headline?: string
          hero_image_url?: string | null
          hero_subheadline?: string
          id?: string
          is_active?: boolean
          journey_kicker?: string | null
          journey_steps?: Json | null
          journey_title?: string | null
          meta_pixel_id?: string | null
          offer_text?: string | null
          og_image_url?: string | null
          product_id?: string | null
          promise_items?: Json | null
          promise_kicker?: string | null
          promise_title?: string | null
          quantity_note?: string | null
          review_images?: Json
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          stats_items?: Json | null
          stats_kicker?: string | null
          stats_title?: string | null
          testimonial_ids?: Json
          testimonials_kicker?: string | null
          testimonials_title?: string | null
          trust_strip?: Json | null
          updated_at?: string
          urgency_text?: string | null
          video_description?: string | null
          video_heading?: string | null
          video_label?: string | null
          video_url?: string | null
          video_urls?: string | null
        }
        Update: {
          amrapali_kicker?: string | null
          amrapali_points?: Json | null
          amrapali_title?: string | null
          created_at?: string
          cta_button_text?: string
          cta_phone?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          faq?: Json
          faq_kicker?: string | null
          faq_title?: string | null
          features?: Json
          features_kicker?: string | null
          features_title?: string | null
          final_cta_description?: string | null
          final_cta_kicker?: string | null
          final_cta_title?: string | null
          free_delivery?: boolean
          hero_badge_bottom?: string | null
          hero_badge_top?: string | null
          hero_bullets?: Json | null
          hero_headline?: string
          hero_image_url?: string | null
          hero_subheadline?: string
          id?: string
          is_active?: boolean
          journey_kicker?: string | null
          journey_steps?: Json | null
          journey_title?: string | null
          meta_pixel_id?: string | null
          offer_text?: string | null
          og_image_url?: string | null
          product_id?: string | null
          promise_items?: Json | null
          promise_kicker?: string | null
          promise_title?: string | null
          quantity_note?: string | null
          review_images?: Json
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          stats_items?: Json | null
          stats_kicker?: string | null
          stats_title?: string | null
          testimonial_ids?: Json
          testimonials_kicker?: string | null
          testimonials_title?: string | null
          trust_strip?: Json | null
          updated_at?: string
          urgency_text?: string | null
          video_description?: string | null
          video_heading?: string | null
          video_label?: string | null
          video_url?: string | null
          video_urls?: string | null
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          label: string
          name?: string | null
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          label: string
          name?: string | null
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          label?: string
          name?: string | null
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      order_history: {
        Row: {
          changed_by: string
          changed_by_email: string | null
          created_at: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          order_id: string
        }
        Insert: {
          changed_by: string
          changed_by_email?: string | null
          created_at?: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          order_id: string
        }
        Update: {
          changed_by?: string
          changed_by_email?: string | null
          created_at?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          city: string
          courier_consignment_id: string | null
          courier_sent_at: string | null
          courier_status: string | null
          courier_tracking_code: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          delivery_fee: number
          id: string
          items: Json
          notes: string | null
          order_no: number | null
          source: string
          status: string
          subtotal: number
          total: number
        }
        Insert: {
          address: string
          city: string
          courier_consignment_id?: string | null
          courier_sent_at?: string | null
          courier_status?: string | null
          courier_tracking_code?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          delivery_fee?: number
          id?: string
          items: Json
          notes?: string | null
          order_no?: number | null
          source?: string
          status?: string
          subtotal: number
          total: number
        }
        Update: {
          address?: string
          city?: string
          courier_consignment_id?: string | null
          courier_sent_at?: string | null
          courier_status?: string | null
          courier_tracking_code?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_fee?: number
          id?: string
          items?: Json
          notes?: string | null
          order_no?: number | null
          source?: string
          status?: string
          subtotal?: number
          total?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          discount_amount: number
          featured: boolean
          id: string
          image_url: string | null
          images: Json
          name: string
          price: number
          product_level: string
          slug: string
          sort_order: number
          stock: number
          subcategory: string | null
          unit: string | null
          updated_at: string
          weight_variants: Json
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          discount_amount?: number
          featured?: boolean
          id?: string
          image_url?: string | null
          images?: Json
          name: string
          price: number
          product_level?: string
          slug: string
          sort_order?: number
          stock?: number
          subcategory?: string | null
          unit?: string | null
          updated_at?: string
          weight_variants?: Json
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          discount_amount?: number
          featured?: boolean
          id?: string
          image_url?: string | null
          images?: Json
          name?: string
          price?: number
          product_level?: string
          slug?: string
          sort_order?: number
          stock?: number
          subcategory?: string | null
          unit?: string | null
          updated_at?: string
          weight_variants?: Json
        }
        Relationships: []
      }
      site_content: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "administrator" | "moderator"
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
      app_role: ["admin", "user", "administrator", "moderator"],
    },
  },
} as const
