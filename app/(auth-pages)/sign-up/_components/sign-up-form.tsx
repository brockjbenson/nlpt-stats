// ============================================
// CLEAN SIGNUP FORM WITH VALIDATION
// app/sign-up/_components/sign-up-form.tsx
// ============================================

"use client";

import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { FormMessage, Message } from "@/components/form-message";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { signUpAction } from "../_actions";
import type { Invitation } from "../_actions";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

// Password validation requirements
const PASSWORD_REQUIREMENTS = {
  minLength: MIN_PASSWORD_LENGTH,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /[0-9]/,
  hasSpecialChar: /[^A-Za-z0-9]/,
};

function SignUpForm({
  invitation,
  message,
}: {
  invitation: Invitation;
  message?: Message;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Validation states
  const [validations, setValidations] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
    passwordsMatch: false,
  });

  // Validate password whenever it changes
  useEffect(() => {
    if (password) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValidations({
        minLength: password.length >= MIN_PASSWORD_LENGTH,
        hasUppercase: PASSWORD_REQUIREMENTS.hasUppercase.test(password),
        hasLowercase: PASSWORD_REQUIREMENTS.hasLowercase.test(password),
        hasNumber: PASSWORD_REQUIREMENTS.hasNumber.test(password),
        hasSpecialChar: PASSWORD_REQUIREMENTS.hasSpecialChar.test(password),
        passwordsMatch: password === confirmPassword && confirmPassword !== "",
      });
    }
  }, [password, confirmPassword]);

  // Check if form is valid
  const isFormValid = () => {
    return (
      validations.minLength &&
      validations.hasUppercase &&
      validations.hasLowercase &&
      validations.hasNumber &&
      validations.hasSpecialChar &&
      validations.passwordsMatch &&
      password.length <= MAX_PASSWORD_LENGTH
    );
  };

  console.log(invitation.email);

  return (
    <form className="w-full max-w-sm flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-medium mb-2">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          {`You've`} been invited as{" "}
          {invitation.role === "admin" ? "an administrator" : "a user"}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Email Field */}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={invitation.email}
            readOnly
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            This email was invited to join
          </p>
        </div>

        {/* Password Field */}
        <div className="relative">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              className="mt-1"
              required
            />
            <button
              type="button"
              className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground/70"
              onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Password Requirements */}
        <div className="flex flex-col gap-1 pl-2">
          <RequirementItem
            met={validations.minLength}
            text={`At least ${MIN_PASSWORD_LENGTH} characters`}
          />
          <RequirementItem
            met={validations.hasUppercase}
            text="One uppercase letter (A-Z)"
          />
          <RequirementItem
            met={validations.hasLowercase}
            text="One lowercase letter (a-z)"
          />
          <RequirementItem
            met={validations.hasNumber}
            text="One number (0-9)"
          />
          <RequirementItem
            met={validations.hasSpecialChar}
            text="One special character (!@#$%^&*)"
          />
        </div>

        {/* Confirm Password Field */}
        <div>
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            name="confirm-password"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            className="mt-1"
            required
          />
          {confirmPassword && (
            <div className="mt-2">
              {validations.passwordsMatch ? (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  Passwords match
                </p>
              ) : (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <X className="h-4 w-4" />
                  Passwords do not match
                </p>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <SubmitButton
          className="mt-2 h-12 font-semibold"
          formAction={(formData: FormData) =>
            signUpAction(formData, invitation)
          }
          pendingText="Creating account..."
          disabled={!isFormValid()}>
          Create account
        </SubmitButton>

        {/* Error Message */}
        {message && <FormMessage message={message} />}

        {/* Sign In Link */}
        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <Link
            className="text-foreground hover:text-primary font-medium underline"
            href="/sign-in">
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
}

export default SignUpForm;

// Requirement checker component
const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
  <div className="flex items-center gap-2 text-sm">
    {met ? (
      <Check className="h-4 w-4 text-green-600" />
    ) : (
      <X className="h-4 w-4 text-muted" />
    )}
    <span className={met ? "text-green-600" : "text-muted"}>{text}</span>
  </div>
);
