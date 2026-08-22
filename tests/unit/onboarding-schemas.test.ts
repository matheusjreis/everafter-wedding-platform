import { describe, expect, it } from "vitest";

import { onboardingSchema } from "@/features/onboarding/schemas";

describe("onboardingSchema", () => {
  it("aceita dados válidos do casal e do site", () => {
    const result = onboardingSchema.safeParse({
      coupleName: "Ana e Bruno",
      siteSlug: "ana-e-bruno",
      weddingTitle: "Nosso casamento",
      weddingDate: "2027-05-22"
    });

    expect(result.success).toBe(true);
  });

  it("rejeita endereço público com espaços ou símbolos", () => {
    const result = onboardingSchema.safeParse({
      coupleName: "Ana e Bruno",
      siteSlug: "ana & bruno",
      weddingTitle: "Nosso casamento",
      weddingDate: "2027-05-22"
    });

    expect(result.success).toBe(false);
  });
});
