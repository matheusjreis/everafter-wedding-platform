import type { Route } from "next";
import { redirect } from "next/navigation";

import { OnboardingForm } from "@/features/onboarding/components/onboarding-form";
import { getCurrentCouple } from "@/features/onboarding/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in" as Route);
  }

  const couple = await getCurrentCouple(user.id);

  if (couple) {
    redirect("/dashboard" as Route);
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="container grid min-h-screen items-center py-10">
        <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">Primeira configuração</p>
            <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">
              Vamos criar a base do seu casamento.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
              Esta etapa cria o casal, sua associação como proprietário e o primeiro site público em modo rascunho.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 shadow-sm sm:p-8">
            <OnboardingForm />
          </div>
        </div>
      </section>
    </main>
  );
}
