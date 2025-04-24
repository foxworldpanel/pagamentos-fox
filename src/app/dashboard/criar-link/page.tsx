"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { nanoid } from "nanoid";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { gerarCPF } from "@/utils";
export default function CriarLinkPage() {
  const { isLoading, user } = useAuth();
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [customId, setCustomId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkGerado, setLinkGerado] = useState<string | null>(null);
  const [pixCopiaECola, setPixCopiaECola] = useState<string | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando...</p>
      </div>
    );
  }

  // Função para formatar a imagem do QR Code
  const formatQrCodeImage = (imageData: string): string => {
    // Verifica se já é uma URL completa ou data URL
    if (imageData.startsWith('http') || imageData.startsWith('data:image')) {
      return imageData;
    }
    
    // Se for apenas um base64 sem o prefixo de data URL, adiciona o prefixo
    if (!imageData.startsWith('data:')) {
      return `data:image/png;base64,${imageData}`;
    }
    
    return imageData;
  };

  // Função para salvar os dados do pagamento no banco de dados
  const salvarPagamentoNoSupabase = async (paymentData: any) => {
    try {
      if (!user?.id) {
        console.error("Usuário não autenticado");
        return false;
      }

      const { error } = await supabase
        .from('pagamentos')
        .insert({
          user_id: user.id,
          transaction_id: paymentData.transactionId,
          external_id: paymentData.external_id,
          status: paymentData.status,
          amount: paymentData.amount,
          description: paymentData.additionalInformation?.value || descricao,
          emv_code: paymentData.emvqrcps,
          qr_code_image: paymentData.base64image,
          due_date: paymentData.calendar?.dueDate,
          expiration: paymentData.calendar?.expiration,
          created_at: new Date().toISOString(),
          payment_link: `${window.location.origin}/pix/${paymentData.external_id}`,
          debtor_name: paymentData.debtor?.name,
          debtor_document: paymentData.debtor?.document
        });

      if (error) {
        console.error("Erro ao salvar pagamento:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erro ao salvar pagamento:", error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validar valor
      const valorNumerico = parseFloat(valor.replace(',', '.'));
      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        throw new Error("Valor inválido. Informe um valor positivo.");
      }
      
      // Gerar um ID aleatório se o customId não estiver definido
      const id = customId || nanoid(5);
      
      // Usar a API Route para gerar o QR Code em vez de expor credenciais no frontend
      const response = await fetch('/api/ezzebank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generateQRCode',
          params: {
            externalId: id,
            value: valorNumerico,
            description: descricao || `Pagamento Fox World Panel ${id}`,
            payer: {
              name: "Cliente",
              document: gerarCPF()
            }
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao gerar QR Code');
      }
      
      const data = await response.json();
      
      // URL do link de pagamento
      const paymentUrl = `${window.location.origin}/pix/${data.external_id}`;
      
      // Processar os campos exatos conforme retornados pela API
      // Salvar os dados do QR Code
      setTransactionId(data.transactionId);
      setLinkGerado(paymentUrl);
      setPixCopiaECola(data.emvqrcps || "");
      setQrCodeImage(data.base64image ? formatQrCodeImage(data.base64image) : null);
      
      // Salvar o pagamento no banco de dados
      const salvou = await salvarPagamentoNoSupabase(data);
      if (salvou) {
        toast({
          title: "Pagamento criado com sucesso",
          description: "Os dados do pagamento foram salvos no banco de dados",
          variant: "success"
        });
      }
      
    } catch (error) {
      console.error("Erro ao gerar link de pagamento:", error);
      toast({
        title: "Erro ao gerar pagamento",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao gerar o link de pagamento.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNovo = () => {
    setValor("");
    setDescricao("");
    setCustomId("");
    setLinkGerado(null);
    setPixCopiaECola(null);
    setQrCodeImage(null);
    setTransactionId(null);
  };

  const handleConsultarStatus = async () => {
    if (!transactionId) return;
    
    try {
      // Usar a API Route para consultar o status em vez de expor credenciais no frontend
      const response = await fetch('/api/ezzebank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getQRCode',
          params: {
            transactionId
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao consultar status');
      }
      
      const data = await response.json();
      
      // Adaptar os campos da resposta para a interface
      const status = data.status || data.state || "Aguardando pagamento";
      const paymentDate = data.payment_date || data.paymentDate || data.paidAt || null;
      const paymentId = data.payment_id || data.paymentId || data.paidId || null;
      
      toast({
        title: "Status do Pagamento",
        description: `Status: ${status}${paymentId ? ` | Pago em: ${new Date(paymentDate || '').toLocaleString('pt-BR')}` : ''}`,
        variant: "success"
      });
    } catch (error) {
      console.error("Erro ao consultar status:", error);
      toast({
        title: "Erro ao consultar status",
        description: "Não foi possível obter o status do pagamento.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Criar Pagamento</h1>
        <p className="text-gray-400 mt-1">
          Gere links de pagamento PIX para compartilhar com seus clientes
        </p>
      </div>

      {!linkGerado ? (
        <Card className="bg-[#252525] border-[#333333] text-white">
          <CardHeader>
            <CardTitle className="text-lg">Detalhes do Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="valor" className="text-gray-300">Valor (R$)</Label>
                <Input
                  id="valor"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  className="h-12 border-[#333333] bg-[#1d1d1d] text-white focus-visible:ring-[#0ae339]"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descricao" className="text-gray-300">Descrição (opcional)</Label>
                <Input
                  id="descricao"
                  type="text"
                  placeholder="Pagamento de produto/serviço"
                  className="h-12 border-[#333333] bg-[#1d1d1d] text-white focus-visible:ring-[#0ae339]"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customId" className="text-gray-300">ID Personalizado (opcional)</Label>
                <Input
                  id="customId"
                  type="text"
                  placeholder="ID customizado ou deixe em branco para gerar automaticamente"
                  className="h-12 border-[#333333] bg-[#1d1d1d] text-white focus-visible:ring-[#0ae339]"
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Se não fornecido, um ID de 5 caracteres será gerado automaticamente.
                </p>
              </div>
              
              <Button
                type="submit"
                className="w-full h-12 bg-[#0ae339] hover:bg-[#0ae339]/90 text-[#1d1d1d] font-medium mt-4"
                disabled={isSubmitting || !valor}
              >
                {isSubmitting ? "Gerando..." : "Gerar Pagamento PIX"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-[#252525] border-[#333333] text-white">
          <CardHeader>
            <CardTitle className="text-lg">Pagamento PIX Gerado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {qrCodeImage && (
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg">
                  <img 
                    src={qrCodeImage} 
                    alt="QR Code PIX" 
                    className="mx-auto h-48 w-48" 
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label className="text-gray-300">Link para compartilhar</Label>
              <div className="flex">
                <Input
                  readOnly
                  value={linkGerado}
                  className="h-12 border-[#333333] bg-[#1d1d1d] text-white focus-visible:ring-[#0ae339]"
                />
                <Button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(linkGerado);
                    toast({ description: "Link copiado para a área de transferência!", variant: "success" });
                  }}
                  className="ml-2 bg-[#333333] hover:bg-[#444444]"
                >
                  Copiar
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-300">Código PIX Copia e Cola</Label>
              <div className="flex">
                <Input
                  readOnly
                  value={pixCopiaECola || ""}
                  className="h-12 border-[#333333] bg-[#1d1d1d] text-white focus-visible:ring-[#0ae339]"
                />
                <Button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(pixCopiaECola || "");
                    toast({ description: "Código PIX copiado para a área de transferência!", variant: "success" });
                  }}
                  className="ml-2 bg-[#333333] hover:bg-[#444444]"
                >
                  Copiar
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 pt-4">
              <Button
                type="button"
                onClick={handleConsultarStatus}
                className="h-12 bg-[#333333] hover:bg-[#444444] font-medium"
              >
                Verificar Status
              </Button>
              
              <Button
                type="button"
                onClick={handleNovo}
                className="h-12 bg-[#0ae339] hover:bg-[#0ae339]/90 text-[#1d1d1d] font-medium"
              >
                Criar Novo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className="bg-[#252525] border-[#333333] text-white">
        <CardHeader>
          <CardTitle className="text-lg">Como funciona?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-gray-400">
            <p>
              1. Preencha o valor e opcionalmente uma descrição e ID personalizado.
            </p>
            <p>
              2. Clique em &quot;Gerar Pagamento PIX&quot; para criar um link PIX usando a API da EzzeBank.
            </p>
            <p>
              3. Compartilhe o link gerado com seus clientes ou utilize o código PIX diretamente.
            </p>
            <p>
              4. Acompanhe os pagamentos na seção &quot;Pagamentos&quot; do painel.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 