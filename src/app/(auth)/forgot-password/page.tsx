import Link from "next/link";
import type { Route } from "next";

import { AuthCard } from "@/features/auth/components/auth-card";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export default function ForgotPasswordPage() {
  const signInHref = "/sign-in" as Route;

  return (
    <AuthCard
      eyebrow="Recuperação de senha"
      title="Recupere o acesso com segurança."
      description="Informe seu e-mail e enviaremos um link para redefinir sua senha, se a conta existir."
      footer={
        <Link href={signInHref} className="font-medium text-primary hover:underline">
          Voltar para o login
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
