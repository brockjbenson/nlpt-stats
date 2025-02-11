import React from "react";
import Nav from "./nav";
import { ThemeSwitcher } from "../theme-switcher";
import HeaderAuth from "@/components/header-auth";
import Logo from "../logo";
import { createClient } from "@/utils/supabase/server";
import MobileNav from "./mobile-nav";

async function Header() {
  const db = await createClient();

  const {
    data: { user },
  } = await db.auth.getUser();

  return (
    <header className="border-t-2 hidden md:block sticky top-0 py-6 bg-background/50 backdrop-blur-xl z-50 border-t-primary border-b border-b-neutral-600">
      <div className=" max-w-screen-xl flex px-4 justify-between items-center mx-auto">
        <Logo />
        <Nav excludeAdmin={!user} />
        <div className="gap-2 hidden md:flex">
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}

export default Header;
