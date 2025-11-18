import DodoPayments from 'dodopayments';

const client = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  environment:
    (process.env.DODO_PAYMENTS_ENVIRONMENT as 'test_mode' | 'live_mode') ||
    'test_mode',
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_SECRET,
});

export const createCheckoutSession = async (
  productId: string,
  userEmail: string,
  userId: string,
  userName?: string
) => {
  const checkoutSession = await client.checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: 1 }],
    customer: {
      email: userEmail,
      ...(userName && { name: userName }),
    },
    metadata: {
      userId: userId,
    },
    ...(process.env.NEXT_PUBLIC_APP_URL && {
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
    }),
  });

  return checkoutSession;
};

export { client as dodoClient };
