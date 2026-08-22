"use client";

import { Eye, EyeOff } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = isVisible ? EyeOff : Eye;

  return (
    <div className="relative">
      <input
        {...props}
        type={isVisible ? "text" : "password"}
        className={cn(
          "h-11 w-full rounded-md border bg-background px-3 pr-12 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
      />
      <button
        type="button"
        aria-label={isVisible ? "Ocultar senha" : "Mostrar senha"}
        title={isVisible ? "Ocultar senha" : "Mostrar senha"}
        onClick={() => setIsVisible((current) => !current)}
        className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
