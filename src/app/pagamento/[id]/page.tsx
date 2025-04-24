import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CopyButton } from "./copy-button";
import { Countdown } from "./countdown";
import { StatusChecker } from "./status-checker";

type Params = Promise<{ id: string }>

export default async function PagamentoPage({ params }: { params: Params }) {
  const { id } = await params
  const pagamento = await prisma.pagamento.findUnique({
    where: {
      externalId: id
    }
  });

  // Se o pagamento não for encontrado, retorne 404
  if (!pagamento) {
    notFound();
  }

  console.log(pagamento);

  // Verifica se o pagamento expirou
  const verificarExpiracao = (): boolean => {
    // Se não tiver data de criação, não pode verificar expiração
    if (!pagamento.createdAt) return false;
    
    // Se não tiver tempo de expiração definido, assume que não expira
    if (!pagamento.expiration) return false;
    
    const dataExpiracao = new Date(pagamento.createdAt);
    // Adiciona o tempo de expiração em segundos
    dataExpiracao.setSeconds(dataExpiracao.getSeconds() + pagamento.expiration);
    
    const agora = new Date();
    return agora > dataExpiracao;
  };
  
  // Calcula a data de expiração
  const calcularDataExpiracao = (): Date | null => {
    if (!pagamento.createdAt || !pagamento.expiration) return null;
    
    const dataExpiracao = new Date(pagamento.createdAt);
    dataExpiracao.setSeconds(dataExpiracao.getSeconds() + pagamento.expiration);
    
    return dataExpiracao;
  };
  
  const formatCurrency = (valor: number | string | null): string => {
    if (valor === null) return "R$ 0,00";
    const valorNumerico = typeof valor === 'string' ? parseFloat(valor) : valor;
    
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valorNumerico);
  };

  const formatDate = (dateString: Date | null): string => {
    if (!dateString) return "-";
    return dateString.toLocaleString("pt-BR");
  };

  // Formata a data de expiração
  const formatarDataExpiracao = (): string => {
    if (!pagamento.createdAt || !pagamento.expiration) return "-";
    
    const dataExpiracao = new Date(pagamento.createdAt);
    dataExpiracao.setSeconds(dataExpiracao.getSeconds() + pagamento.expiration);
    
    return dataExpiracao.toLocaleString("pt-BR");
  };

  const getStatusColor = (status: string): string => {
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

  const getStatusText = (status: string): string => {
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

  const expirado = verificarExpiracao();
  const pago = pagamento.status.toUpperCase() === "PAID" || pagamento.status.toUpperCase() === "COMPLETED";
  const dataExpiracao = calcularDataExpiracao();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1d1d1d] text-white p-4">
      {/* StatusChecker component for automatic status updates */}
      <StatusChecker 
        transactionId={pagamento.transactionId} 
        currentStatus={pagamento.status} 
      />
      
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
          <h1 className="text-2xl font-bold text-white">Pagamento PIX</h1>
          <p className="text-gray-400 mt-2">
            Escaneie o QR Code ou copie o código para pagar
          </p>
        </div>

        <Card className="bg-[#252525] border-[#333333] text-white">
          <CardHeader className="pb-2 border-b border-[#333333]">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">
                {pagamento.description || `Pagamento #${pagamento.externalId}`}
              </CardTitle>
              <Badge className={`${getStatusColor(pagamento.status)} text-white`}>
                {getStatusText(pagamento.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Valor a pagar</p>
              <p className="text-3xl font-bold text-[#0ae339]">
                {formatCurrency(pagamento.amount.toString())}
              </p>
            </div>

            {!pago && !expirado && (
              <>
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg">
                    {pagamento.qrCodeImage && (
                      <img
                        src={pagamento.qrCodeImage.startsWith('data:') 
                          ? pagamento.qrCodeImage 
                          : `data:image/png;base64,${pagamento.qrCodeImage}`}
                        alt="QR Code PIX"
                        className="mx-auto h-48 w-48"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Código PIX (copia e cola)</p>
                  <div className="relative">
                    <div className="p-3 bg-[#1d1d1d] rounded-md text-sm text-white break-all">
                      {pagamento.emvCode}
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <CopyButton code={pagamento.emvCode || ""} />
                </div>

                {pagamento.expiration && (
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Válido até {formatarDataExpiracao()}</p>
                    {dataExpiracao && <Countdown expirationDate={dataExpiracao} />}
                  </div>
                )}
              </>
            )}

            {pago && (
              <div className="p-6 bg-green-500/20 border border-green-500/50 rounded-md text-center">
                <h3 className="text-xl font-bold text-green-400 mb-2">
                  Pagamento Confirmado!
                </h3>
                <p className="text-sm text-gray-300">
                  {pagamento.paymentDate && `Pago em ${formatDate(pagamento.paymentDate)}`}
                </p>
              </div>
            )}

            {expirado && !pago && (
              <div className="p-6 bg-red-500/20 border border-red-500/50 rounded-md text-center">
                <h3 className="text-xl font-bold text-red-400 mb-2">
                  Pagamento Expirado
                </h3>
                <p className="text-sm text-gray-300">
                  Este QR Code não é mais válido.
                </p>
              </div>
            )}
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