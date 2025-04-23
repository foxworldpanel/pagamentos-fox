/**
 * EzzeBank API Client
 * Biblioteca para integração com a API da EzzeBank
 * Documentação: https://dev.ezzebank.com/
 */

// Tipos para a API da EzzeBank
export type EzzeBankConfig = {
  clientId: string;
  clientSecret: string;
  baseUrl?: string;
};

export type EzzeBankAuth = {
  accessToken: string;
  expiresIn: number;
  expiresAt: number; // Timestamp
};

export type EzzeBankQRCodeParams = {
  externalId?: string;       // ID externo para referência (opcional)
  value: number;             // Valor do QR code em reais
  description?: string;      // Descrição do pagamento (opcional)
  expiresIn?: number;        // Tempo de expiração em minutos (opcional)
  additionalInfo?: string;   // Informações adicionais (opcional)
  callbackUrl?: string;      // URL para notificação (opcional) 
};

export type EzzeBankQRCodeResponse = {
  transactionId: string;     // ID da transação na EzzeBank
  externalId: string;        // ID externo fornecido na criação
  qrcode: string;            // String do QR code para copiar e colar
  qrcodeBase64: string;      // QR code em base64 para exibição como imagem
  value: number;             // Valor do QR code
  status: string;            // Status do QR code
  createdAt: string;         // Data de criação
  expiresAt: string;         // Data de expiração
  paymentId?: string;        // ID do pagamento (quando pago)
  paymentDate?: string;      // Data do pagamento (quando pago)
};

export type EzzeBankListQRCodeResponse = {
  data: EzzeBankQRCodeResponse[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
};

export type EzzeBankError = {
  statusCode: number;
  message: string;
  error?: string;
};

/**
 * Cliente para integração com a API da EzzeBank
 */
export class EzzeBankClient {
  private config: EzzeBankConfig;
  private auth: EzzeBankAuth | null = null;
  public baseUrl: string;

  constructor(config: EzzeBankConfig) {
    this.config = config;
    this.baseUrl = "https://api.ezzebank.com/v2"
  }

  /**
   * Obtém um token de acesso para autenticação
   */
  public async authenticate(): Promise<EzzeBankAuth> {
    // Se já tem um token válido, retorna ele
    if (this.auth && this.auth.expiresAt > Date.now()) {
      return this.auth;
    }

    try {
      // Cria a string para autenticação Basic Auth
      const authString = `${this.config.clientId}:${this.config.clientSecret}`;
      const base64Auth = Buffer.from(authString).toString('base64');

      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${base64Auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'grant_type': 'client_credentials',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao autenticar: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      
      // Salva o token com o tempo de expiração (convertendo para timestamp)
      this.auth = {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
        expiresAt: Date.now() + (data.expires_in * 1000), // Converte para milissegundos
      };

      return this.auth;
    } catch (error) {
      console.error('Erro na autenticação:', error);
      throw error;
    }
  }

  /**
   * Realiza uma requisição autenticada para a API
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    try {
      // Obtém token de autenticação
      const auth = await this.authenticate();

      const options: RequestInit = {
        method,
        headers: {
          'Authorization': `Bearer ${auth.accessToken}`,
          'Content-Type': 'application/json',
        },
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, options);

      if (!response.ok) {
        const errorData = await response.json();
        throw {
          statusCode: response.status,
          message: errorData.message || response.statusText,
          error: errorData.error,
        };
      }

      const responseData = await response.json();
      return responseData as T;
    } catch (error) {
      console.error(`Erro ao ${method} ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Gera um QR Code PIX dinâmico
   * @param params Parâmetros para geração do QR Code
   */
  async generateDynamicQRCode(params: EzzeBankQRCodeParams): Promise<EzzeBankQRCodeResponse> {
    try {
      // Preparar os dados para a requisição
      const payload: Record<string, any> = {
        external_id: params.externalId || generateRandomId(),
        amount: params.value,
        description: params.description || 'Pagamento via PIX',
        expiration: params.expiresIn || 1440, // 24 horas por padrão
      };

      if (params.additionalInfo) {
        payload.additional_info = params.additionalInfo;
      }

      if (params.callbackUrl) {
        payload.callback_url = params.callbackUrl;
      }

      return this.request<EzzeBankQRCodeResponse>('/pix/qrcode', 'POST', payload);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      throw error;
    }
  }

  /**
   * Lista QR Codes gerados
   * @param page Número da página
   * @param limit Limite de registros por página
   */
  async listQRCodes(page: number = 1, limit: number = 10): Promise<EzzeBankListQRCodeResponse> {
    return this.request<EzzeBankListQRCodeResponse>(`/pix/qrcode?page=${page}&limit=${limit}`);
  }

  /**
   * Consulta um QR Code específico
   * @param transactionId ID da transação
   */
  async getQRCode(transactionId: string): Promise<EzzeBankQRCodeResponse> {
    return this.request<EzzeBankQRCodeResponse>(`/pix/qrcode/${transactionId}`);
  }

  /**
   * Consulta um QR Code por ID externo
   * @param externalId ID externo
   */
  async getQRCodeByExternalId(externalId: string): Promise<EzzeBankQRCodeResponse> {
    return this.request<EzzeBankQRCodeResponse>(`/pix/qrcode/external/${externalId}`);
  }

  /**
   * Consulta o status de um pagamento PIX
   * @param transactionId ID da transação
   */
  async getPaymentStatus(transactionId: string): Promise<{
    status: string;
    transactionId: string;
    paymentId?: string;
    paymentDate?: string;
  }> {
    return this.request<{
      status: string;
      transactionId: string;
      paymentId?: string;
      paymentDate?: string;
    }>(`/pix/payment/${transactionId}/status`);
  }
}

/**
 * Gera um ID aleatório para uso como external_id
 */
function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

/**
 * Cria uma instância do cliente EzzeBank
 */
export function createEzzeBankClient(config: EzzeBankConfig): EzzeBankClient {
  return new EzzeBankClient(config);
}

// Exporta por padrão uma função para criação do cliente
export default createEzzeBankClient; 