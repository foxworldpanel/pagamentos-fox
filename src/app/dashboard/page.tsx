"use client";

import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Bem-vindo ao painel de pagamentos Fox World Panel
        </p>
      </div>

      <Card className="bg-[#252525] border-[#333333] text-white mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Resumo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">
            Visualize estatísticas e resumos de suas transações.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-[#252525] border-[#333333] text-white">
          <CardHeader>
            <CardTitle className="text-lg">Pagamentos recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400">
              Visualize os pagamentos em tempo real.
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#252525] border-[#333333] text-white">
          <CardHeader>
            <CardTitle className="text-lg">Links gerados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400">
              Acompanhe os links de pagamento criados.
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#252525] border-[#333333] text-white">
          <CardHeader>
            <CardTitle className="text-lg">Suporte</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400">
              Entre em contato com o suporte se precisar de ajuda.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
