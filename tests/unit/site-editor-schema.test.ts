import { describe, expect, it } from "vitest";

import { siteEditorSchema } from "@/features/site/schemas";

describe("siteEditorSchema", () => {
  it("aceita conteúdo válido para o editor", () => {
    const result = siteEditorSchema.safeParse({
      title: "Nosso casamento",
      slug: "matheus-e-sara",
      description: "Esperamos você para celebrar conosco.",
      weddingDate: "2027-12-22",
      heroImageUrl: "https://example.com/casal.jpg",
      story: "Tudo começou em uma conversa simples.",
      ceremonyLocation: "Capela Central",
      receptionLocation: "Salão Jardim",
      rsvpNote: "Confirme sua presença até novembro.",
      giftNote: "Sua presença é nosso maior presente.",
      status: "published"
    });

    expect(result.success).toBe(true);
  });

  it("rejeita slug com espaços e símbolos", () => {
    const result = siteEditorSchema.safeParse({
      title: "Nosso casamento",
      slug: "matheus & sara",
      description: "",
      weddingDate: "",
      heroImageUrl: "",
      story: "",
      ceremonyLocation: "",
      receptionLocation: "",
      rsvpNote: "",
      giftNote: "",
      status: "draft"
    });

    expect(result.success).toBe(false);
  });
});
