"use client";

import { CalendarDays, Gift, LinkIcon, MapPin, Send, Type } from "lucide-react";
import { useActionState } from "react";

import { ImageUploadField } from "@/components/forms/image-upload-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { VisualSelect } from "@/components/forms/visual-select";

import { createGiftAction, updateWeddingSiteAction } from "../actions";
import { defaultWeddingImages, giftPresets } from "../default-assets";
import { initialSiteEditorActionState } from "../state";
import type { GiftEditorData, WeddingSiteEditorData } from "../data";

type SiteEditorFormProps = {
  site: WeddingSiteEditorData;
  gifts: GiftEditorData[];
};

const siteStatusOptions = [
  { value: "draft", label: "Rascunho", description: "Somente membros do casal veem a prévia." },
  { value: "published", label: "Publicado", description: "Disponível para convidados." },
  { value: "unpublished", label: "Despublicado", description: "Oculto sem arquivar o conteúdo." }
];

const giftStatusOptions = [
  { value: "draft", label: "Rascunho", description: "Ainda não aparece para convidados." },
  { value: "active", label: "Ativo", description: "Disponível na lista pública." },
  { value: "paused", label: "Pausado", description: "Temporariamente indisponível." }
];

const giftCategoryOptions = [
  { value: "cash", label: "Cota em dinheiro", description: "Valor simbólico livre ou parcial." },
  { value: "home", label: "Casa nova", description: "Itens para casa e rotina." },
  { value: "experience", label: "Experiência", description: "Jantares, passeios e momentos." },
  { value: "travel", label: "Lua de mel", description: "Viagem, hospedagem e deslocamento." },
  { value: "custom", label: "Personalizado", description: "Qualquer outro tipo de presente." }
];

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

function formatMoney(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(cents / 100);
}

function GiftCreationForm({ site }: { site: WeddingSiteEditorData }) {
  const createAction = createGiftAction.bind(null, site.id, site.coupleId);
  const [state, action] = useActionState(createAction, initialSiteEditorActionState);

  return (
    <form action={action} className="grid gap-5 rounded-lg border bg-background p-5">
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
          <span className="text-sm font-medium">Nome do presente</span>
          <input
            name="title"
            defaultValue={state.fields?.title}
            className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Jantar romântico na lua de mel"
            required
          />
          <FieldError messages={state.fieldErrors?.title} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Valor</span>
          <input
            name="amount"
            inputMode="decimal"
            defaultValue={state.fields?.amount}
            className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="250,00"
            required
          />
          <FieldError messages={state.fieldErrors?.amount} />
        </label>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <VisualSelect
          label="Categoria"
          name="category"
          defaultValue={state.fields?.category ?? "custom"}
          options={giftCategoryOptions}
        />
        <VisualSelect
          label="Status"
          name="status"
          defaultValue={state.fields?.status ?? "draft"}
          options={giftStatusOptions}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Quantidade disponível</span>
          <input
            name="quantityTotal"
            type="number"
            min={1}
            defaultValue={state.fields?.quantityTotal}
            className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Sem limite"
          />
          <FieldError messages={state.fieldErrors?.quantityTotal} />
        </label>
        <label className="flex items-center gap-3 self-end rounded-lg border bg-card px-4 py-3 text-sm">
          <input
            name="allowPartial"
            type="checkbox"
            value="on"
            defaultChecked={state.fields?.allowPartial !== "off"}
            className="size-4 accent-primary"
          />
          Permitir contribuição parcial
        </label>
      </div>

      <ImageUploadField
        label="Foto do presente"
        name="imageUrl"
        initialUrl={state.fields?.imageUrl ?? ""}
        uploadPathPrefix={`${site.coupleId}/${site.id}/gifts`}
        presets={defaultWeddingImages.gift}
      />

      <label className="grid gap-2">
        <span className="text-sm font-medium">Descrição do presente</span>
        <textarea
          name="description"
          defaultValue={state.fields?.description}
          rows={4}
          className="w-full resize-y rounded-md border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          placeholder="Explique o significado do presente ou como o valor será usado."
        />
        <FieldError messages={state.fieldErrors?.description} />
      </label>

      <SubmitButton pendingLabel="Cadastrando presente...">
        <span className="inline-flex items-center gap-2">
          <Gift className="size-4" />
          Cadastrar presente
        </span>
      </SubmitButton>

      <div className="grid gap-3 border-t pt-5">
        <p className="text-sm font-semibold">Presentes comuns</p>
        <div className="grid gap-3 lg:grid-cols-2">
          {giftPresets.map((preset) => (
            <button
              key={preset.id}
              type="submit"
              formNoValidate
              name="presetId"
              value={preset.id}
              className="grid gap-2 rounded-lg border bg-card p-4 text-left text-sm shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
            >
              <span className="font-semibold">{preset.title}</span>
              <span className="leading-6 text-muted-foreground">{preset.description}</span>
              <span className="font-semibold text-primary">R$ {preset.amount}</span>
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}

export function SiteEditorForm({ site, gifts }: SiteEditorFormProps) {
  const updateAction = updateWeddingSiteAction.bind(null, site.id);
  const [state, action] = useActionState(updateAction, initialSiteEditorActionState);

  return (
    <div className="grid gap-6">
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

        <div className="grid gap-2">
          <VisualSelect
            label="Status"
            name="status"
            defaultValue={state.fields?.status ?? site.status}
            options={siteStatusOptions}
          />
          <FieldError messages={state.fieldErrors?.status} />
        </div>
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

      <ImageUploadField
        label="Imagem principal"
        name="heroImageUrl"
        initialUrl={state.fields?.heroImageUrl ?? site.heroImageUrl}
        uploadPathPrefix={`${site.coupleId}/${site.id}/hero`}
        presets={defaultWeddingImages.hero}
      />
      <FieldError messages={state.fieldErrors?.heroImageUrl} />

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
              list="place-suggestions"
              defaultValue={state.fields?.ceremonyLocation ?? site.ceremonyLocation}
              className="h-11 w-full rounded-md border bg-background px-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Digite o nome da igreja, salão ou endereço"
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
              list="place-suggestions"
              defaultValue={state.fields?.receptionLocation ?? site.receptionLocation}
              className="h-11 w-full rounded-md border bg-background px-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Digite o nome do espaço ou endereço"
            />
          </span>
          <FieldError messages={state.fieldErrors?.receptionLocation} />
        </label>
      </div>
      <datalist id="place-suggestions">
        <option value="Igreja Matriz" />
        <option value="Cartório" />
        <option value="Espaço de Eventos" />
        <option value="Buffet" />
      </datalist>

      <div className="grid gap-5 lg:grid-cols-2">
        <ImageUploadField
          label="Foto da cerimônia"
          name="ceremonyImageUrl"
          initialUrl={state.fields?.ceremonyImageUrl ?? site.ceremonyImageUrl}
          uploadPathPrefix={`${site.coupleId}/${site.id}/ceremony`}
          presets={defaultWeddingImages.ceremony}
        />
        <ImageUploadField
          label="Foto da recepção"
          name="receptionImageUrl"
          initialUrl={state.fields?.receptionImageUrl ?? site.receptionImageUrl}
          uploadPathPrefix={`${site.coupleId}/${site.id}/reception`}
          presets={defaultWeddingImages.reception}
        />
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

      <section className="mt-4 grid gap-5 border-t pt-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Lista de presentes</p>
          <h2 className="mt-2 text-2xl font-semibold">Cadastro de presente</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Cadastre presentes simbólicos com valor, categoria, quantidade, imagem e status de publicação.
          </p>
        </div>
        <GiftCreationForm site={site} />
        {gifts.length ? (
          <div className="grid gap-3">
            {gifts.map((giftItem) => (
              <article key={giftItem.id} className="grid gap-4 rounded-lg border bg-background p-4 sm:grid-cols-[88px_1fr_auto]">
                <div className="flex size-20 items-center justify-center overflow-hidden rounded-md border bg-muted">
                  {giftItem.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={giftItem.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Gift className="size-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">{giftItem.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{giftItem.description || "Sem descrição."}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    {giftItem.status === "active" ? "Ativo" : giftItem.status === "paused" ? "Pausado" : "Rascunho"}
                  </p>
                </div>
                <p className="text-sm font-semibold">{formatMoney(giftItem.amountCents)}</p>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
