import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <form className="w-full max-w-sm max-h-fit flex flex-col">
      <h1 className="text-2xl font-medium">Sign in</h1>
      <div className="flex w-full flex-col gap-2 [&>input]:mb-3 mt-8">
        <Label htmlFor="email">Email</Label>
        <Input name="email" placeholder="you@example.com" required />
        <Label htmlFor="password">Password</Label>
        <div className="w-full relative">
          <Input
            type="password"
            name="password"
            placeholder="Your password"
            required
          />
          <Link
            className="text-xs text-foreground hover:underline absolute right-2 top-1/2 -translate-y-1/2"
            href="/forgot-password">
            Forgot Password?
          </Link>
        </div>
        <SubmitButton
          className="mt-4 h-12 font-semibold"
          pendingText="Signing In..."
          formAction={signInAction}>
          Sign in
        </SubmitButton>
        <p className="text-sm text-foreground">
          Don't have an account?{" "}
          <Link
            className="text-foreground hover:text-primary font-medium underline"
            href="/sign-up">
            Sign up
          </Link>
        </p>
        <FormMessage message={searchParams} />
      </div>
    </form>
  );
}
