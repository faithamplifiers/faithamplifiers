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
          username: string | null
          full_name: string | null
          avatar_url: string | null
          video_url: string | null
          audio_url: string | null
          image_url: string | null
          role: 'admin' | 'content_creator' | 'event_organizer' | 'member'
          is_approved?: boolean | null
          newsletter_subscribed?: boolean | null
          plan: 'blog_basics' | 'event_services' | 'enterprise' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          video_url?: string | null
          audio_url?: string | null
          image_url?: string | null
          role?: 'admin' | 'content_creator' | 'event_organizer' | 'member'
          is_approved?: boolean | null
          newsletter_subscribed?: boolean | null
          plan?: 'blog_basics' | 'event_services' | 'enterprise' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          video_url?: string | null
          audio_url?: string | null
          image_url?: string | null
          role?: 'admin' | 'content_creator' | 'event_organizer' | 'member'
          is_approved?: boolean | null
          newsletter_subscribed?: boolean | null
          plan?: 'blog_basics' | 'event_services' | 'enterprise' | null
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string
          price: string
          currency: 'USD' | 'NGN' | 'EUR' | 'GBP'
          provider_id: string
          portfolio_images: string[] | null
          status: 'active' | 'inactive' | 'pending'
          booking_notifications_enabled: boolean
          slug: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category: string
          price: string
          currency?: 'USD' | 'NGN' | 'EUR' | 'GBP'
          provider_id: string
          portfolio_images?: string[] | null
          status?: 'active' | 'inactive' | 'pending'
          booking_notifications_enabled?: boolean
          slug?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: string
          price?: string
          currency?: 'USD' | 'NGN' | 'EUR' | 'GBP'
          provider_id?: string
          portfolio_images?: string[] | null
          status?: 'active' | 'inactive' | 'pending'
          booking_notifications_enabled?: boolean
          slug?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      service_ratings: {
        Row: {
          id: string
          service_id: string
          user_id: string | null
          rating_value: number
          review_text: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          service_id: string
          user_id?: string | null
          rating_value: number
          review_text?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          service_id?: string
          user_id?: string | null
          rating_value?: number
          review_text?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contact_messages: {
        Row: {
          id: string
          name: string
          email: string
          subject: string
          message: string
          status: 'new' | 'read' | 'replied' | 'archived'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          subject: string
          message: string
          status?: 'new' | 'read' | 'replied' | 'archived'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          subject?: string
          message?: string
          status?: 'new' | 'read' | 'replied' | 'archived'
          created_at?: string
        }
      }
      service_bookings: {
        Row: {
          id: string
          service_id: string
          user_id: string | null
          client_name: string
          client_email: string
          client_phone: string | null
          message: string | null
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          service_id: string
          user_id?: string | null
          client_name: string
          client_email: string
          client_phone?: string | null
          message?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          service_id?: string
          user_id?: string | null
          client_name?: string
          client_email?: string
          client_phone?: string | null
          message?: string | null
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      pages: {
        Row: {
          id: string
          title: string
          slug: string
          content: string | null
          status: 'published' | 'draft'
          meta_title: string | null
          meta_description: string | null
          is_system_page: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          content?: string | null
          status?: 'published' | 'draft'
          meta_title?: string | null
          meta_description?: string | null
          is_system_page?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          content?: string | null
          status?: 'published' | 'draft'
          meta_title?: string | null
          meta_description?: string | null
          is_system_page?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      app_settings: {
        Row: {
          key: string
          value: string
          description: string | null
          updated_at: string
        }
        Insert: {
          key: string
          value: string
          description?: string | null
          updated_at?: string
        }
        Update: {
          key?: string
          value?: string
          description?: string | null
          updated_at?: string
        }
      }
      member_plans: {
        Row: {
          id: string
          user_id: string
          plan: 'blog_basics' | 'event_services' | 'enterprise'
          username_choice: string | null
          social_links: Json
          legal_name: string | null
          phone: string | null
          address: string | null
          country: string | null
          state: string | null
          date_of_birth: string | null
          gov_id_url: string | null
          verification_status: 'none' | 'pending' | 'verified' | 'rejected'
          paystack_reference: string | null
          payment_status: 'unpaid' | 'paid'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan?: 'blog_basics' | 'event_services' | 'enterprise'
          username_choice?: string | null
          social_links?: Json
          legal_name?: string | null
          phone?: string | null
          address?: string | null
          country?: string | null
          state?: string | null
          date_of_birth?: string | null
          gov_id_url?: string | null
          verification_status?: 'none' | 'pending' | 'verified' | 'rejected'
          paystack_reference?: string | null
          payment_status?: 'unpaid' | 'paid'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan?: 'blog_basics' | 'event_services' | 'enterprise'
          username_choice?: string | null
          social_links?: Json
          legal_name?: string | null
          phone?: string | null
          address?: string | null
          country?: string | null
          state?: string | null
          date_of_birth?: string | null
          gov_id_url?: string | null
          verification_status?: 'none' | 'pending' | 'verified' | 'rejected'
          paystack_reference?: string | null
          payment_status?: 'unpaid' | 'paid'
          created_at?: string
          updated_at?: string
        }
      }
      user_integrations: {
        Row: {
          id: string
          user_id: string
          cloudinary_cloud_name: string | null
          cloudinary_api_key: string | null
          cloudinary_upload_preset: string | null
          cloudinary_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          cloudinary_cloud_name?: string | null
          cloudinary_api_key?: string | null
          cloudinary_upload_preset?: string | null
          cloudinary_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          cloudinary_cloud_name?: string | null
          cloudinary_api_key?: string | null
          cloudinary_upload_preset?: string | null
          cloudinary_enabled?: boolean
          created_at?: string
          updated_at?: string
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