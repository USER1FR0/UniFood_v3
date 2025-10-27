import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import { EnviarSmsDto } from './../models/enviar-sms.model';

@Injectable()
export class ComunicacionService {
  private twilioClient: twilio.Twilio;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    if (!accountSid || !authToken) {
      console.error('Credenciales de Twilio no configuradas');
      return;
    }

    this.twilioClient = twilio(accountSid, authToken);
    console.log(' Cliente de Twilio inicializado');
  }

  async enviarSmsPedidoListo(dto: EnviarSmsDto) {
    try {
      const fromPhone = this.configService.get<string>('TWILIO_PHONE_NUMBER');

      if (!fromPhone) {
        throw new Error('Número de Twilio no configurado');
      }

      //  Validar que el teléfono tenga formato internacional
      let telefonoFormateado = dto.telefono.trim();
      
      // Si no empieza con +, agregarlo (asumiendo México +52)
      if (!telefonoFormateado.startsWith('+')) {
        // Si es de 10 dígitos, es México
        if (telefonoFormateado.length === 10) {
          telefonoFormateado = `+52${telefonoFormateado}`;
        } else {
          throw new Error('Formato de teléfono inválido');
        }
      }

      const mensaje = `🍔 ¡Tu pedido está listo! Puedes pasar a recogerlo al área de ${dto.area_nombre}. ¡Gracias por tu preferencia!`;

      const result = await this.twilioClient.messages.create({
        body: mensaje,
        from: fromPhone,
        to: telefonoFormateado,
      });

      console.log('SMS enviado:', result.sid);

      return {
        success: true,
        mensaje: 'SMS enviado exitosamente',
        sid: result.sid,
        telefono: telefonoFormateado,
      };
    } catch (error: any) {
      console.error('❌ Error al enviar SMS:', error.message);

      // Si Twilio no está configurado correctamente, no lanzar error
      if (error.message.includes('no configurado')) {
        return {
          success: false,
          mensaje: 'Servicio de SMS no disponible',
        };
      }

      throw new BadRequestException(
        `Error al enviar SMS: ${error.message || 'Error desconocido'}`,
      );
    }
  }

  // Endpoint de prueba/ping
  ping() {
    return {
      mensaje: 'Servicio de comunicación disponible',
      timestamp: new Date(),
      twilioConfigurado: !!this.twilioClient,
    };
  }
}