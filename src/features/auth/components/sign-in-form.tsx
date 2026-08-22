"use client";

import Link from "next/link";
import type { Route } from "next";
import { useActionState } from "react";

import { SubmitButton } from "@/components/forms/submit-button";
import { PasswordInput } from "@/components/forms/password-input";
import { signInAction } from "@/features/auth/actions";
import { initialAuthActionState } from "@/features/auth/state";

import { AuthMessage } from "./auth-message";

export function SignInForm() {
  const [state, formAction] = useActionState(signInAction, initialAuthActionState);
  const forgotPasswordHref = "/forgot-password" as Route;

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
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="password" className="text-sm font-medium">
            Senha
          </label>
          <Link href={forgotPasswordHref} className="text-sm font-medium text-primary hover:underline">
            Esqueci minha senha
          </Link>
        </div>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
        />
        {state.fieldErrors?.password ? (
          <p className="text-sm text-destructive">{state.fieldErrors.password[0]}</p>
        ) : null}
      </div>
      <SubmitButton pendingLabel="Entrando...">Entrar</SubmitButton>
    </form>
  );
}
