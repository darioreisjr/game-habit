import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', requestUrl.origin))
  }

  const response = NextResponse.redirect(new URL(next, requestUrl.origin))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL('/login?error=auth', requestUrl.origin))
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const userName =
      typeof user.user_metadata?.name === 'string' && user.user_metadata.name.trim().length > 0
        ? user.user_metadata.name
        : 'Usuario'

    await supabase.from('profiles').upsert(
      {
        id: user.id,
        name: userName,
      },
      { onConflict: 'id', ignoreDuplicates: true }
    )

    await supabase.from('stats').upsert(
      {
        user_id: user.id,
        level: 1,
        xp: 0,
        coins: 0,
      },
      { onConflict: 'user_id', ignoreDuplicates: true }
    )
  }

  return response
}
