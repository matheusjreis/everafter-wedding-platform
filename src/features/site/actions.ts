"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { giftPresets } from "./default-assets";
import { giftSchema, siteEditorSchema } from "./schemas";
import type { SiteEditorActionState } from "./state";

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

function emptyToNull(value?: string) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function toWeddingDate(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T12:00:00.000-03:00`);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function mapSiteEditorError(message?: string) {
  const normalizedMessage = message?.toLowerCase() ?? "";

  if (normalizedMessage.includes("duplicate") || normalizedMessage.includes("unique")) {
    return "Este endereço público já está em uso. Escolha outro.";
  }

  if (normalizedMessage.includes("row-level security")) {
    return "Sua sessão não tem permissão para editar este site. Entre novamente e tente outra vez.";
  }

  return "Não foi possível salvar o site. Tente novamente.";
}

function toAmountCents(value: string) {
  return Math.round(Number(value.replace(",", ".")) * 100);
}

function toOptionalInteger(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function getGiftPreset(formData: FormData) {
  const presetId = getStringField(formData, "presetId");

  return giftPresets.find((preset) => preset.id === presetId);
}

export async function updateWeddingSiteAction(
  siteId: string,
  _state: SiteEditorActionState,
  formData: FormData
): Promise<SiteEditorActionState> {
  const fields = createFieldSnapshot(formData, [
    "title",
    "slug",
    "description",
    "weddingDate",
    "heroImageUrl",
    "story",
    "ceremonyLocation",
    "receptionLocation",
    "ceremonyImageUrl",
    "receptionImageUrl",
    "rsvpNote",
    "giftNote",
    "status"
  ]);
  const parsed = siteEditorSchema.safeParse({
    title: getStringField(formData, "title"),
    slug: getStringField(formData, "slug"),
    description: getStringField(formData, "description"),
    weddingDate: getStringField(formData, "weddingDate"),
    heroImageUrl: getStringField(formData, "heroImageUrl"),
    story: getStringField(formData, "story"),
    ceremonyLocation: getStringField(formData, "ceremonyLocation"),
    receptionLocation: getStringField(formData, "receptionLocation"),
    ceremonyImageUrl: getStringField(formData, "ceremonyImageUrl"),
    receptionImageUrl: getStringField(formData, "receptionImageUrl"),
    rsvpNote: getStringField(formData, "rsvpNote"),
    giftNote: getStringField(formData, "giftNote"),
    status: getStringField(formData, "status")
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

  const { error } = await supabase
    .from("wedding_sites")
    .update({
      slug: parsed.data.slug,
      status: parsed.data.status,
      title: parsed.data.title,
      description: emptyToNull(parsed.data.description),
      wedding_date: toWeddingDate(parsed.data.weddingDate),
      hero_image_url: emptyToNull(parsed.data.heroImageUrl),
      story: emptyToNull(parsed.data.story),
      ceremony_location: emptyToNull(parsed.data.ceremonyLocation),
      reception_location: emptyToNull(parsed.data.receptionLocation),
      ceremony_image_url: emptyToNull(parsed.data.ceremonyImageUrl),
      reception_image_url: emptyToNull(parsed.data.receptionImageUrl),
      rsvp_note: emptyToNull(parsed.data.rsvpNote),
      gift_note: emptyToNull(parsed.data.giftNote)
    })
    .eq("id", siteId);

  if (error) {
    return {
      status: "error",
      message: mapSiteEditorError(error.message),
      fields
    };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/site/${siteId}/editor`);
  revalidatePath(`/wedding/${parsed.data.slug}`);

  return {
    status: "success",
    message: "Site salvo com sucesso.",
    fields
  };
}

export async function createGiftAction(
  siteId: string,
  coupleId: string,
  _state: SiteEditorActionState,
  formData: FormData
): Promise<SiteEditorActionState> {
  const fields = createFieldSnapshot(formData, [
    "title",
    "description",
    "imageUrl",
    "amount",
    "quantityTotal",
    "category",
    "status",
    "allowPartial"
  ]);
  const preset = getGiftPreset(formData);
  const parsed = giftSchema.safeParse({
    title: getStringField(formData, "title") || preset?.title || "",
    description: getStringField(formData, "description") || preset?.description || "",
    imageUrl: getStringField(formData, "imageUrl") || preset?.imageUrl || "",
    amount: getStringField(formData, "amount") || preset?.amount || "",
    quantityTotal: getStringField(formData, "quantityTotal"),
    category: getStringField(formData, "category") || preset?.category || "custom",
    status: getStringField(formData, "status") || "draft",
    allowPartial: getStringField(formData, "allowPartial") || "off"
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados do presente.",
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

  const { error } = await supabase.from("gifts").insert({
    couple_id: coupleId,
    site_id: siteId,
    title: parsed.data.title,
    description: emptyToNull(parsed.data.description),
    image_url: emptyToNull(parsed.data.imageUrl),
    amount_cents: toAmountCents(parsed.data.amount),
    quantity_total: toOptionalInteger(parsed.data.quantityTotal),
    category: parsed.data.category,
    status: parsed.data.status,
    allow_partial: parsed.data.allowPartial === "on"
  });

  if (error) {
    return {
      status: "error",
      message: mapSiteEditorError(error.message),
      fields
    };
  }

  revalidatePath(`/dashboard/site/${siteId}/editor`);
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Presente cadastrado com sucesso.",
    fields: {}
  };
}
