import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { authService } from 'src/services/auth.service';
import { LoginDto, RegistroSupervisorDto } from 'src/models/auth.model';

@Controller('auth')
export class authController {
  constructor(private readonly authService: authService) {}

  //Login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  //Verificar Token
  // CAMBIAR "autorization" por "authorization"
  @Get('verificar')
  async verificar(@Headers('authorization') authorization: string) {
    if (!authorization) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    const token = authorization.replace('Bearer ', '');
    const usuario = await this.authService.verificarToken(token);

    return {
      valido: true,
      usuario,
    };
  }

  @Get('perfil')
  async perfil(@Headers('authorization') authorization: string) {
    if (!authorization) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    const token = authorization.replace('Bearer ', '');
    return this.authService.verificarToken(token);
  }

  // cerrar sesion
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    return {
      mensaje: 'Sesion cerrada exitosamente',
    };
  }

  // Registrar supervisor
  @Post('registrar-supervisor')
  @HttpCode(HttpStatus.CREATED)
  async registrarSupervisor(@Body() registroDto: RegistroSupervisorDto) {
    return this.authService.registrarSupervisor(registroDto);
  }
}
