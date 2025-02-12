"use client"; // Required for interactive components in Next.js App Router

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function Login(props: {
  searchParams: Promise<Message | undefined>;
}) {
  const [message, setMessage] = useState<Message | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    props.searchParams.then((data) => {
      if (data) {
        setMessage(data);
      } else {
        setMessage({ message: "" }); // ✅ Default that matches `Message` type
      }
    });
  }, [props.searchParams]); // Track `searchParams` properly

  return (
    <form className="w-full max-w-sm max-h-fit flex flex-col">
      <h1 className="text-2xl font-medium">Sign in</h1>
      <div className="flex w-full flex-col gap-2 [&>input]:mb-3 mt-8">
        <Label htmlFor="email">Email</Label>
        <Input
          className="text-base"
          name="email"
          placeholder="you@example.com"
          required
        />
        <Label htmlFor="password">Password</Label>
        <div className="w-full relative">
          <Input
            className="text-base pr-10"
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Your password"
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <Link
            className="text-xs text-foreground hover:underline absolute right-12 top-1/2 -translate-y-1/2"
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
          Don't have an account? Contact admin for account access
        </p>
        {message && <FormMessage message={message} />}{" "}
        {/* Ensure message is valid */}
      </div>
    </form>
  );
}
