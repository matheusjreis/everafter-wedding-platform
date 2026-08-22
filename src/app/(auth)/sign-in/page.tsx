import Link from "next/link";

import { AuthCard } from "@/features/auth/components/auth-card";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export default function SignInPage() {
  return (
    <AuthCard
      eyebrow="Acesso seguro"
      title="Entre no painel do casal."
      description="Acesse seu espaço privado para acompanhar o site, as confirmações, os presentes e a publicação."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link href="/sign-up" className="font-medium text-primary hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <SignInForm />
    </AuthCard>
  );
}
