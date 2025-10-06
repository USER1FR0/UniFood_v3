// ============================================
// RESPONSABILIDAD: 
// - Definir estructura de datos del producto
// - Validaciones básicas de seguridad
// ============================================
// INTERACTÚA CON:
// - Controller: Recibe estos datos del body
// - Service: Valida antes de enviar a BD
// ============================================

import { IsString, IsNumber, IsOptional, IsEnum, IsNotEmpty, Min } from 'class-validator';

// DTO para CREAR (todos los campos requeridos del negocio)
export class CreateRecursoDto {
  @IsString() // Valida que sea texto
  @IsNotEmpty() // No puede estar vacío
  campo1: string;

  @IsNumber() // Valida que sea número
  @Min(0) // Valor mínimo
  campo2: number;

  @IsOptional() // Este campo es opcional
  @IsString()
  campo3?: string; // El "?" indica opcional en TypeScript
}

// DTO para ACTUALIZAR (todos opcionales, permite actualización parcial)
export class UpdateRecursoDto {
  @IsOptional()
  @IsString()
  campo1?: string;

  @IsOptional()
  @IsNumber()
  campo2?: number;
}

// DTO para RESPUESTA (lo que devuelve el backend)
export class RecursoResponseDto {
  id: number;
  campo1: string;
  campo2: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 Los DTOs son clases que definen la forma de los datos que entran/salen
class-validator valida automáticamente en el controller
El ? significa campo opcional
Estas validaciones son tu última línea de defensa contra datos maliciosos
 */