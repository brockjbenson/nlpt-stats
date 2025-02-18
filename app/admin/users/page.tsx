import PageHeader from "@/components/page-header/page-header";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminSupabase } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import React from "react";

async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { users },
  } = await adminSupabase.auth.admin.listUsers();

  console.log(users);

  return (
    <div className="mx-auto max-w-screen-xl px-2">
      <h2 className="text-xl mb-8 font-semibold">Users</h2>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead></TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.user_metadata.name || "-"}</TableCell>
                <TableCell>{user.user_metadata.phone || "-"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.user_metadata.role}</TableCell>
                <TableCell>
                  <Link href={`/admin/user/${user.id}`}></Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default Page;
