"use client";

import { AlertCircle, CheckCircle2, Gift, HeartHandshake } from "lucide-react";
import QRCode from "qrcode";
import { useActionState, useEffect, useMemo, useState } from "react";

import { SubmitButton } from "@/components/forms/submit-button";

import { createGiftContributionAction } from "../actions";
import type { PublicGift } from "../data";
import { initialSiteEditorActionState } from "../state";

type GiftContributionFormProps = {
  gift: PublicGift;
  siteSlug: string;
  pixKey: string;
};

type SubmittedPayment = {
  amountCents: number;
  contributorName: string;
};

function formatMoney(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(cents / 100);
}

function formatAmountInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function parseAmountCents(value: string) {
  return Math.round(Number(value.replace(/\./g, "").replace(",", ".")) * 100);
}

function getGiftTargetCents(gift: PublicGift) {
  return gift.amountCents * (gift.quantityTotal ?? 1);
}

function getRemainingCents(gift: PublicGift) {
  return Math.max(getGiftTargetCents(gift) - gift.amountContributedCents, 0);
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }

  return <p className="text-sm font-medium text-destructive">{messages[0]}</p>;
}

export function GiftContributionForm({ gift, siteSlug, pixKey }: GiftContributionFormProps) {
  const giftContributionAction = createGiftContributionAction.bind(null, gift.id, siteSlug, pixKey);
  const [state, action] = useActionState(giftContributionAction, initialSiteEditorActionState);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [submittedPayment, setSubmittedPayment] = useState<SubmittedPayment | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [copyLabel, setCopyLabel] = useState("Copiar código Pix");
  const remainingCents = getRemainingCents(gift);
  const isUnavailable = gift.status === "sold_out" || remainingCents <= 0;
  const hasPixKey = pixKey.trim().length > 0;
  const defaultAmount = useMemo(() => {
    if (!gift.allowPartial) {
      return formatAmountInput(Math.min(gift.amountCents, remainingCents || gift.amountCents));
    }

    return formatAmountInput(remainingCents || gift.amountCents);
  }, [gift.allowPartial, gift.amountCents, remainingCents]);
  const pixPayload = useMemo(() => {
    if (state.status !== "success" || !submittedPayment || !hasPixKey) {
      return "";
    }

    return state.fields?.pixPayload ?? "";
  }, [hasPixKey, state.fields?.pixPayload, state.status, submittedPayment]);

  useEffect(() => {
    if (!state.message) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsToastVisible(true);
    const timeout = window.setTimeout(() => setIsToastVisible(false), 3800);

    return () => window.clearTimeout(timeout);
  }, [state.message, state.status]);

  useEffect(() => {
    if (!pixPayload) {
      setQrCodeDataUrl("");
      return;
    }

    let isMounted = true;

    QRCode.toDataURL(pixPayload, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 240
    })
      .then((dataUrl) => {
        if (isMounted) {
          setQrCodeDataUrl(dataUrl);
        }
      })
      .catch(() => {
        if (isMounted) {
          setQrCodeDataUrl("");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [pixPayload]);

  async function handleCopyPixCode() {
    if (!pixPayload) {
      return;
    }

    await navigator.clipboard.writeText(pixPayload);
    setCopyLabel("Código copiado");
    window.setTimeout(() => setCopyLabel("Copiar código Pix"), 2200);
  }

  if (isUnavailable && state.status !== "success") {
    return (
      <div className="mt-4 rounded-md border border-muted bg-muted/50 px-4 py-3 text-sm font-semibold text-muted-foreground">
        Presente indisponível
      </div>
    );
  }

  return (
    <div className="mt-4">
      {state.message && isToastVisible ? (
        <div
          role="status"
          className={
            state.status === "error"
              ? "fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-destructive/30 bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground shadow-xl"
              : "fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-emerald-300 bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xl"
          }
        >
          {state.status === "error" ? (
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          )}
          <span>{state.message}</span>
        </div>
      ) : null}

      {!hasPixKey ? (
        <div className="rounded-md border border-dashed bg-muted/30 px-4 py-3 text-sm leading-6 text-muted-foreground">
          O casal ainda precisa cadastrar uma chave Pix para receber este presente.
        </div>
      ) : state.status === "success" && pixPayload ? (
        <div className="grid gap-4 rounded-md border bg-card p-4">
          <div>
            <p className="text-sm font-semibold">Pix gerado para {submittedPayment?.contributorName}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Valor exato: {formatMoney(submittedPayment?.amountCents ?? 0)}. Escaneie o QR Code ou copie o código Pix.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="flex size-44 items-center justify-center rounded-lg border bg-white p-3">
              {qrCodeDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrCodeDataUrl} alt="QR Code Pix do presente" className="h-full w-full object-contain" />
              ) : (
                <span className="text-center text-xs text-muted-foreground">Gerando QR Code...</span>
              )}
            </div>
            <div className="grid gap-3">
              <textarea
                readOnly
                value={pixPayload}
                className="min-h-28 resize-none rounded-md border bg-background p-3 text-xs leading-5 text-muted-foreground"
                aria-label="Código Pix copia e cola"
              />
              <button
                type="button"
                onClick={() => void handleCopyPixCode()}
                className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted"
              >
                {copyLabel}
              </button>
            </div>
          </div>
        </div>
      ) : !isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <HeartHandshake className="size-4" />
          Presentear
        </button>
      ) : (
        <form
          action={action}
          onSubmit={(event) => {
            const formData = new FormData(event.currentTarget);
            setSubmittedPayment({
              amountCents: parseAmountCents(String(formData.get("amount") ?? defaultAmount)),
              contributorName: String(formData.get("contributorName") ?? "").trim()
            });
          }}
          className="grid gap-4 rounded-md border bg-card p-4"
        >
          <input type="hidden" name="pixKeySnapshot" value={pixKey} />

          <div>
            <p className="text-sm font-semibold">Contribuir com este presente</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Saldo disponível: {formatMoney(remainingCents)}.{" "}
              {gift.allowPartial ? "Você pode pagar apenas uma parte." : "Este presente exige o valor inteiro."}
            </p>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Seu nome</span>
            <input
              name="contributorName"
              defaultValue={state.fields?.contributorName}
              className="h-11 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Nome completo"
              required
            />
            <FieldError messages={state.fieldErrors?.contributorName} />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">E-mail</span>
            <input
              name="contributorEmail"
              type="email"
              defaultValue={state.fields?.contributorEmail}
              className="h-11 rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="voce@email.com"
            />
            <FieldError messages={state.fieldErrors?.contributorEmail} />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Valor</span>
            <div className="flex items-center rounded-md border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <span className="px-3 text-sm font-semibold text-muted-foreground">R$</span>
              <input
                name="amount"
                inputMode="decimal"
                defaultValue={state.fields?.amount ?? defaultAmount}
                className="h-11 min-w-0 flex-1 bg-transparent px-1 text-sm outline-none"
                placeholder="0,00"
                readOnly={!gift.allowPartial}
                required
              />
            </div>
            <FieldError messages={state.fieldErrors?.amount} />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Mensagem opcional</span>
            <textarea
              name="message"
              defaultValue={state.fields?.message}
              className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Deixe uma mensagem para o casal."
            />
            <FieldError messages={state.fieldErrors?.message} />
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <SubmitButton pendingLabel="Registrando presente...">
              <span className="inline-flex items-center gap-2">
                <Gift className="size-4" />
                Confirmar presente
              </span>
            </SubmitButton>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
