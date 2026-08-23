import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { defaultWeddingImages, getDefaultGiftImage } from "./default-assets";

export type WeddingSiteEditorData = {
  id: string;
  coupleId: string;
  slug: string;
  status: "draft" | "published" | "unpublished" | "archived";
  title: string;
  description: string;
  weddingDate: string | null;
  heroImageUrl: string;
  story: string;
  ceremonyLocation: string;
  ceremonyTime: string;
  receptionLocation: string;
  receptionTime: string;
  ceremonyImageUrl: string;
  receptionImageUrl: string;
  rsvpNote: string;
  giftNote: string;
};

export type PublicWeddingSite = WeddingSiteEditorData & {
  coupleName: string;
  pixKey: string;
  gifts: PublicGift[];
  guests: PublicWeddingGuest[];
};

export type GiftEditorData = {
  id: string;
  status: "draft" | "active" | "paused" | "sold_out" | "archived";
  category: "cash" | "home" | "experience" | "travel" | "custom";
  title: string;
  description: string;
  imageUrl: string;
  amountCents: number;
  amountContributedCents: number;
  quantityTotal: number | null;
  quantityPurchased: number;
  allowPartial: boolean;
};

export type PublicGift = GiftEditorData;

export type PublicWeddingGuest = {
  id: string;
  guestName: string;
  expectedGuestCount: number;
};

type PublicWeddingGuestRow = {
  id: string;
  guest_name: string;
  expected_guest_count: number;
};

type PublicWeddingPaymentProfileRow = {
  pix_key: string | null;
  merchant_name: string | null;
};

export type RsvpEditorData = {
  id: string;
  guestName: string;
  email: string;
  phone: string;
  attendanceStatus: "attending" | "declined";
  guestCount: number;
  message: string;
  createdAt: string;
};

export type WeddingGuestEditorData = {
  id: string;
  guestName: string;
  email: string;
  phone: string;
  groupName: string;
  expectedGuestCount: number;
  notes: string;
  createdAt: string;
};

function normalizeGiftTitle(title: string) {
  return title.trim().toLowerCase();
}

function dedupeGiftsByTitle(gifts: GiftEditorData[]) {
  return Array.from(new Map(gifts.map((gift) => [normalizeGiftTitle(gift.title), gift])).values());
}

export async function getEditableWeddingSite(siteId: string): Promise<WeddingSiteEditorData | null> {
  const supabase = await createSupabaseServerClient();
  const { data: site, error } = await supabase
    .from("wedding_sites")
    .select(
      "id, couple_id, slug, status, title, description, wedding_date, hero_image_url, story, ceremony_location, ceremony_time, reception_location, reception_time, ceremony_image_url, reception_image_url, rsvp_note, gift_note"
    )
    .eq("id", siteId)
    .maybeSingle();

  if (error || !site) {
    return null;
  }

  return {
    id: site.id,
    coupleId: site.couple_id,
    slug: site.slug,
    status: site.status,
    title: site.title ?? "Nosso casamento",
    description: site.description ?? "",
    weddingDate: site.wedding_date,
    heroImageUrl: site.hero_image_url ?? defaultWeddingImages.hero[0].value,
    story: site.story ?? "",
    ceremonyLocation: site.ceremony_location ?? "",
    ceremonyTime: site.ceremony_time ?? "",
    receptionLocation: site.reception_location ?? "",
    receptionTime: site.reception_time ?? "",
    ceremonyImageUrl: site.ceremony_image_url ?? defaultWeddingImages.ceremony[0].value,
    receptionImageUrl: site.reception_image_url ?? defaultWeddingImages.reception[0].value,
    rsvpNote: site.rsvp_note ?? "",
    giftNote: site.gift_note ?? ""
  };
}

export async function getEditableGifts(siteId: string): Promise<GiftEditorData[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("gifts")
    .select(
      "id, status, category, title, description, image_url, amount_cents, amount_contributed_cents, quantity_total, quantity_purchased, allow_partial"
    )
    .eq("site_id", siteId)
    .neq("status", "archived")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return dedupeGiftsByTitle((data ?? []).map((gift) => ({
    id: gift.id,
    status: gift.status,
    category: gift.category,
    title: gift.title,
    description: gift.description ?? "",
    imageUrl: gift.image_url ?? getDefaultGiftImage(gift.category, gift.title),
    amountCents: gift.amount_cents,
    amountContributedCents: gift.amount_contributed_cents ?? 0,
    quantityTotal: gift.quantity_total,
    quantityPurchased: gift.quantity_purchased,
    allowPartial: gift.allow_partial
  })));
}

export async function getEditableRsvps(siteId: string): Promise<RsvpEditorData[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("guest_rsvps")
    .select("id, guest_name, email, phone, attendance_status, guest_count, message, created_at")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((rsvp) => ({
    id: rsvp.id,
    guestName: rsvp.guest_name,
    email: rsvp.email ?? "",
    phone: rsvp.phone ?? "",
    attendanceStatus: rsvp.attendance_status,
    guestCount: rsvp.guest_count,
    message: rsvp.message ?? "",
    createdAt: rsvp.created_at
  }));
}

export async function getEditableWeddingGuests(siteId: string): Promise<WeddingGuestEditorData[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("wedding_guests")
    .select("id, guest_name, email, phone, group_name, expected_guest_count, notes, created_at")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((guest) => ({
    id: guest.id,
    guestName: guest.guest_name,
    email: guest.email ?? "",
    phone: guest.phone ?? "",
    groupName: guest.group_name ?? "",
    expectedGuestCount: guest.expected_guest_count,
    notes: guest.notes ?? "",
    createdAt: guest.created_at
  }));
}

export async function getPublicWeddingSite(slug: string): Promise<PublicWeddingSite | null> {
  const supabase = await createSupabaseServerClient();
  const { data: site, error } = await supabase
    .from("wedding_sites")
    .select(
      "id, couple_id, slug, status, title, description, wedding_date, hero_image_url, story, ceremony_location, ceremony_time, reception_location, reception_time, ceremony_image_url, reception_image_url, rsvp_note, gift_note"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !site || site.status !== "published") {
    return null;
  }

  const { data: couple } = await supabase
    .from("couples")
    .select("display_name")
    .eq("id", site.couple_id)
    .maybeSingle();
  const { data: gifts } = await supabase
    .from("gifts")
    .select(
      "id, status, category, title, description, image_url, amount_cents, amount_contributed_cents, quantity_total, quantity_purchased, allow_partial"
    )
    .eq("site_id", site.id)
    .in("status", ["active", "sold_out"])
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  const { data: guests } = await supabase.rpc("get_public_wedding_guest_options", {
    p_site_id: site.id
  });
  const { data: paymentProfile } = await supabase.rpc("get_public_wedding_payment_profile", {
    p_site_id: site.id
  });

  return {
    id: site.id,
    coupleId: site.couple_id,
    slug: site.slug,
    status: site.status,
    title: site.title ?? "Nosso casamento",
    description: site.description ?? "",
    weddingDate: site.wedding_date,
    heroImageUrl: site.hero_image_url ?? defaultWeddingImages.hero[0].value,
    story: site.story ?? "",
    ceremonyLocation: site.ceremony_location ?? "",
    ceremonyTime: site.ceremony_time ?? "",
    receptionLocation: site.reception_location ?? "",
    receptionTime: site.reception_time ?? "",
    ceremonyImageUrl: site.ceremony_image_url ?? defaultWeddingImages.ceremony[0].value,
    receptionImageUrl: site.reception_image_url ?? defaultWeddingImages.reception[0].value,
    rsvpNote: site.rsvp_note ?? "",
    giftNote: site.gift_note ?? "",
    coupleName: couple?.display_name ?? site.title ?? "Nosso casamento",
    pixKey: ((paymentProfile?.[0] as PublicWeddingPaymentProfileRow | undefined)?.pix_key ?? "").trim(),
    guests: ((guests ?? []) as PublicWeddingGuestRow[]).map((guest) => ({
      id: guest.id,
      guestName: guest.guest_name,
      expectedGuestCount: guest.expected_guest_count
    })),
    gifts: dedupeGiftsByTitle((gifts ?? []).map((gift) => ({
      id: gift.id,
      status: gift.status,
      category: gift.category,
      title: gift.title,
      description: gift.description ?? "",
      imageUrl: gift.image_url ?? getDefaultGiftImage(gift.category, gift.title),
      amountCents: gift.amount_cents,
      amountContributedCents: gift.amount_contributed_cents ?? 0,
      quantityTotal: gift.quantity_total,
      quantityPurchased: gift.quantity_purchased,
      allowPartial: gift.allow_partial
    })))
  };
}
