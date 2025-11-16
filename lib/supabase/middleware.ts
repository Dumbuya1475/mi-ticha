import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If env vars are missing, skip middleware and continue
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[v0] Supabase credentials missing in middleware, skipping auth check')
    return NextResponse.next({
      request,
    })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes for parents
  const parentProtectedPaths = ["/dashboard", "/add-child", "/notifications"]
  const isParentProtectedPath = parentProtectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  // Protected routes for students
  const isStudentLoginPath = request.nextUrl.pathname === "/student-login"
  const studentProtectedPaths = ["/student"]
  const isStudentProtectedPath =
    !isStudentLoginPath && studentProtectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  if (!user && (isParentProtectedPath || isStudentProtectedPath)) {
    // Redirect to appropriate login page
    const loginUrl = isStudentProtectedPath ? "/student-login" : "/login"
    const url = request.nextUrl.clone()
    url.pathname = loginUrl
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
