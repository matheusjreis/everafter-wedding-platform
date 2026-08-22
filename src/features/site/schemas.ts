import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const optionalText = (max: number, message: string) => z.string().trim().max(max, message).optional();

const optionalUrlSchema = z
  .string()
  .trim()
  .max(600, "Use no máximo 600 caracteres.")
  .optional()
  .refine((value) => {
    if (!value) {
      return true;
    }

    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Informe uma URL válida começando com http:// ou https://.");

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
  heroImageUrl: optionalUrlSchema,
  story: optionalText(2800, "Use no máximo 2800 caracteres."),
  ceremonyLocation: optionalText(220, "Use no máximo 220 caracteres."),
  receptionLocation: optionalText(220, "Use no máximo 220 caracteres."),
  rsvpNote: optionalText(600, "Use no máximo 600 caracteres."),
  giftNote: optionalText(600, "Use no máximo 600 caracteres."),
  status: z.enum(["draft", "published", "unpublished"])
});

export type SiteEditorInput = z.infer<typeof siteEditorSchema>;
