"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { deleteStructureAction } from "@/features/clock/actions/structures";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

function DeleteStructureButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const remove = (): void => {
    startTransition(async () => {
      const result = await deleteStructureAction(id);
      if (result.success) {
        setOpen(false);
        toast({ title: "Template deleted", description: `"${name}" is gone.` });
        return;
      }
      toast({
        title: "Couldn't delete",
        description: result.message,
        variant: "destructive",
      });
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label={`Delete ${name}`}>
          <Trash2 className="text-red-600" size={16} />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the template and its levels. Clocks already made from
            it keep their own copy and aren&rsquo;t affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            className="bg-red-600 text-destructive-foreground hover:bg-red-600/90"
            onClick={(event) => {
              // Keep the dialog open until the delete finishes.
              event.preventDefault();
              remove();
            }}
          >
            {isPending ? <Spinner /> : "Delete Template"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteStructureButton;
