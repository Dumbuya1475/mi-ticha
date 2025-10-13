import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createSupabaseBrowserClient> | null = null

export function createBrowserClient() {
  if (client) {
    return client
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("[v0] Supabase URL:", supabaseUrl)
  console.log("[v0] Supabase Anon Key exists:", !!supabaseAnonKey)
  console.log("[v0] Supabase Anon Key length:", supabaseAnonKey?.length)

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase credentials!")
    console.error("[v0] URL:", supabaseUrl)
    console.error("[v0] Key exists:", !!supabaseAnonKey)
    throw new Error("Missing Supabase environment variables. Please check your configuration.")
  }

  client = createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey)

  return client
}

// Keep the old function for backwards compatibility
export function getSupabaseBrowserClient() {
  return createBrowserClient()
}
