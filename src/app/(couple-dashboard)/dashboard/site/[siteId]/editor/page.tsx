import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { SiteEditorForm } from "@/features/site/components/site-editor-form";
import { getEditableWeddingSite } from "@/features/site/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SiteEditorPageProps = {
  params: Promise<{
    siteId: string;
  }>;
};

export default async function SiteEditorPage({ params }: SiteEditorPageProps) {
  const { siteId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in" as Route);
  }

  const site = await getEditableWeddingSite(siteId);

  if (!site) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="container py-10">
        <div className="flex flex-col gap-5 border-b pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">Editor do site</p>
            <h1 className="mt-3 font-serif text-4xl leading-tight">{site.title}</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Edite a primeira versão pública do casamento. As próximas fases adicionam seções, convidados e presentes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href={"/dashboard" as Route}>Voltar ao painel</Link>
            </Button>
            <Button asChild>
              <Link href={`/wedding/${site.slug}` as Route}>Ver prévia</Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-lg border bg-card p-6 shadow-sm sm:p-8">
            <SiteEditorForm site={site} />
          </div>
          <aside className="rounded-lg border bg-card p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Prévia rápida</p>
            <h2 className="mt-4 font-serif text-3xl leading-tight">{site.title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {site.description || "Adicione uma descrição curta para abrir o site com contexto."}
            </p>
            <div className="mt-5 rounded-md border bg-background p-4 text-sm leading-6">
              <p className="font-semibold">Endereço</p>
              <p className="mt-1 text-muted-foreground">/wedding/{site.slug}</p>
            </div>
            <div className="mt-4 rounded-md border bg-background p-4 text-sm leading-6">
              <p className="font-semibold">Publicação</p>
              <p className="mt-1 text-muted-foreground">
                {site.status === "published" ? "Publicado para convidados." : "Visível como prévia para membros."}
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
