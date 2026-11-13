import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { MenuIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { NavLinks } from "./client";
import { MenuNotificationDot } from "./menu-notification-dot";
import { SwipeNavSheet } from "./swipe-nav-sheet";

async function MobileNav() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <SwipeNavSheet
      trigger={
        <>
          <MenuIcon className="ml-auto" size={32} />
          <MenuNotificationDot />
        </>
      }
    >
      <h2 className="text-foreground font-semibold w-full border-b px-4 pb-4 mb-4 border-neutral-700 flex items-center gap-4">
        <Image src="/icons/nlpt-no-bg.png" alt="logo" width={40} height={40} />
        NLPT Stats
      </h2>
      <NavLinks showAdmin={!!user} />
      {user ? (
        <form
          className="flex mt-auto w-64 items-start mx-auto justify-center"
          action={signOutAction}
        >
          <Button type="submit" className="w-full h-12" variant={"outline"}>
            Sign out
          </Button>
        </form>
      ) : (
        <Button
          asChild
          className="w-64 mt-auto mx-auto h-12"
          variant={"default"}
        >
          <Link
            className=" self-end ml-auto align-middle w-fit"
            href="/sign-in"
          >
            Sign in
          </Link>
        </Button>
      )}
    </SwipeNavSheet>
  );
}

export default MobileNav;
