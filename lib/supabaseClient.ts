import { createClient } from '@supabase/supabase-js'

// Ensure you have a .env.local file with these variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.warn(
    'Supabase URL is not configured. Please set NEXT_PUBLIC_SUPABASE_URL environment variable.'
  )
}
if (!supabaseAnonKey) {
  console.warn(
    'Supabase Anon Key is not configured. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.'
  )
}

// Initialize Supabase client only if URL and key are present
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

// Optional: Log initialization status
if (supabase) {
  console.log('Supabase client initialized.')
} else {
  console.error(
    'Supabase client could not be initialized. Check environment variables.'
  )
}
