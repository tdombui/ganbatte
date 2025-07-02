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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          company: string | null
          role: 'customer' | 'staff' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          company?: string | null
          role?: 'customer' | 'staff' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          company?: string | null
          role?: 'customer' | 'staff' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      customers: {
        Row: {
          id: string
          billing_address: string | null
          default_address: string | null
          preferred_payment_method: string | null
          credit_limit: number | null
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          billing_address?: string | null
          default_address?: string | null
          preferred_payment_method?: string | null
          credit_limit?: number | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          billing_address?: string | null
          default_address?: string | null
          preferred_payment_method?: string | null
          credit_limit?: number | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      staff: {
        Row: {
          id: string
          employee_id: string | null
          department: string | null
          permissions: Json | null
          is_active: boolean
          hire_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          employee_id?: string | null
          department?: string | null
          permissions?: Json | null
          is_active?: boolean
          hire_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string | null
          department?: string | null
          permissions?: Json | null
          is_active?: boolean
          hire_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      jobs: {
        Row: {
          id: string
          parts: string[] | null
          pickup: string | null
          dropoff: string | null
          deadline: string | null
          deadline_display: string | null
          status: string | null
          photo_urls: string[] | null
          distance_meters: number | null
          duration_seconds: number | null
          legs: Json | null
          created_at: string | null
          user_id: string | null
          customer_id: string | null
        }
        Insert: {
          id?: string
          parts?: string[] | null
          pickup?: string | null
          dropoff?: string | null
          deadline?: string | null
          deadline_display?: string | null
          status?: string | null
          photo_urls?: string[] | null
          distance_meters?: number | null
          duration_seconds?: number | null
          legs?: Json | null
          created_at?: string | null
          user_id?: string | null
          customer_id?: string | null
        }
        Update: {
          id?: string
          parts?: string[] | null
          pickup?: string | null
          dropoff?: string | null
          deadline?: string | null
          deadline_display?: string | null
          status?: string | null
          photo_urls?: string[] | null
          distance_meters?: number | null
          duration_seconds?: number | null
          legs?: Json | null
          created_at?: string | null
          user_id?: string | null
          customer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          }
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

// Extended types for our application
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type Staff = Database['public']['Tables']['staff']['Row']
export type Job = Database['public']['Tables']['jobs']['Row']

export type UserRole = 'customer' | 'staff' | 'admin'

export interface UserWithProfile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  company: string | null
  role: UserRole
  customer?: Customer
  staff?: Staff
}
