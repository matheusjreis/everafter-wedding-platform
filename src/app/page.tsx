import Link from "next/link";
import type { Route } from "next";
import Image from "next/image";
import { CalendarHeart, CreditCard, GalleryHorizontal, Gift, Globe2, LockKeyhole, MessageSquare, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default function HomePage() {
  const dictionary = getDictionary("pt-BR");
  const signUpHref = "/sign-up" as Route;
  const signInHref = "/sign-in" as Route;
  const demoHref = "/wedding/demo" as Route;
  const featureIcons = [Globe2, Gift, CreditCard, MessageSquare, GalleryHorizontal, CalendarHeart, LockKeyhole, Smartphone];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/92 backdrop-blur">
        <nav className="container flex h-16 items-center justify-between gap-4" aria-label="Navegação principal">
          <Link href="/" className="font-serif text-2xl text-foreground">
            {dictionary.common.brandName}
          </Link>
          <div className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#examples" className="transition-colors hover:text-foreground">
              {dictionary.marketing.nav.examples}
            </a>
            <a href="#features" className="transition-colors hover:text-foreground">
              {dictionary.marketing.nav.features}
            </a>
            <a href="#pricing" className="transition-colors hover:text-foreground">
              {dictionary.marketing.nav.pricing}
            </a>
            <a href="#security" className="transition-colors hover:text-foreground">
              {dictionary.marketing.nav.security}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href={signInHref}>{dictionary.marketing.nav.signIn}</Link>
            </Button>
            <Button asChild>
              <Link href={signUpHref}>{dictionary.marketing.nav.cta}</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main>
        <section className="container grid min-h-[calc(100vh-4rem)] items-center gap-10 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
          <div className="max-w-3xl space-y-7">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
              {dictionary.marketing.hero.eyebrow}
            </p>
            <div className="space-y-5">
              <h1 className="font-serif text-5xl leading-tight text-foreground sm:text-6xl lg:text-7xl">
                {dictionary.marketing.hero.title}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                {dictionary.marketing.hero.description}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href={signUpHref}>{dictionary.marketing.hero.primaryCta}</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={demoHref}>{dictionary.marketing.hero.secondaryCta}</Link>
              </Button>
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">{dictionary.marketing.hero.proof}</p>
          </div>

          <div className="relative overflow-hidden rounded-lg border bg-card shadow-sm">
            <Image
              src="/images/everafter-hero.png"
              alt={dictionary.marketing.hero.imageAlt}
              width={1536}
              height={1024}
              priority
              className="aspect-[4/3] h-full w-full object-cover"
            />
          </div>
        </section>

        <section className="border-y bg-card py-14" id="examples">
          <div className="container grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
                {dictionary.marketing.demo.eyebrow}
              </p>
              <h2 className="font-serif text-4xl leading-tight">{dictionary.marketing.demo.title}</h2>
              <p className="text-base leading-7 text-muted-foreground">{dictionary.marketing.demo.description}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {dictionary.marketing.demo.metrics.map((metric) => (
                <div key={metric.label} className="rounded-lg border bg-background p-5">
                  <p className="font-serif text-4xl">{metric.value}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{metric.label}</p>
                </div>
              ))}
            </div>
            <div className="lg:col-span-2 grid gap-4 md:grid-cols-3">
              {dictionary.marketing.demo.panels.map((panel) => (
                <div key={panel} className="rounded-lg border bg-background p-5">
                  <div className="mb-5 h-28 rounded-md border bg-muted" />
                  <h3 className="text-base font-semibold">{panel}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container py-16">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
              {dictionary.marketing.howItWorks.eyebrow}
            </p>
            <h2 className="font-serif text-4xl leading-tight">{dictionary.marketing.howItWorks.title}</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {dictionary.marketing.howItWorks.steps.map((step, index) => (
              <article key={step.title} className="rounded-lg border bg-card p-5 shadow-sm">
                <p className="text-sm font-semibold text-primary">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y bg-card py-16" id="features">
          <div className="container">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
                {dictionary.marketing.features.eyebrow}
              </p>
              <h2 className="font-serif text-4xl leading-tight">{dictionary.marketing.features.title}</h2>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {dictionary.marketing.features.items.map((item, index) => {
                const Icon = featureIcons[index] ?? Globe2;

                return (
                  <article key={item} className="rounded-lg border bg-background p-5">
                    <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                    <h3 className="mt-4 text-base font-semibold">{item}</h3>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="container grid gap-8 py-16 lg:grid-cols-[0.9fr_1.1fr]" id="pricing">
          <div className="space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
              {dictionary.marketing.templates.eyebrow}
            </p>
            <h2 className="font-serif text-4xl leading-tight">{dictionary.marketing.templates.title}</h2>
            <p className="text-base leading-7 text-muted-foreground">{dictionary.marketing.templates.description}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {dictionary.marketing.templates.styles.map((style) => (
              <article key={style} className="rounded-lg border bg-card p-5 shadow-sm">
                <div className="h-36 rounded-md border bg-[linear-gradient(135deg,hsl(var(--muted)),hsl(var(--background)))]" />
                <h3 className="mt-4 text-base font-semibold">{style}</h3>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y bg-foreground py-16 text-background" id="security">
          <div className="container grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent">
                {dictionary.marketing.trust.eyebrow}
              </p>
              <h2 className="font-serif text-4xl leading-tight">{dictionary.marketing.trust.title}</h2>
            </div>
            <div className="grid gap-4">
              {dictionary.marketing.trust.points.map((point) => (
                <div key={point} className="rounded-lg border border-background/20 p-5 text-sm leading-6 text-background/80">
                  {point}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container py-16">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
              {dictionary.marketing.testimonials.eyebrow}
            </p>
            <h2 className="font-serif text-4xl leading-tight">{dictionary.marketing.testimonials.title}</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {dictionary.marketing.testimonials.items.map((item) => (
              <figure key={item.quote} className="rounded-lg border bg-card p-6 shadow-sm">
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  {dictionary.marketing.testimonials.note}
                </span>
                <blockquote className="mt-5 text-lg leading-8">{item.quote}</blockquote>
                <figcaption className="mt-5 text-sm text-muted-foreground">{item.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="border-y bg-card py-16">
          <div className="container grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
                {dictionary.marketing.faq.eyebrow}
              </p>
              <h2 className="font-serif text-4xl leading-tight">{dictionary.marketing.faq.title}</h2>
            </div>
            <div className="grid gap-4">
              {dictionary.marketing.faq.items.map((item) => (
                <article key={item.question} className="rounded-lg border bg-background p-5">
                  <h3 className="text-base font-semibold">{item.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="container py-16">
          <div className="max-w-3xl space-y-5">
            <h2 className="font-serif text-4xl leading-tight">{dictionary.marketing.finalCta.title}</h2>
            <p className="text-base leading-7 text-muted-foreground">{dictionary.marketing.finalCta.description}</p>
            <Button asChild size="lg">
              <Link href={signUpHref}>{dictionary.marketing.finalCta.cta}</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t bg-card">
        <div className="container flex flex-col gap-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>{dictionary.marketing.footer.rights}</p>
          <div className="flex gap-5">
            {dictionary.marketing.footer.links.map((link) => (
              <span key={link}>{link}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
