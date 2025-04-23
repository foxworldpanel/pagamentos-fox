import { NextRequest, NextResponse } from "next/server";
import { createEzzeBankClient } from "@/lib/ezzebank";
import { prisma } from "@/lib/prisma";

type Params = Promise<{ id: string }>

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  const { id } = await params;
  
  try {
    // Inicializar o cliente EzzeBank
    const clientId = process.env.EZZEBANK_CLIENT_ID;
    const clientSecret = process.env.EZZEBANK_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Credenciais da API não configuradas" },
        { status: 500 }
      );
    }

    const ezzebank = createEzzeBankClient({
      clientId: process.env.EZZEBANK_CLIENT_ID || "",
      clientSecret: process.env.EZZEBANK_CLIENT_SECRET || "",
    });
    
    const auth = await ezzebank.authenticate();
    
    const statusData = await fetch(`https://api.ezzebank.com/v2/pix/qrcode/${id}/detail`, {
      headers: {
        'Authorization': `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    const statusDataJson = await statusData.json();
    
    // Mapear o status da API para o formato armazenado no banco
    let paymentStatus = statusDataJson.status;
    if (statusDataJson.status === 'APPROVED') {
      paymentStatus = 'PAID';
    }
    
    // Buscar o pagamento no Prisma
    const payment = await prisma.pagamento.findUnique({
      where: {
        transactionId: id
      }
    });
    
    if (!payment) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 }
      );
    }
    
    // Atualizar o status no banco de dados
    const updatedPayment = await prisma.pagamento.update({
      where: {
        transactionId: id
      },
      data: {
        status: paymentStatus,
        paymentDate: paymentStatus === 'PAID' ? new Date() : null,
        paymentId: statusDataJson.transactionIdentification || null,
        debtorName: statusDataJson.debitParty?.name || null,
        debtorDocument: statusDataJson.debitParty?.taxId || null,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({
      id: updatedPayment.id,
      transaction_id: updatedPayment.transactionId,
      external_id: updatedPayment.externalId,
      status: updatedPayment.status,
      amount: updatedPayment.amount.toString(),
      payer_name: updatedPayment.debtorName,
      payer_document: updatedPayment.debtorDocument,
      payment_id: updatedPayment.paymentId,
      payment_date: updatedPayment.paymentDate,
      updated_at: updatedPayment.updatedAt
    });

  } catch (error: any) {
    console.log("Erro ao consultar status do pagamento:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao consultar status do pagamento" },
      { status: 500 }
    );
  }
} 