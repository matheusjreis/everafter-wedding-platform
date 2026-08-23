"use client";

import { Gift, MessageSquare } from "lucide-react";
import { useState } from "react";

import type { PublicGift, PublicWeddingGuest } from "../data";
import { GiftContributionForm } from "./gift-contribution-form";
import { RsvpForm } from "./rsvp-form";

type PublicWeddingTabsProps = {
  siteId: string;
  siteSlug: string;
  rsvpNote: string;
  giftNote: string;
  gifts: PublicGift[];
  guests: PublicWeddingGuest[];
  pixKey: string;
};

function formatMoney(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(cents / 100);
}

function getGiftTargetCents(gift: PublicGift) {
  return gift.amountCents * (gift.quantityTotal ?? 1);
}

function getRemainingCents(gift: PublicGift) {
  return Math.max(getGiftTargetCents(gift) - gift.amountContributedCents, 0);
}

function getGiftAvailabilityLabel(gift: PublicGift) {
  if (gift.status === "sold_out" || getRemainingCents(gift) <= 0) {
    return "Indisponível";
  }

  if (gift.allowPartial) {
    return "Aceita contribuição parcial";
  }

  return "Valor único";
}

export function PublicWeddingTabs({
  siteId,
  siteSlug,
  rsvpNote,
  giftNote,
  gifts,
  guests,
  pixKey
}: PublicWeddingTabsProps) {
  const [activeTab, setActiveTab] = useState<"rsvp" | "gifts">("rsvp");
  const sortedGifts = [...gifts].sort((firstGift, secondGift) => {
    const firstUnavailable = firstGift.status === "sold_out" || getRemainingCents(firstGift) <= 0;
    const secondUnavailable = secondGift.status === "sold_out" || getRemainingCents(secondGift) <= 0;

    if (firstUnavailable === secondUnavailable) {
      return 0;
    }

    return firstUnavailable ? 1 : -1;
  });

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
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                {rsvpNote || "Informe seu nome e confirme se poderá celebrar esse dia com o casal."}
              </p>
            </article>
            <RsvpForm siteId={siteId} siteSlug={siteSlug} guests={guests} />
          </div>
        ) : (
          <div className="mt-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Presentes</p>
              <h2 className="mt-3 font-serif text-4xl leading-tight">Presentes cadastrados</h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                {giftNote || "Escolha um presente simbólico para participar dos planos do casal."}
              </p>
            </div>
            {gifts.length ? (
              <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {sortedGifts.map((gift) => {
                  const remainingCents = getRemainingCents(gift);
                  const isUnavailable = gift.status === "sold_out" || remainingCents <= 0;

                  return (
                    <article
                      key={gift.id}
                      className={`overflow-hidden rounded-lg border bg-background shadow-sm transition ${
                        isUnavailable ? "opacity-55 grayscale" : ""
                      }`}
                    >
                      {gift.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={gift.imageUrl} alt="" className="aspect-[4/3] w-full object-cover" />
                      ) : null}
                      <div className="p-5">
                        <div className="mb-3 inline-flex rounded-full border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
                          {getGiftAvailabilityLabel(gift)}
                        </div>
                        <p className="text-lg font-semibold">{gift.title}</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{gift.description || "Presente simbólico."}</p>
                        <p className="mt-4 text-base font-semibold text-primary">{formatMoney(gift.amountCents)}</p>
                        {gift.allowPartial && !isUnavailable ? (
                          <p className="mt-1 text-xs text-muted-foreground">Restante: {formatMoney(remainingCents)}</p>
                        ) : null}
                        <GiftContributionForm gift={gift} siteSlug={siteSlug} pixKey={pixKey} />
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-8 rounded-lg border bg-background p-5 text-sm leading-6 text-muted-foreground">
                O casal ainda não cadastrou presentes.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
