"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type ImagePreset = {
  label: string;
  value: string;
};

type ImagePresetPickerProps = {
  value: string;
  onChange: (value: string) => void;
  options: ImagePreset[];
};

export function ImagePresetPicker({ value, onChange, options }: ImagePresetPickerProps) {
  if (!options.length) {
    return null;
  }

  return (
    <div className="grid gap-2">
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "group relative overflow-hidden rounded-lg border bg-card text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md",
              value === option.value ? "border-primary ring-2 ring-primary/20" : "border-border"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={option.value} alt="" className="aspect-video w-full object-cover" />
            <div className="flex items-center justify-between px-3 py-2 text-sm font-medium">
              <span>{option.label}</span>
              {value === option.value ? <Check className="size-4 text-primary" /> : null}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
