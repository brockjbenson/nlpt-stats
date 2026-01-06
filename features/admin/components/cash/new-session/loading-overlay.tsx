import { Spinner } from "@/components/ui/spinner";

function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="w-16 h-16 text-primary" />
        <p className="text-sm text-muted-foreground">Adding sessions...</p>
      </div>
    </div>
  );
}

export default LoadingOverlay;
