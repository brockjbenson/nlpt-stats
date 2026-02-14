"use client";

import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";
import { completeProfileAction } from "../_actions";
import { FormMessage, Message } from "@/components/form-message";

function CompleteProfileForm({
  role,
  userId,
  message,
  email,
}: {
  role: "admin" | "user";
  userId: string;
  message?: Message;
  email: string;
}) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");

  return (
    <form className="w-full max-w-sm flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-medium mb-2">Complete your profile</h1>
      </div>
      <div className="flex flex-col gap-4">
        {/* Email Field */}
        <Input
          type="hidden"
          className="hidden"
          id="user-id"
          name="user-id"
          value={userId}
        />
        <Input
          type="hidden"
          className="hidden"
          id="email"
          name="email"
          value={email}
        />
        <div>
          <Label htmlFor="first-name">First Name*</Label>
          <Input
            id="first-name"
            name="first-name"
            type="text"
            className="mt-1"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="last-name">Last Name*</Label>
          <Input
            id="last-name"
            name="last-name"
            type="text"
            className="mt-1"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            name="role"
            type="text"
            className="mt-1 bg-muted/20 opacity-50 cursor-not-allowed"
            value={role.slice(0, 1).toUpperCase() + role.slice(1)}
            readOnly
          />
        </div>
        <SubmitButton
          className="mt-2 h-12 font-semibold"
          formAction={(formData: FormData) => completeProfileAction(formData)}
          disabled={!firstName || !lastName}
          pendingText="Completing profile...">
          Complete profile
        </SubmitButton>
      </div>
      {message && <FormMessage message={message} />}
    </form>
  );
}

export default CompleteProfileForm;
