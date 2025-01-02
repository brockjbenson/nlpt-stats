import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <div className="w-full flex-1 flex items-center h-screen sm:max-w-md justify-center gap-2 p-4">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <form className="w-full max-w-sm max-h-fit flex flex-col">
      <h1 className="text-2xl font-medium">Sign up</h1>
      <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
        <Label htmlFor="email">Email</Label>
        <Input name="email" placeholder="you@example.com" required />
        <Label htmlFor="password">Password</Label>
        <Input
          type="password"
          name="password"
          placeholder="Your password"
          minLength={6}
          required
        />
        <SubmitButton
          className="mt-1 h-12 font-semibold"
          formAction={signUpAction}
          pendingText="Signing up...">
          Sign up
        </SubmitButton>
        <p className="text-sm text text-foreground">
          Already have an account?{" "}
          <Link
            className="text-foreground hover:text-primary font-medium underline"
            href="/sign-in">
            Sign in
          </Link>
        </p>
        <FormMessage message={searchParams} />
      </div>
    </form>
  );
}
