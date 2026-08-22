export type PaymentProvider = "mock" | "mercado-pago" | "pagar-me" | "asaas" | "stripe";

export type PaymentMethod = "pix" | "card";

export type TransactionStatus =
  | "created"
  | "pending"
  | "processing"
  | "approved"
  | "declined"
  | "expired"
  | "cancelled"
  | "refunded"
  | "disputed"
  | "available_for_payout"
  | "paid_out"
  | "payout_failed";

export interface CreateCheckoutInput {
  transactionId: string;
  amountInCents: number;
  currency: "BRL";
  description: string;
  paymentMethod: PaymentMethod;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSession {
  provider: PaymentProvider;
  providerCheckoutId: string;
  status: TransactionStatus;
  redirectUrl?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
}

export interface PaymentGateway {
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession>;
  verifyWebhookSignature(payload: string, signature: string | null): Promise<boolean>;
}
