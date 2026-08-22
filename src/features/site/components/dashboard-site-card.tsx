"use client";

import Link from "next/link";
import type { Route } from "next";
import { CalendarDays, CheckCircle2, ExternalLink, LinkIcon, Power, Save } from "lucide-react";
import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import { updateDashboardSiteSettingsAction } from "../actions";
import { initialSiteEditorActionState } from "../state";

type DashboardSiteCardProps = {
  site: {
    id: string;
    slug: string;
    status: "draft" | "published" | "unpublished" | "archived";
    title: string | null;
    weddingDate: string | null;
  };
};

function toDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

function formatWeddingDate(value: string | null) {
  if (!value) {
    return "Data não definida";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(value));
}

function getStatusLabel(status: DashboardSiteCardProps["site"]["status"]) {
  if (status === "published") {
    return "Publicado";
  }

  if (status === "unpublished") {
    return "Fora do ar";
  }

  if (status === "archived") {
    return "Arquivado";
  }

  return "Rascunho";
}

export function DashboardSiteCard({ site }: DashboardSiteCardProps) {
  const action = updateDashboardSiteSettingsAction.bind(null, site.id, site.slug);
  const [state, formAction] = useActionState(action, initialSiteEditorActionState);
  const [selectedStatus, setSelectedStatus] = useState<"draft" | "published" | "unpublished">(
    site.status === "archived" ? "unpublished" : site.status
  );
  const [isToastVisible, setIsToastVisible] = useState(false);
  const publicHref = `/wedding/${site.slug}` as Route;
  const editorHref = `/dashboard/site/${site.id}/editor` as Route;
  const fields = state.fields;

  useEffect(() => {
    setSelectedStatus(site.status === "archived" ? "unpublished" : site.status);
  }, [site.status]);

  useEffect(() => {
    if (!state.message) {
      return;
    }

    setIsToastVisible(true);
    const timeout = window.setTimeout(() => setIsToastVisible(false), 3800);

    return () => window.clearTimeout(timeout);
  }, [state.message, state.status]);

  return (
    <article className="rounded-lg border bg-card p-6 shadow-sm">
      {state.message && isToastVisible ? (
        <div
          role="status"
          className={
            state.status === "error"
              ? "fixed right-4 top-4 z-50 max-w-sm rounded-lg border border-destructive/30 bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground shadow-xl"
              : "fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-emerald-300 bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xl"
          }
        >
          {state.status === "success" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : null}
          <span>{state.message}</span>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            Site {selectedStatus === "unpublished" ? "fora do ar" : selectedStatus === "published" ? "publicado" : "em rascunho"}
          </p>
          <h2 className="mt-4 text-2xl font-semibold">{site.title ?? "Site do casamento"}</h2>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {getStatusLabel(selectedStatus)}
        </span>
      </div>

      <form action={formAction} className="mt-6 grid gap-5">
        <input name="status" type="hidden" value={selectedStatus} />

        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <label className="grid gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Endereço público</span>
            <span className="relative">
              <LinkIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="slug"
                defaultValue={fields?.slug ?? site.slug}
                className="h-11 w-full rounded-md border bg-background px-10 text-sm lowercase outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </span>
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Data</span>
            <span className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="weddingDate"
                type="date"
                defaultValue={fields?.weddingDate ?? toDateInputValue(site.weddingDate)}
                className="h-11 w-full rounded-md border bg-background px-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </span>
          </label>
        </div>

        <dl className="grid gap-4 border-y py-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Status atual</dt>
            <dd className="mt-2 text-sm font-semibold">{getStatusLabel(site.status)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Data salva</dt>
            <dd className="mt-2 text-sm font-semibold">{formatWeddingDate(site.weddingDate)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Endereço salvo</dt>
            <dd className="mt-2 text-sm font-semibold">/wedding/{site.slug}</dd>
          </div>
        </dl>

        <div className="grid gap-3 rounded-lg border bg-background/60 p-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setSelectedStatus("published")}
            className={`rounded-md border px-3 py-3 text-left text-sm font-semibold transition ${
              selectedStatus === "published" ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary"
            }`}
          >
            Ativar site
            <span className="mt-1 block text-xs font-normal opacity-80">O endereço público volta a abrir.</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus("draft")}
            className={`rounded-md border px-3 py-3 text-left text-sm font-semibold transition ${
              selectedStatus === "draft" ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary"
            }`}
          >
            Rascunho
            <span className="mt-1 block text-xs font-normal opacity-80">Fica oculto para convidados.</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus("unpublished")}
            className={`rounded-md border px-3 py-3 text-left text-sm font-semibold transition ${
              selectedStatus === "unpublished" ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary"
            }`}
          >
            Sair do ar
            <span className="mt-1 block text-xs font-normal opacity-80">O endereço retorna 404.</span>
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {selectedStatus === "published" ? (
            <Button asChild>
              <a href={publicHref} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 size-4" />
                Ver site público
              </a>
            </Button>
          ) : (
            <Button type="button" variant="outline" disabled>
              <Power className="mr-2 size-4" />
              Site fora do ar
            </Button>
          )}
          <Button type="submit">
            <Save className="mr-2 size-4" />
            Salvar ajustes
          </Button>
          <Button asChild variant="outline">
            <Link href={editorHref}>Abrir editor</Link>
          </Button>
        </div>
      </form>
    </article>
  );
}
