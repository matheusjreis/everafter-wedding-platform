import { AuthCard } from "@/features/auth/components/auth-card";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthCard
      eyebrow="Nova senha"
      title="Defina uma nova senha."
      description="Escolha uma senha segura para continuar acessando o painel do EverAfter."
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}
