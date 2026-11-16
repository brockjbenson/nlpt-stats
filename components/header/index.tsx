import React, { Suspense } from "react";
import Nav from "./nav";
import Logo from "../logo";
import { signOutAction } from "@/app/actions";
import { Button } from "../ui/button";
import Link from "next/link";
import { getCurrentUser } from "@/utils/supabase/user";

function Header() {
  return (
    <header className="border-t-2 hidden md:block sticky top-0 py-6 bg-background/50 backdrop-blur-xl z-50 border-t-primary border-b border-b-neutral-600">
      <div className=" max-w-(--breakpoint-xl) grid grid-cols-[100px_1fr_100px] px-4 justify-between items-center mx-auto">
        <Logo />
        {/* The nav's admin menu and the sign in/out button depend on the
            signed-in user, read from the request. The prebuilt page shows the
            public nav until they stream in. */}
        <Suspense
          fallback={
            <>
              <Nav excludeAdmin />
              <div className="hidden md:block" />
            </>
          }
        >
          <UserNav />
        </Suspense>
      </div>
    </header>
  );
}

async function UserNav() {
  const user = await getCurrentUser();

  return (
    <>
      <Nav excludeAdmin={!user} />
      <div className="hidden md:block">
        {user ? (
          <form action={signOutAction}>
            <Button type="submit" size="sm" variant={"outline"}>
              Sign out
            </Button>
          </form>
        ) : (
          <Button asChild size="sm" variant={"outline"}>
            <Link
              className=" self-end ml-auto align-middle w-fit"
              href="/sign-in"
            >
              Sign in
            </Link>
          </Button>
        )}
      </div>
    </>
  );
}

export default Header;
