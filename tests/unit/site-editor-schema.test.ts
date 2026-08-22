import { describe, expect, it } from "vitest";

import { giftSchema, rsvpSchema, siteEditorSchema, weddingGuestSchema } from "@/features/site/schemas";

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
      ceremonyTime: "16:30",
      receptionLocation: "Salão Jardim",
      receptionTime: "19:00",
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
      ceremonyTime: "",
      receptionLocation: "",
      receptionTime: "",
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

  it("aceita confirmação de presença válida", () => {
    const result = rsvpSchema.safeParse({
      guestName: "Maria Oliveira",
      email: "maria@example.com",
      phone: "(11) 99999-9999",
      attendanceStatus: "attending",
      guestCount: "2",
      message: "Estamos felizes em celebrar com vocês."
    });

    expect(result.success).toBe(true);
  });

  it("aceita convidado cadastrado pelo casal", () => {
    const result = weddingGuestSchema.safeParse({
      guestName: "João Pereira",
      email: "joao@example.com",
      phone: "(11) 98888-7777",
      groupName: "Família",
      expectedGuestCount: "3",
      notes: "Mesa próxima aos familiares."
    });

    expect(result.success).toBe(true);
  });
});
