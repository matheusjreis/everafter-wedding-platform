"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

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
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <input type="hidden" name={name} value={value} />
      <div className="relative">
        <details className="group">
          <summary className="flex h-12 cursor-pointer list-none items-center justify-between rounded-lg border bg-background px-4 text-sm shadow-sm transition hover:border-primary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
            <span>
              <span className="block font-semibold">{selectedOption.label}</span>
              {selectedOption.description ? (
                <span className="block text-xs text-muted-foreground">{selectedOption.description}</span>
              ) : null}
            </span>
            <ChevronDown className="size-4 text-muted-foreground transition group-open:rotate-180" />
          </summary>
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border bg-card p-1 shadow-lg">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={(event) => {
                  setValue(option.value);
                  event.currentTarget.closest("details")?.removeAttribute("open");
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition hover:bg-muted",
                  option.value === value ? "bg-muted text-foreground" : "text-muted-foreground"
                )}
              >
                <span>
                  <span className="block font-medium">{option.label}</span>
                  {option.description ? <span className="block text-xs">{option.description}</span> : null}
                </span>
                {option.value === value ? <Check className="size-4 text-primary" /> : null}
              </button>
            ))}
          </div>
        </details>
      </div>
    </label>
  );
}
