import AdminNav from "@/components/admin-nav/admin-nav";
import Header from "@/components/header";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />

      <main className="min-h-screen flex flex-col items-center">
        <div className="flex-1 w-full flex flex-col gap-20 items-center">
          <div className="grid grid-cols-[15rem_1fr] gap-20 w-full max-w-screen-xl p-4">
            <AdminNav />
            {children}
          </div>
        </div>
      </main>
    </>
  );
}
