"use client";

import { Check, ChevronDown } from "lucide-react";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

type VisualSelectOption = {
  value: string;
  label: string;
  description?: string;
};

type VisualSelectProps = {
  label: string;
  name: string;
  defaultValue: string;
  options: VisualSelectOption[];
};

export function VisualSelect({ label, name, defaultValue, options }: VisualSelectProps) {
  const [value, setValue] = useState(defaultValue);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className="grid min-w-0 gap-2">
      <label className="text-sm font-medium" htmlFor={`${name}-visual-select`}>
        {label}
      </label>
      <input type="hidden" name={name} value={value} />
      <div className="relative">
        <details ref={detailsRef} className="group">
          <summary
            id={`${name}-visual-select`}
            className="flex h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-md border bg-background px-3 text-sm shadow-sm transition hover:border-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 [&::-webkit-details-marker]:hidden"
          >
            <span className="min-w-0 truncate font-medium">{selectedOption.label}</span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="size-2 rounded-full bg-primary/70" />
              <ChevronDown className="size-4 text-muted-foreground transition group-open:rotate-180" />
            </span>
          </summary>
          <div className="absolute z-20 mt-2 w-full min-w-64 overflow-hidden rounded-lg border bg-card p-1 shadow-lg">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setValue(option.value);
                  detailsRef.current?.removeAttribute("open");
                }}
                className={cn(
                  "flex w-full items-start justify-between gap-3 rounded-md px-3 py-3 text-left text-sm transition hover:bg-muted",
                  option.value === value ? "bg-muted text-foreground" : "text-muted-foreground"
                )}
              >
                <span className="min-w-0">
                  <span className="block font-medium">{option.label}</span>
                  {option.description ? <span className="mt-0.5 block text-xs leading-5">{option.description}</span> : null}
                </span>
                {option.value === value ? <Check className="mt-0.5 size-4 shrink-0 text-primary" /> : null}
              </button>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
