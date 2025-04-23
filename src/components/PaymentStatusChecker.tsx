"use client";

import { useState } from "react";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PaymentStatusCheckerProps {
  paymentId: string;
  onStatusChange?: (status: string) => void;
}

export default function PaymentStatusChecker({ 
  paymentId, 
  onStatusChange 
}: PaymentStatusCheckerProps) {
  const { checkStatus, isLoading, data, error } = usePaymentStatus();
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    const result = await checkStatus(paymentId);
    setLastChecked(new Date().toLocaleTimeString());
    
    if (result?.status && onStatusChange) {
      onStatusChange(result.status);
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return "bg-gray-300";
    
    switch (status.toUpperCase()) {
      case "PAID":
        return "bg-green-500";
      case "PENDING":
        return "bg-yellow-500";
      case "EXPIRED":
        return "bg-red-500";
      case "CANCELLED":
        return "bg-red-300";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <Card className="w-full bg-[#252525] border-[#333333] text-white">
      <CardHeader>
        <CardTitle>Status do Pagamento</CardTitle>
      </CardHeader>
      
      <CardContent>
        {data ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Status:</span>
              <Badge className={`${getStatusColor(data.status)}`}>
                {data.status?.toUpperCase() || "DESCONHECIDO"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-300">ID da Transação:</span>
              <span className="text-white">{data.transaction_id}</span>
            </div>
            
            {data.payment_date && (
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Data do Pagamento:</span>
                <span className="text-white">
                  {new Date(data.payment_date).toLocaleString()}
                </span>
              </div>
            )}
            
            {lastChecked && (
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Última verificação:</span>
                <span className="text-gray-400">{lastChecked}</span>
              </div>
            )}
          </div>
        ) : error ? (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-md text-white">
            {error}
          </div>
        ) : (
          <div className="text-gray-400 text-center py-4">
            Clique no botão abaixo para verificar o status do pagamento
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleCheckStatus}
          className="w-full bg-[#0ae339] hover:bg-[#0ae339]/90 text-[#1d1d1d]"
          disabled={isLoading}
        >
          {isLoading ? "Verificando..." : "Verificar Status"}
        </Button>
      </CardFooter>
    </Card>
  );
} 