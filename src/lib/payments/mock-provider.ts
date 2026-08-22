import type { CheckoutSession, CreateCheckoutInput, PaymentGateway } from "./types";

export class MockPaymentGateway implements PaymentGateway {
  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutSession> {
    return {
      provider: "mock",
      providerCheckoutId: `mock_${input.transactionId}`,
      status: "pending",
      redirectUrl: `${input.successUrl}?provider=mock`
    };
  }

  async verifyWebhookSignature() {
    return true;
  }
}
