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
} from "@/components/ui/alert-dialog";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const STRUCTURES_HREF = "/admin/clock/structures";

// Back to the list, asking first when there are unsaved changes.
function BackToStructuresLink({ isDirty }: { isDirty: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <Link
        href={STRUCTURES_HREF}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary"
        onClick={(event) => {
          if (!isDirty) return;
          event.preventDefault();
          setConfirming(true);
        }}
      >
        <ChevronLeft size={16} /> Blind Structures
      </Link>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
            <AlertDialogDescription>
              Your changes to this template will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push(STRUCTURES_HREF)}>
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default BackToStructuresLink;
