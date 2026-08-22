import Link from "next/link";
import type { ReactNode } from "react";

type AuthCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ eyebrow, title, description, children, footer }: AuthCardProps) {
  return (
    <main className="container grid min-h-screen items-center py-10">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-lg border bg-card shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
        <section className="bg-foreground p-8 text-background sm:p-10">
          <Link href="/" className="font-serif text-2xl">
            EverAfter
          </Link>
          <div className="mt-16 space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent">{eyebrow}</p>
            <h1 className="font-serif text-4xl leading-tight">{title}</h1>
            <p className="text-base leading-7 text-background/75">{description}</p>
          </div>
        </section>
        <section className="p-6 sm:p-10">
          <div className="mx-auto max-w-md space-y-6">
            {children}
            {footer ? <div className="text-center text-sm text-muted-foreground">{footer}</div> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
