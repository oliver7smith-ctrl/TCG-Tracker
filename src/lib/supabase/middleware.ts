
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(list) {
        list.forEach(({name,value}) => request.cookies.set(name,value))
        response = NextResponse.next({ request })
        list.forEach(({name,value,options}) => response.cookies.set(name,value,options))
      },
    }}
  )
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl
  const isPublic  = ["/" , "/auth/login", "/auth/signup", "/auth/reset"].includes(pathname) || pathname.startsWith("/api/")
  const isAuth    = pathname.startsWith("/auth/")

  if (!user && !isPublic && !isAuth) {
    const u = request.nextUrl.clone(); u.pathname = "/auth/login"; u.searchParams.set("next", pathname)
    return NextResponse.redirect(u)
  }
  if (user && isAuth && !pathname.includes("callback")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }
  return response
}
