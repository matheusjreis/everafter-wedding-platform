"use client";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Gift,
  LinkIcon,
  MapPin,
  Pencil,
  PlusCircle,
  Send,
  Trash2,
  Type,
  UsersRound
} from "lucide-react";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import { ImageUploadField } from "@/components/forms/image-upload-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { VisualSelect } from "@/components/forms/visual-select";

import {
  archiveGiftAction,
  createGiftBatchAction,
  createWeddingGuestAction,
  updateGiftAction,
  updateWeddingSiteAction
} from "../actions";
import { defaultWeddingImages, giftPresets } from "../default-assets";
import { initialSiteEditorActionState } from "../state";
import type { GiftEditorData, RsvpEditorData, WeddingGuestEditorData, WeddingSiteEditorData } from "../data";
import { giftSchema } from "../schemas";
import type { GiftInput } from "../schemas";

type SiteEditorFormProps = {
  site: WeddingSiteEditorData;
  gifts: GiftEditorData[];
  rsvps: RsvpEditorData[];
  guests: WeddingGuestEditorData[];
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

function formatAmountInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function formatRsvpDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(value));
}

function normalizeGiftTitle(title: string) {
  return title.trim().toLowerCase();
}

type PendingGift = GiftInput & {
  id: string;
};

function GiftCreationForm({ site, gifts }: { site: WeddingSiteEditorData; gifts: GiftEditorData[] }) {
  const saveAction = createGiftBatchAction.bind(null, site.id, site.coupleId, site.slug);
  const [state, action, isSaving] = useActionState(saveAction, initialSiteEditorActionState);
  const [pendingGifts, setPendingGifts] = useState<PendingGift[]>([]);
  const [draftKey, setDraftKey] = useState(0);
  const [draftMessage, setDraftMessage] = useState("");
  const [draftStatus, setDraftStatus] = useState<"success" | "error">("success");
  const [toastId, setToastId] = useState(0);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [draftFieldErrors, setDraftFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const existingGiftTitles = useMemo(() => new Set(gifts.map((gift) => normalizeGiftTitle(gift.title))), [gifts]);
  const pendingGiftTitles = useMemo(
    () => new Set(pendingGifts.map((gift) => normalizeGiftTitle(gift.title))),
    [pendingGifts]
  );

  useEffect(() => {
    if (state.status === "success") {
      setPendingGifts([]);
    }
  }, [state.status]);

  useEffect(() => {
    const hasMessage = Boolean(draftMessage || state.message);

    if (!hasMessage) {
      return;
    }

    setIsToastVisible(true);
    const timeout = window.setTimeout(() => setIsToastVisible(false), 3800);

    return () => window.clearTimeout(timeout);
  }, [draftMessage, state.message, state.status, toastId]);

  function showDraftToast(message: string, status: "success" | "error") {
    setDraftMessage(message);
    setDraftStatus(status);
    setToastId((currentId) => currentId + 1);
  }

  function addGiftToQueue(giftItem: Omit<PendingGift, "id">) {
    const parsed = giftSchema.safeParse(giftItem);

    if (!parsed.success) {
      showDraftToast("Revise os campos destacados antes de adicionar o presente.", "error");
      setDraftFieldErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    const normalizedTitle = normalizeGiftTitle(parsed.data.title);

    if (existingGiftTitles.has(normalizedTitle)) {
      showDraftToast("Este presente já está salvo na lista.", "error");
      setDraftFieldErrors({});
      return;
    }

    if (pendingGiftTitles.has(normalizedTitle)) {
      showDraftToast("Este presente já foi adicionado para revisão.", "error");
      setDraftFieldErrors({});
      return;
    }

    setPendingGifts((currentGifts) => [...currentGifts, { ...parsed.data, id: crypto.randomUUID() }]);
    showDraftToast("Presente adicionado à revisão. Salve quando terminar a lista.", "success");
    setDraftFieldErrors({});
    formRef.current?.reset();
    setDraftKey((currentKey) => currentKey + 1);
  }

  function handleAddManualGift() {
    const form = formRef.current;

    if (!form) {
      return;
    }

    const formData = new FormData(form);

    addGiftToQueue({
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      imageUrl: String(formData.get("imageUrl") ?? ""),
      amount: String(formData.get("amount") ?? ""),
      quantityTotal: String(formData.get("quantityTotal") ?? ""),
      category: String(formData.get("category") ?? "custom") as GiftInput["category"],
      status: String(formData.get("status") ?? "draft") as GiftInput["status"],
      allowPartial: formData.get("allowPartial") === "on" ? "on" : "off"
    });
  }

  const toastMessage = draftMessage || state.message;
  const toastStatus = draftMessage ? draftStatus : state.status === "error" ? "error" : "success";

  return (
    <form ref={formRef} action={action} className="grid gap-5 rounded-lg border bg-background p-5">
      <input name="giftsJson" type="hidden" value={JSON.stringify(pendingGifts.map(({ id: _id, ...giftItem }) => giftItem))} />
      {toastMessage && isToastVisible ? (
        <div
          role="status"
          className={
            toastStatus === "error"
              ? "fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-destructive/30 bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground shadow-xl"
              : "fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-emerald-300 bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xl"
          }
        >
          {toastStatus === "error" ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
          <span>{toastMessage}</span>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Nome do presente</span>
          <input
            name="title"
            defaultValue={state.fields?.title}
            className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Jantar romântico na lua de mel"
          />
          <FieldError messages={draftFieldErrors.title} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Valor</span>
          <input
            name="amount"
            inputMode="decimal"
            defaultValue={state.fields?.amount}
            className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="250,00"
          />
          <FieldError messages={draftFieldErrors.amount} />
        </label>
      </div>

      <div key={`gift-selects-${draftKey}`} className="grid gap-5 lg:grid-cols-2">
        <VisualSelect
          label="Categoria"
          name="category"
          defaultValue="custom"
          options={giftCategoryOptions}
        />
        <VisualSelect
          label="Status"
          name="status"
          defaultValue="draft"
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
          <FieldError messages={draftFieldErrors.quantityTotal} />
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
        key={`gift-image-${draftKey}`}
        label="Foto do presente"
        name="imageUrl"
        initialUrl=""
        uploadPathPrefix={`${site.coupleId}/${site.id}/gifts`}
        helper="Escolha uma foto própria para este presente. As sugestões abaixo já trazem imagens padrão."
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
        <FieldError messages={draftFieldErrors.description} />
      </label>

      <button
        type="button"
        onClick={handleAddManualGift}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-primary bg-primary/10 px-4 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
      >
        <PlusCircle className="size-4" />
        Adicionar à revisão
      </button>

      <div className="grid gap-3 rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Presentes para salvar</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {pendingGifts.length
                ? `${pendingGifts.length} ${pendingGifts.length === 1 ? "presente pendente" : "presentes pendentes"}`
                : "Adicione presentes antes de confirmar o cadastro."}
            </p>
          </div>
          <SubmitButton className="w-auto px-5" pendingLabel="Salvando presentes..." disabled={!pendingGifts.length || isSaving}>
            <span className="inline-flex items-center gap-2">
              <Gift className="size-4" />
              Salvar presentes
            </span>
          </SubmitButton>
        </div>

        {pendingGifts.length ? (
          <div className="grid max-h-80 gap-3 overflow-y-auto pr-2">
            {pendingGifts.map((giftItem) => (
              <article
                key={giftItem.id}
                className="grid gap-3 rounded-lg border bg-background p-3 sm:grid-cols-[64px_1fr_auto]"
              >
                <div className="flex size-16 items-center justify-center overflow-hidden rounded-md border bg-muted">
                  {giftItem.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={giftItem.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Gift className="size-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{giftItem.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {giftItem.description || "Sem descrição."}
                  </p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                    {giftItem.status === "active" ? "Ativo" : giftItem.status === "paused" ? "Pausado" : "Rascunho"}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <p className="text-sm font-semibold">R$ {giftItem.amount}</p>
                  <button
                    type="button"
                    onClick={() => setPendingGifts((currentGifts) => currentGifts.filter((item) => item.id !== giftItem.id))}
                    className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium text-destructive transition hover:bg-destructive/10"
                  >
                    <Trash2 className="size-4" />
                    Remover
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 border-t pt-5">
        <p className="text-sm font-semibold">Presentes comuns</p>
        <div className="grid max-h-96 gap-3 overflow-y-auto pr-2 lg:grid-cols-2">
          {giftPresets.map((preset) => {
            const alreadyExists = existingGiftTitles.has(normalizeGiftTitle(preset.title));
            const alreadyPending = pendingGiftTitles.has(normalizeGiftTitle(preset.title));

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  addGiftToQueue({
                    title: preset.title,
                    description: preset.description,
                    imageUrl: preset.imageUrl,
                    amount: preset.amount,
                    quantityTotal: "1",
                    category: preset.category as GiftInput["category"],
                    status: "active",
                    allowPartial: "on"
                  })
                }
                disabled={alreadyExists || alreadyPending}
                className="grid gap-3 rounded-lg border bg-card p-3 text-left text-sm shadow-sm transition enabled:hover:-translate-y-0.5 enabled:hover:border-primary enabled:hover:shadow-md disabled:cursor-not-allowed disabled:opacity-55 sm:grid-cols-[88px_1fr]"
              >
                <span className="flex h-24 overflow-hidden rounded-md border bg-muted sm:h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preset.imageUrl} alt="" className="h-full w-full object-cover" />
                </span>
                <span className="grid min-w-0 content-start gap-2">
                  <span className="font-semibold">{preset.title}</span>
                  <span className="line-clamp-3 leading-6 text-muted-foreground">{preset.description}</span>
                  <span className="font-semibold text-primary">
                    {alreadyExists ? "Já está salva" : alreadyPending ? "Na revisão" : `R$ ${preset.amount}`}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </form>
  );
}

function ArchivedGiftButton({ siteId, siteSlug, giftId }: { siteId: string; siteSlug: string; giftId: string }) {
  const action = archiveGiftAction.bind(null, siteId, giftId, siteSlug);

  return (
    <form action={action}>
      <SubmitButton className="w-auto bg-transparent px-2 text-destructive shadow-none hover:bg-destructive/10 hover:text-destructive" pendingLabel="Removendo...">
        <span className="inline-flex items-center gap-2">
          <Trash2 className="size-4" />
          Remover
        </span>
      </SubmitButton>
    </form>
  );
}

function GiftEditForm({ site, giftItem }: { site: WeddingSiteEditorData; giftItem: GiftEditorData }) {
  const action = updateGiftAction.bind(null, site.id, giftItem.id, site.slug);

  return (
    <form action={action} className="grid gap-4 rounded-lg border bg-card p-4 text-left sm:col-span-3">
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Nome do presente</span>
          <input
            name="title"
            defaultValue={giftItem.title}
            className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            required
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Valor</span>
          <input
            name="amount"
            inputMode="decimal"
            defaultValue={formatAmountInput(giftItem.amountCents)}
            className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            required
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <VisualSelect label="Categoria" name="category" defaultValue={giftItem.category} options={giftCategoryOptions} />
        <VisualSelect
          label="Status"
          name="status"
          defaultValue={giftItem.status === "sold_out" || giftItem.status === "archived" ? "draft" : giftItem.status}
          options={giftStatusOptions}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Quantidade disponível</span>
          <input
            name="quantityTotal"
            type="number"
            min={1}
            defaultValue={giftItem.quantityTotal ?? ""}
            className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Sem limite"
          />
        </label>
        <label className="flex items-center gap-3 self-end rounded-lg border bg-background px-4 py-3 text-sm">
          <input
            name="allowPartial"
            type="checkbox"
            value="on"
            defaultChecked={giftItem.allowPartial}
            className="size-4 accent-primary"
          />
          Permitir contribuição parcial
        </label>
      </div>

      <ImageUploadField
        label="Foto do presente"
        name="imageUrl"
        initialUrl={giftItem.imageUrl}
        uploadPathPrefix={`${site.coupleId}/${site.id}/gifts`}
        helper="Troque por uma foto própria ou mantenha a imagem atual."
      />

      <label className="grid gap-2">
        <span className="text-sm font-medium">Descrição do presente</span>
        <textarea
          name="description"
          defaultValue={giftItem.description}
          rows={3}
          className="w-full resize-y rounded-md border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </label>

      <SubmitButton className="w-auto justify-self-start px-5" pendingLabel="Salvando presente...">
        Salvar alterações
      </SubmitButton>
    </form>
  );
}

function GiftEditorCard({ site, giftItem }: { site: WeddingSiteEditorData; giftItem: GiftEditorData }) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <article className="grid gap-4 rounded-lg border bg-background p-4 sm:grid-cols-[88px_1fr_auto]">
      <div className="flex size-20 items-center justify-center overflow-hidden rounded-md border bg-muted">
        {giftItem.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={giftItem.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <Gift className="size-6 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0">
        <p className="font-semibold">{giftItem.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{giftItem.description || "Sem descrição."}</p>
        <p className="mt-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
          {giftItem.status === "active" ? "Ativo" : giftItem.status === "paused" ? "Pausado" : "Rascunho"}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
        <p className="text-sm font-semibold">{formatMoney(giftItem.amountCents)}</p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsEditing((currentValue) => !currentValue)}
            className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium text-primary transition hover:bg-primary/10"
            aria-expanded={isEditing}
          >
            <Pencil className="size-4" />
            Editar
          </button>
          <ArchivedGiftButton siteId={site.id} siteSlug={site.slug} giftId={giftItem.id} />
        </div>
      </div>
      {isEditing ? <GiftEditForm site={site} giftItem={giftItem} /> : null}
    </article>
  );
}

function WeddingGuestCreationForm({ site }: { site: WeddingSiteEditorData }) {
  const createAction = createWeddingGuestAction.bind(null, site.id, site.coupleId);
  const [state, action] = useActionState(createAction, initialSiteEditorActionState);
  const [isToastVisible, setIsToastVisible] = useState(false);

  useEffect(() => {
    if (!state.message) {
      return;
    }

    setIsToastVisible(true);
    const timeout = window.setTimeout(() => setIsToastVisible(false), 3800);

    return () => window.clearTimeout(timeout);
  }, [state.message, state.status]);

  return (
    <form action={action} className="grid gap-5 rounded-lg border bg-background p-5">
      {state.message && isToastVisible ? (
        <div
          role="status"
          className={
            state.status === "error"
              ? "fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-destructive/30 bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground shadow-xl"
              : "fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-emerald-300 bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xl"
          }
        >
          {state.status === "error" ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
          <span>{state.message}</span>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Nome do convidado</span>
          <input
            name="guestName"
            defaultValue={state.fields?.guestName}
            className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Maria Oliveira"
            required
          />
          <FieldError messages={state.fieldErrors?.guestName} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Quantidade prevista</span>
          <input
            name="expectedGuestCount"
            type="number"
            min={1}
            max={20}
            defaultValue={state.fields?.expectedGuestCount ?? "1"}
            className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <FieldError messages={state.fieldErrors?.expectedGuestCount} />
        </label>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium">E-mail</span>
          <input
            name="email"
            type="email"
            defaultValue={state.fields?.email}
            className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="convidado@email.com"
          />
          <FieldError messages={state.fieldErrors?.email} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Telefone</span>
          <input
            name="phone"
            defaultValue={state.fields?.phone}
            className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="(00) 00000-0000"
          />
          <FieldError messages={state.fieldErrors?.phone} />
        </label>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Grupo</span>
          <input
            name="groupName"
            defaultValue={state.fields?.groupName}
            className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Família, amigos, trabalho..."
          />
          <FieldError messages={state.fieldErrors?.groupName} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Observações</span>
          <input
            name="notes"
            defaultValue={state.fields?.notes}
            className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Restrição alimentar, acompanhante..."
          />
          <FieldError messages={state.fieldErrors?.notes} />
        </label>
      </div>

      <SubmitButton pendingLabel="Cadastrando convidado...">
        <span className="inline-flex items-center gap-2">
          <UsersRound className="size-4" />
          Cadastrar convidado
        </span>
      </SubmitButton>
    </form>
  );
}

export function SiteEditorForm({ site, gifts, rsvps, guests }: SiteEditorFormProps) {
  const updateAction = updateWeddingSiteAction.bind(null, site.id);
  const [state, action] = useActionState(updateAction, initialSiteEditorActionState);
  const attendingCount = rsvps
    .filter((rsvp) => rsvp.attendanceStatus === "attending")
    .reduce((total, rsvp) => total + rsvp.guestCount, 0);
  const declinedCount = rsvps.filter((rsvp) => rsvp.attendanceStatus === "declined").length;
  const visibleGifts = Array.from(
    new Map(gifts.map((gift) => [normalizeGiftTitle(gift.title), gift])).values()
  );

  return (
    <div className="grid gap-6 pb-24 xl:pb-0">
      {state.message ? (
        <div
          role="status"
          className={
            state.status === "error"
              ? "fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-destructive/30 bg-destructive px-4 py-3 text-sm font-medium text-destructive-foreground shadow-lg"
              : "fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-950 shadow-lg"
          }
        >
          {state.status === "error" ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
          <span>{state.message}</span>
        </div>
      ) : null}

      <form action={action} className="grid gap-6">
        <div className="grid gap-6">
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
        <div className="grid gap-4">
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
            <span className="text-sm font-medium">Horário da cerimônia</span>
            <span className="relative">
              <Clock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="ceremonyTime"
                type="time"
                defaultValue={state.fields?.ceremonyTime ?? site.ceremonyTime}
                className="h-11 w-full rounded-md border bg-background px-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </span>
            <FieldError messages={state.fieldErrors?.ceremonyTime} />
          </label>
        </div>

        <div className="grid gap-4">
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
          <label className="grid gap-2">
            <span className="text-sm font-medium">Horário da recepção</span>
            <span className="relative">
              <Clock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="receptionTime"
                type="time"
                defaultValue={state.fields?.receptionTime ?? site.receptionTime}
                className="h-11 w-full rounded-md border bg-background px-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </span>
            <FieldError messages={state.fieldErrors?.receptionTime} />
          </label>
        </div>
      </div>
      <datalist id="place-suggestions">
        <option value="Igreja Matriz" />
        <option value="Cartório" />
        <option value="Espaço de Eventos" />
        <option value="Buffet" />
      </datalist>

      <div className="grid gap-5 2xl:grid-cols-2">
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

        </div>

        <aside className="hidden w-44 rounded-lg border border-border/50 bg-background/35 p-3 shadow-sm backdrop-blur-sm transition hover:bg-background/80 xl:fixed xl:right-3 xl:top-3 xl:z-30 xl:block">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-primary/80">Ações</p>
          <p className="mt-2 text-xs font-semibold text-foreground/80">
            {state.status === "success" ? "Salvo agora" : state.status === "error" ? "Erro ao salvar" : "Pronto para salvar"}
          </p>
          <SubmitButton className="mt-3 h-9 text-sm" pendingLabel="Salvando...">
            <span className="inline-flex items-center gap-2">
              <Send className="size-4" />
              Salvar site
            </span>
          </SubmitButton>
        </aside>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(15,23,42,0.12)] backdrop-blur xl:hidden">
          <div className="mx-auto grid max-w-2xl gap-2">
            <p className="text-center text-xs font-medium text-muted-foreground">
              {state.status === "success" ? "Site salvo com sucesso" : state.status === "error" ? "Erro ao salvar o site" : "Salve as alterações do site"}
            </p>
            <SubmitButton pendingLabel="Salvando...">
              <span className="inline-flex items-center gap-2">
                <Send className="size-4" />
                Salvar site
              </span>
            </SubmitButton>
          </div>
        </div>
      </form>

      <section className="mt-4 grid gap-5 border-t pt-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Lista de presentes</p>
          <h2 className="mt-2 text-2xl font-semibold">Cadastro de presente</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Cadastre presentes simbólicos com valor, categoria, quantidade, imagem e status de publicação.
          </p>
        </div>
        <GiftCreationForm site={site} gifts={gifts} />
        {visibleGifts.length ? (
          <div className="grid max-h-[520px] gap-3 overflow-y-auto pr-2">
            {visibleGifts.map((giftItem) => (
              <GiftEditorCard key={giftItem.id} site={site} giftItem={giftItem} />
            ))}
          </div>
        ) : null}
      </section>

      <section className="mt-4 grid gap-5 border-t pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Lista de convidados</p>
            <h2 className="mt-2 text-2xl font-semibold">Cadastro de convidados</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Cadastre convidados previstos para organizar grupos, contatos e quantidade esperada.
            </p>
          </div>
          <div className="rounded-lg border bg-background px-4 py-3 text-sm">
            <p className="text-2xl font-semibold">
              {guests.reduce((total, guest) => total + guest.expectedGuestCount, 0)}
            </p>
            <p className="text-muted-foreground">Pessoas previstas</p>
          </div>
        </div>

        <WeddingGuestCreationForm site={site} />
        {guests.length ? (
          <div className="grid max-h-[420px] gap-3 overflow-y-auto pr-2">
            {guests.map((guest) => (
              <article key={guest.id} className="rounded-lg border bg-background p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold">{guest.guestName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {guest.email || "Sem e-mail"} {guest.phone ? `- ${guest.phone}` : ""}
                    </p>
                    {guest.groupName || guest.notes ? (
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {[guest.groupName, guest.notes].filter(Boolean).join(" - ")}
                      </p>
                    ) : null}
                  </div>
                  <span className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]">
                    {guest.expectedGuestCount} pessoa(s)
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-background p-5 text-sm leading-6 text-muted-foreground">
            Nenhum convidado cadastrado ainda.
          </div>
        )}
      </section>

      <section className="mt-4 grid gap-5 border-t pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Confirmações de presença</p>
            <h2 className="mt-2 text-2xl font-semibold">RSVP dos convidados</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Acompanhe quem confirmou presença e as mensagens enviadas pelo site público.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border bg-background px-4 py-3">
              <p className="text-2xl font-semibold">{attendingCount}</p>
              <p className="text-muted-foreground">Presenças</p>
            </div>
            <div className="rounded-lg border bg-background px-4 py-3">
              <p className="text-2xl font-semibold">{declinedCount}</p>
              <p className="text-muted-foreground">Ausências</p>
            </div>
          </div>
        </div>

        {rsvps.length ? (
          <div className="grid gap-3">
            {rsvps.map((rsvp) => (
              <article key={rsvp.id} className="rounded-lg border bg-background p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold">{rsvp.guestName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {rsvp.email || "Sem e-mail"} {rsvp.phone ? `- ${rsvp.phone}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.12em]">
                    <span className="rounded-full border px-3 py-1">
                      {rsvp.attendanceStatus === "attending" ? "Vai comparecer" : "Não poderá ir"}
                    </span>
                    <span className="rounded-full border px-3 py-1">{rsvp.guestCount} pessoa(s)</span>
                  </div>
                </div>
                {rsvp.message ? (
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{rsvp.message}</p>
                ) : null}
                <p className="mt-3 text-xs text-muted-foreground">{formatRsvpDate(rsvp.createdAt)}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-background p-5 text-sm leading-6 text-muted-foreground">
            Nenhuma confirmação recebida ainda.
          </div>
        )}
      </section>
    </div>
  );
}
