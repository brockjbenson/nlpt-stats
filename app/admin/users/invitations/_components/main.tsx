import ErrorHandler from "@/components/error-handler";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle } from "lucide-react";
import { InviteUserDialog } from "../../_components/invite-user-dialog";
import { fetchInvitationsAction, revokeInvitationAction } from "../_actions";
import { InvitationRowWrapper } from "./invitation-row-wrapper";

async function InvitationsMain() {
  const { data, error } = await fetchInvitationsAction();

  if (error) {
    return (
      <ErrorHandler
        errorMessage={error}
        pageTitle="Invitations"
        title="Error Fetching Invitations"
      />
    );
  }

  if (data.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertCircle />
          </EmptyMedia>
          <EmptyTitle>No Pending Invitations found.</EmptyTitle>
          <EmptyDescription>
            There are currently no pending invitations. Once invitations have
            been sent you will see them here.
          </EmptyDescription>
          <EmptyContent>
            <InviteUserDialog />
          </EmptyContent>
        </EmptyHeader>
      </Empty>
    );
  }

  //   const accpetedInviations = data.filter(
  //     (invitation) => invitation.accepted !== null,
  //   );
  //   const pendingInvitations = data.filter(
  //     (invitation) => invitation.accepted === null,
  //   );

  return (
    <Card>
      <CardHeader className="justify-between">
        <CardTitle>Pending Invitations</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((invitation) => (
              <InvitationRowWrapper
                key={invitation.id}
                invitation={invitation}
                revokeAction={revokeInvitationAction}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default InvitationsMain;
