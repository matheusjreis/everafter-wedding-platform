"use client";

import { AlertCircle, CheckCircle2, Send } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

import { SubmitButton } from "@/components/forms/submit-button";

import { createRsvpAction } from "../actions";
import type { PublicWeddingGuest } from "../data";
import { initialSiteEditorActionState } from "../state";

type RsvpFormProps = {
  siteId: string;
  siteSlug: string;
  guests: PublicWeddingGuest[];
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }

  return <p className="text-sm font-medium text-destructive">{messages[0]}</p>;
}

export function RsvpForm({ siteId, siteSlug, guests }: RsvpFormProps) {
  const rsvpAction = createRsvpAction.bind(null, siteId, siteSlug);
  const [state, action] = useActionState(rsvpAction, initialSiteEditorActionState);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [guestName, setGuestName] = useState(state.fields?.guestName ?? "");
  const guestListId = `guest-list-${siteId}`;
  const hasGuests = guests.length > 0;
  const canSuggestGuests = /^\S+\s+/.test(guestName);
  const guestOptions = canSuggestGuests
    ? guests.filter((guest) => guest.guestName.toLowerCase().includes(guestName.trim().toLowerCase()))
    : [];

  useEffect(() => {
    if (!state.message) {
      return;
    }

    setIsToastVisible(true);
    const timeout = window.setTimeout(() => setIsToastVisible(false), 3800);

    return () => window.clearTimeout(timeout);
  }, [state.message, state.status]);

  useEffect(() => {
    if (state.status === "success") {
      setGuestName("");
      return;
    }

    if (state.fields?.guestName) {
      setGuestName(state.fields.guestName);
    }
  }, [state.fields?.guestName, state.status]);

  return (
    <form action={action} className="grid gap-5 rounded-lg border bg-background p-5 shadow-sm">
      {state.message && isToastVisible ? (
        <div
          role="status"
          className={
            state.status === "error"
              ? "fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-destructive/30 bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground shadow-xl"
              : "fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-emerald-300 bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xl"
          }
        >
          {state.status === "error" ? (
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          )}
          <span>{state.message}</span>
        </div>
      ) : null}

      <input name="guestCount" type="hidden" value="1" />
      <label className="grid gap-2">
        <span className="text-sm font-medium">Nome completo</span>
        <input
          name="guestName"
          list={guestListId}
          value={guestName}
          onChange={(event) => setGuestName(event.target.value)}
          className="h-11 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder={hasGuests ? "Digite seu nome e escolha na lista" : "Lista de convidados ainda não cadastrada"}
          disabled={!hasGuests}
          required
        />
        <datalist id={guestListId}>
          {guestOptions.map((guest) => (
            <option key={guest.id} value={guest.guestName}>
              {guest.expectedGuestCount > 1 ? `${guest.expectedGuestCount} pessoas` : "1 pessoa"}
            </option>
          ))}
        </datalist>
        <p className="text-xs leading-5 text-muted-foreground">
          Apenas nomes cadastrados pelo casal podem confirmar presença.
        </p>
        <FieldError messages={state.fieldErrors?.guestName} />
      </label>

      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">Você vai comparecer?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-4 text-sm transition hover:border-primary">
            <input
              name="attendanceStatus"
              type="radio"
              value="attending"
              defaultChecked={state.fields?.attendanceStatus !== "declined"}
              className="size-4 accent-primary"
            />
            Sim, vou comparecer
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-4 text-sm transition hover:border-primary">
            <input
              name="attendanceStatus"
              type="radio"
              value="declined"
              defaultChecked={state.fields?.attendanceStatus === "declined"}
              className="size-4 accent-primary"
            />
            Não poderei ir
          </label>
        </div>
        <FieldError messages={state.fieldErrors?.attendanceStatus} />
      </fieldset>

      <SubmitButton pendingLabel="Enviando confirmação..." disabled={!hasGuests}>
        <span className="inline-flex items-center gap-2">
          <Send className="size-4" />
          Confirmar presença
        </span>
      </SubmitButton>
    </form>
  );
}
