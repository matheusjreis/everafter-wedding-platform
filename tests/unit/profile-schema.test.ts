import { describe, expect, it } from "vitest";

import { profileSchema } from "@/features/profile/schemas";

describe("profileSchema", () => {
  it("aceita perfil válido", () => {
    const result = profileSchema.safeParse({
      fullName: "Matheus José dos Reis",
      email: "matheus@example.com",
      avatarUrl: "https://example.com/avatar.jpg"
    });

    expect(result.success).toBe(true);
  });

  it("rejeita URL de foto inválida", () => {
    const result = profileSchema.safeParse({
      fullName: "Matheus José dos Reis",
      email: "matheus@example.com",
      avatarUrl: "avatar.jpg"
    });

    expect(result.success).toBe(false);
  });
});
