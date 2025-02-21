import Header from "@/components/header";
import MobileNav from "@/components/header/mobile-nav";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main
        id="main-wrapper"
        className="flex animate-in flex-col mx-auto pb-8 w-full lg:px-4 items-center">
        <div className="max-w-screen-xl mx-auto w-full">{children}</div>
      </main>
      <MobileNav />
    </>
  );
}
