import React from "react";
import Logo from "@/components/logo";

function page() {
  return (
    <div className="h-screen w-screen flex flex-col items-center gap-20 justify-center">
      <Logo size="xl" />
      <h1>Coming Soon</h1>
    </div>
  );
}

export default page;
