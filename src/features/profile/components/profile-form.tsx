"use client";

import { KeyRound, Loader2, Mail, Pencil, UserRound } from "lucide-react";
import { useActionState, useRef, useState } from "react";

import { SubmitButton } from "@/components/forms/submit-button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { updateProfileAction } from "../actions";
import { initialProfileActionState } from "../state";

type ProfileFormProps = {
  profile: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    pixKey: string;
  };
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }

  return <p className="text-sm font-medium text-destructive">{messages[0]}</p>;
}

function getSafeFilename(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  return `${crypto.randomUUID()}.${extension.replace(/[^a-z0-9]/g, "") || "jpg"}`;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, action] = useActionState(updateProfileAction, initialProfileActionState);
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(state.fields?.avatarUrl ?? profile.avatarUrl ?? "");
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const initials = (state.fields?.fullName ?? profile.fullName)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  async function handleAvatarChange(file?: File) {
    if (!file) {
      return;
    }

    setUploadError("");

    if (!file.type.startsWith("image/")) {
      setUploadError("Escolha uma imagem válida.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Use uma imagem de até 5 MB.");
      return;
    }

    setIsUploading(true);

    const supabase = createSupabaseBrowserClient();
    const path = `${profile.id}/avatar/${getSafeFilename(file)}`;
    const { error } = await supabase.storage.from("profile-media").upload(path, file, {
      cacheControl: "31536000",
      upsert: false
    });

    if (error) {
      setUploadError("Não foi possível enviar a foto. Confira o bucket profile-media no Supabase.");
      setIsUploading(false);
      return;
    }

    const { data } = supabase.storage.from("profile-media").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    setIsUploading(false);
  }

  return (
    <form action={action} className="grid gap-6">
      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              : "rounded-md border border-secondary/30 bg-secondary/10 px-4 py-3 text-sm text-secondary-foreground"
          }
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <input name="avatarUrl" type="hidden" value={avatarUrl} />
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={(event) => void handleAvatarChange(event.target.files?.[0])}
        />
        <div className="relative">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="group flex size-28 items-center justify-center overflow-hidden rounded-full border bg-muted text-2xl font-semibold text-primary shadow-sm transition hover:border-primary"
            aria-label="Trocar foto de perfil"
            disabled={isUploading}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Foto de perfil"
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{initials || "EA"}</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-1 right-1 inline-flex size-9 items-center justify-center rounded-full border bg-background text-primary shadow-sm transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
            aria-label="Escolher nova foto"
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />}
          </button>
        </div>
        <div>
          <p className="text-sm font-semibold">Foto de perfil</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Clique no lápis para escolher uma foto do computador.
          </p>
          {uploadError ? <p className="mt-2 text-sm font-medium text-destructive">{uploadError}</p> : null}
          <FieldError messages={state.fieldErrors?.avatarUrl} />
        </div>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-medium">Nome completo</span>
        <span className="relative">
          <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="fullName"
            defaultValue={state.fields?.fullName ?? profile.fullName}
            className="h-11 w-full rounded-md border bg-background px-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            required
          />
        </span>
        <FieldError messages={state.fieldErrors?.fullName} />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium">E-mail</span>
        <span className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="email"
            type="email"
            defaultValue={state.fields?.email ?? profile.email}
            className="h-11 w-full rounded-md border bg-background px-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            required
          />
        </span>
        <p className="text-xs text-muted-foreground">Alterar o e-mail pode exigir confirmação pelo Supabase.</p>
        <FieldError messages={state.fieldErrors?.email} />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium">Chave Pix do casal</span>
        <span className="relative">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="pixKey"
            defaultValue={state.fields?.pixKey ?? profile.pixKey}
            className="h-11 w-full rounded-md border bg-background px-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="CPF, e-mail, telefone ou chave aleatória"
          />
        </span>
        <p className="text-xs text-muted-foreground">
          Essa chave será usada para gerar o QR Code Pix dos presentes do site público.
        </p>
        <FieldError messages={state.fieldErrors?.pixKey} />
      </label>

      <SubmitButton pendingLabel="Salvando perfil...">Salvar perfil</SubmitButton>
    </form>
  );
}
