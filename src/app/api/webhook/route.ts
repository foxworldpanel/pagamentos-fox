import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Webhook body:", body);

    const expectedAuth = process.env.EZZEBANK_WEBHOOK_AUTH;
    if (!expectedAuth || body.authentication !== expectedAuth) {
      console.log("Autenticação inválida:", body.authentication);
      return NextResponse.json({ message: "Autenticação inválida" }, { status: 401 });
    }

    if (body.transactionType !== 'RECEIVEPIX') {
      return NextResponse.json({ message: "Tipo de transação não processável" }, { status: 200 });
    }

    if (!body.external_id || !body.amount || !body.transactionId) {
      return NextResponse.json({ 
        message: "Parâmetros obrigatórios ausentes" 
      }, { status: 400 });
    }

    const pagamento = await prisma.pagamento.findUnique({
      where: {
        externalId: body.external_id
      }
    });

    if (!pagamento) {
      console.log("Pagamento não encontrado:", body.external_id);
      return NextResponse.json({ 
        message: "Pagamento não encontrado" 
      }, { status: 404 });
    }

    const valorPagamentoStr = pagamento.amount.toString();
    const valorRecebidoStr = body.amount.toString();
    
    if (valorPagamentoStr !== valorRecebidoStr) {
      console.log("Valor diferente:", {
        esperado: valorPagamentoStr,
        recebido: valorRecebidoStr
      });
      return NextResponse.json({ 
        message: "Valor do pagamento diferente do esperado" 
      }, { status: 200 });
    }

    if (pagamento.status === 'PAID') {
      console.log("Pagamento já processado anteriormente:", body.external_id);
      return NextResponse.json({ 
        message: "Pagamento já foi processado anteriormente",
        id: pagamento.id,
        external_id: pagamento.externalId,
        status: pagamento.status
      }, { status: 200 });
    }

    const updatedPayment = await prisma.pagamento.update({
      where: {
        externalId: body.external_id
      },
      data: {
        status: 'PAID',
        paymentDate: new Date(body.dateApproval) || new Date(),
        paymentId: body.transactionId,
        debtorName: body.debitParty?.name || null,
        debtorDocument: body.debitParty?.taxId || null,
        updatedAt: new Date()
      }
    });

    console.log("Pagamento atualizado com sucesso:", {
      id: updatedPayment.id,
      external_id: updatedPayment.externalId,
      status: updatedPayment.status
    });

    return NextResponse.json({ 
      message: "Pagamento atualizado com sucesso",
      id: updatedPayment.id,
      external_id: updatedPayment.externalId,
      status: updatedPayment.status
    }, { status: 200 });
    
  } catch (error: any) {
    console.error("Erro ao processar webhook:", error);
    return NextResponse.json({ 
      error: "Erro ao processar webhook", 
      message: error.message || "Ocorreu um erro desconhecido"
    }, { status: 500 });
  }
}
