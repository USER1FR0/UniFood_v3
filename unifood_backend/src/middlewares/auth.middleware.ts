import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

// Extender el tipo Request para incluir usuario
declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: number;
        correo: string;
        rol: string;
      };
    }
  }
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    try {
      const token = authHeader.replace('Bearer ', '');
      const decoded = this.jwtService.verify(token);

      // Agregar usuario al request
      req.usuario = {
        id: decoded.id,
        correo: decoded.correo,
        rol: decoded.rol,
      };

      next();
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}

// Middleware para verificar roles específicos
export class RolMiddleware implements NestMiddleware {
  constructor(private rolesPermitidos: string[]) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (!req.usuario) {
      throw new UnauthorizedException('No autenticado');
    }

    if (!this.rolesPermitidos.includes(req.usuario.rol)) {
      throw new UnauthorizedException(
        `No tienes permisos. Se requiere rol: ${this.rolesPermitidos.join(' o ')}`,
      );
    }

    next();
  }
}

// Guard JWT para usar con @UseGuards
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    try {
      const token = authHeader.replace('Bearer ', '');
      const decoded = this.jwtService.verify(token);

      // Agregar usuario al request
      request.user = {
        id: decoded.id,
        correo: decoded.correo,
        rol: decoded.rol,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}