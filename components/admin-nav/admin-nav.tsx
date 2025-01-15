import React from "react";
import Link from "next/link";

function AdminNav() {
  return (
    <div className="w-full">
      <ul className="pl-2 flex item-center justify-center">
        <li>
          <Link className="hover:text-primary" href="/admin">
            Dashboard
          </Link>
        </li>
        <li>
          <Link className="hover:text-primary" href="/admin/members">
            Members
          </Link>
        </li>
        <li>
          <Link className="hover:text-primary" href="/admin/stats">
            Stats
          </Link>
        </li>
        <li>
          <Link className="hover:text-primary" href="/admin/records">
            Records
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default AdminNav;
