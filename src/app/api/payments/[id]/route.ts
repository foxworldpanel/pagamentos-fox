import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se o ID foi fornecido
    if (!params.id) {
      return NextResponse.json(
        { error: "ID do pagamento não fornecido" },
        { status: 400 }
      );
    }

    // Verificar se o pagamento existe
    const payment = await prisma.pagamento.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 }
      );
    }

    // Deletar o pagamento
    await prisma.pagamento.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json(
      { success: true, message: "Pagamento excluído com sucesso" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erro ao excluir pagamento:", error);
    return NextResponse.json(
      { 
        error: "Erro ao excluir pagamento", 
        message: error.message 
      },
      { status: 500 }
    );
  }
} 