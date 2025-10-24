import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto, LoginResponse, JwtPayload, RegistroSupervisorDto } from 'src/models/auth.model';
import { PrismaService } from './prisma.service';

@Injectable()
export class authService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  //Login
  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { correo_electronico, contrasena } = loginDto;

    // Buscar Usuario por correo
    const usuario = await this.prisma.usuario.findUnique({
      where: { correo_electronico },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar Contrasena
    const passwordValida = await bcrypt.compare(contrasena, usuario.contrasena);

    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Obtener el id del rol (cliente, vendedor o supervisor)
    let id_rol: number | null = null;
    let nombre_completo: string | undefined;
    let telefono: string | undefined;
    let area_venta_id: number | undefined;
    let area_venta: any | undefined;

    if (usuario.rol === 'cliente') {
      const cliente = await this.prisma.cliente.findFirst({
        where: { usuario_id: usuario.id },
      });
      id_rol = cliente?.id ?? null;
      nombre_completo = cliente?.nombre_completo;
      telefono = cliente?.telefono;
    } else if (usuario.rol === 'vendedor') {
      const vendedor = await this.prisma.vendedor.findFirst({
        where: { usuario_id: usuario.id },
        include: {
          vendedor_areas: {
            where: { estatus: true },
            include: { area_venta: true },
            take: 1,
          },
        },
      });
      id_rol = vendedor?.id ?? null;
    } else if (usuario.rol === 'supervisor') {
      const supervisor = await this.prisma.supervisor.findFirst({
        where: { usuario_id: usuario.id },
      });
      id_rol = supervisor?.id ?? null;
    }

    // Generar payload JWT
    const payload: JwtPayload = {
      id: usuario.id,
      id_rol: id_rol,
      correo: usuario.correo_electronico,
      rol: usuario.rol,
      nombre_completo,
      telefono,
      area_venta_id,
    };

    // Generar Token JWT
    const token = this.jwtService.sign(payload);

    //Respuesta
    return {
      token,
      usuario: {
        id: usuario.id,
        id_rol: id_rol,
        correo: usuario.correo_electronico,
        rol: usuario.rol,
        nombre_completo,
        telefono,
        area_venta_id,
        area_venta,
      },
    };
  }

  //Verificar Token
  async verificarToken(token: string): Promise<JwtPayload> {
    try {
      const decoded = this.jwtService.verify(token);

      //Verificar que el usuario exista
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: decoded.id },
      });

      if (!usuario) {
        throw new UnauthorizedException('Token inválido (Usuario no existe)');
      }

      // Obtener el id del rol (cliente, vendedor o supervisor)
      let id_rol: number | null = null;
      let nombre_completo: string | undefined;
      let telefono: string | undefined;
      let area_venta_id: number | undefined;

      if (usuario.rol === 'cliente') {
        const cliente = await this.prisma.cliente.findFirst({
          where: { usuario_id: usuario.id },
        });
        id_rol = cliente?.id ?? null;
        nombre_completo = cliente?.nombre_completo;
        telefono = cliente?.telefono;
      } else if (usuario.rol === 'vendedor') {
        const vendedor = await this.prisma.vendedor.findFirst({
          where: { usuario_id: usuario.id },
          include: {
            vendedor_areas: {
              where: { estatus: true },
              include: { area_venta: true },
              take: 1,
            },
          },
        });
        id_rol = vendedor?.id ?? null;
      } else if (usuario.rol === 'supervisor') {
        const supervisor = await this.prisma.supervisor.findFirst({
          where: { usuario_id: usuario.id },
        });
        id_rol = supervisor?.id ?? null;
      }

      return {
        id: usuario.id,
        id_rol: id_rol,
        correo: usuario.correo_electronico,
        rol: usuario.rol,
        nombre_completo,
        telefono,
        area_venta_id,
      };
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }

  //Verificar rol de usuario
  verificarRol(usuario: JwtPayload, rolesPermitidos: string[]): boolean {
    return rolesPermitidos.includes(usuario.rol);
  }

  //Metodo para hashear contrasena
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // Registrar Supervisor
  async registrarSupervisor(registroDto: RegistroSupervisorDto) {
    const { nombre, telefono, email, num_empleado, contrasena, departamento } = registroDto;

    // Verificar si el email ya existe
    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { correo_electronico: email },
    });

    if (usuarioExistente) {
      throw new ConflictException('El email ya está registrado');
    }

    // Verificar si el número de empleado ya existe
    const supervisorExistente = await this.prisma.supervisor.findFirst({
      where: { num_empleado },
    });

    if (supervisorExistente) {
      throw new ConflictException('El número de empleado ya está registrado');
    }

    // Hashear contraseña
    const contrasenaHash = await this.hashPassword(contrasena);

    // Crear usuario
    const usuario = await this.prisma.usuario.create({
      data: {
        correo_electronico: email,
        contrasena: contrasenaHash,
        rol: 'supervisor',
      },
    });

    // Crear supervisor
    const supervisor = await this.prisma.supervisor.create({
      data: {
        nombre,
        telefono,
        email,
        num_empleado,
        departamento: departamento || 'Supervisión General',
        usuario_id: usuario.id,
        estatus: 'activo',
      },
    });

    // Generar token
    const payload: JwtPayload = {
      id: usuario.id,
      id_rol: supervisor.id,
      correo: usuario.correo_electronico,
      rol: usuario.rol,
    };

    const token = this.jwtService.sign(payload);

    return {
      mensaje: 'Supervisor registrado exitosamente',
      token,
      supervisor: {
        id: supervisor.id,
        nombre: supervisor.nombre,
        email: supervisor.email,
        num_empleado: supervisor.num_empleado,
        departamento: supervisor.departamento,
      },
    };
  }
}
