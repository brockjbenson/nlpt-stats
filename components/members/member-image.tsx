"use client";

import React, { useState } from "react";
import Image, { ImageProps } from "next/image";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

type ZoomValues = "1.5" | "2" | "2.5";

interface Props extends Omit<ImageProps, "width" | "height"> {
  className?: string;
  zoom?: ZoomValues;
  imageClassName?: string;
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
    zoom: "default",
  },
});

const MemberImage: React.FC<Props> = ({
  className,
  zoom = null,
  imageClassName,
  alt = "Member image",
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <figure
      className={cn(
        "flex items-center justify-center w-full aspect-square overflow-hidden rounded-full relative",
        className
      )}>
      {/* Shimmer skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-linear-to-r from-muted via-muted/50 to-muted animate-pulse bg-size-[200%_100%]" />
      )}

      <Image
        alt={alt}
        className={cn(
          "w-full h-auto transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          zoomStyles({ zoom }),
          imageClassName
        )}
        width={500}
        height={500}
        onLoad={() => setIsLoading(false)}
        {...props}
      />
    </figure>
  );
};

export default MemberImage;
