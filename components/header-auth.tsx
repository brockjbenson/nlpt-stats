import { signOutAction } from "@/app/actions";
import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";
import {
  Sheet,
  SheetContent,
  SheetOverlay,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { FaUserCircle } from "react-icons/fa";

export default async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? (
    <Sheet>
      <SheetTrigger asChild>
        <FaUserCircle className="ml-auto" size={32} />
      </SheetTrigger>
      <SheetContent>
        <SheetTitle>Account</SheetTitle>
        <form action={signOutAction}>
          <Button type="submit" size="sm" variant={"outline"}>
            Sign out
          </Button>
        </form>
      </SheetContent>
      <SheetOverlay />
    </Sheet>
  ) : (
    <Button asChild size="sm" variant={"outline"}>
      <Link className=" self-end ml-auto align-middle w-fit" href="/sign-in">
        Sign in
      </Link>
    </Button>
  );
}
