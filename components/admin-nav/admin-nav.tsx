import React from "react";
import Link from "next/link";

function AdminNav() {
  return (
    <div className="w-screen flex justify-center">
      <ul className="flex gap-12">
        <li className="flex flex-col">
          <Link className="whitespace-nowrap p-1" href="/admin/stats/cashgames">
            Cash
          </Link>
          <ul>
            <li>
              <Link
                className="whitespace-nowrap p-1"
                href="/admin/stats/cashgames/new">
                Add Sessions
              </Link>
            </li>
          </ul>
        </li>
        <li>
          <Link
            className="whitespace-nowrap pb-1 border-b-2 border-foreground hover:border-primary"
            href="/admin/members">
            Members
          </Link>
        </li>
        <li>
          <Link
            className="whitespace-nowrap pb-1 border-b-2 border-foreground hover:border-primary"
            href="/admin/records">
            Records
          </Link>
        </li>
        <li>
          <Link
            className="whitespace-nowrap pb-1 border-b-2 border-foreground hover:border-primary"
            href="/admin/seasons">
            Seasons
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default AdminNav;
