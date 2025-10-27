import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm'; //  Importar
import { DataSource } from 'typeorm'; //  Importar
import { ProcesarPagoDto } from 'src/models/procesar-pago.model';
import { ReembolsarPagoDto } from 'src/models/reembolsar-pago.model';

@Injectable()
export class PagosService {
  constructor(
    @InjectDataSource() private dataSource: DataSource, // Inyectar
  ) {}

  async procesarPago(dto: ProcesarPagoDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      //  Validar tarjeta
      this.validarTarjeta(dto.tarjeta);

      //  Insertar pago SIN pedido_id (será NULL temporalmente)
      const result = await queryRunner.query(
        `INSERT INTO pago (cantidad, pago_metodo_id, pago_estado_id, fecha, pedido_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
        [
          dto.monto,
          1, // tarjeta
          1, // completado
          new Date(),
          null, //  NULL en lugar de 0
        ],
      );

      const pagoId = result[0].id;

      //  Registrar log
      await queryRunner.query(
        `INSERT INTO pago_log (accion, detalles, fecha, pago_id)
       VALUES ($1, $2, $3, $4)`,
        [
          'CREADO',
          JSON.stringify({
            monto: dto.monto,
            pedidoId: dto.pedidoId || 'pendiente',
            metodo: 'tarjeta',
            tarjeta_ultimos_4: dto.tarjeta.numero.slice(-4),
          }),
          new Date(),
          pagoId,
        ],
      );

      await queryRunner.commitTransaction();

      return {
        success: true,
        pagoId,
        transaccionId: `TXN-${pagoId}-${Date.now()}`,
        mensaje: 'Pago procesado exitosamente',
      };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      console.error('❌ Error al procesar pago:', error);
      throw new BadRequestException(
        error.message || 'Error al procesar el pago',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async reembolsarPago(dto: ReembolsarPagoDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      //  Verificar pago
      const pagoResult = await queryRunner.query(
        'SELECT * FROM pago WHERE id = $1',
        [dto.pagoId],
      );

      if (pagoResult.length === 0) {
        throw new Error('Pago no encontrado o no está completado');
      }

      //  Actualizar a reembolsado (id: 4)
      await queryRunner.query(
        'UPDATE pago SET pago_estado_id = $1 WHERE id = $2',
        [4, dto.pagoId],
      );

      //  Registrar log
      await queryRunner.query(
        `INSERT INTO pago_log (accion, detalles, fecha, pago_id)
         VALUES ($1, $2, $3, $4)`,
        [
          'ACTUALIZADO',
          JSON.stringify({
            estado_anterior: 'completado',
            estado_nuevo: 'reembolsado',
            motivo: dto.motivo || 'Pedido cancelado/rechazado',
          }),
          new Date(),
          dto.pagoId,
        ],
      );

      await queryRunner.commitTransaction();

      return {
        success: true,
        pagoId: dto.pagoId,
        mensaje: 'Reembolso procesado exitosamente',
      };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      console.error('❌ Error al reembolsar:', error);
      throw new BadRequestException(
        error.message || 'Error al procesar el reembolso',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async verificarEstadoPago(pagoId: number) {
    try {
      const result = await this.dataSource.query(
        `SELECT p.*, pe.pago_estado, pm.pago_metodo
         FROM pago p
         LEFT JOIN pago_estado pe ON p.pago_estado_id = pe.id
         LEFT JOIN pago_metodo pm ON p.pago_metodo_id = pm.id
         WHERE p.id = $1`,
        [pagoId],
      );

      if (result.length === 0) {
        throw new Error('Pago no encontrado');
      }

      return result[0];
    } catch (error: any) {
      throw new BadRequestException('Error al verificar el estado del pago');
    }
  }

  private validarTarjeta(tarjeta: {
    numero: string;
    cvv: string;
    expiracion: string;
  }): void {
    const numeroLimpio = tarjeta.numero.replace(/\s/g, '');

    if (!/^\d{16}$/.test(numeroLimpio)) {
      throw new Error('Número de tarjeta inválido');
    }

    if (!/^\d{3}$/.test(tarjeta.cvv)) {
      throw new Error('CVV inválido');
    }

    if (!/^\d{2}\/\d{2}$/.test(tarjeta.expiracion)) {
      throw new Error('Formato de expiración inválido');
    }

    const [mes, anio] = tarjeta.expiracion.split('/').map(Number);
    const anioCompleto = 2000 + anio;
    const fechaExpiracion = new Date(anioCompleto, mes - 1);

    if (fechaExpiracion < new Date()) {
      throw new Error('Tarjeta expirada');
    }

    //  Simular rechazo (5%)
    if (Math.random() < 0.05) {
      throw new Error('Pago rechazado por el banco');
    }
  }
}
