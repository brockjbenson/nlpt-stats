// lib/email-service.ts
import { Resend } from "resend";

// This only runs on the server since RESEND_API_KEY is not public
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvitationEmail(data: {
  to: string;
  invitationToken: string;
  role: "admin" | "user";
}) {
  const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/sign-up?inviteToken=${data.invitationToken}`;

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: data.to,
      subject: `You're invited to ${process.env.NEXT_PUBLIC_APP_NAME}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You're Invited!</h2>
          <p>You've been invited to join ${process.env.NEXT_PUBLIC_APP_NAME} as a ${data.role}.</p>
          <p>Click the button below to accept your invitation:</p>
          <a href="${invitationLink}" 
             style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Accept Invitation
          </a>
          <p style="color: #666; font-size: 14px;">
            This invitation expires in 7 days.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error };
  }
}
