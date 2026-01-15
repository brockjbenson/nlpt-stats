"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast"; // Assuming you have toast notifications
import { deleteSeason } from "@/app/admin/seasons/actions";
import { Spinner } from "@/components/ui/spinner";

function RemoveSeason({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    affectedWeeks: number;
    affectedSessions: number;
  } | null>(null);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      // First call - check what will be deleted
      const result = await deleteSeason(id, false);

      if ("error" in result) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        setIsDeleting(false);
        return;
      }

      if ("requiresConfirmation" in result) {
        // Store the confirmation data and keep dialog open
        setConfirmationData({
          affectedWeeks: result.affectedWeeks,
          affectedSessions: result.affectedSessions,
        });
        setIsDeleting(false);
        return;
      }

      // Success
      toast({
        title: "Success",
        description: "Season deleted successfully",
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmedDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteSeason(id, true);

      if ("error" in result) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        setIsDeleting(false);
        return;
      }

      toast({
        title: "Success",
        description: "Season deleted successfully",
      });
      setOpen(false);
      setConfirmationData(null);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setConfirmationData(null);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Trash2 className="text-red-600" size={16} />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>
          {confirmationData
            ? "Confirm Deletion"
            : "Are you sure you want to remove this season?"}
        </AlertDialogTitle>
        <div>
          {confirmationData ? (
            <>
              This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>
                  <strong>{confirmationData.affectedWeeks}</strong> week
                  {confirmationData.affectedWeeks !== 1 ? "s" : ""}
                </li>
                <li>
                  <strong>{confirmationData.affectedSessions}</strong> session
                  {confirmationData.affectedSessions !== 1 ? "s" : ""}
                </li>
              </ul>
              <p className="mt-2 font-semibold">
                This action cannot be undone.
              </p>
            </>
          ) : (
            "This will remove the season and all associated data. This action cannot be undone."
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} onClick={handleCancel}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isDeleting}
            className="bg-red-600 text-destructive-foreground hover:bg-red-600/90"
            onClick={(e) => {
              e.preventDefault();
              if (confirmationData) {
                handleConfirmedDelete();
              } else {
                handleDelete();
              }
            }}>
            {isDeleting ? (
              <Spinner />
            ) : confirmationData ? (
              "Yes, Delete Everything"
            ) : (
              "Remove Season"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default RemoveSeason;
