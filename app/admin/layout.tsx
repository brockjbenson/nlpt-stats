import Header from "@/components/header";
import MobileNav from "@/components/header/mobile-nav";
import PageHeader from "@/components/page-header/page-header";

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
        className="flex flex-col mx-auto w-full lg:px-4 items-center">
        <div className="max-w-screen-xl mx-auto w-full">
          <PageHeader title="Admin" />
          {children}
        </div>
      </main>
      <MobileNav />
    </>
  );
}
