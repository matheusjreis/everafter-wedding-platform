import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const onboardingSchema = z.object({
  coupleName: z
    .string()
    .trim()
    .min(3, "Informe um nome com pelo menos 3 caracteres.")
    .max(160, "Use no máximo 160 caracteres."),
  siteSlug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Informe um endereço com pelo menos 3 caracteres.")
    .max(80, "Use no máximo 80 caracteres.")
    .regex(slugRegex, "Use apenas letras minúsculas, números e hífens entre palavras."),
  weddingTitle: z
    .string()
    .trim()
    .min(3, "Informe um título com pelo menos 3 caracteres.")
    .max(180, "Use no máximo 180 caracteres."),
  weddingDate: z.string().trim().optional()
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
