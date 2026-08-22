import { describe, expect, it } from "vitest";

import { giftSchema, siteEditorSchema } from "@/features/site/schemas";

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
      ceremonyImageUrl: "/images/defaults/ceremony-chapel-default.png",
      receptionImageUrl: "/images/defaults/reception-hall-default.png",
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
      ceremonyImageUrl: "",
      receptionImageUrl: "",
      rsvpNote: "",
      giftNote: "",
      status: "draft"
    });

    expect(result.success).toBe(false);
  });

  it("aceita imagem padrão interna para presente", () => {
    const result = giftSchema.safeParse({
      title: "Cota para a lua de mel",
      description: "Ajude o casal a viver uma experiência especial.",
      imageUrl: "/images/defaults/gift-symbolic-default.png",
      amount: "300,00",
      quantityTotal: "",
      category: "travel",
      status: "active",
      allowPartial: "on"
    });

    expect(result.success).toBe(true);
  });
});
