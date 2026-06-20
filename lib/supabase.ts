import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : (null as any);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          role: 'user' | 'admin';
          account_status: 'active' | 'disabled' | 'banned' | 'removed';
          status_reason: string | null;
          status_updated_at: string | null;
          status_updated_by: string | null;
          disabled_at: string | null;
          banned_at: string | null;
          removed_at: string | null;
          last_seen_at: string | null;
          timezone: string;
          preferences: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Row']>;
      };
      customers: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          position: string | null;
          address: string | null;
          city: string | null;
          country: string | null;
          source: string;
          status: 'lead' | 'prospect' | 'qualified' | 'customer' | 'inactive';
          value: number;
          notes: string | null;
          tags: string[];
          attachments: any[];
          custom_fields: Record<string, any>;
          last_contact_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['customers']['Row']>;
      };
      calls: {
        Row: {
          id: string;
          user_id: string;
          customer_id: string;
          call_type: 'inbound' | 'outbound' | 'missed';
          duration_minutes: number;
          notes: string | null;
          outcome: 'pending' | 'completed' | 'no_answer' | 'voicemail' | 'rescheduled';
          follow_up_date: string | null;
          recording_url: string | null;
          tags: string[];
          sentiment: 'positive' | 'neutral' | 'negative' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['calls']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['calls']['Row']>;
      };
      follow_ups: {
        Row: {
          id: string;
          user_id: string;
          customer_id: string;
          call_id: string | null;
          follow_up_type: 'email' | 'call' | 'meeting' | 'task' | 'message';
          description: string;
          scheduled_date: string;
          completed: boolean;
          completed_at: string | null;
          completion_notes: string | null;
          priority: 'low' | 'medium' | 'high' | 'urgent';
          reminder_sent: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['follow_ups']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['follow_ups']['Row']>;
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          customer_id: string | null;
          title: string;
          description: string | null;
          reminder_type: 'task' | 'call' | 'meeting' | 'birthday' | 'anniversary' | 'follow_up';
          scheduled_time: string;
          completed: boolean;
          completed_at: string | null;
          priority: 'low' | 'medium' | 'high' | 'urgent';
          recurrence: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | null;
          recurrence_end_date: string | null;
          notification_sent: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reminders']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['reminders']['Row']>;
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          customer_id: string | null;
          title: string;
          description: string | null;
          status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          due_date: string | null;
          completed_at: string | null;
          assigned_to: string | null;
          tags: string[];
          attachments: any[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tasks']['Row']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string | null;
          notification_type: 'info' | 'warning' | 'success' | 'error' | 'reminder';
          related_entity_type: 'customer' | 'call' | 'follow_up' | 'task' | 'reminder' | null;
          related_entity_id: string | null;
          read: boolean;
          action_url: string | null;
          created_at: string;
          read_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Row']>;
      };
      activities: {
        Row: {
          id: string;
          user_id: string;
          activity_type: string;
          entity_type: string;
          entity_id: string;
          description: string | null;
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['activities']['Row'], 'id' | 'created_at'>;
        Update: never;
      };
    };
  };
};
