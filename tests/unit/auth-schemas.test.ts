import { describe, expect, it } from "vitest";

import { forgotPasswordSchema, resetPasswordSchema, signInSchema, signUpSchema } from "@/features/auth/schemas";

describe("auth schemas", () => {
  it("valida credenciais de login", () => {
    expect(signInSchema.safeParse({ email: "casal@example.com", password: "senha123" }).success).toBe(true);
    expect(signInSchema.safeParse({ email: "email-invalido", password: "" }).success).toBe(false);
  });

  it("exige uma senha forte o suficiente no cadastro", () => {
    expect(
      signUpSchema.safeParse({
        fullName: "Ana e Bruno",
        email: "casal@example.com",
        password: "casamento1"
      }).success
    ).toBe(true);

    expect(
      signUpSchema.safeParse({
        fullName: "A",
        email: "casal@example.com",
        password: "curta"
      }).success
    ).toBe(false);
  });

  it("valida recuperação e redefinição de senha", () => {
    expect(forgotPasswordSchema.safeParse({ email: "casal@example.com" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ password: "novaSenha1" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ password: "semnumero" }).success).toBe(false);
  });
});
