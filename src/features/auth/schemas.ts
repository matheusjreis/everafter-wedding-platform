import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha.")
});

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Informe seu nome completo."),
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .regex(/[A-Za-zÀ-ÿ]/, "A senha deve conter pelo menos uma letra.")
    .regex(/[0-9]/, "A senha deve conter pelo menos um número.")
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido.")
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .regex(/[A-Za-zÀ-ÿ]/, "A senha deve conter pelo menos uma letra.")
    .regex(/[0-9]/, "A senha deve conter pelo menos um número.")
});
