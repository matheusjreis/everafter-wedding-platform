"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { onboardingSchema } from "./schemas";
import type { OnboardingActionState } from "./state";

function getStringField(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function createFieldSnapshot(formData: FormData, keys: string[]) {
  return keys.reduce<Record<string, string>>((fields, key) => {
    fields[key] = getStringField(formData, key);
    return fields;
  }, {});
}

function toWeddingDate(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T12:00:00.000-03:00`);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function mapOnboardingError(message?: string, code?: string) {
  const normalizedMessage = message?.toLowerCase() ?? "";
  const normalizedCode = code?.toLowerCase() ?? "";

  if (
    normalizedCode === "pgrst202" ||
    normalizedMessage.includes("could not find the function") ||
    normalizedMessage.includes("schema cache") ||
    normalizedMessage.includes("create_couple_onboarding")
  ) {
    return "A função de onboarding ainda não foi aplicada no Supabase. Rode as migrations e tente novamente.";
  }

  if (normalizedMessage.includes("duplicate") || normalizedMessage.includes("unique")) {
    return "Este endereço público já está em uso. Escolha outro.";
  }

  if (normalizedMessage.includes("já possui") || normalizedMessage.includes("ja possui")) {
    return "Esta conta já possui um casal configurado.";
  }

  if (normalizedMessage.includes("row-level security")) {
    return "Sua sessão não tem permissão para concluir esta configuração. Entre novamente e tente outra vez.";
  }

  return "Não foi possível salvar a configuração inicial. Tente novamente.";
}

export async function createCoupleOnboardingAction(
  _state: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const fields = createFieldSnapshot(formData, ["coupleName", "siteSlug", "weddingTitle", "weddingDate"]);
  const parsed = onboardingSchema.safeParse({
    coupleName: getStringField(formData, "coupleName"),
    siteSlug: getStringField(formData, "siteSlug"),
    weddingTitle: getStringField(formData, "weddingTitle"),
    weddingDate: getStringField(formData, "weddingDate")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fields,
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/sign-in" as Route);
  }

  const { data: existingMembership } = await supabase
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (existingMembership) {
    redirect("/dashboard" as Route);
  }

  const { error: onboardingError } = await supabase.rpc("create_couple_onboarding", {
    couple_display_name: parsed.data.coupleName,
    site_slug: parsed.data.siteSlug,
    site_title: parsed.data.weddingTitle,
    site_wedding_date: toWeddingDate(parsed.data.weddingDate)
  });

  if (onboardingError) {
    return {
      status: "error",
      message: mapOnboardingError(onboardingError.message, onboardingError.code),
      fields
    };
  }

  redirect("/dashboard" as Route);
}
