import { Injectable, Logger, OnApplicationBootstrap} from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService implements OnApplicationBootstrap{
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
      try {
        await this.dataSource.query('SELECT 1');
        this.logger.log('(Pagos),Conectado a la Base de Datos Exito');
      }catch(error){
        this.logger.error('Error al conectar a la Base de Datos', error);
      }
      this.logger.log('Servicio de Pagos Iniciado Puerto 5000');
  }
  
  getHello(): string {
    return 'Hello World! (Pagos)';
  }
}
