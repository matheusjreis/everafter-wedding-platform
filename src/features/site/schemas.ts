import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const optionalText = (max: number, message: string) => z.string().trim().max(max, message).optional();
const optionalTimeSchema = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || /^([01]\d|2[0-3]):[0-5]\d$/.test(value), "Informe um horário válido.");

const optionalImageUrlSchema = z
  .string()
  .trim()
  .max(600, "Use no máximo 600 caracteres.")
  .optional()
  .refine((value) => {
    if (!value) {
      return true;
    }

    if (value.startsWith("/images/")) {
      return true;
    }

    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Informe uma URL de imagem válida ou escolha uma imagem padrão.");

export const siteEditorSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Informe um título com pelo menos 3 caracteres.")
    .max(180, "Use no máximo 180 caracteres."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Informe um endereço com pelo menos 3 caracteres.")
    .max(80, "Use no máximo 80 caracteres.")
    .regex(slugRegex, "Use apenas letras minúsculas, números e hífens entre palavras."),
  description: optionalText(600, "Use no máximo 600 caracteres."),
  weddingDate: z.string().trim().optional(),
  heroImageUrl: optionalImageUrlSchema,
  story: optionalText(2800, "Use no máximo 2800 caracteres."),
  ceremonyLocation: optionalText(220, "Use no máximo 220 caracteres."),
  ceremonyTime: optionalTimeSchema,
  receptionLocation: optionalText(220, "Use no máximo 220 caracteres."),
  receptionTime: optionalTimeSchema,
  ceremonyImageUrl: optionalImageUrlSchema,
  receptionImageUrl: optionalImageUrlSchema,
  rsvpNote: optionalText(600, "Use no máximo 600 caracteres."),
  giftNote: optionalText(600, "Use no máximo 600 caracteres."),
  status: z.enum(["draft", "published", "unpublished"])
});

export type SiteEditorInput = z.infer<typeof siteEditorSchema>;

export const giftSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Informe um nome com pelo menos 3 caracteres.")
    .max(180, "Use no máximo 180 caracteres."),
  description: optionalText(900, "Use no máximo 900 caracteres."),
  imageUrl: optionalImageUrlSchema,
  amount: z
    .string()
    .trim()
    .min(1, "Informe o valor.")
    .refine((value) => Number(value.replace(",", ".")) > 0, "Informe um valor maior que zero."),
  quantityTotal: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || Number.parseInt(value, 10) > 0, "Informe uma quantidade maior que zero."),
  category: z.enum(["cash", "home", "experience", "travel", "custom"]),
  status: z.enum(["draft", "active", "paused"]),
  allowPartial: z.enum(["on", "off"]).optional()
});

export type GiftInput = z.infer<typeof giftSchema>;

export const rsvpSchema = z.object({
  guestName: z
    .string()
    .trim()
    .min(3, "Informe seu nome com pelo menos 3 caracteres.")
    .max(160, "Use no máximo 160 caracteres."),
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .max(220, "Use no máximo 220 caracteres.")
    .optional()
    .or(z.literal("")),
  phone: optionalText(40, "Use no máximo 40 caracteres."),
  attendanceStatus: z.enum(["attending", "declined"]),
  guestCount: z
    .string()
    .trim()
    .min(1, "Informe a quantidade de pessoas.")
    .refine((value) => Number.parseInt(value, 10) > 0, "Informe pelo menos 1 pessoa.")
    .refine((value) => Number.parseInt(value, 10) <= 20, "Informe no máximo 20 pessoas."),
  message: optionalText(600, "Use no máximo 600 caracteres.")
});

export type RsvpInput = z.infer<typeof rsvpSchema>;

export const weddingGuestSchema = z.object({
  guestName: z
    .string()
    .trim()
    .min(3, "Informe o nome do convidado com pelo menos 3 caracteres.")
    .max(160, "Use no máximo 160 caracteres."),
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .max(220, "Use no máximo 220 caracteres.")
    .optional()
    .or(z.literal("")),
  phone: optionalText(40, "Use no máximo 40 caracteres."),
  groupName: optionalText(80, "Use no máximo 80 caracteres."),
  expectedGuestCount: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || Number.parseInt(value, 10) > 0, "Informe pelo menos 1 pessoa.")
    .refine((value) => !value || Number.parseInt(value, 10) <= 20, "Informe no máximo 20 pessoas."),
  notes: optionalText(500, "Use no máximo 500 caracteres.")
});

export type WeddingGuestInput = z.infer<typeof weddingGuestSchema>;
