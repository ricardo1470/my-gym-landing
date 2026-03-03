// src/lib/nequi.ts
/**
 * Cliente para la API de Nequi Conecta
 * Documentación: https://conecta.nequi.com.co/
 */

interface NequiConfig {
  clientId: string;
  clientSecret: string;
  apiKey: string;
  baseUrl: string;
}

interface NequiTokenResponse {
  access_token: string;
  expires_in: string;
  token_type: string;
}

interface NequiPushPaymentRequest {
  phoneNumber: string;
  code: string;
  value: string;
  reference1: string;
  reference2?: string;
  reference3?: string;
}

interface NequiPushPaymentResponse {
  transactionId: string;
  statusCode: string;
  statusDesc: string;
}

interface NequiPaymentStatusResponse {
  status: string; // "33" = Pendiente, "35" = Realizado, "10-455" = Cancelado
  name: string;
  value: string;
  date: string;
  trnId: string;
}

class NequiClient {
  private config: NequiConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.config = {
      clientId: process.env.NEQUI_CLIENT_ID || '',
      clientSecret: process.env.NEQUI_CLIENT_SECRET || '',
      apiKey: process.env.NEQUI_API_KEY || '',
      baseUrl: process.env.NEQUI_BASE_URL || 'https://api.nequi.com.co',
    };

    // Validar configuración
    if (!this.config.clientId || !this.config.clientSecret || !this.config.apiKey) {
      console.warn('⚠️ Nequi credentials not configured. Payment integration will run in simulation mode.');
    }
  }

  /**
   * Verifica si las credenciales de Nequi están configuradas
   */
  isConfigured(): boolean {
    const hasCredentials = !!(this.config.clientId && this.config.clientSecret && this.config.apiKey);
    const hasRealCredentials = this.config.clientId.length > 10 && 
                               this.config.clientSecret.length > 10 && 
                               this.config.apiKey.length > 10;
    
    return hasCredentials && hasRealCredentials;
  }

  /**
   * Obtiene un token de acceso OAuth2
   */
  private async getAccessToken(): Promise<string> {
    // Si ya tenemos un token válido, retornarlo
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      // Crear credenciales en base64 (Basic Auth)
      const credentials = Buffer.from(
        `${this.config.clientId}:${this.config.clientSecret}`
      ).toString('base64');

      const response = await fetch(`${this.config.baseUrl}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.status}`);
      }

      const data: NequiTokenResponse = await response.json();

      // Guardar token y expiración (restar 60 segundos para renovar antes)
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (parseInt(data.expires_in) - 60) * 1000;

      console.log('✅ Nequi access token obtained successfully');
      return this.accessToken;

    } catch (error) {
      console.error('❌ Error obtaining Nequi access token:', error);
      throw new Error('Failed to authenticate with Nequi');
    }
  }

  /**
   * Genera un MessageID único para cada petición
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Envía una notificación push de pago al usuario de Nequi
   */
  async sendPushPayment(params: NequiPushPaymentRequest): Promise<NequiPushPaymentResponse> {
    if (!this.isConfigured()) {
      throw new Error('Nequi API is not configured. Please add credentials to .env.local');
    }

    try {
      const token = await this.getAccessToken();
      const messageId = this.generateMessageId();

      const requestBody = {
        RequestMessage: {
          RequestHeader: {
            Channel: 'PNP04-C001',
            RequestDate: new Date().toISOString(),
            MessageID: messageId,
            ClientID: this.config.clientId,
            Destination: {
              ServiceName: 'PaymentsService',
              ServiceOperation: 'unregisteredPayment',
              ServiceRegion: 'C001',
              ServiceVersion: '1.2.0',
            },
          },
          RequestBody: {
            any: {
              unregisteredPaymentRQ: {
                phoneNumber: params.phoneNumber,
                code: params.code,
                value: params.value,
                reference1: params.reference1,
                reference2: params.reference2 || '',
                reference3: params.reference3 || '',
              },
            },
          },
        },
      };

      const response = await fetch(
        `${this.config.baseUrl}/payments/v2/-services-paymentservice-unregisteredpayment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-api-key': this.config.apiKey,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Nequi push payment error:', errorData);
        throw new Error(`Nequi API error: ${response.status}`);
      }

      const data = await response.json();
      const responseBody = data.ResponseMessage?.ResponseBody?.any?.unregisteredPaymentRS;
      const status = data.ResponseMessage?.ResponseHeader?.Status;

      return {
        transactionId: responseBody?.transactionId || '',
        statusCode: status?.StatusCode || '',
        statusDesc: status?.StatusDesc || '',
      };

    } catch (error) {
      console.error('❌ Error sending Nequi push payment:', error);
      throw error;
    }
  }

  /**
   * Consulta el estado de un pago
   */
  async getPaymentStatus(transactionId: string): Promise<NequiPaymentStatusResponse> {
    if (!this.isConfigured()) {
      throw new Error('Nequi API is not configured');
    }

    try {
      const token = await this.getAccessToken();
      const messageId = this.generateMessageId();

      const requestBody = {
        RequestMessage: {
          RequestHeader: {
            Channel: 'PNP04-C001',
            RequestDate: new Date().toISOString(),
            MessageID: messageId,
            ClientID: this.config.clientId,
            Destination: {
              ServiceName: 'PaymentsService',
              ServiceOperation: 'getStatusPayment',
              ServiceRegion: 'C001',
              ServiceVersion: '1.0.0',
            },
          },
          RequestBody: {
            any: {
              getStatusPaymentRQ: {
                codeQR: transactionId,
              },
            },
          },
        },
      };

      const response = await fetch(
        `${this.config.baseUrl}/payments/v2/-services-paymentservice-getstatuspayment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-api-key': this.config.apiKey,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(`Nequi API error: ${response.status}`);
      }

      const data = await response.json();
      const statusData = data.ResponseMessage?.ResponseBody?.any?.getStatusPaymentRS;

      return {
        status: statusData?.status || '33',
        name: statusData?.name || '',
        value: statusData?.value || '',
        date: statusData?.date || '',
        trnId: statusData?.trnId || '',
      };

    } catch (error) {
      console.error('❌ Error getting payment status:', error);
      throw error;
    }
  }

  /**
   * Cancela una notificación push pendiente
   */
  async cancelPushPayment(phoneNumber: string, transactionId: string, code: string): Promise<boolean> {
    if (!this.isConfigured()) {
      throw new Error('Nequi API is not configured');
    }

    try {
      const token = await this.getAccessToken();
      const messageId = this.generateMessageId();

      const requestBody = {
        RequestMessage: {
          RequestHeader: {
            Channel: 'PNP04-C001',
            RequestDate: new Date().toISOString(),
            MessageID: messageId,
            ClientID: this.config.clientId,
            Destination: {
              ServiceName: 'PaymentsService',
              ServiceOperation: 'unregisteredPayment',
              ServiceRegion: 'C001',
              ServiceVersion: '1.0.0',
            },
          },
          RequestBody: {
            any: {
              cancelUnregisteredPaymentRQ: {
                code,
                phoneNumber,
                transactionId,
              },
            },
          },
        },
      };

      const response = await fetch(
        `${this.config.baseUrl}/payments/v2/-services-paymentservice-cancelunregisteredpayment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-api-key': this.config.apiKey,
          },
          body: JSON.stringify(requestBody),
        }
      );

      return response.ok;

    } catch (error) {
      console.error('❌ Error canceling push payment:', error);
      return false;
    }
  }
}

// Singleton instance
let nequiClient: NequiClient | null = null;

export function getNequiClient(): NequiClient {
  if (!nequiClient) {
    nequiClient = new NequiClient();
  }
  return nequiClient;
}

// Helper para interpretar estados de Nequi
export function interpretPaymentStatus(status: string): {
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'caducado' | 'fallido';
  descripcion: string;
} {
  switch (status) {
    case '33':
      return { estado: 'pendiente', descripcion: 'Pago pendiente de confirmación' };
    case '35':
      return { estado: 'aprobado', descripcion: 'Pago realizado exitosamente' };
    case '10-455':
      return { estado: 'rechazado', descripcion: 'Pago cancelado o rechazado' };
    case '10-454':
      return { estado: 'caducado', descripcion: 'Solicitud de pago caducada' };
    case '71':
      return { estado: 'fallido', descripcion: 'Pago fallido' };
    default:
      return { estado: 'pendiente', descripcion: 'Estado desconocido' };
  }
}
