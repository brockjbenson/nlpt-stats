"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";

export function InviteUserDialog() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleInvite(e: React.FormEvent) {
    const supabase = createClient();
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log(user);

      if (!user) {
        setError("You must be logged in");
        setLoading(false);
        return;
      }

      // Call your API route
      const response = await fetch("/api/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          role,
          userId: user.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to send invitation");
        setLoading(false);
        return;
      }

      setSuccess(
        result.emailSent
          ? `✓ Invitation sent to ${email}`
          : `⚠ Invitation created but email failed`,
      );
      setEmail("");

      // Optional: Refresh your invitations list
      // refreshInvitations();
    } catch (err) {
      console.error("Error:", err);
      setError("An unexpected error occurred");
    }

    setLoading(false);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default">Invite User</Button>
      </DialogTrigger>
      <DialogContent className="w-[90%] max-w-lg">
        <DialogTitle>Invite User</DialogTitle>
        <form onSubmit={handleInvite} className="space-y-4">
          <Field>
            <Label className="block text-sm font-medium mb-1">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </Field>

          <Field>
            <Label className="block text-sm font-medium mb-1">Role</Label>
            <Select
              onValueChange={(e) => setRole(e as "admin" | "user")}
              value={role}>
              <SelectTrigger className="w-full h-12 rounded border border-neutral-500 bg-background">
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {error && (
            <div className="p-3 bg-red-50 text-red-800 rounded">{error}</div>
          )}

          {success && (
            <div className="p-3 bg-green-50 text-green-800 rounded">
              {success}
            </div>
          )}

          <Button type="submit" className="w-full mt-4" disabled={loading}>
            {loading ? "Sending..." : "Send Invitation"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
