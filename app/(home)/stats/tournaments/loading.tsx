import Image from "next/image";
import React from "react";

function loading() {
  return (
    <div className="w-full h-screen flex items-center justify-center">
      <Image
        src="/icons/nlpt-no-bg.png"
        alt="loading"
        width={100}
        height={100}
      />
    </div>
  );
}

export default loading;
