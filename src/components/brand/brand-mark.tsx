import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  showText?: boolean;
};

export function BrandMark({ className, imageClassName, textClassName, showText = true }: BrandMarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Image
        src="/images/everafter-mark.png"
        alt=""
        width={48}
        height={48}
        priority
        className={cn("size-9 rounded-md object-contain", imageClassName)}
      />
      {showText ? <span className={cn("font-serif text-2xl", textClassName)}>EverAfter</span> : null}
    </span>
  );
}
