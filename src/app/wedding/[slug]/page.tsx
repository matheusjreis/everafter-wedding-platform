import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getPublicWeddingSite } from "@/features/site/data";
import { PublicWeddingTabs } from "@/features/site/components/public-wedding-tabs";
import { WeddingCountdown } from "@/features/site/components/wedding-countdown";

type WeddingSitePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatWeddingDate(value: string | null) {
  if (!value) {
    return "Data em breve";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(value));
}

function formatEventTime(value: string) {
  if (!value) {
    return "";
  }

  return value.slice(0, 5);
}

export default async function WeddingSitePage({ params }: WeddingSitePageProps) {
  const { slug } = await params;
  const site = await getPublicWeddingSite(slug);

  if (!site) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="relative isolate min-h-[78vh] overflow-hidden border-b">
        {site.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={site.heroImageUrl} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 -z-20 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--accent))_100%)]" />
        )}
        <div className="absolute inset-0 -z-10 bg-background/80" />
        <div className="container flex min-h-[78vh] flex-col justify-end py-12">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Casamento</p>
          <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-tight sm:text-6xl">{site.coupleName}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            {site.description || site.title}
          </p>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.14em]">{formatWeddingDate(site.weddingDate)}</p>
          <WeddingCountdown weddingDate={site.weddingDate} />
        </div>
      </section>

      <section className="container grid gap-8 py-12 lg:grid-cols-[1.2fr_0.8fr]">
        <article>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">Nossa história</p>
          <h2 className="mt-3 font-serif text-4xl leading-tight">{site.title}</h2>
          <p className="mt-5 whitespace-pre-line text-base leading-8 text-muted-foreground">
            {site.story || "Em breve o casal vai compartilhar aqui a história, os detalhes e as mensagens para os convidados."}
          </p>
        </article>

        <aside className="grid gap-4">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            {site.ceremonyImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={site.ceremonyImageUrl} alt="" className="mb-5 aspect-video w-full rounded-md object-cover" />
            ) : null}
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Cerimônia</p>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              {site.ceremonyLocation || "Local da cerimônia em breve."}
            </p>
            {site.ceremonyTime ? (
              <p className="mt-3 text-sm font-semibold text-foreground">Horário: {formatEventTime(site.ceremonyTime)}</p>
            ) : null}
          </div>
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            {site.receptionImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={site.receptionImageUrl} alt="" className="mb-5 aspect-video w-full rounded-md object-cover" />
            ) : null}
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Recepção</p>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              {site.receptionLocation || "Local da recepção em breve."}
            </p>
            {site.receptionTime ? (
              <p className="mt-3 text-sm font-semibold text-foreground">Horário: {formatEventTime(site.receptionTime)}</p>
            ) : null}
          </div>
        </aside>
      </section>

      <PublicWeddingTabs
        siteId={site.id}
        siteSlug={site.slug}
        rsvpNote={site.rsvpNote}
        giftNote={site.giftNote}
        gifts={site.gifts}
        guests={site.guests}
      />

      <footer className="container flex flex-col gap-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>Site criado no EverAfter.</span>
        <Button asChild variant="outline">
          <Link href={"/" as Route}>Conhecer a plataforma</Link>
        </Button>
      </footer>
    </main>
  );
}
