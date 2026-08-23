import { z } from "zod";

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

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Informe um nome com pelo menos 3 caracteres.")
    .max(160, "Use no máximo 160 caracteres."),
  email: z.string().trim().email("Informe um e-mail válido."),
  avatarUrl: optionalUrlSchema,
  pixKey: z.string().trim().max(77, "Use no máximo 77 caracteres.").optional()
});

export type ProfileInput = z.infer<typeof profileSchema>;
