import { isEmail, IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

// DTO para LOGIN
export class LoginDto {
    @IsEmail({}, { message: 'Correo electronico inválido' })
    @IsNotEmpty({ message: 'El correo electronico es obligatorio' })
    correo_electronico: string;

    @IsString()
    @IsNotEmpty({ message: 'La contraseña es obligatoria' })
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    contrasena: string;
}

//Respuesta Login
export interface LoginResponse{
    token: string;
    usuario:{
        id: number;
        correo:string;
        rol:string;
    };
}

//Payload del JWT
export interface JwtPayload{
    id: number;
    correo: string;
    rol: string;
}