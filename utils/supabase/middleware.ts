import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const pathname = request.nextUrl.pathname;

    const publicPaths = [
      "/manifest.json",
      "/icons/",
      "/favicon.ico",
      "/robots.txt",
    ];
    if (publicPaths.some((path) => pathname.startsWith(path))) {
      return response;
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
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

    const { data, error } = await supabase.auth.getUser();
    const isAdminRoute = pathname.startsWith("/admin");
    const isSignInPage = pathname.startsWith("/sign-in");

    if (!data?.user && !isSignInPage) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

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
