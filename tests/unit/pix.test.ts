import { describe, expect, it } from "vitest";

import { buildPixPayload } from "@/lib/pix";

describe("buildPixPayload", () => {
  it("gera BR Code Pix com valor exato e CRC", () => {
    const payload = buildPixPayload({
      pixKey: "casal@example.com",
      merchantName: "Matheus e Sara",
      amountCents: 35000,
      txid: "presente-123"
    });

    expect(payload).toContain("0014BR.GOV.BCB.PIX");
    expect(payload).toContain("0117casal@example.com");
    expect(payload).toContain("5406350.00");
    expect(payload).toMatch(/6304[A-F0-9]{4}$/);
  });
});
