import Link from "next/link";
import type { Route } from "next";

import { Button } from "@/components/ui/button";

export default function AuthErrorPage() {
  const signInHref = "/sign-in" as Route;

  return (
    <main className="container flex min-h-screen items-center py-16">
      <div className="max-w-xl space-y-5">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">Falha de autenticação</p>
        <h1 className="font-serif text-4xl leading-tight">Não foi possível concluir o acesso.</h1>
        <p className="text-base leading-7 text-muted-foreground">
          O link pode ter expirado ou já ter sido utilizado. Solicite um novo link ou tente entrar novamente.
        </p>
        <Button asChild>
          <Link href={signInHref}>Voltar para o login</Link>
        </Button>
      </div>
    </main>
  );
}
