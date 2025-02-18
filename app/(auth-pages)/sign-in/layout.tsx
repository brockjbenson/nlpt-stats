import Logo from "@/components/logo";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Logo className="absolute top-8" size="xl" />
      {children}
    </>
  );
}
