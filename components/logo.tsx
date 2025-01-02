import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface Props {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const logoSizes = cva("", {
  variants: {
    state: {
      sm: "w-8 h-8",
      md: "w-12 h-12",
      lg: "w-20 h-20",
      xl: "w-28 h-28",
      "2xl": "w-36 h-36",
    },
  },
});

function Logo({ className, size = "md" }: Props) {
  return (
    <Link
      className={cn("bg-primary w-fit h-fit rounded-full p-[2px]", className)}
      href="/">
      <Image
        alt="Northern Lights Poker Tour Stats"
        className={logoSizes({ state: size })}
        src="https://utfs.io/f/gQX0Qsocx19Cp52PBkANqt1OD4SxAdVXe8my9vU3oWwLaHlP"
        width={100}
        height={100}
      />
      <span className=" sr-only">Northern Lights Poker Tour</span>
    </Link>
  );
}

export default Logo;
