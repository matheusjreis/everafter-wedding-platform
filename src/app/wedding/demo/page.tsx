import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function WeddingDemoPage() {
  return (
    <main className="container flex min-h-screen flex-col justify-center py-16">
      <div className="max-w-2xl space-y-5">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">Demonstração do casamento</p>
        <h1 className="font-serif text-4xl leading-tight">A prévia do site público do casamento ficará aqui.</h1>
        <p className="text-base leading-7 text-muted-foreground">
          O site narrativo completo do casamento está planejado para a Fase 6. Esta rota já existe para manter as
          rotas tipadas ativas desde o início.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Voltar para o início</Link>
        </Button>
      </div>
    </main>
  );
}
