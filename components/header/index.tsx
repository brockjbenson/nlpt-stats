import React from "react";
import Nav from "./nav";
import { ThemeSwitcher } from "../theme-switcher";
import HeaderAuth from "@/components/header-auth";
import Logo from "../logo";
import { createClient } from "@/utils/supabase/server";
import { signOutAction } from "@/app/actions";
import { Button } from "../ui/button";
import Link from "next/link";

async function Header() {
  const db = await createClient();

  const {
    data: { user },
  } = await db.auth.getUser();

  return (
    <header className="border-t-2 hidden md:block sticky top-0 py-6 bg-background/50 backdrop-blur-xl z-50 border-t-primary border-b border-b-neutral-600">
      <div className=" max-w-screen-xl grid grid-cols-[100px_1fr_100px] px-4 justify-between items-center mx-auto">
        <Logo />
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
                href="/sign-in">
                Sign in
              </Link>
            </Button>
          )}
        </div>
        <div className="gap-2 flex md:hidden">
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}

export default Header;
