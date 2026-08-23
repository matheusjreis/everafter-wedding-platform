"use client";

import { CheckCircle2, Gift, MessageSquare, Send } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

import type { PublicGift, PublicWeddingGuest } from "../data";

type DemoWeddingTabsProps = {
  rsvpNote: string;
  giftNote: string;
  gifts: PublicGift[];
  guests: PublicWeddingGuest[];
};

function formatMoney(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(cents / 100);
}

function shouldShowGuestOptions(value: string) {
  return value.trim().split(/\s+/).length >= 2;
}

export function DemoWeddingTabs({ rsvpNote, giftNote, gifts, guests }: DemoWeddingTabsProps) {
  const [activeTab, setActiveTab] = useState<"rsvp" | "gifts">("rsvp");
  const [guestName, setGuestName] = useState("");
  const [attendanceStatus, setAttendanceStatus] = useState<"attending" | "declined">("attending");
  const [message, setMessage] = useState("");

  const matchingGuests = useMemo(() => {
    if (!shouldShowGuestOptions(guestName)) {
      return [];
    }

    const normalizedName = guestName.trim().toLowerCase();
    return guests.filter((guest) => guest.guestName.toLowerCase().includes(normalizedName)).slice(0, 4);
  }, [guestName, guests]);

  function handleSubmit() {
    const selectedGuest = guests.find((guest) => guest.guestName.toLowerCase() === guestName.trim().toLowerCase());

    if (!selectedGuest) {
      setMessage("Escolha um nome cadastrado na lista para simular a confirmação.");
      return;
    }

    setMessage(
      attendanceStatus === "attending"
        ? "Confirmação simulada com sucesso. Na versão real, o RSVP seria salvo para o casal."
        : "Ausência simulada com sucesso. Na versão real, o casal receberia essa resposta."
    );
  }

  return (
    <section className="border-t bg-card">
      <div className="container py-12">
        <div className="inline-flex rounded-lg border bg-background p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("rsvp")}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${
              activeTab === "rsvp" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="size-4" />
            Confirmar presença
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("gifts")}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${
              activeTab === "gifts" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Gift className="size-4" />
            Presentes cadastrados
          </button>
        </div>

        {activeTab === "rsvp" ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <article>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Confirmação de presença</p>
              <h2 className="mt-3 font-serif text-4xl leading-tight">Você vai comparecer?</h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">{rsvpNote}</p>
            </article>

            <div className="rounded-lg border bg-background p-5 shadow-sm">
              {message ? (
                <div className="mb-5 flex items-start gap-3 rounded-md border border-primary/25 bg-primary/10 p-4 text-sm font-medium text-primary">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                  <span>{message}</span>
                </div>
              ) : null}

              <label className="block text-sm font-medium" htmlFor="demo-guest-name">
                Nome completo
              </label>
              <div className="relative mt-2">
                <input
                  id="demo-guest-name"
                  value={guestName}
                  onChange={(event) => {
                    setGuestName(event.target.value);
                    setMessage("");
                  }}
                  placeholder="Digite nome e sobrenome"
                  className="h-12 w-full rounded-md border bg-background px-4 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {matchingGuests.length ? (
                  <div className="absolute inset-x-0 top-[calc(100%+0.4rem)] z-20 overflow-hidden rounded-md border bg-popover shadow-lg">
                    {matchingGuests.map((guest) => (
                      <button
                        key={guest.id}
                        type="button"
                        onClick={() => setGuestName(guest.guestName)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-muted"
                      >
                        <span className="font-medium">{guest.guestName}</span>
                        <span className="text-xs text-muted-foreground">
                          {guest.expectedGuestCount} {guest.expectedGuestCount === 1 ? "pessoa" : "pessoas"}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Demonstração com convidados fictícios. Na versão real, apenas nomes cadastrados aparecem aqui.
              </p>

              <fieldset className="mt-6">
                <legend className="text-sm font-medium">Você vai comparecer?</legend>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setAttendanceStatus("attending")}
                    className={`flex items-center gap-3 rounded-md border px-4 py-3 text-left transition ${
                      attendanceStatus === "attending" ? "border-primary bg-primary/10" : "hover:border-primary/50"
                    }`}
                  >
                    <span
                      className={`size-4 rounded-full border ${
                        attendanceStatus === "attending" ? "border-primary bg-primary shadow-[inset_0_0_0_3px_white]" : ""
                      }`}
                    />
                    Sim, vou comparecer
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceStatus("declined")}
                    className={`flex items-center gap-3 rounded-md border px-4 py-3 text-left transition ${
                      attendanceStatus === "declined" ? "border-primary bg-primary/10" : "hover:border-primary/50"
                    }`}
                  >
                    <span
                      className={`size-4 rounded-full border ${
                        attendanceStatus === "declined" ? "border-primary bg-primary shadow-[inset_0_0_0_3px_white]" : ""
                      }`}
                    />
                    Não poderei ir
                  </button>
                </div>
              </fieldset>

              <Button type="button" onClick={handleSubmit} className="mt-5 w-full gap-2">
                <Send className="size-4" />
                Simular confirmação
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Presentes</p>
              <h2 className="mt-3 font-serif text-4xl leading-tight">Presentes cadastrados</h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">{giftNote}</p>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {gifts.map((gift) => (
                <article key={gift.id} className="overflow-hidden rounded-lg border bg-background shadow-sm">
                  {gift.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={gift.imageUrl} alt="" className="aspect-[4/3] w-full object-cover" />
                  ) : null}
                  <div className="p-5">
                    <p className="text-lg font-semibold">{gift.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{gift.description}</p>
                    <p className="mt-4 text-base font-semibold text-primary">{formatMoney(gift.amountCents)}</p>
                    <Button type="button" className="mt-4 w-full">
                      Presentear em breve
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
