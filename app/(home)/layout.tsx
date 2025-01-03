import Header from "@/components/header";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex flex-col max-w-screen-xl mx-auto w-full p-4 items-center">
        {children}
      </main>
    </>
  );
}
