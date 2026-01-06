import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { XCircle } from "lucide-react";

function ErrorDialog({
  error,
  onClose,
}: {
  error: string | undefined;
  onClose: () => void;
}) {
  return (
    <AlertDialog open={error !== undefined} onOpenChange={onClose}>
      <AlertDialogContent className="border-destructive">
        <XCircle className="w-16 h-16 mx-auto text-destructive" />
        <AlertDialogTitle>Error Adding Sessions</AlertDialogTitle>
        <AlertDialogDescription>{error}</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogAction
            className="bg-muted px-12 mx-auto"
            onClick={onClose}>
            Okay
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ErrorDialog;
