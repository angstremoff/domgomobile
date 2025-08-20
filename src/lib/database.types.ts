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
      properties: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string
          type: 'sale' | 'rent'
          property_type: string
          price: number
          area: number
          rooms: number
          city_id: number
          images: string[]
          features: string[]
          coordinates: Json | null
          user_id: string | null
          location: string
          status: 'active' | 'sold' | 'rented'
          agency_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description: string
          type: 'sale' | 'rent'
          property_type: string
          price: number
          area: number
          rooms: number
          city_id: number
          images: string[]
          features?: string[]
          coordinates?: Json | null
          user_id?: string | null
          location: string
          status?: 'active' | 'sold' | 'rented'
          agency_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string
          type?: 'sale' | 'rent'
          property_type?: string
          price?: number
          area?: number
          rooms?: number
          location?: string
          images?: string[]
          features?: string[]
          coordinates?: Json | null
          user_id?: string | null
          status?: 'active' | 'sold' | 'rented'
          agency_id?: string | null
        }
      }
      users: {
        Row: {
          id: string
          created_at: string
          email: string
          name: string | null
          phone: string | null
          avatar_url: string | null
          is_agency: boolean | null
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          name?: string | null
          avatar_url?: string | null
          phone?: string | null
          is_agency?: boolean | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          phone?: string | null
          is_agency?: boolean | null
        }
      }
      agency_profiles: {
        Row: {
          id: string
          created_at: string
          user_id: string
          name: string
          phone: string | null
          logo_url: string | null
          description: string | null
          website: string | null
          instagram: string | null
          facebook: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          name: string
          phone?: string | null
          logo_url?: string | null
          description?: string | null
          website?: string | null
          instagram?: string | null
          facebook?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          name?: string
          phone?: string | null
          logo_url?: string | null
          description?: string | null
          website?: string | null
          instagram?: string | null
          facebook?: string | null
        }
      }
      favorites: {
        Row: {
          id: string
          created_at: string
          user_id: string
          property_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          property_id: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          property_id?: string
        }
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
