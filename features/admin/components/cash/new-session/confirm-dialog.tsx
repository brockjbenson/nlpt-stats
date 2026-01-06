import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircleIcon } from "lucide-react";

function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertCircleIcon className="w-16 h-16 mx-auto text-primary" />
        <AlertDialogTitle>Have you added every session?</AlertDialogTitle>
        <AlertDialogDescription>
          Make sure you have added every session before clicking yes.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>No, Go Back</AlertDialogCancel>
          <AlertDialogAction
            className="bg-primary px-12 mx-auto"
            onClick={onConfirm}>
            Yes, Add Sessions
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
export default ConfirmDialog;
