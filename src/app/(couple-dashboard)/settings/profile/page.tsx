import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { getCurrentProfile } from "@/features/profile/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProfileSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in" as Route);
  }

  const profile = await getCurrentProfile(user.id);
  const displayProfile = {
    fullName:
      profile.fullName ||
      (typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : "") ||
      "",
    email: profile.email || user.email || "",
    avatarUrl: profile.avatarUrl
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="container py-10">
        <div className="flex flex-col gap-5 border-b pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">Configurações</p>
            <h1 className="mt-3 font-serif text-4xl leading-tight">Seu perfil</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Atualize os dados usados no painel do casal e na identificação da sua conta.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={"/dashboard" as Route}>Voltar ao painel</Link>
          </Button>
        </div>

        <div className="mx-auto mt-8 max-w-2xl rounded-lg border bg-card p-6 shadow-sm sm:p-8">
          <ProfileForm profile={displayProfile} />
        </div>
      </section>
    </main>
  );
}
