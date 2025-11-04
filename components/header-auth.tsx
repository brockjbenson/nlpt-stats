import { signOutAction } from "@/app/actions";
import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./ui/sheet";
import { RxHamburgerMenu } from "react-icons/rx";

export default async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = user?.user_metadata.role === "admin";

  return (
    <Sheet>
      <SheetTrigger asChild>
        <RxHamburgerMenu className="ml-auto" size={32} />
      </SheetTrigger>
      <SheetContent>
        <SheetTitle className="w-full flex items-center font-bold justify-center mb-8 text-2xl">
          NLPT Stats
        </SheetTitle>
        {isAdmin && (
          <div className="mb-8">
            <p className="text-2xl font-semibold mb-2">Admin Nav</p>
            <ul className="flex flex-col gap-2">
              <li>
                <Link href="/admin/users">Users</Link>
              </li>
              <li>
                <Link href="/admin/stats/tournaments">Tournaments</Link>
              </li>
              <li>
                <Link href="/admin/stats/cash">Cash</Link>
              </li>
              <li>
                <Link href="/admin/members">Members</Link>
              </li>
              <li>
                <Link href="/admin/seasons">Seasons</Link>
              </li>
            </ul>
          </div>
        )}
        <div className="mb-8">
          <p className="text-2xl font-semibold mb-2">Navigation</p>
          <ul className="flex flex-col gap-2">
            <li>
              <Link href="/stats/tournaments">Tournaments</Link>
            </li>
            <li>
              <Link href="/stats/cash?year=2025">Cash</Link>
            </li>
            <li>
              <Link href="/members">Members</Link>
            </li>
            <li>
              <Link href="/poy">POY Standings</Link>
            </li>
            <li>
              <Link href="/nlpi">NLPI Rankings</Link>
            </li>
            <li>
              <Link href="/records">Records</Link>
            </li>
          </ul>
        </div>
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
      </SheetContent>
    </Sheet>
  );
}
