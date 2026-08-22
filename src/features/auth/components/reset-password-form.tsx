"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/forms/submit-button";
import { PasswordInput } from "@/components/forms/password-input";
import { resetPasswordAction } from "@/features/auth/actions";
import { initialAuthActionState } from "@/features/auth/state";

import { AuthMessage } from "./auth-message";

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetPasswordAction, initialAuthActionState);

  return (
    <form action={formAction} className="space-y-5">
      <AuthMessage state={state} />
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Nova senha
        </label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        {state.fieldErrors?.password ? (
          <p className="text-sm text-destructive">{state.fieldErrors.password[0]}</p>
        ) : null}
      </div>
      <SubmitButton pendingLabel="Atualizando...">Atualizar senha</SubmitButton>
    </form>
  );
}
