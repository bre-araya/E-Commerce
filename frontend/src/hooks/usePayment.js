import api from '../utils/axios';

// createPaymentIntent(amountInCents)
// returns { clientSecret, intentId }
export default function usePayment() {
  const createPaymentIntent = async (amountInCents, currency = 'usd') => {
    const { data } = await api.post('/payments/create-intent', { amount: amountInCents, currency });
    return { clientSecret: data.clientSecret, intentId: data.intentId };
  };

  return { createPaymentIntent };
}
