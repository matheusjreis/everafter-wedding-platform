import Image from "next/image";

export default function WeddingSiteLoading() {
  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <section className="relative isolate min-h-[78vh] border-b bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--accent))_100%)]">
        <div className="absolute inset-0 -z-10 bg-background/82" />
        <div className="container flex min-h-[78vh] flex-col justify-end py-12">
          <div className="flex items-center gap-4">
            <span className="relative flex size-16 items-center justify-center">
              <span className="absolute inset-0 animate-[weddingPulse_1.8s_ease-in-out_infinite] rounded-full border border-primary/30" />
              <span className="absolute inset-2 animate-[weddingSpin_2.4s_linear_infinite] rounded-full border border-primary/30 border-t-primary" />
              <Image
                src="/images/everafter-mark.png"
                alt=""
                width={44}
                height={44}
                className="size-11 object-contain"
                priority
              />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Preparando o casamento</p>
              <p className="mt-1 text-sm text-muted-foreground">Carregando detalhes, história e presentes.</p>
            </div>
          </div>

          <div className="mt-10 max-w-4xl space-y-5">
            <div className="h-5 w-36 animate-[loadingShimmer_1.6s_ease-in-out_infinite] rounded-full bg-muted" />
            <div className="h-16 w-full max-w-2xl animate-[loadingShimmer_1.6s_ease-in-out_infinite] rounded-lg bg-muted sm:h-20" />
            <div className="h-5 w-full max-w-xl animate-[loadingShimmer_1.6s_ease-in-out_infinite] rounded-full bg-muted" />
            <div className="h-5 w-3/4 max-w-lg animate-[loadingShimmer_1.6s_ease-in-out_infinite] rounded-full bg-muted" />
          </div>

          <div className="mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {["Dias", "Horas", "Minutos", "Segundos"].map((label) => (
              <div key={label} className="rounded-lg border bg-card/90 p-4 shadow-sm backdrop-blur">
                <div className="h-11 w-16 animate-[loadingShimmer_1.6s_ease-in-out_infinite] rounded-md bg-muted" />
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container grid gap-8 py-12 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="h-4 w-32 animate-[loadingShimmer_1.6s_ease-in-out_infinite] rounded-full bg-muted" />
          <div className="h-10 w-72 animate-[loadingShimmer_1.6s_ease-in-out_infinite] rounded-md bg-muted" />
          <div className="h-4 w-full animate-[loadingShimmer_1.6s_ease-in-out_infinite] rounded-full bg-muted" />
          <div className="h-4 w-5/6 animate-[loadingShimmer_1.6s_ease-in-out_infinite] rounded-full bg-muted" />
        </div>
        <div className="grid gap-4">
          <div className="h-28 animate-[loadingShimmer_1.6s_ease-in-out_infinite] rounded-lg border bg-card" />
          <div className="h-28 animate-[loadingShimmer_1.6s_ease-in-out_infinite] rounded-lg border bg-card" />
        </div>
      </section>
    </main>
  );
}
