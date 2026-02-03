import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createClient } from "@/utils/supabase/server";
import { MenuIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { NavLinks } from "./client";
import { MenuNotificationDot } from "./menu-notification-dot";

async function MobileNav() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <Sheet>
      <SheetTrigger className="relative">
        <MenuIcon className="ml-auto" size={32} />
        <MenuNotificationDot />
      </SheetTrigger>
      <SheetContent className="px-0! gap-0" hideCloseButton side="right">
        <SheetTitle className="w-full border-b px-4 pb-4 mb-4 border-neutral-700 flex items-center gap-4">
          <Image
            src="/icons/nlpt-no-bg.png"
            alt="logo"
            width={40}
            height={40}
          />
          NLPT Stats
        </SheetTitle>
        <NavLinks showAdmin={!!user} />
        {user ? (
          <form
            className="flex mt-auto w-64 items-start mx-auto justify-center"
            action={signOutAction}>
            <Button type="submit" className="w-full h-12" variant={"outline"}>
              Sign out
            </Button>
          </form>
        ) : (
          <Button
            asChild
            className="w-64 mt-auto mx-auto h-12"
            variant={"default"}>
            <Link
              className=" self-end ml-auto align-middle w-fit"
              href="/sign-in">
              Sign in
            </Link>
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default MobileNav;
