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

type Props = {
  href: string;
  // Where the link goes, as "Blind Structures" or "Clock".
  label: string;
  // There are unsaved changes, so ask before leaving.
  isDirty: boolean;
  // What the confirm dialog says will be lost.
  description: string;
};

// The back link above an editor, asking first when there are unsaved
// changes.
function BackLink({ href, label, isDirty, description }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary"
        onClick={(event) => {
          if (!isDirty) return;
          event.preventDefault();
          setConfirming(true);
        }}
      >
        <ChevronLeft size={16} /> {label}
      </Link>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push(href)}>
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default BackLink;
