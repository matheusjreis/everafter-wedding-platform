"use client";

import { useEffect, useMemo, useState } from "react";

type WeddingCountdownProps = {
  weddingDate: string | null;
};

type CountdownUnit = {
  label: string;
  shortLabel: string;
  value: number;
};

const secondInMs = 1000;
const minuteInMs = secondInMs * 60;
const hourInMs = minuteInMs * 60;
const dayInMs = hourInMs * 24;

function getRemainingUnits(targetDate: Date): CountdownUnit[] {
  const remaining = Math.max(targetDate.getTime() - Date.now(), 0);
  const days = Math.floor(remaining / dayInMs);
  const hours = Math.floor((remaining % dayInMs) / hourInMs);
  const minutes = Math.floor((remaining % hourInMs) / minuteInMs);
  const seconds = Math.floor((remaining % minuteInMs) / secondInMs);

  return [
    { label: "dias", shortLabel: "DIA", value: days },
    { label: "horas", shortLabel: "HRS", value: hours },
    { label: "minutos", shortLabel: "MIN", value: minutes },
    { label: "segundos", shortLabel: "SEG", value: seconds }
  ];
}

function formatUnitValue(unit: CountdownUnit) {
  const minimumDigits = unit.label === "dias" && unit.value > 99 ? 3 : 2;

  return String(unit.value).padStart(minimumDigits, "0");
}

export function WeddingCountdown({ weddingDate }: WeddingCountdownProps) {
  const targetDate = useMemo(() => (weddingDate ? new Date(weddingDate) : null), [weddingDate]);
  const [units, setUnits] = useState<CountdownUnit[]>(() =>
    targetDate ? getRemainingUnits(targetDate) : []
  );

  useEffect(() => {
    if (!targetDate) {
      return;
    }

    const interval = window.setInterval(() => {
      setUnits(getRemainingUnits(targetDate));
    }, secondInMs);

    return () => window.clearInterval(interval);
  }, [targetDate]);

  if (!targetDate) {
    return null;
  }

  const hasEnded = targetDate.getTime() <= Date.now();

  return (
    <section aria-label="Contagem regressiva para o casamento" className="mt-8 max-w-4xl">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
        {hasEnded ? "O grande dia chegou" : "Contagem regressiva"}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {units.map((unit) => (
          <div key={unit.label} className="group">
            <div className="mb-1 flex items-center justify-between px-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-foreground/75">
              <span>{unit.shortLabel}</span>
              <span>{unit.label}</span>
            </div>
            <span
              key={`${unit.label}-${unit.value}`}
              className="relative block overflow-hidden rounded-md border border-black/50 bg-[#1f1f20] px-3 py-5 text-center font-serif text-6xl font-black leading-none tracking-[0.02em] text-white shadow-[0_14px_30px_rgba(0,0,0,0.24)] animate-[flipTick_420ms_ease-out] sm:text-7xl lg:text-8xl"
            >
              <span className="absolute inset-x-0 top-1/2 h-px bg-black/70" aria-hidden="true" />
              <span className="absolute inset-x-0 top-0 h-1/2 bg-white/[0.04]" aria-hidden="true" />
              <span className="relative z-10 drop-shadow-[0_2px_0_rgba(0,0,0,0.8)]">{formatUnitValue(unit)}</span>
            </span>
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-primary/50 opacity-70 transition group-hover:w-14 group-hover:bg-primary" />
          </div>
        ))}
      </div>
    </section>
  );
}
