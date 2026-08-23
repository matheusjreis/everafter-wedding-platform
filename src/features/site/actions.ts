"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildPixPayload } from "@/lib/pix";

import { getDefaultGiftImage, giftPresets } from "./default-assets";
import {
  dashboardSiteSettingsSchema,
  giftContributionSchema,
  giftSchema,
  rsvpSchema,
  siteEditorSchema,
  weddingGuestSchema
} from "./schemas";
import type { SiteEditorActionState } from "./state";

type PublicWeddingGuestOptionRow = {
  id: string;
  guest_name: string;
  expected_guest_count: number;
};

type PublicWeddingPaymentProfileRow = {
  pix_key: string | null;
  merchant_name: string | null;
};

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

function mapGiftContributionError(message?: string) {
  const normalizedMessage = message?.toLowerCase() ?? "";

  if (normalizedMessage.includes("indispon")) {
    return "Este presente não está mais disponível.";
  }

  if (normalizedMessage.includes("saldo") || normalizedMessage.includes("maior")) {
    return "O valor informado é maior que o saldo disponível para este presente.";
  }

  if (normalizedMessage.includes("parcial")) {
    return "Este presente não aceita pagamento parcial.";
  }

  if (normalizedMessage.includes("pix")) {
    return "O casal ainda não configurou a chave Pix para receber presentes.";
  }

  return "Não foi possível registrar o presente. Tente novamente.";
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
    "ceremonyTime",
    "receptionLocation",
    "receptionTime",
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
    ceremonyTime: getStringField(formData, "ceremonyTime"),
    receptionLocation: getStringField(formData, "receptionLocation"),
    receptionTime: getStringField(formData, "receptionTime"),
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
      ceremony_time: emptyToNull(parsed.data.ceremonyTime),
      reception_location: emptyToNull(parsed.data.receptionLocation),
      reception_time: emptyToNull(parsed.data.receptionTime),
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

export async function updateDashboardSiteSettingsAction(
  siteId: string,
  currentSlug: string,
  _state: SiteEditorActionState,
  formData: FormData
): Promise<SiteEditorActionState> {
  const fields = createFieldSnapshot(formData, ["slug", "weddingDate", "status"]);
  const parsed = dashboardSiteSettingsSchema.safeParse({
    slug: getStringField(formData, "slug"),
    weddingDate: getStringField(formData, "weddingDate"),
    status: getStringField(formData, "status")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise o endereço, a data e o status do site.",
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
      wedding_date: toWeddingDate(parsed.data.weddingDate),
      status: parsed.data.status
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
  revalidatePath(`/wedding/${currentSlug}`);
  revalidatePath(`/wedding/${parsed.data.slug}`);

  return {
    status: "success",
    message:
      parsed.data.status === "published"
        ? "Site publicado com sucesso."
        : parsed.data.status === "unpublished"
          ? "Site saiu do ar. O endereço público agora retorna 404."
          : "Site salvo como rascunho.",
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

  const { data: existingGift } = await supabase
    .from("gifts")
    .select("id")
    .eq("site_id", siteId)
    .ilike("title", parsed.data.title)
    .neq("status", "archived")
    .limit(1)
    .maybeSingle();

  if (existingGift) {
    return {
      status: "error",
      message: "Este presente já existe na lista. Edite o item existente ou escolha outro presente.",
      fields
    };
  }

  const { error } = await supabase.from("gifts").insert({
    couple_id: coupleId,
    site_id: siteId,
    title: parsed.data.title,
    description: emptyToNull(parsed.data.description),
    image_url: emptyToNull(parsed.data.imageUrl) ?? getDefaultGiftImage(parsed.data.category, parsed.data.title),
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

export async function createGiftBatchAction(
  siteId: string,
  coupleId: string,
  siteSlug: string,
  _state: SiteEditorActionState,
  formData: FormData
): Promise<SiteEditorActionState> {
  const rawGifts = getStringField(formData, "giftsJson");
  let giftItems: unknown;

  try {
    giftItems = JSON.parse(rawGifts);
  } catch {
    return {
      status: "error",
      message: "Não foi possível ler a lista de presentes. Tente montar a lista novamente.",
      fields: {}
    };
  }

  if (!Array.isArray(giftItems) || giftItems.length === 0) {
    return {
      status: "error",
      message: "Adicione pelo menos um presente antes de salvar.",
      fields: {}
    };
  }

  const parsedGifts = [];
  const pendingTitles = new Set<string>();

  for (const giftItem of giftItems) {
    const parsed = giftSchema.safeParse(giftItem);

    if (!parsed.success) {
      return {
        status: "error",
        message: "Revise os presentes pendentes. Algum item está incompleto ou inválido.",
        fields: {}
      };
    }

    const normalizedTitle = parsed.data.title.trim().toLowerCase();

    if (pendingTitles.has(normalizedTitle)) {
      return {
        status: "error",
        message: `O presente "${parsed.data.title}" está repetido na lista pendente.`,
        fields: {}
      };
    }

    pendingTitles.add(normalizedTitle);
    parsedGifts.push(parsed.data);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/sign-in" as Route);
  }

  const { data: existingGifts } = await supabase
    .from("gifts")
    .select("title")
    .eq("site_id", siteId)
    .neq("status", "archived");

  const existingTitles = new Set((existingGifts ?? []).map((gift) => String(gift.title).trim().toLowerCase()));
  const duplicatedGift = parsedGifts.find((gift) => existingTitles.has(gift.title.trim().toLowerCase()));

  if (duplicatedGift) {
    return {
      status: "error",
      message: `O presente "${duplicatedGift.title}" já existe na lista.`,
      fields: {}
    };
  }

  const { error } = await supabase.from("gifts").insert(
    parsedGifts.map((giftItem) => ({
      couple_id: coupleId,
      site_id: siteId,
      title: giftItem.title,
      description: emptyToNull(giftItem.description),
      image_url: emptyToNull(giftItem.imageUrl) ?? getDefaultGiftImage(giftItem.category, giftItem.title),
      amount_cents: toAmountCents(giftItem.amount),
      quantity_total: toOptionalInteger(giftItem.quantityTotal),
      category: giftItem.category,
      status: giftItem.status,
      allow_partial: giftItem.allowPartial === "on"
    }))
  );

  if (error) {
    return {
      status: "error",
      message: mapSiteEditorError(error.message),
      fields: {}
    };
  }

  revalidatePath(`/dashboard/site/${siteId}/editor`);
  revalidatePath("/dashboard");
  revalidatePath(`/wedding/${siteSlug}`);

  return {
    status: "success",
    message: parsedGifts.length === 1 ? "Presente salvo com sucesso." : "Presentes salvos com sucesso.",
    fields: {}
  };
}

export async function archiveGiftAction(
  siteId: string,
  giftId: string,
  siteSlug: string,
  _formData: FormData
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/sign-in" as Route);
  }

  const { error } = await supabase
    .from("gifts")
    .update({ status: "archived" })
    .eq("id", giftId)
    .eq("site_id", siteId);

  if (error) {
    return;
  }

  revalidatePath(`/dashboard/site/${siteId}/editor`);
  revalidatePath("/dashboard");
  revalidatePath(`/wedding/${siteSlug}`);
}

export async function updateGiftAction(
  siteId: string,
  giftId: string,
  siteSlug: string,
  _formData: FormData
) {
  const parsed = giftSchema.safeParse({
    title: getStringField(_formData, "title"),
    description: getStringField(_formData, "description"),
    imageUrl: getStringField(_formData, "imageUrl"),
    amount: getStringField(_formData, "amount"),
    quantityTotal: getStringField(_formData, "quantityTotal"),
    category: getStringField(_formData, "category") || "custom",
    status: getStringField(_formData, "status") || "draft",
    allowPartial: getStringField(_formData, "allowPartial") || "off"
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/sign-in" as Route);
  }

  const { data: existingGift } = await supabase
    .from("gifts")
    .select("id")
    .eq("site_id", siteId)
    .ilike("title", parsed.data.title)
    .neq("id", giftId)
    .neq("status", "archived")
    .limit(1)
    .maybeSingle();

  if (existingGift) {
    return;
  }

  const { error } = await supabase
    .from("gifts")
    .update({
      title: parsed.data.title,
      description: emptyToNull(parsed.data.description),
      image_url: emptyToNull(parsed.data.imageUrl) ?? getDefaultGiftImage(parsed.data.category, parsed.data.title),
      amount_cents: toAmountCents(parsed.data.amount),
      quantity_total: toOptionalInteger(parsed.data.quantityTotal),
      category: parsed.data.category,
      status: parsed.data.status,
      allow_partial: parsed.data.allowPartial === "on"
    })
    .eq("id", giftId)
    .eq("site_id", siteId);

  if (error) {
    return;
  }

  revalidatePath(`/dashboard/site/${siteId}/editor`);
  revalidatePath("/dashboard");
  revalidatePath(`/wedding/${siteSlug}`);
}

export async function createRsvpAction(
  siteId: string,
  siteSlug: string,
  _state: SiteEditorActionState,
  formData: FormData
): Promise<SiteEditorActionState> {
  const fields = createFieldSnapshot(formData, [
    "guestName",
    "email",
    "phone",
    "attendanceStatus",
    "guestCount",
    "message"
  ]);
  const parsed = rsvpSchema.safeParse({
    guestName: getStringField(formData, "guestName"),
    email: getStringField(formData, "email"),
    phone: getStringField(formData, "phone"),
    attendanceStatus: getStringField(formData, "attendanceStatus") || "attending",
    guestCount: getStringField(formData, "guestCount") || "1",
    message: getStringField(formData, "message")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados da confirmação.",
      fields,
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: registeredGuests } = await supabase.rpc("get_public_wedding_guest_options", {
    p_site_id: siteId
  });
  const registeredGuest = ((registeredGuests ?? []) as PublicWeddingGuestOptionRow[]).find(
    (guest) => String(guest.guest_name).trim().toLowerCase() === parsed.data.guestName.trim().toLowerCase()
  );

  if (!registeredGuest) {
    return {
      status: "error",
      message: "Seu nome não foi encontrado na lista de convidados. Confira a grafia ou fale com o casal.",
      fields
    };
  }

  const { error } = await supabase.from("guest_rsvps").insert({
    site_id: siteId,
    guest_name: registeredGuest.guest_name,
    email: emptyToNull(parsed.data.email),
    phone: emptyToNull(parsed.data.phone),
    attendance_status: parsed.data.attendanceStatus,
    guest_count: registeredGuest.expected_guest_count,
    message: emptyToNull(parsed.data.message)
  });

  if (error) {
    return {
      status: "error",
      message: "Não foi possível enviar sua confirmação. Tente novamente.",
      fields
    };
  }

  revalidatePath(`/wedding/${siteSlug}`);
  revalidatePath(`/dashboard/site/${siteId}/editor`);

  return {
    status: "success",
    message: "Confirmação enviada com sucesso. Obrigado!",
    fields: {}
  };
}

export async function createGiftContributionAction(
  giftId: string,
  siteSlug: string,
  _state: SiteEditorActionState,
  formData: FormData
): Promise<SiteEditorActionState> {
  const fields = createFieldSnapshot(formData, ["contributorName", "contributorEmail", "amount", "message"]);
  const parsed = giftContributionSchema.safeParse({
    contributorName: getStringField(formData, "contributorName"),
    contributorEmail: getStringField(formData, "contributorEmail"),
    amount: getStringField(formData, "amount"),
    message: getStringField(formData, "message")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os dados para presentear.",
      fields,
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: gift } = await supabase
    .from("gifts")
    .select("id, site_id, title")
    .eq("id", giftId)
    .maybeSingle();

  if (!gift) {
    return {
      status: "error",
      message: "Este presente não está mais disponível.",
      fields
    };
  }

  const { data: paymentProfile } = await supabase.rpc("get_public_wedding_payment_profile", {
    p_site_id: gift.site_id
  });
  const paymentProfileRow = (paymentProfile?.[0] as PublicWeddingPaymentProfileRow | undefined) ?? null;
  const pixKey = paymentProfileRow?.pix_key?.trim() ?? "";

  if (!pixKey) {
    return {
      status: "error",
      message: "O casal ainda não configurou a chave Pix para receber presentes.",
      fields
    };
  }

  const amountCents = toAmountCents(parsed.data.amount);
  const pixPayload = buildPixPayload({
    pixKey,
    merchantName: paymentProfileRow?.merchant_name || "EverAfter",
    amountCents,
    txid: crypto.randomUUID()
  });
  const { data: contributionId, error } = await supabase.rpc("present_wedding_gift", {
    p_gift_id: giftId,
    p_contributor_name: parsed.data.contributorName,
    p_contributor_email: emptyToNull(parsed.data.contributorEmail),
    p_amount_cents: amountCents,
    p_message: emptyToNull(parsed.data.message),
    p_pix_payload: pixPayload,
    p_pix_key_snapshot: pixKey
  });

  if (error) {
    return {
      status: "error",
      message: mapGiftContributionError(error.message),
      fields
    };
  }

  revalidatePath(`/wedding/${siteSlug}`);

  return {
    status: "success",
    message: "Presente registrado com sucesso. Obrigado pelo carinho!",
    fields: {
      contributorName: parsed.data.contributorName,
      contributorEmail: parsed.data.contributorEmail ?? "",
      amount: parsed.data.amount,
      message: parsed.data.message ?? "",
      contributionId: String(contributionId ?? ""),
      pixPayload
    }
  };
}

export async function createWeddingGuestAction(
  siteId: string,
  coupleId: string,
  _state: SiteEditorActionState,
  formData: FormData
): Promise<SiteEditorActionState> {
  const fields = createFieldSnapshot(formData, [
    "guestName",
    "email",
    "phone",
    "groupName",
    "expectedGuestCount",
    "notes"
  ]);
  const parsed = weddingGuestSchema.safeParse({
    guestName: getStringField(formData, "guestName"),
    email: getStringField(formData, "email"),
    phone: getStringField(formData, "phone"),
    groupName: getStringField(formData, "groupName"),
    expectedGuestCount: getStringField(formData, "expectedGuestCount") || "1",
    notes: getStringField(formData, "notes")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados do convidado.",
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

  const { data: existingGuest } = await supabase
    .from("wedding_guests")
    .select("id")
    .eq("site_id", siteId)
    .ilike("guest_name", parsed.data.guestName)
    .limit(1)
    .maybeSingle();

  if (existingGuest) {
    return {
      status: "error",
      message: "Este convidado já está na lista.",
      fields
    };
  }

  const { error } = await supabase.from("wedding_guests").insert({
    couple_id: coupleId,
    site_id: siteId,
    guest_name: parsed.data.guestName,
    email: emptyToNull(parsed.data.email),
    phone: emptyToNull(parsed.data.phone),
    group_name: emptyToNull(parsed.data.groupName),
    expected_guest_count: Number.parseInt(parsed.data.expectedGuestCount || "1", 10),
    notes: emptyToNull(parsed.data.notes)
  });

  if (error) {
    return {
      status: "error",
      message: mapSiteEditorError(error.message),
      fields
    };
  }

  revalidatePath(`/dashboard/site/${siteId}/editor`);

  return {
    status: "success",
    message: "Convidado cadastrado com sucesso.",
    fields: {}
  };
}
