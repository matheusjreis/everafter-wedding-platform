"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

type GiftPaymentLookupRow = {
  id: string;
  pix_key: string | null;
  full_name: string | null;
};

type GiftPaymentMemberRow = {
  user_id: string;
  role: "owner" | "admin" | "collaborator";
  created_at: string;
};

function getPaymentProfileRow(data: unknown): PublicWeddingPaymentProfileRow | null {
  if (Array.isArray(data)) {
    return (data[0] as PublicWeddingPaymentProfileRow | undefined) ?? null;
  }

  if (data && typeof data === "object" && "pix_key" in data) {
    return data as PublicWeddingPaymentProfileRow;
  }

  return null;
}

function getFirstPaymentMemberRow(data: unknown): GiftPaymentMemberRow | null {
  if (!Array.isArray(data)) {
    return null;
  }

  return (data[0] as GiftPaymentMemberRow | undefined) ?? null;
}

function maskPixKey(value?: string | null) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.includes("@")) {
    const [name, domain] = trimmed.split("@");
    return `${name.slice(0, 3)}***@${domain}`;
  }

  return `${trimmed.slice(0, 4)}***${trimmed.slice(-2)}`;
}

function getPixLookupFailureMessage({
  rpcHasPixKey,
  memberRowsCount,
  memberRowsWithPixCount,
  hasSnapshot
}: {
  rpcHasPixKey: boolean;
  memberRowsCount: number;
  memberRowsWithPixCount: number;
  hasSnapshot: boolean;
}) {
  if (!rpcHasPixKey && memberRowsWithPixCount > 0) {
    return "A RPC pública não retornou a chave Pix, mas há membro ativo com Pix. Verifique o formato da consulta de membros.";
  }

  if (!rpcHasPixKey && memberRowsCount === 0) {
    return "Nenhum membro ativo foi encontrado para o casal deste presente. Verifique o couple_id do presente.";
  }

  if (!rpcHasPixKey && memberRowsCount > 0 && memberRowsWithPixCount === 0) {
    return "Membros ativos foram encontrados, mas nenhum deles tem chave Pix preenchida.";
  }

  if (!hasSnapshot) {
    return "A chave Pix também não chegou pelo formulário público. Recarregue a página e tente novamente.";
  }

  return "Nenhuma chave Pix válida foi encontrada para este presente.";
}

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

  if (normalizedMessage.includes("schema cache") || normalizedMessage.includes("column")) {
    return "A tabela de contribuições está desatualizada no Supabase. Rode a migration de presentes Pix.";
  }

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
    return "Nenhum perfil ativo do casal tem chave Pix cadastrada para receber presentes.";
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
  boundPixKeySnapshot: string,
  _state: SiteEditorActionState,
  formData: FormData
): Promise<SiteEditorActionState> {
  const fields = createFieldSnapshot(formData, ["contributorName", "contributorEmail", "amount", "message"]);
  const pixKeySnapshot = boundPixKeySnapshot.trim() || getStringField(formData, "pixKeySnapshot").trim();
  console.log("[EverAfter Pix] Iniciando contribuição de presente", {
    giftId,
    siteSlug,
    hasBoundPixKeySnapshot: boundPixKeySnapshot.trim().length > 0,
    hasFormPixKeySnapshot: getStringField(formData, "pixKeySnapshot").trim().length > 0,
    pixKeySnapshot: maskPixKey(pixKeySnapshot)
  });
  const parsed = giftContributionSchema.safeParse({
    contributorName: getStringField(formData, "contributorName"),
    contributorEmail: getStringField(formData, "contributorEmail"),
    amount: getStringField(formData, "amount"),
    message: getStringField(formData, "message")
  });

  if (!parsed.success) {
    console.log("[EverAfter Pix] Validação do formulário falhou", {
      giftId,
      fieldErrors: parsed.error.flatten().fieldErrors
    });

    return {
      status: "error",
      message: "Revise os dados para presentear.",
      fields,
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  let supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>;

  try {
    supabaseAdmin = createSupabaseAdminClient();
  } catch (error) {
    console.error("[EverAfter Pix] Falha ao criar Supabase admin client", {
      giftId,
      error
    });

    return {
      status: "error",
      message: "A configuração privada do Supabase está incompleta para gerar Pix.",
      fields
    };
  }

  const { data: gift } = await supabaseAdmin
    .from("gifts")
    .select("id, site_id, couple_id, status, amount_cents, amount_contributed_cents, quantity_total, allow_partial, title")
    .eq("id", giftId)
    .maybeSingle();

  const { data: weddingSite, error: weddingSiteError } = gift
    ? await supabaseAdmin.from("wedding_sites").select("status").eq("id", gift.site_id).maybeSingle()
    : { data: null, error: null };

  console.log("[EverAfter Pix] Resultado da busca do presente/site", {
    giftId,
    giftFound: Boolean(gift),
    giftStatus: gift?.status,
    giftSiteId: gift?.site_id,
    giftCoupleId: gift?.couple_id,
    weddingSiteStatus: weddingSite?.status,
    weddingSiteError: weddingSiteError?.message
  });

  if (!gift || weddingSite?.status !== "published" || gift.status !== "active") {
    return {
      status: "error",
      message: "Este presente não está mais disponível.",
      fields
    };
  }

  const { data: paymentProfile } = await supabaseAdmin.rpc("get_public_wedding_payment_profile", {
    p_site_id: gift.site_id
  });
  const paymentProfileRow = getPaymentProfileRow(paymentProfile);
  console.log("[EverAfter Pix] Resultado da RPC de perfil Pix", {
    giftId,
    siteId: gift.site_id,
    rawIsArray: Array.isArray(paymentProfile),
    rawRowsCount: Array.isArray(paymentProfile) ? paymentProfile.length : paymentProfile ? 1 : 0,
    hasRpcPixKey: Boolean(paymentProfileRow?.pix_key?.trim()),
    rpcPixKey: maskPixKey(paymentProfileRow?.pix_key),
    merchantName: paymentProfileRow?.merchant_name
  });

  const { data: paymentMemberRows, error: paymentMemberRowsError } = await supabaseAdmin
    .from("couple_members")
    .select("user_id, role, created_at")
    .eq("couple_id", gift.couple_id)
    .eq("status", "active")
    .order("created_at", { ascending: true });
  const normalizedPaymentMemberRows = (paymentMemberRows as GiftPaymentMemberRow[] | null | undefined) ?? [];
  const { data: paymentProfiles, error: paymentProfilesError } = normalizedPaymentMemberRows.length
    ? await supabaseAdmin
        .from("profiles")
        .select("id, pix_key, full_name")
        .in(
          "id",
          normalizedPaymentMemberRows.map((row) => row.user_id)
        )
    : { data: [], error: null };
  const profileByUserId = new Map(
    ((paymentProfiles ?? []) as GiftPaymentLookupRow[]).map((profile) => [profile.id, profile])
  );
  const paymentMemberRowsWithPix = normalizedPaymentMemberRows.filter((row) =>
    profileByUserId.get(row.user_id)?.pix_key?.trim()
  );
  console.log("[EverAfter Pix] Resultado da consulta direta de membros", {
    giftId,
    coupleId: gift.couple_id,
    rowsCount: normalizedPaymentMemberRows.length,
    rowsWithPixCount: paymentMemberRowsWithPix.length,
    memberQueryError: paymentMemberRowsError?.message,
    profileQueryError: paymentProfilesError?.message,
    rows: normalizedPaymentMemberRows.map((row) => {
      const profile = profileByUserId.get(row.user_id);

      return {
        userId: row.user_id,
        role: row.role,
        hasPixKey: Boolean(profile?.pix_key?.trim()),
        pixKey: maskPixKey(profile?.pix_key),
        fullName: profile?.full_name
      };
      })
  });
  const paymentMemberRow = getFirstPaymentMemberRow(
    paymentMemberRowsWithPix
      .sort((left, right) => {
        const priority = { owner: 1, admin: 2, collaborator: 3 };

        return priority[left.role] - priority[right.role];
      })
  );
  const memberProfile = paymentMemberRow ? profileByUserId.get(paymentMemberRow.user_id) ?? null : null;
  const pixKey = paymentProfileRow?.pix_key?.trim() || memberProfile?.pix_key?.trim() || pixKeySnapshot;
  console.log("[EverAfter Pix] Chave Pix escolhida para gerar QR", {
    giftId,
    source: paymentProfileRow?.pix_key?.trim() ? "rpc" : memberProfile?.pix_key?.trim() ? "member_query" : pixKeySnapshot ? "snapshot" : "none",
    hasPixKey: pixKey.length > 0,
    pixKey: maskPixKey(pixKey)
  });

  if (!pixKey) {
    return {
      status: "error",
      message: getPixLookupFailureMessage({
        rpcHasPixKey: Boolean(paymentProfileRow?.pix_key?.trim()),
        memberRowsCount: normalizedPaymentMemberRows.length,
        memberRowsWithPixCount: paymentMemberRowsWithPix.length,
        hasSnapshot: pixKeySnapshot.length > 0
      }),
      fields
    };
  }

  const amountCents = toAmountCents(parsed.data.amount);
  const pixPayload = buildPixPayload({
    pixKey,
    merchantName: paymentProfileRow?.merchant_name || memberProfile?.full_name || "EverAfter",
    amountCents,
    txid: crypto.randomUUID()
  });
  const targetCents = gift.amount_cents * (gift.quantity_total ?? 1);
  const currentAmountCents = gift.amount_contributed_cents ?? 0;
  const remainingCents = targetCents - currentAmountCents;

  if (remainingCents <= 0) {
    await supabaseAdmin
      .from("gifts")
      .update({
        status: "sold_out",
        quantity_purchased: gift.quantity_total ?? 1
      })
      .eq("id", gift.id);

    return {
      status: "error",
      message: "Este presente não está mais disponível.",
      fields
    };
  }

  if (!gift.allow_partial && amountCents !== Math.min(gift.amount_cents, remainingCents)) {
    return {
      status: "error",
      message: "Este presente não aceita pagamento parcial.",
      fields
    };
  }

  if (amountCents > remainingCents) {
    return {
      status: "error",
      message: "O valor informado é maior que o saldo disponível para este presente.",
      fields
    };
  }

  const contributionInsert = {
    couple_id: gift.couple_id,
    site_id: gift.site_id,
    gift_id: gift.id,
    contributor_name: parsed.data.contributorName.trim(),
    contributor_email: emptyToNull(parsed.data.contributorEmail),
    amount_cents: amountCents,
    message: emptyToNull(parsed.data.message),
    status: "approved",
    payment_provider: "mock",
    provider_reference: `mock-${crypto.randomUUID()}`,
    pix_key_snapshot: pixKey,
    pix_payload: pixPayload
  };
  const { data: firstContribution, error: firstContributionError } = await supabaseAdmin
    .from("gift_contributions")
    .insert(contributionInsert)
    .select("id")
    .single();
  const shouldRetryWithoutPixColumns =
    firstContributionError?.message.includes("schema cache") &&
    (firstContributionError.message.includes("pix_key_snapshot") || firstContributionError.message.includes("pix_payload"));
  const { data: fallbackContribution, error: fallbackContributionError } = shouldRetryWithoutPixColumns
    ? await supabaseAdmin
        .from("gift_contributions")
        .insert({
          couple_id: contributionInsert.couple_id,
          site_id: contributionInsert.site_id,
          gift_id: contributionInsert.gift_id,
          contributor_name: contributionInsert.contributor_name,
          contributor_email: contributionInsert.contributor_email,
          amount_cents: contributionInsert.amount_cents,
          message: contributionInsert.message,
          status: contributionInsert.status,
          payment_provider: contributionInsert.payment_provider,
          provider_reference: contributionInsert.provider_reference
        })
        .select("id")
        .single()
    : { data: null, error: null };
  const contribution = fallbackContribution ?? firstContribution;
  const error = fallbackContributionError ?? (shouldRetryWithoutPixColumns ? null : firstContributionError);

  console.log("[EverAfter Pix] Resultado do registro da contribuição", {
    giftId,
    contributionId: contribution?.id,
    retriedWithoutPixColumns: shouldRetryWithoutPixColumns,
    firstError: firstContributionError?.message,
    fallbackError: fallbackContributionError?.message,
    error: error?.message
  });

  if (error) {
    return {
      status: "error",
      message: mapGiftContributionError(error.message),
      fields
    };
  }

  const newAmountCents = currentAmountCents + amountCents;
  const { error: giftUpdateError } = await supabaseAdmin
    .from("gifts")
    .update({
      amount_contributed_cents: newAmountCents,
      quantity_purchased: Math.min(gift.quantity_total ?? 1, Math.floor(newAmountCents / gift.amount_cents)),
      status: newAmountCents >= targetCents ? "sold_out" : gift.status
    })
    .eq("id", gift.id);
  console.log("[EverAfter Pix] Resultado da atualização do presente", {
    giftId,
    newAmountCents,
    targetCents,
    nextStatus: newAmountCents >= targetCents ? "sold_out" : gift.status,
    error: giftUpdateError?.message
  });

  revalidatePath(`/wedding/${siteSlug}`);

  return {
    status: "success",
    message: "Presente registrado com sucesso. Obrigado pelo carinho!",
    fields: {
      contributorName: parsed.data.contributorName,
      contributorEmail: parsed.data.contributorEmail ?? "",
      amount: parsed.data.amount,
      message: parsed.data.message ?? "",
      contributionId: String(contribution?.id ?? ""),
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
