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

  useEffect(() => {
    // Skip checking if already paid
    if (isPaid) return;

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/payments/status/${transactionId}`);
        const data = await response.json();
        
        if (data.status === "PAID" || data.status === "COMPLETED") {
          setIsPaid(true);
          // Redirect to thank you page
          router.push(`/pagamento/obrigado?id=${data.external_id}`);
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

  // This component doesn't render anything
  return null;
} 