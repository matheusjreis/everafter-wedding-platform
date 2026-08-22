"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/forms/submit-button";
import { forgotPasswordAction } from "@/features/auth/actions";
import { initialAuthActionState } from "@/features/auth/state";

import { AuthMessage } from "./auth-message";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialAuthActionState);

  return (
    <form action={formAction} className="space-y-5">
      <AuthMessage state={state} />
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.fields?.email}
          className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
        />
        {state.fieldErrors?.email ? <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p> : null}
      </div>
      <SubmitButton pendingLabel="Enviando...">Enviar link de recuperação</SubmitButton>
    </form>
  );
}
