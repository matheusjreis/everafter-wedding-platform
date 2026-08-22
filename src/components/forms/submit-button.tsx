"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SubmitButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  pendingLabel?: string;
};

export function SubmitButton({ children, className, disabled = false, pendingLabel = "Salvando..." }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} className={cn("w-full", className)}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
