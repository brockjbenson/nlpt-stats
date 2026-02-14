import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { InviteUserDialog } from "./invite-user-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/utils/supabase/server";
import ErrorHandler from "@/components/error-handler";

async function AdminUsersMain() {
  const db = await createClient();

  const { data: profiles, error: profileError } = await db
    .from("profiles")
    .select("*");

  if (profileError) {
    return (
      <ErrorHandler
        pageTitle="Users"
        title="Error Fetching Users"
        errorMessage={profileError.message}
      />
    );
  }
  return (
    <div className="px-2">
      <Card>
        <CardHeader className="justify-between">
          <CardTitle>All Users</CardTitle>
          <InviteUserDialog />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    <span className="w-25 block truncate">{profile.id}</span>
                  </TableCell>
                  <TableCell>{profile.email}</TableCell>
                  <TableCell>{profile.role.toUpperCase()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminUsersMain;
