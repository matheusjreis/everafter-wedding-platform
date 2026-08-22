import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  rsvpNote: string;
  giftNote: string;
};

export type PublicWeddingSite = WeddingSiteEditorData & {
  coupleName: string;
};

export async function getEditableWeddingSite(siteId: string): Promise<WeddingSiteEditorData | null> {
  const supabase = await createSupabaseServerClient();
  const { data: site, error } = await supabase
    .from("wedding_sites")
    .select(
      "id, couple_id, slug, status, title, description, wedding_date, hero_image_url, story, ceremony_location, reception_location, rsvp_note, gift_note"
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
    heroImageUrl: site.hero_image_url ?? "",
    story: site.story ?? "",
    ceremonyLocation: site.ceremony_location ?? "",
    receptionLocation: site.reception_location ?? "",
    rsvpNote: site.rsvp_note ?? "",
    giftNote: site.gift_note ?? ""
  };
}

export async function getPublicWeddingSite(slug: string): Promise<PublicWeddingSite | null> {
  const supabase = await createSupabaseServerClient();
  const { data: site, error } = await supabase
    .from("wedding_sites")
    .select(
      "id, couple_id, slug, status, title, description, wedding_date, hero_image_url, story, ceremony_location, reception_location, rsvp_note, gift_note"
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

  return {
    id: site.id,
    coupleId: site.couple_id,
    slug: site.slug,
    status: site.status,
    title: site.title ?? "Nosso casamento",
    description: site.description ?? "",
    weddingDate: site.wedding_date,
    heroImageUrl: site.hero_image_url ?? "",
    story: site.story ?? "",
    ceremonyLocation: site.ceremony_location ?? "",
    receptionLocation: site.reception_location ?? "",
    rsvpNote: site.rsvp_note ?? "",
    giftNote: site.gift_note ?? "",
    coupleName: couple?.display_name ?? site.title ?? "Nosso casamento"
  };
}
