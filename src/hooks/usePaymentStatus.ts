import { useState } from 'react';

interface PaymentStatusResponse {
  id: string;
  transaction_id: string;
  external_id: string;
  status: string;
  payment_id?: string;
  payment_date?: string;
  updated_at: string;
  error?: string;
}

export function usePaymentStatus() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<PaymentStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async (paymentId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/payments/status/${paymentId}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao consultar status do pagamento');
      }
      
      setData(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao consultar status do pagamento';
      setError(errorMessage);
      console.error(errorMessage, err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    checkStatus,
    isLoading,
    data,
    error
  };
} 