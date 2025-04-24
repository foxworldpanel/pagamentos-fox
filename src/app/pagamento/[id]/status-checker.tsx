'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface StatusCheckerProps {
  transactionId: string;
  currentStatus: string;
}

export function StatusChecker({ transactionId, currentStatus }: StatusCheckerProps) {
  const router = useRouter();
  const [isPaid, setIsPaid] = useState(
    currentStatus.toUpperCase() === "PAID" || currentStatus.toUpperCase() === "COMPLETED"
  );
  const [showThankYou, setShowThankYou] = useState(false);
  const [externalId, setExternalId] = useState("");

  useEffect(() => {
    // Skip checking if already paid
    if (isPaid) return;

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/payments/status/${transactionId}`);
        const data = await response.json();
        
        if (data.status === "PAID" || data.status === "COMPLETED") {
          setIsPaid(true);
          setExternalId(data.external_id);
          setShowThankYou(true);
          // Refresh the page to show updated status
          router.refresh();
        } else {
          // Refresh the page to show updated status
          router.refresh();
        }
      } catch (error) {
        console.error("Erro ao verificar status do pagamento:", error);
      }
    };

    // Check immediately on mount
    checkPaymentStatus();
    
    // Set up interval to check every 2 seconds
    const interval = setInterval(checkPaymentStatus, 2000);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [transactionId, isPaid, router]);

  if (showThankYou) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
        <div className="bg-[#252525] p-8 rounded-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-green-400 mb-4">Obrigado pelo seu pagamento!</h2>
          <p className="text-white mb-6">Seu pagamento foi processado com sucesso.</p>
          <p className="text-gray-400 mb-6">ID da transação: {externalId}</p>
          <button 
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md"
            onClick={() => setShowThankYou(false)}
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  // This component doesn't render anything when not showing the thank you message
  return null;
} 