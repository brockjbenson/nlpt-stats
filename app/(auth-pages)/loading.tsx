import { Spinner } from "@/components/ui/spinner";

// These pages read the request (the signed-in user, the ?message after a
// form submit), so the prebuilt shell shows this until they stream in.
export default function Loading() {
  return <Spinner className="size-8" />;
}
