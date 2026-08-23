import Link from "next/link";

import { Button } from "@/components/ui/button";
import { defaultWeddingImages, giftPresets } from "@/features/site/default-assets";
import { DemoWeddingTabs } from "@/features/site/components/demo-wedding-tabs";
import { WeddingCountdown } from "@/features/site/components/wedding-countdown";

function formatWeddingDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(value));
}

function centsFromMoney(value: string) {
  return Number(value.replace(/\D/g, ""));
}

const demoWeddingDate = "2027-08-22T16:30:00.000-03:00";
const demoGifts = giftPresets.slice(0, 6).map((gift, index) => ({
  id: `demo-gift-${gift.id}`,
  status: "active" as const,
  category: gift.category,
  title: gift.title,
  description: gift.description,
  imageUrl: gift.imageUrl,
  amountCents: centsFromMoney(gift.amount),
  amountContributedCents: index === 0 ? 12000 : 0,
  quantityTotal: index % 2 === 0 ? 5 : null,
  quantityPurchased: index === 0 ? 1 : 0,
  allowPartial: true
}));

const demoGuests = [
  {
    id: "demo-guest-1",
    guestName: "Rosemeire de Jesus",
    expectedGuestCount: 1
  },
  {
    id: "demo-guest-2",
    guestName: "Maria Oliveira",
    expectedGuestCount: 2
  },
  {
    id: "demo-guest-3",
    guestName: "João Pereira",
    expectedGuestCount: 3
  }
];

export default function WeddingDemoPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="relative isolate min-h-[78vh] overflow-hidden border-b">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={defaultWeddingImages.hero[1].value} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-background/80" />
        <div className="container flex min-h-[78vh] flex-col justify-end py-12">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Demonstração do casamento</p>
          <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-tight sm:text-6xl">Lívia e Rafael</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Um site de casamento completo para contar a história do casal, organizar confirmações e apresentar os
            presentes de forma elegante para os convidados.
          </p>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.14em]">{formatWeddingDate(demoWeddingDate)}</p>
          <WeddingCountdown weddingDate={demoWeddingDate} />
        </div>
      </section>

      <section className="container grid gap-8 py-12 lg:grid-cols-[1.2fr_0.8fr]">
        <article>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">Nossa história</p>
          <h2 className="mt-3 font-serif text-4xl leading-tight">Nosso casamento</h2>
          <div className="mt-5 space-y-6 text-base leading-8 text-muted-foreground">
            <p>
              Esta demonstração mostra como o site público pode ficar quando o casal publica a página para os
              convidados. A narrativa, os horários, as fotos e os presentes são apenas exemplos.
            </p>
            <p>
              O casal pode usar imagens próprias ou escolher fotos padrão do EverAfter para montar uma página bonita
              mesmo antes de ter todos os materiais finais.
            </p>
          </div>
        </article>

        <aside className="grid gap-4">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={defaultWeddingImages.ceremony[0].value} alt="" className="mb-5 aspect-video w-full rounded-md object-cover" />
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Cerimônia</p>
            <p className="mt-3 text-base leading-7 text-muted-foreground">Capela Santa Clara</p>
            <p className="mt-3 text-sm font-semibold text-foreground">Horário: 16:30</p>
          </div>
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={defaultWeddingImages.reception[0].value} alt="" className="mb-5 aspect-video w-full rounded-md object-cover" />
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Recepção</p>
            <p className="mt-3 text-base leading-7 text-muted-foreground">Espaço Jardim das Acácias</p>
            <p className="mt-3 text-sm font-semibold text-foreground">Horário: 19:00</p>
          </div>
        </aside>
      </section>

      <DemoWeddingTabs
        rsvpNote="Informe seu nome e confirme se poderá celebrar esse dia com o casal. Nesta demo, a confirmação é apenas visual."
        giftNote="Explore exemplos de presentes simbólicos que podem ser cadastrados pelo casal."
        gifts={demoGifts}
        guests={demoGuests}
      />

      <footer className="container flex flex-col gap-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>Site criado no EverAfter.</span>
        <Button asChild variant="outline">
          <Link href="/">Conhecer a plataforma</Link>
        </Button>
      </footer>
    </main>
  );
}
