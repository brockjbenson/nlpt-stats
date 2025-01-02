import Logo from "@/components/logo";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full px-4 relative h-screen flex flex-col gap-12 items-center justify-center">
      <Logo className="absolute top-8" size="xl" />
      {children}
    </div>
  );
}
