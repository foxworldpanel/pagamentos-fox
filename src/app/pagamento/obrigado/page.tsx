import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { redirect } from "next/navigation";
type Params = Promise<{ id: string }>

export default async function ObrigadoPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const id = searchParams.id;
  
  if (!id) {
    redirect("/");
  }

  // Buscar o pagamento usando o Prisma
  const pagamento = await prisma.pagamento.findUnique({
    where: {
      externalId: id,
    },
  });

  // Se o pagamento não for encontrado ou não estiver pago, redirecionar
  if (!pagamento || pagamento.status !== "PAID") {
    redirect(`/pagamento/${id}`);
  }

  const formatCurrency = (valor: number | string | null): string => {
    if (valor === null) return "R$ 0,00";
    const valorNumerico = typeof valor === "string" ? parseFloat(valor) : valor;

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valorNumerico);
  };

  const formatDate = (dateString: Date | null): string => {
    if (!dateString) return "-";
    return dateString.toLocaleString("pt-BR");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1d1d1d] text-white p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={120}
            height={40}
            className="mx-auto mb-6"
            priority
          />
          <h1 className="text-2xl font-bold text-white">Pagamento Confirmado!</h1>
          <p className="text-gray-400 mt-2">
            Agradecemos pela sua confiança
          </p>
        </div>

        <Card className="bg-[#252525] border-[#333333] text-white">
          <CardHeader className="pb-2 border-b border-[#333333]">
            <CardTitle className="text-lg">
              {pagamento.description || `Pagamento #${pagamento.externalId}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Valor pago</p>
              <p className="text-3xl font-bold text-[#0ae339]">
                {formatCurrency(pagamento.amount.toString())}
              </p>
            </div>

            <div className="p-6 bg-green-500/20 border border-green-500/50 rounded-md text-center">
              <h3 className="text-xl font-bold text-green-400 mb-2">
                Muito Obrigado!
              </h3>
              <p className="text-sm text-gray-300">
                {pagamento.paymentDate && `Pago em ${formatDate(pagamento.paymentDate)}`}
                {pagamento.paymentId && <><br />ID: {pagamento.paymentId}</>}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Fox World Panel. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
} 