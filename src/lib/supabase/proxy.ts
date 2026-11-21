import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  // Supabase 미설정(로컬 첫 실행 등): 공개 페이지만 보여주고 관리 화면은 로그인으로 보냄
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (request.nextUrl.pathname.startsWith("/admin")) return NextResponse.redirect(new URL("/login", request.url));
    return response;
  }
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const signedIn = !!data?.claims;

  if (!signedIn && request.nextUrl.pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return response;
}
