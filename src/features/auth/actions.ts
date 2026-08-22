"use server";

import { headers } from "next/headers";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { forgotPasswordSchema, resetPasswordSchema, signInSchema, signUpSchema } from "./schemas";
import type { AuthActionState } from "./state";

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

async function getAppUrl() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");

  return origin ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

async function getAuthCallbackUrl(nextPath: string) {
  const callbackUrl = new URL("/auth/callback", await getAppUrl());
  callbackUrl.searchParams.set("next", nextPath);

  return callbackUrl.toString();
}

async function getDefaultAuthCallbackUrl() {
  return new URL("/auth/callback", await getAppUrl()).toString();
}

function mapAuthError(message?: string) {
  if (!message) {
    return "Não foi possível concluir a solicitação. Tente novamente.";
  }

  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("invalid login credentials")) {
    return "E-mail ou senha inválidos.";
  }

  if (normalizedMessage.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar.";
  }

  if (normalizedMessage.includes("user already registered") || normalizedMessage.includes("already registered")) {
    return "Já existe uma conta com este e-mail.";
  }

  if (normalizedMessage.includes("invalid path specified in request url")) {
    return "A URL de redirecionamento do Supabase está inválida. Verifique a configuração de URLs do projeto.";
  }

  return message;
}

export async function signInAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const fields = createFieldSnapshot(formData, ["email"]);
  const parsed = signInSchema.safeParse({
    email: getStringField(formData, "email"),
    password: getStringField(formData, "password")
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
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      status: "error",
      message: mapAuthError(error.message),
      fields
    };
  }

  redirect("/dashboard" as Route);
}

export async function signUpAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const fields = createFieldSnapshot(formData, ["fullName", "email"]);
  const parsed = signUpSchema.safeParse({
    fullName: getStringField(formData, "fullName"),
    email: getStringField(formData, "email"),
    password: getStringField(formData, "password")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fields,
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const callbackUrl = await getDefaultAuthCallbackUrl();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName
      },
      emailRedirectTo: callbackUrl
    }
  });

  if (error) {
    return {
      status: "error",
      message: mapAuthError(error.message),
      fields
    };
  }

  return {
    status: "success",
    message: "Cadastro criado. Verifique seu e-mail para confirmar a conta.",
    fields
  };
}

export async function forgotPasswordAction(
  _state: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const fields = createFieldSnapshot(formData, ["email"]);
  const parsed = forgotPasswordSchema.safeParse({
    email: getStringField(formData, "email")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fields,
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const callbackUrl = await getAuthCallbackUrl("/reset-password");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: callbackUrl
  });

  if (error) {
    return {
      status: "error",
      message: mapAuthError(error.message),
      fields
    };
  }

  return {
    status: "success",
    message: "Se o e-mail existir, enviaremos um link de recuperação.",
    fields
  };
}

export async function resetPasswordAction(
  _state: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: getStringField(formData, "password")
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password
  });

  if (error) {
    return {
      status: "error",
      message: mapAuthError(error.message)
    };
  }

  redirect("/dashboard" as Route);
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  redirect("/" as Route);
}
