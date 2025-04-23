import { NextRequest, NextResponse } from "next/server";
import { createEzzeBankClient } from "@/lib/ezzebank";

// Configuração do cliente EzzeBank usando variáveis de ambiente do servidor
const ezzebank = createEzzeBankClient({
  clientId: process.env.EZZEBANK_CLIENT_ID || "",
  clientSecret: process.env.EZZEBANK_CLIENT_SECRET || "",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    // Validar a requisição
    if (!action) {
      return NextResponse.json(
        { error: "Parâmetro 'action' é obrigatório" },
        { status: 400 }
      );
    }

    // Obter token de autenticação para todas as chamadas
    const auth = await ezzebank.authenticate();
    
    // Rodar diferentes ações com base no parâmetro 'action'
    switch (action) {
      case "generateQRCode":
        if (!params || !params.value) {
          return NextResponse.json(
            { error: "Valor é obrigatório para gerar QR Code" },
            { status: 400 }
          );
        }

        // Ajustar o formato da requisição conforme a documentação da API
        const qrCodePayload = {
          amount: params.value,
          payerQuestion: params.description || "Pagamento Fox World Panel",
          external_id: params.externalId,
          // Adicionar informações do pagador se disponíveis
          payer: params.payer || {
            name: "Cliente",
            document: "00000000000"
          }
        };

        // Fazer a chamada direta para a API da EzzeBank
        const qrCodeResponse = await fetch(`https://api.ezzebank.com/v2/pix/qrcode`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${auth.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(qrCodePayload),
        });
 
        if (!qrCodeResponse.ok) {
          const errorData = await qrCodeResponse.json();
          throw new Error(`Erro ao gerar QR Code: ${errorData.message || qrCodeResponse.statusText}`);
        }

        const responseData = await qrCodeResponse.json();
        return NextResponse.json(responseData);

      case "getQRCode":
        if (!params || !params.transactionId) {
          return NextResponse.json(
            { error: "ID da transação é obrigatório" },
            { status: 400 }
          );
        }

        // Fazer a chamada direta para a API da EzzeBank para consultar o status
        const statusResponse = await fetch(`https://api.ezzebank.com/v2/pix/qrcode/${params.transactionId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${auth.accessToken}`,
            'Content-Type': 'application/json',
          }
        });

        if (!statusResponse.ok) {
          const errorData = await statusResponse.json();
          throw new Error(`Erro ao consultar QR Code: ${errorData.message || statusResponse.statusText}`);
        }

        const statusData = await statusResponse.json();
        return NextResponse.json(statusData);

      case "getQRCodeByExternalId":
        if (!params || !params.externalId) {
          return NextResponse.json(
            { error: "ID externo é obrigatório" },
            { status: 400 }
          );
        }

        // Fazer a chamada direta para a API da EzzeBank para consultar por ID externo
        const externalIdResponse = await fetch(`https://api.ezzebank.com/v2/pix/qrcode/external/${params.externalId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${auth.accessToken}`,
            'Content-Type': 'application/json',
          }
        });

        if (!externalIdResponse.ok) {
          const errorData = await externalIdResponse.json();
          throw new Error(`Erro ao consultar QR Code por ID externo: ${errorData.message || externalIdResponse.statusText}`);
        }

        const externalIdData = await externalIdResponse.json();
        return NextResponse.json(externalIdData);

      default:
        return NextResponse.json(
          { error: "Ação não suportada" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Erro na API EzzeBank:", error);
    
    return NextResponse.json(
      { 
        error: "Erro ao processar requisição", 
        message: error.message || "Ocorreu um erro desconhecido"
      }, 
      { status: 500 }
    );
  }
} 