import { redirect } from "next/navigation";
import type { Route } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";
import { getCurrentCouple } from "@/features/onboarding/data";
import { getCurrentProfile } from "@/features/profile/data";
import { DashboardSiteCard } from "@/features/site/components/dashboard-site-card";
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

  const profileHref = "/settings/profile" as Route;

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
        <div className="grid gap-4 py-8">
          {couple.site ? <DashboardSiteCard site={couple.site} /> : null}
        </div>
      </section>
    </main>
  );
}
