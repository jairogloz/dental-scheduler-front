import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Supabase client - ONLY used for authentication
// All data operations should go through your backend API
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// User profile type for authentication context
export type UserProfile = {
  id: string
  email: string
  full_name: string | null
  roles: ('admin' | 'doctor' | 'receptionist')[]
  avatar_url: string | null
  created_at: string
  updated_at: string
}
