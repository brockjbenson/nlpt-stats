import React from "react";
import Image, { ImageProps } from "next/image";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"; // Ensure you have `cn` utility from Tailwind

type ZoomValues = "1.5" | "2" | "2.5";

interface Props extends Omit<ImageProps, "width" | "height"> {
  className?: string;
  zoom?: ZoomValues;
  imageClassName?: string; // Optional prop for additional image styles
}

const zoomStyles = cva("", {
  variants: {
    zoom: {
      default: "scale-[1]",
      "1.5": "scale-[1.5]",
      "2": "scale-[2]",
      "2.5": "scale-[2.5]",
    },
  },
  defaultVariants: {
    zoom: "default", // ✅ Set a valid default zoom level (must match the variant keys)
  },
});

const MemberImage: React.FC<Props> = ({
  className,
  zoom = null,
  imageClassName,
  ...props
}) => {
  return (
    <figure
      className={cn(
        "flex items-center justify-center w-full aspect-square overflow-hidden rounded-full",
        className
      )}>
      <Image
        className={cn("w-full h-auto", zoomStyles({ zoom }), imageClassName)}
        width={500}
        height={500}
        {...props}
      />
    </figure>
  );
};

export default MemberImage;
