"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { duplicateStructureAction } from "@/features/clock/actions/structures";
import { useToast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";
import { useTransition } from "react";

function DuplicateStructureButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const duplicate = (): void => {
    startTransition(async () => {
      const result = await duplicateStructureAction(id);
      toast({
        title: result.success ? "Template duplicated" : "Couldn't duplicate",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    });
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={duplicate}
      disabled={isPending}
      aria-label={`Duplicate ${name}`}
    >
      {isPending ? <Spinner /> : <Copy size={16} />}
    </Button>
  );
}

export default DuplicateStructureButton;
