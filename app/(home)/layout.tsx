import Header from "@/components/header";
import RefreshWrapper from "@/components/refresh-wrapper/refresh-wrapper";

export default async function Layout({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string; // Accept title from metadata
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
