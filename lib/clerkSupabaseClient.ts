import { createClient } from '@supabase/supabase-js'
import { useSession } from '@clerk/nextjs'
import { useMemo } from 'react'

// Create a hook to get a Supabase client instance authenticated with Clerk
export function useClerkSupabaseClient() {
  const { session } = useSession()

  // Memoize the client instance to avoid creating a new one on every render
  const supabaseClient = useMemo(() => {
    if (!session) {
      return null // Or return a non-authenticated client if needed
    }

    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          // Get the Supabase token with a custom template
          fetch: async (url, options = {}) => {
            const clerkToken = await session?.getToken({ template: 'supabase' })

            // Inject the token into the Authorization header
            const headers = new Headers(options?.headers)
            headers.set('Authorization', `Bearer ${clerkToken}`)

            // Execute the fetch request
            return fetch(url, { ...options, headers })
          },
        },
      }
    )
  }, [session]) // Re-create the client only when the session changes

  return supabaseClient
}
