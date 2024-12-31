import React from "react";
import Nav from "./nav";
import { ThemeSwitcher } from "../theme-switcher";
import HeaderAuth from "@/components/header-auth";
import Image from "next/image";
import Link from "next/link";

function Header() {
  return (
    <header className="border-t-2 p-4 border-t-primary border-b border-b-neutral-600">
      <div className=" max-w-screen-xl flex justify-between items-center mx-auto">
        <Link href="/">
          <Image
            alt="Northern Lights Poker Tour Stats"
            className="w-20 h-20"
            src="https://utfs.io/f/gQX0Qsocx19Cp52PBkANqt1OD4SxAdVXe8my9vU3oWwLaHlP"
            width={100}
            height={100}
          />
        </Link>
        <Nav />
        <div className="flex gap-4">
          <ThemeSwitcher />
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}

export default Header;
