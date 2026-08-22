"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/forms/submit-button";
import { PasswordInput } from "@/components/forms/password-input";
import { signUpAction } from "@/features/auth/actions";
import { initialAuthActionState } from "@/features/auth/state";

import { AuthMessage } from "./auth-message";

export function SignUpForm() {
  const [state, formAction] = useActionState(signUpAction, initialAuthActionState);

  return (
    <form action={formAction} className="space-y-5">
      <AuthMessage state={state} />
      <div className="space-y-2">
        <label htmlFor="fullName" className="text-sm font-medium">
          Nome completo
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          defaultValue={state.fields?.fullName}
          className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
        />
        {state.fieldErrors?.fullName ? (
          <p className="text-sm text-destructive">{state.fieldErrors.fullName[0]}</p>
        ) : null}
      </div>
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
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Senha
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
      <SubmitButton pendingLabel="Criando conta...">Criar conta</SubmitButton>
    </form>
  );
}
