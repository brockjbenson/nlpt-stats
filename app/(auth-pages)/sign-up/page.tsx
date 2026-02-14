import { createAdminClient } from "@/utils/supabase/admin";
import { redirect } from "next/navigation";
import InvalidInvitation from "./_components/invalid-invitation";
import SignUpForm from "./_components/sign-up-form";
import { Message } from "@/components/form-message";

export type Invitation = {
  id: string;
  email: string;
  role: "admin" | "user";
  token: string;
  expires_at: string | null;
  accepted: string | null;
  created_at: string;
};

export default async function Signup({
  searchParams,
}: {
  searchParams: Promise<{
    inviteToken?: string;
    error?: string; // ✅ Change to string
    error_description?: string;
  }>;
}) {
  const { inviteToken, error, error_description } = await searchParams;

  const supabase = await createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  if (!inviteToken) {
    return (
      <InvalidInvitation
        title="No Valid Invitation"
        message="No valid invitation found. In order to sign up for an account you need a valid invitation from your administrator."
      />
    );
  }

  const { data: invitation, error: invitationError } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", inviteToken)
    .single();

  if (invitationError || !invitation) {
    return (
      <InvalidInvitation
        title="No Valid Invitation"
        message="No valid invitation found. In order to sign up for an account you need a valid invitation from your administrator."
      />
    );
  }

  if (invitation.accepted_at !== null) {
    return (
      <InvalidInvitation
        title="Invitation Already Used"
        message="This invitation has already been used to create an account. If you believe this is an error, please contact your administrator."
      />
    );
  }

  // ✅ Create message object from URL params
  const message: Message | undefined = error
    ? { error: error_description || error }
    : undefined;

  return (
    <>
      <SignUpForm invitation={invitation} message={message} />
    </>
  );
}
