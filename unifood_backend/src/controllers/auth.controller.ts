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
import { authService } from "src/services/auth.service";
import { LoginDto } from 'src/models/auth.model';

@Controller('auth')
export class authController {
    constructor(private readonly authService: authService){}

    //Login
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto){
        return this.authService.login(loginDto);
    }

    //Verificar Token
    @Get('verificar')
    async verifcar(@Headers('autorization') autorization:string){
        if (!autorization){
            throw new UnauthorizedException('Token no proporcionado');
        }

        const token = autorization.replace('Bearer ', '');
        const usuario = await this.authService.verificarToken(token);

        return{
            valido:true,
            usuario,
        };
    }

    @Get('perfil')
    async perfil(@Headers('autorization') autorization:string){
        if (!autorization){
            throw new UnauthorizedException('Token no proporcionado');
        }

        const token = autorization.replace('Bearer ', '');
        return this.authService.verificarToken(token);
    }

    // cerrar sesion
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(){
        return{
            mensaje: 'Sesion cerrada exitosamente',
        };
    }
}