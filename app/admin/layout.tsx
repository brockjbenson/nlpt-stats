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
      <main
        id="main-wrapper"
        className="flex overflow-y-auto flex-col mx-auto w-full lg:px-4 items-center">
        <div className="max-w-screen-xl mx-auto w-full">{children}</div>
      </main>
    </>
  );
}
