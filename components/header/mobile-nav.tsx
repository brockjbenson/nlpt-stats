import React from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "../ui/sheet";
import { Menu } from "lucide-react";

interface Props {
  className?: string;
  excludeAdmin?: boolean;
}

function MobileNav({ excludeAdmin, className }: Props) {
  return (
    <Sheet>
      <SheetTrigger>
        <Menu className="block w-8 h-8 lg:hidden" />
      </SheetTrigger>
      <SheetContent side="right">
        <SheetTitle>Menu</SheetTitle>
        <nav className={className}>
          <ul>
            <li>
              <a href="/stats">Stats</a>
            </li>
            <li>
              <a href="/seasons">Seasons</a>
            </li>
            <li>
              <a href="/members">Members</a>
            </li>
            <li>
              <a href="/cash">Cash</a>
            </li>
            <li>
              <a href="/tournaments">Tournaments</a>
            </li>
            <li>
              <a href="/games">Games</a>
            </li>
            <li>
              <a href="/settings">Settings</a>
            </li>
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export default MobileNav;
