import React from "react";
import Nav from "./nav";
import { ThemeSwitcher } from "../theme-switcher";
import HeaderAuth from "@/components/header-auth";
import Logo from "../logo";

function Header() {
  return (
    <header className="border-t-2 sticky top-0 p-6 bg-background/50 backdrop-blur-xl z-50 border-t-primary border-b border-b-neutral-600">
      <div className=" max-w-screen-xl flex justify-between items-center mx-auto">
        <Logo />
        <Nav />
        <div className="flex gap-2">
          <ThemeSwitcher />
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}

export default Header;
