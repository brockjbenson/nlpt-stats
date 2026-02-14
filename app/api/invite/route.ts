import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendInvitationEmail } from "@/lib/email-service";
import { revalidatePath } from "next/cache";

// Use service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const { email, role = "user", userId } = await request.json();

    // Optional: Verify the requesting user is an admin
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (profile?.role !== "admin") {
        return NextResponse.json(
          { error: "Unauthorized: Admin access required" },
          { status: 403 },
        );
      }
    }

    // Create invitation in database
    const { data: invitation, error: inviteError } = await supabase
      .from("invitations")
      .insert({
        email,
        role,
        invited_by: userId,
      })
      .select()
      .single();

    if (inviteError) {
      console.error("Database error:", inviteError);
      return NextResponse.json(
        { error: "Failed to create invitation", details: inviteError.message },
        { status: 500 },
      );
    }

    // Send email
    const emailResult = await sendInvitationEmail({
      to: email,
      invitationToken: invitation.token,
      role: invitation.role,
    });

    if (!emailResult.success) {
      // Log but don't fail - invitation is created
      console.error("Email failed:", emailResult.error);
      return NextResponse.json({
        success: true,
        invitation,
        warning: "Invitation created but email failed to send",
      });
    }

    revalidatePath("/admin/users/invitations");

    return NextResponse.json({
      success: true,
      invitation,
      emailSent: true,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
