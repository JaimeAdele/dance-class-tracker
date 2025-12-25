// Database types for Supabase
// These will be auto-generated later, but we'll define them manually for now

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          primary_color: string
          secondary_color: string
          payment_provider: 'stripe' | 'square' | 'paypal' | 'manual'
          stripe_account_id: string | null
          square_merchant_id: string | null
          paypal_merchant_id: string | null
          payment_provider_connected_at: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['businesses']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['businesses']['Insert']>
      }
      users: {
        Row: {
          id: string
          email: string
          business_id: string
          role: 'owner' | 'instructor' | 'student'
          first_name: string
          last_name: string
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      package_types: {
        Row: {
          id: string
          business_id: string
          name: string
          package_structure: 'fixed_count' | 'weekly_limit' | 'unlimited'
          class_count: number | null
          classes_per_week: number | null
          duration_months: number | null
          price: number
          expiration_days: number | null
          description: string | null
          valid_for_class_types: string[] | null
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['package_types']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['package_types']['Insert']>
      }
      packages: {
        Row: {
          id: string
          student_id: string
          package_type_id: string
          business_id: string
          classes_remaining: number | null
          total_classes: number | null
          total_months: number | null
          months_remaining: number | null
          classes_per_week: number | null
          purchase_date: string
          expiration_date: string | null
          status: 'active' | 'expired' | 'depleted'
          payment_method: 'stripe' | 'square' | 'paypal' | 'cash' | 'venmo' | 'other'
          payment_id: string | null
          amount_paid: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['packages']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['packages']['Insert']>
      }
      class_types: {
        Row: {
          id: string
          business_id: string
          name: string
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['class_types']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['class_types']['Insert']>
      }
      recurring_schedules: {
        Row: {
          id: string
          business_id: string
          class_type_id: string
          instructor_id: string
          day_of_week: number
          start_time: string
          duration_minutes: number
          timezone: string
          start_date: string
          end_date: string | null
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['recurring_schedules']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['recurring_schedules']['Insert']>
      }
      classes: {
        Row: {
          id: string
          business_id: string
          class_type_id: string
          instructor_id: string
          recurring_schedule_id: string | null
          scheduled_at: string
          duration_minutes: number
          notes: string | null
          status: 'scheduled' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['classes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['classes']['Insert']>
      }
      attendance: {
        Row: {
          id: string
          class_id: string
          student_id: string
          package_id: string
          business_id: string
          recorded_by: string
          recorded_at: string
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['attendance']['Row'], 'id' | 'recorded_at'>
        Update: Partial<Database['public']['Tables']['attendance']['Insert']>
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
  }
}
