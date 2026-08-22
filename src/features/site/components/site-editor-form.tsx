"use client";

import { CalendarDays, ImageIcon, LinkIcon, MapPin, Send, Type } from "lucide-react";
import { useActionState } from "react";

import { SubmitButton } from "@/components/forms/submit-button";

import { updateWeddingSiteAction } from "../actions";
import { initialSiteEditorActionState } from "../state";
import type { WeddingSiteEditorData } from "../data";

type SiteEditorFormProps = {
  site: WeddingSiteEditorData;
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }

  return <p className="text-sm font-medium text-destructive">{messages[0]}</p>;
}

function toDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

export function SiteEditorForm({ site }: SiteEditorFormProps) {
  const updateAction = updateWeddingSiteAction.bind(null, site.id);
  const [state, action] = useActionState(updateAction, initialSiteEditorActionState);

  return (
    <form action={action} className="grid gap-6">
      {state.message ? (
        <p
          className={
            state.status === "error"
              ? "rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              : "rounded-md border border-secondary/30 bg-secondary/10 px-4 py-3 text-sm text-secondary-foreground"
          }
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Título</span>
          <span className="relative">
            <Type className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="title"
              defaultValue={state.fields?.title ?? site.title}
              className="h-11 w-full rounded-md border bg-background px-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              required
            />
          </span>
          <FieldError messages={state.fieldErrors?.title} />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Endereço público</span>
          <span className="relative">
            <LinkIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="slug"
              defaultValue={state.fields?.slug ?? site.slug}
              className="h-11 w-full rounded-md border bg-background px-10 text-sm lowercase outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              required
            />
          </span>
          <FieldError messages={state.fieldErrors?.slug} />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Data</span>
          <span className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="weddingDate"
              type="date"
              defaultValue={state.fields?.weddingDate ?? toDateInputValue(site.weddingDate)}
              className="h-11 w-full rounded-md border bg-background px-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </span>
          <FieldError messages={state.fieldErrors?.weddingDate} />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Status</span>
          <select
            name="status"
            defaultValue={state.fields?.status ?? site.status}
            className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
            <option value="unpublished">Despublicado</option>
          </select>
          <FieldError messages={state.fieldErrors?.status} />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-medium">Descrição curta</span>
        <textarea
          name="description"
          defaultValue={state.fields?.description ?? site.description}
          rows={3}
          className="w-full resize-y rounded-md border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="Uma mensagem breve para abrir o site."
        />
        <FieldError messages={state.fieldErrors?.description} />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium">Imagem principal</span>
        <span className="relative">
          <ImageIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="heroImageUrl"
            type="url"
            defaultValue={state.fields?.heroImageUrl ?? site.heroImageUrl}
            className="h-11 w-full rounded-md border bg-background px-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="https://..."
          />
        </span>
        <FieldError messages={state.fieldErrors?.heroImageUrl} />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium">História do casal</span>
        <textarea
          name="story"
          defaultValue={state.fields?.story ?? site.story}
          rows={8}
          className="w-full resize-y rounded-md border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="Conte como tudo começou."
        />
        <FieldError messages={state.fieldErrors?.story} />
      </label>

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Local da cerimônia</span>
          <span className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="ceremonyLocation"
              defaultValue={state.fields?.ceremonyLocation ?? site.ceremonyLocation}
              className="h-11 w-full rounded-md border bg-background px-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </span>
          <FieldError messages={state.fieldErrors?.ceremonyLocation} />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Local da recepção</span>
          <span className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="receptionLocation"
              defaultValue={state.fields?.receptionLocation ?? site.receptionLocation}
              className="h-11 w-full rounded-md border bg-background px-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </span>
          <FieldError messages={state.fieldErrors?.receptionLocation} />
        </label>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Mensagem de RSVP</span>
          <textarea
            name="rsvpNote"
            defaultValue={state.fields?.rsvpNote ?? site.rsvpNote}
            rows={4}
            className="w-full resize-y rounded-md border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <FieldError messages={state.fieldErrors?.rsvpNote} />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Mensagem de presentes</span>
          <textarea
            name="giftNote"
            defaultValue={state.fields?.giftNote ?? site.giftNote}
            rows={4}
            className="w-full resize-y rounded-md border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <FieldError messages={state.fieldErrors?.giftNote} />
        </label>
      </div>

      <SubmitButton pendingLabel="Salvando site...">
        <span className="inline-flex items-center gap-2">
          <Send className="size-4" />
          Salvar site
        </span>
      </SubmitButton>
    </form>
  );
}
