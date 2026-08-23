import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CurrentProfile = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  pixKey: string;
};

export async function getCurrentProfile(userId: string): Promise<CurrentProfile> {
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, pix_key")
    .eq("id", userId)
    .maybeSingle();

  return {
    id: userId,
    email: profile?.email ?? "",
    fullName: profile?.full_name ?? "",
    avatarUrl: profile?.avatar_url ?? null,
    pixKey: profile?.pix_key ?? ""
  };
}
