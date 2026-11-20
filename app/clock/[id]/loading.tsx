import Image from "next/image";

// Shown while the clock loads. The page waits on its params, so with
// Cache Components it needs this Suspense boundary.
function Loading() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center">
      <Image
        src="/icons/nlpt-no-bg.png"
        alt="Loading"
        width={100}
        height={100}
      />
    </div>
  );
}

export default Loading;
