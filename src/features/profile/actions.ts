"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { profileSchema } from "./schemas";
import type { ProfileActionState } from "./state";

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

function mapProfileError(message?: string) {
  const normalizedMessage = message?.toLowerCase() ?? "";

  if (normalizedMessage.includes("email")) {
    return "Não foi possível atualizar o e-mail. Verifique se ele já não está em uso.";
  }

  if (normalizedMessage.includes("row-level security")) {
    return "Sua sessão não tem permissão para atualizar este perfil. Entre novamente e tente outra vez.";
  }

  return "Não foi possível atualizar o perfil. Tente novamente.";
}

export async function updateProfileAction(
  _state: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const fields = createFieldSnapshot(formData, ["fullName", "email", "avatarUrl", "pixKey"]);
  const parsed = profileSchema.safeParse({
    fullName: getStringField(formData, "fullName"),
    email: getStringField(formData, "email"),
    avatarUrl: getStringField(formData, "avatarUrl"),
    pixKey: getStringField(formData, "pixKey")
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

  const normalizedAvatarUrl = parsed.data.avatarUrl || null;
  const normalizedPixKey = parsed.data.pixKey?.trim() || null;
  const { error: profileError } = await supabase.rpc("update_own_profile", {
    p_email: parsed.data.email,
    p_full_name: parsed.data.fullName,
    p_avatar_url: normalizedAvatarUrl,
    p_pix_key: normalizedPixKey
  });

  if (profileError) {
    return {
      status: "error",
      message: mapProfileError(profileError.message),
      fields
    };
  }

  if (parsed.data.email !== user.email || parsed.data.fullName !== user.user_metadata.full_name) {
    const { error: authError } = await supabase.auth.updateUser({
      email: parsed.data.email,
      data: {
        full_name: parsed.data.fullName,
        avatar_url: normalizedAvatarUrl
      }
    });

    if (authError) {
      return {
        status: "error",
        message: mapProfileError(authError.message),
        fields
      };
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/profile");

  return {
    status: "success",
    message:
      parsed.data.email !== user.email
        ? "Perfil atualizado. Confirme o novo e-mail para concluir a alteração."
        : "Perfil atualizado com sucesso.",
    fields
  };
}
