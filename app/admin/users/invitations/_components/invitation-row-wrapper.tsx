"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import RevokeInvitationDialog from "./revoke-invitation-dialog";

export function InvitationRowWrapper({
  invitation,
  revokeAction,
}: {
  invitation: { id: string; email: string; role: "admin" | "user" };
  revokeAction: (id: string) => Promise<{ error: string | null }>;
}) {
  const handleRevoke = async () => {
    await revokeAction(invitation.id);
  };

  return (
    <TableRow>
      <TableCell>
        <span className="w-25 block truncate">{invitation.id}</span>
      </TableCell>
      <TableCell>{invitation.email}</TableCell>
      <TableCell>{invitation.role.toUpperCase()}</TableCell>
      <TableCell>
        <RevokeInvitationDialog onConfirm={handleRevoke} />
      </TableCell>
    </TableRow>
  );
}
