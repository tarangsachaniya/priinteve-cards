export type InitiatePaymentInput = {
  purchaseId: string;
  amount: number;
  userId: string;
};

export type InitiatePaymentResult = {
  gatewayName: string;
  gatewayOrderId: string;
  clientPayload?: Record<string, unknown>;
};

export type ConfirmPaymentInput = {
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  rawPayload: unknown;
  signatureHeader?: string;
};

export type ConfirmPaymentResult = {
  verified: boolean;
  gatewayOrderId: string;
  gatewayPaymentId?: string;
};

export interface PaymentGateway {
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  verifyAndConfirm(input: ConfirmPaymentInput): Promise<ConfirmPaymentResult>;
}

// Stub gateway used until a real provider (e.g. Razorpay) is wired up.
// Always succeeds — swap `paymentGateway` below for a real implementation
// of PaymentGateway when a provider is chosen; call sites never change.
class MockPaymentGateway implements PaymentGateway {
  async initiate({ purchaseId }: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    return {
      gatewayName: "mock",
      gatewayOrderId: `mock_order_${purchaseId}`,
      clientPayload: { autoConfirm: true },
    };
  }

  async verifyAndConfirm(input: ConfirmPaymentInput): Promise<ConfirmPaymentResult> {
    return {
      verified: true,
      gatewayOrderId: input.gatewayOrderId,
      gatewayPaymentId: input.gatewayPaymentId ?? `mock_payment_${input.gatewayOrderId}`,
    };
  }
}

export const paymentGateway: PaymentGateway = new MockPaymentGateway();
