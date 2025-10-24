import { isEmail, IsEmail, IsNotEmpty, IsString, MinLength, IsInt, IsOptional } from "class-validator";

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
export interface JwtPayload {
  id: number;
  id_rol: number | null;
  correo: string;
  rol: string;
}

export interface LoginResponse {
  token: string;
  usuario: {
    id: number;
    id_rol: number | null;  // ← Agrega esta línea
    correo: string;
    rol: string;
  };
}

export interface Usuario {
  id: number;
  id_rol: number | null;
  correo: string;
  rol: string;
}

// DTO para REGISTRO DE SUPERVISOR
export class RegistroSupervisorDto {
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @IsString({ message: 'El teléfono debe ser texto' })
  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  telefono: string;

  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string;

  @IsInt({ message: 'El número de empleado debe ser un número entero' })
  @IsNotEmpty({ message: 'El número de empleado es obligatorio' })
  num_empleado: number;

  @IsString({ message: 'La contraseña debe ser texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  contrasena: string;

  @IsString({ message: 'El departamento debe ser texto' })
  @IsOptional()
  departamento?: string;
}