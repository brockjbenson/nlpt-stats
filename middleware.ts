import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "";

  // Detect if it's a request from PWA standalone mode
  const isPwa =
    request.headers.get("Sec-CH-UA-Mobile") || userAgent.includes("wv");

  if (isPwa) {
    console.log("Skipping session update for PWA");
    return NextResponse.next();
  }

  return await updateSession(request);
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
