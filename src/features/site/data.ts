import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { defaultWeddingImages } from "./default-assets";

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
  receptionLocation: string;
  ceremonyImageUrl: string;
  receptionImageUrl: string;
  rsvpNote: string;
  giftNote: string;
};

export type PublicWeddingSite = WeddingSiteEditorData & {
  coupleName: string;
  gifts: PublicGift[];
};

export type GiftEditorData = {
  id: string;
  status: "draft" | "active" | "paused" | "sold_out" | "archived";
  category: "cash" | "home" | "experience" | "travel" | "custom";
  title: string;
  description: string;
  imageUrl: string;
  amountCents: number;
  quantityTotal: number | null;
  quantityPurchased: number;
  allowPartial: boolean;
};

export type PublicGift = GiftEditorData;

export async function getEditableWeddingSite(siteId: string): Promise<WeddingSiteEditorData | null> {
  const supabase = await createSupabaseServerClient();
  const { data: site, error } = await supabase
    .from("wedding_sites")
    .select(
      "id, couple_id, slug, status, title, description, wedding_date, hero_image_url, story, ceremony_location, reception_location, ceremony_image_url, reception_image_url, rsvp_note, gift_note"
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
    receptionLocation: site.reception_location ?? "",
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
    .select("id, status, category, title, description, image_url, amount_cents, quantity_total, quantity_purchased, allow_partial")
    .eq("site_id", siteId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (data ?? []).map((gift) => ({
    id: gift.id,
    status: gift.status,
    category: gift.category,
    title: gift.title,
    description: gift.description ?? "",
    imageUrl: gift.image_url ?? defaultWeddingImages.gift[0].value,
    amountCents: gift.amount_cents,
    quantityTotal: gift.quantity_total,
    quantityPurchased: gift.quantity_purchased,
    allowPartial: gift.allow_partial
  }));
}

export async function getPublicWeddingSite(slug: string): Promise<PublicWeddingSite | null> {
  const supabase = await createSupabaseServerClient();
  const { data: site, error } = await supabase
    .from("wedding_sites")
    .select(
      "id, couple_id, slug, status, title, description, wedding_date, hero_image_url, story, ceremony_location, reception_location, ceremony_image_url, reception_image_url, rsvp_note, gift_note"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !site || site.status === "archived") {
    return null;
  }

  const { data: couple } = await supabase
    .from("couples")
    .select("display_name")
    .eq("id", site.couple_id)
    .maybeSingle();
  const { data: gifts } = await supabase
    .from("gifts")
    .select("id, status, category, title, description, image_url, amount_cents, quantity_total, quantity_purchased, allow_partial")
    .eq("site_id", site.id)
    .eq("status", "active")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

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
    receptionLocation: site.reception_location ?? "",
    ceremonyImageUrl: site.ceremony_image_url ?? defaultWeddingImages.ceremony[0].value,
    receptionImageUrl: site.reception_image_url ?? defaultWeddingImages.reception[0].value,
    rsvpNote: site.rsvp_note ?? "",
    giftNote: site.gift_note ?? "",
    coupleName: couple?.display_name ?? site.title ?? "Nosso casamento",
    gifts: (gifts ?? []).map((gift) => ({
      id: gift.id,
      status: gift.status,
      category: gift.category,
      title: gift.title,
      description: gift.description ?? "",
      imageUrl: gift.image_url ?? defaultWeddingImages.gift[0].value,
      amountCents: gift.amount_cents,
      quantityTotal: gift.quantity_total,
      quantityPurchased: gift.quantity_purchased,
      allowPartial: gift.allow_partial
    }))
  };
}
