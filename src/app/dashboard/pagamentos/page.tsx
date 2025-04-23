"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DeleteButton } from "@/app/pagamento/[id]/delete-button";

type Pagamento = {
  id: string;
  transaction_id: string;
  external_id: string;
  status: string;
  amount: number;
  description: string;
  payment_link: string;
  created_at: string;
  payment_date: string | null;
  qr_code_image: string;
};

export default function PagamentosPage() {
  const { isLoading, user } = useAuth();
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [viewType, setViewType] = useState<"card" | "table">("card");
  
  // Set the default view type based on screen size
  useEffect(() => {
    setViewType(isMobile ? "card" : "table");
  }, [isMobile]);

  useEffect(() => {
    if (!isLoading && user) {
      carregarPagamentos();
    }
  }, [isLoading, user]);

  const carregarPagamentos = async () => {
    try {
      setIsDataLoading(true);
      const { data, error } = await supabase
        .from("pagamentos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setPagamentos(data || []);
    } catch (error) {
      console.error("Erro ao carregar pagamentos:", error);
      toast({
        title: "Erro ao carregar pagamentos",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsDataLoading(false);
    }
  };

  const atualizarStatusPagamento = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/payments/status/${transactionId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao consultar status");
      }

      toast({
        title: "Status atualizado",
        description: 'Pagamento atualizado com sucesso',
        variant: "success"
      });

      // Recarregar os pagamentos
      carregarPagamentos();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro ao atualizar status",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
      case "COMPLETED":
        return "bg-green-500";
      case "PENDING":
        return "bg-yellow-500";
      case "EXPIRED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
        return "Pago";
      case "COMPLETED":
        return "Completado";
      case "PENDING":
        return "Pendente";
      case "EXPIRED":
        return "Expirado";
      default:
        return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ description: "Link copiado para a área de transferência!", variant: "success" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando...</p>
      </div>
    );
  }

  const renderCardView = () => (
    <div className="grid gap-4">
      {pagamentos.map((pagamento) => (
        <Card
          key={pagamento.id}
          className="bg-[#252525] border-[#333333] text-white"
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">
                  {pagamento.description || `Pagamento #${pagamento.external_id}`}
                </CardTitle>
                <p className="text-sm text-gray-400 mt-1">
                  Criado em {formatDate(pagamento.created_at)}
                </p>
              </div>
              <Badge className={`${getStatusColor(pagamento.status)} text-white`}>
                {getStatusText(pagamento.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Valor</p>
                <p className="text-xl font-bold text-[#0ae339]">
                  {formatCurrency(pagamento.amount)}
                </p>
                
                <div className="mt-4">
                  <p className="text-sm text-gray-400">ID da Transação</p>
                  <p className="text-xs text-white break-all">
                    {pagamento.transaction_id}
                  </p>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm text-gray-400">ID Externo</p>
                  <p className="text-xs text-white break-all">
                    {pagamento.external_id}
                  </p>
                </div>
                
                {pagamento.payment_date && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-400">Data de Pagamento</p>
                    <p className="text-white">
                      {formatDate(pagamento.payment_date)}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-center">
                {pagamento.qr_code_image && (
                  <div className="p-2 bg-white rounded-lg mb-4">
                    <img
                      src={pagamento.qr_code_image.startsWith('data:') 
                        ? pagamento.qr_code_image 
                        : `data:image/png;base64,${pagamento.qr_code_image}`}
                      alt="QR Code PIX"
                      className="h-32 w-32"
                    />
                  </div>
                )}
                
                <div className="flex gap-2 mt-auto flex-col items-start justify-start">
                <div className="flex gap-2 mt-auto">
                  <Button
                    className="flex-1 bg-[#333333] hover:bg-[#444444]"
                    onClick={() => atualizarStatusPagamento(pagamento.transaction_id)}
                  >
                    Atualizar Status
                  </Button>
                  
                  <Button
                    className="flex-1 bg-[#333333] hover:bg-[#444444]"
                    onClick={() => copyToClipboard(pagamento.payment_link)}
                  >
                    Copiar Link
                  </Button>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    className="w-full bg-[#333333] hover:bg-[#444444]"
                    onClick={() => window.open(pagamento.payment_link, '_blank')}
                  >
                    Abrir Link
                  </Button>
                  <DeleteButton id={pagamento.id} transactionId={pagamento.transaction_id} />
                </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderTableView = () => (
    <div className="rounded-md border border-[#333333] bg-[#252525]">
      <Table className="text-white">
        <TableHeader>
          <TableRow className="border-[#333333]">
            <TableHead className="text-gray-300">Descrição</TableHead>
            <TableHead className="text-gray-300">Valor</TableHead>
            <TableHead className="text-gray-300">Status</TableHead>
            <TableHead className="text-gray-300">Data de Criação</TableHead>
            <TableHead className="text-gray-300">Data de Pagamento</TableHead>
            <TableHead className="text-right text-gray-300">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagamentos.map((pagamento) => (
            <TableRow key={pagamento.id} className="border-[#333333]">
              <TableCell className="font-medium">
                {pagamento.description || `Pagamento #${pagamento.external_id}`}
              </TableCell>
              <TableCell className="font-bold text-[#0ae339]">
                {formatCurrency(pagamento.amount)}
              </TableCell>
              <TableCell>
                <Badge className={`${getStatusColor(pagamento.status)} text-white`}>
                  {getStatusText(pagamento.status)}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(pagamento.created_at)}</TableCell>
              <TableCell>
                {pagamento.payment_date ? formatDate(pagamento.payment_date) : '-'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    className="bg-[#333333] hover:bg-[#444444]"
                    onClick={() => atualizarStatusPagamento(pagamento.transaction_id)}
                  >
                    Atualizar Status
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#333333] hover:bg-[#444444]"
                    onClick={() => copyToClipboard(pagamento.payment_link)}
                  >
                    Copiar Link
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#333333] hover:bg-[#444444]"
                    onClick={() => window.open(pagamento.payment_link, '_blank')}
                  >
                    Abrir Link
                  </Button>
                  <DeleteButton id={pagamento.id} transactionId={pagamento.transaction_id} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Meus Pagamentos</h1>
          <p className="text-gray-400 mt-1">
            Gerencie seus links de pagamento PIX
          </p>
        </div>
        <div className="flex gap-2">
          {!isMobile && (
            <div className="flex items-center bg-[#252525] rounded-md border border-[#333333] p-1">
              <Button 
                variant={viewType === "card" ? "default" : "ghost"}
                className={viewType === "card" ? "bg-[#0ae339] text-[#1d1d1d]" : "text-white"}
                size="sm"
                onClick={() => setViewType("card")}
              >
                Cards
              </Button>
              <Button 
                variant={viewType === "table" ? "default" : "ghost"}
                className={viewType === "table" ? "bg-[#0ae339] text-[#1d1d1d]" : "text-white"}
                size="sm"
                onClick={() => setViewType("table")}
              >
                Tabela
              </Button>
            </div>
          )}
          <Link href="/dashboard/criar-link">
            <Button className="bg-[#0ae339] hover:bg-[#0ae339]/90 text-[#1d1d1d]">
              Criar Novo Pagamento
            </Button>
          </Link>
        </div>
      </div>

      {isDataLoading ? (
        <div className="flex justify-center p-8">
          <p>Carregando pagamentos...</p>
        </div>
      ) : pagamentos.length === 0 ? (
        <Card className="bg-[#252525] border-[#333333] text-white">
          <CardContent className="p-8 text-center">
            <p className="text-gray-400">
              Você ainda não possui pagamentos. Clique em &quot;Criar Novo Pagamento&quot; para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {isMobile ? (
            renderCardView()
          ) : (
            viewType === "card" ? renderCardView() : renderTableView()
          )}
        </>
      )}
    </div>
  );
} 