import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CurrentCouple = {
  id: string;
  displayName: string | null;
  status: "onboarding" | "active" | "suspended" | "blocked";
  memberRole: "owner" | "admin" | "collaborator";
  site: {
    id: string;
    slug: string;
    status: "draft" | "published" | "unpublished" | "archived";
    title: string | null;
    description: string | null;
    weddingDate: string | null;
  } | null;
};

export async function getCurrentCouple(userId: string): Promise<CurrentCouple | null> {
  const supabase = await createSupabaseServerClient();
  const { data: membership, error: membershipError } = await supabase
    .from("couple_members")
    .select("couple_id, role")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) {
    return null;
  }

  const { data: couple, error: coupleError } = await supabase
    .from("couples")
    .select("id, display_name, status")
    .eq("id", membership.couple_id)
    .maybeSingle();

  if (coupleError || !couple) {
    return null;
  }

  const { data: site } = await supabase
    .from("wedding_sites")
    .select("id, slug, status, title, description, wedding_date")
    .eq("couple_id", couple.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    id: couple.id,
    displayName: couple.display_name,
    status: couple.status,
    memberRole: membership.role,
    site: site
      ? {
          id: site.id,
          slug: site.slug,
          status: site.status,
          title: site.title,
          description: site.description,
          weddingDate: site.wedding_date
        }
      : null
  };
}
