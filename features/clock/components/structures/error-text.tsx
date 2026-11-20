import type { StructureError } from "@/features/clock/lib/structures";

// The messages for one part of the form, if any.
function ErrorText({ errors }: { errors: StructureError[] }) {
  if (errors.length === 0) return null;
  return (
    <div role="alert" className="flex flex-col gap-1">
      {errors.map((error) => (
        <p key={error.message} className="text-sm text-destructive">
          {error.message}
        </p>
      ))}
    </div>
  );
}

export default ErrorText;
