import { redirect } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";
import { getCurrentCouple } from "@/features/onboarding/data";
import { getCurrentProfile } from "@/features/profile/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in" as Route);
  }

  const displayName =
    typeof user.user_metadata.full_name === "string" && user.user_metadata.full_name.trim().length > 0
      ? user.user_metadata.full_name
      : user.email;
  const couple = await getCurrentCouple(user.id);

  if (!couple) {
    redirect("/onboarding" as Route);
  }

  const profile = await getCurrentProfile(user.id);

  const siteHref = couple.site ? (`/wedding/${couple.site.slug}` as Route) : null;
  const editorHref = couple.site ? (`/dashboard/site/${couple.site.id}/editor` as Route) : null;
  const profileHref = "/settings/profile" as Route;
  const weddingDate = couple.site?.weddingDate
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "America/Sao_Paulo"
      }).format(new Date(couple.site.weddingDate))
    : "Data não definida";

  return (
    <main className="min-h-screen bg-background">
      <section className="container py-10">
        <div className="flex flex-col gap-6 border-b pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt="Foto de perfil"
                className="size-16 rounded-full border object-cover"
              />
            ) : null}
            <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">Painel do casal</p>
            <h1 className="mt-3 font-serif text-4xl leading-tight">{couple.displayName ?? "Seu casamento"}</h1>
            <p className="mt-3 text-base text-muted-foreground">{displayName}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href={profileHref}>Editar perfil</Link>
            </Button>
            <form action={signOutAction}>
              <Button type="submit" variant="outline">
                Sair
              </Button>
            </form>
          </div>
        </div>
        <div className="grid gap-4 py-8 lg:grid-cols-[1.4fr_0.8fr]">
          <article className="rounded-lg border bg-card p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Site em rascunho</p>
            <h2 className="mt-4 text-2xl font-semibold">{couple.site?.title ?? "Site do casamento"}</h2>
            <dl className="mt-6 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Status</dt>
                <dd className="mt-2 text-sm font-semibold">
                  {couple.site?.status === "published" ? "Publicado" : "Rascunho"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Data</dt>
                <dd className="mt-2 text-sm font-semibold">{weddingDate}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Endereço</dt>
                <dd className="mt-2 text-sm font-semibold">{couple.site ? `/wedding/${couple.site.slug}` : "Pendente"}</dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {siteHref ? (
                <Button asChild>
                  <a href={siteHref}>Ver prévia pública</a>
                </Button>
              ) : null}
              {editorHref ? (
                <Button asChild variant="outline">
                  <Link href={editorHref}>Abrir editor</Link>
                </Button>
              ) : null}
            </div>
          </article>

          <aside className="rounded-lg border bg-card p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Próximas etapas</p>
            <ol className="mt-5 grid gap-4 text-sm leading-6 text-muted-foreground">
              <li>
                <span className="font-semibold text-foreground">1. Conteúdo:</span> nomes, história, cerimônia e
                recepção.
              </li>
              <li>
                <span className="font-semibold text-foreground">2. Convidados:</span> RSVP e mensagens.
              </li>
              <li>
                <span className="font-semibold text-foreground">3. Presentes:</span> lista simbólica e pagamentos.
              </li>
            </ol>
          </aside>
        </div>
      </section>
    </main>
  );
}
