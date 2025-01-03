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
      <main className="flex flex-col mt-4 items-center">
        <div className="flex flex-col gap-12 w-full max-w-screen-xl p-4">
          <h1 className="w-full text-left">Admin Dashboard</h1>
          <AdminNav />
          <div className="w-full">{children}</div>
        </div>
      </main>
    </>
  );
}
