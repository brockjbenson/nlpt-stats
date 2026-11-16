import { Spinner } from "@/components/ui/spinner";

// These pages read the signed-in user (and the reset-password ?message), so
// the prebuilt shell shows this until they stream in.
export default function Loading() {
  return (
    <div className="flex w-full justify-center py-16">
      <Spinner className="size-8" />
    </div>
  );
}
