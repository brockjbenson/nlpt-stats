"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

function NavigateBack() {
  const router = useRouter();
  return (
    <button
      className="bg-transparent border-none text-primary text-base flex md:hidden gap-1 items-center"
      onClick={(e) => {
        e.preventDefault();
        router.back();
      }}>
      <ChevronLeft className="w-6 h-6" />
      Back
    </button>
  );
}

export default NavigateBack;
