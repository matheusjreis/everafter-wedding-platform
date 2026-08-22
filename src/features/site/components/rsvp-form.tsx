"use client";

import { Send } from "lucide-react";
import { useActionState } from "react";

import { SubmitButton } from "@/components/forms/submit-button";

import { createRsvpAction } from "../actions";
import { initialSiteEditorActionState } from "../state";

type RsvpFormProps = {
  siteId: string;
  siteSlug: string;
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }

  return <p className="text-sm font-medium text-destructive">{messages[0]}</p>;
}

export function RsvpForm({ siteId, siteSlug }: RsvpFormProps) {
  const rsvpAction = createRsvpAction.bind(null, siteId, siteSlug);
  const [state, action] = useActionState(rsvpAction, initialSiteEditorActionState);

  return (
    <form action={action} className="grid gap-5 rounded-lg border bg-background p-5 shadow-sm">
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

      <input name="guestCount" type="hidden" value="1" />
      <label className="grid gap-2">
        <span className="text-sm font-medium">Nome completo</span>
        <input
          name="guestName"
          defaultValue={state.fields?.guestName}
          className="h-11 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          required
        />
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

      <SubmitButton pendingLabel="Enviando confirmação...">
        <span className="inline-flex items-center gap-2">
          <Send className="size-4" />
          Confirmar presença
        </span>
      </SubmitButton>
    </form>
  );
}
