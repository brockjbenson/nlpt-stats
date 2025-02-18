import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh session if expired
    const { data, error } = await supabase.auth.getUser();
    const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
    const isSignInPage = request.nextUrl.pathname.startsWith("/sign-in");

    // 🚫 If user is NOT logged in, redirect to sign-in (but don't loop on /sign-in)
    if (!data?.user && !isSignInPage) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // 🛡️ If user is logged in but NOT an admin, restrict `/admin`
    const userRole = data.user?.user_metadata?.role;
    if (isAdminRoute && userRole !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return response;
  } catch (e) {
    console.error("Error in middleware:", e);
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
