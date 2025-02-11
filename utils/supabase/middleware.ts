import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  try {
    // Create an initial response
    let response = NextResponse.next();

    // Redirect all requests to /maintenance
    return NextResponse.redirect(new URL("/maintenance", request.url));
  } catch (e) {
    console.error("Error in updateSession:", e);

    return NextResponse.next();
  }
};
