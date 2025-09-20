import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Enhanced Supabase client with proper auth configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage,
    storageKey: 'dental-scheduler-auth-token',
    // Enable debug mode for development
    debug: import.meta.env.DEV
  }
})

// Helper function to get current auth token
export const getAuthToken = async (): Promise<string | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    return session?.access_token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// User profile type for authentication context
export type UserProfile = {
  id: string
  organization_id: string
  email: string
  full_name: string | null
  roles: ('admin' | 'doctor' | 'receptionist')[]
  avatar_url: string | null
  created_at: string
  updated_at: string
}
