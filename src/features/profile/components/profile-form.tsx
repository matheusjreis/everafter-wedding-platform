"use client";

import { ImageIcon, Mail, UserRound } from "lucide-react";
import { useActionState } from "react";

import { SubmitButton } from "@/components/forms/submit-button";

import { updateProfileAction } from "../actions";
import { initialProfileActionState } from "../state";

type ProfileFormProps = {
  profile: {
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }

  return <p className="text-sm font-medium text-destructive">{messages[0]}</p>;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, action] = useActionState(updateProfileAction, initialProfileActionState);
  const avatarUrl = state.fields?.avatarUrl ?? profile.avatarUrl ?? "";
  const initials = (state.fields?.fullName ?? profile.fullName)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

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
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt="Foto de perfil"
            className="size-20 rounded-full border object-cover"
          />
        ) : (
          <div className="flex size-20 items-center justify-center rounded-full border bg-muted text-xl font-semibold text-primary">
            {initials || "EA"}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold">Foto de perfil</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Use uma URL pública de imagem. Upload para o Storage será conectado em uma etapa dedicada.
          </p>
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
        <span className="text-sm font-medium">URL da foto</span>
        <span className="relative">
          <ImageIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="avatarUrl"
            type="url"
            defaultValue={avatarUrl}
            className="h-11 w-full rounded-md border bg-background px-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="https://..."
          />
        </span>
        <FieldError messages={state.fieldErrors?.avatarUrl} />
      </label>

      <SubmitButton pendingLabel="Salvando perfil...">Salvar perfil</SubmitButton>
    </form>
  );
}
