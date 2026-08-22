"use client";

import { CalendarDays, LinkIcon, Sparkles } from "lucide-react";
import { useActionState } from "react";

import { SubmitButton } from "@/components/forms/submit-button";

import { createCoupleOnboardingAction } from "../actions";
import { initialOnboardingActionState } from "../state";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }

  return <p className="text-sm font-medium text-destructive">{messages[0]}</p>;
}

export function OnboardingForm() {
  const [state, action] = useActionState(createCoupleOnboardingAction, initialOnboardingActionState);

  return (
    <form action={action} className="grid gap-5">
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

      <label className="grid gap-2">
        <span className="text-sm font-medium">Nome do casal</span>
        <span className="relative">
          <Sparkles className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="coupleName"
            defaultValue={state.fields?.coupleName}
            className="h-11 w-full rounded-md border bg-background px-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Ana e Bruno"
            required
          />
        </span>
        <FieldError messages={state.fieldErrors?.coupleName} />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium">Endereço público</span>
        <span className="relative">
          <LinkIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="siteSlug"
            defaultValue={state.fields?.siteSlug}
            className="h-11 w-full rounded-md border bg-background px-10 text-sm lowercase outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="ana-e-bruno"
            required
          />
        </span>
        <p className="text-xs text-muted-foreground">Use letras minúsculas, números e hífens.</p>
        <FieldError messages={state.fieldErrors?.siteSlug} />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium">Título do site</span>
        <input
          name="weddingTitle"
          defaultValue={state.fields?.weddingTitle}
          className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="Nosso casamento"
          required
        />
        <FieldError messages={state.fieldErrors?.weddingTitle} />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium">Data do casamento</span>
        <span className="relative">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="weddingDate"
            type="date"
            defaultValue={state.fields?.weddingDate}
            className="h-11 w-full rounded-md border bg-background px-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </span>
        <FieldError messages={state.fieldErrors?.weddingDate} />
      </label>

      <SubmitButton className="mt-2 w-full">Criar painel inicial</SubmitButton>
    </form>
  );
}
