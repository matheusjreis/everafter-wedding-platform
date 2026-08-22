import Link from "next/link";
import type { Route } from "next";

import { AuthCard } from "@/features/auth/components/auth-card";
import { SignUpForm } from "@/features/auth/components/sign-up-form";

export default function SignUpPage() {
  const signInHref = "/sign-in" as Route;

  return (
    <AuthCard
      eyebrow="Cadastro do casal"
      title="Crie sua conta EverAfter."
      description="Comece com uma conta segura para configurar o site, os presentes, o RSVP e a publicação do casamento."
      footer={
        <>
          Já tem uma conta?{" "}
          <Link href={signInHref} className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthCard>
  );
}
