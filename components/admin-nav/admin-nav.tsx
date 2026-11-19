import React from "react";
import Link from "next/link";
import { ADMIN_LINK_GROUPS } from "./admin-links";

// The desktop Admin menu: one column per group of admin links.
function AdminNav() {
  return (
    <div className="w-screen flex justify-center py-2">
      <ul className="flex gap-16">
        {ADMIN_LINK_GROUPS.map((group) => (
          <li key={group.title} className="flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted">
              {group.title}
            </p>
            <ul className="flex flex-col gap-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    className="whitespace-nowrap text-white hover:text-primary"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminNav;
