import {Injectable, UnauthorizedException} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto, LoginResponse, JwtPayload } from 'src/models/auth.model';
import { PrismaService } from './prisma.service';

@Injectable()
export class authService{

    constructor(
        private jwtService: JwtService,
        private prisma: PrismaService
    ){}

    //Login
    async login(loginDto: LoginDto): Promise<LoginResponse>{
        const {correo_electronico, contrasena} = loginDto;

        // Buscar Usuario por correo
        const usuario = await this.prisma.usuario.findUnique({
            where: {correo_electronico}
        });

        if (!usuario){
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // Verificar Contrasena
        const passwordValida = await bcrypt.compare(contrasena, usuario.contrasena);

        if (!passwordValida){
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // Generar payload JWT
        const payload: JwtPayload ={
            id: usuario.id,
            correo: usuario.correo_electronico,
            rol: usuario.rol
        }

        // Generar Token JWT
        const token = this.jwtService.sign(payload);

        //Respuesta
        return{
            token,
            usuario:{
                id: usuario.id,
                correo: usuario.correo_electronico,
                rol: usuario.rol
            },
        };
    }

    //Verificar Token
    async verificarToken(token:string): Promise<JwtPayload>{
        try{
            const decoded = this.jwtService.verify(token);

            //Verificar que el usuario exista
            const usuario = await this.prisma.usuario.findUnique({
                where: {id: decoded.id},
            });

            if (!usuario){
                throw new UnauthorizedException('Token inválido (Usuario no existe)');
            }

            return{
                id: usuario.id,
                correo: usuario.correo_electronico,
                rol: usuario.rol
            };
        }catch(error){
            throw new UnauthorizedException('Token inválido');
        }
    }

    //Verificar rol de usuario
    verificarRol(usuario: JwtPayload, rolesPermitidos: string[]): boolean{
        return rolesPermitidos.includes(usuario.rol);
    }

    //Metodo para hashear contrasena
    async hashPassword(password: string): Promise<string>{
        return bcrypt.hash(password, 10);
    }
}