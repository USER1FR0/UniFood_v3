## 🍔 UniFood – Plataforma de Autoservicio Universitario

**UniFood** es una plataforma integral de autoservicio diseñada para modernizar la experiencia de compra en cafeterías universitarias. Su arquitectura combina el modelo **Cliente–Servidor**, **Microservicios** y **MVC**, garantizando escalabilidad, mantenibilidad y alta disponibilidad.  

---

## 🧩 Arquitectura General

La solución está compuesta por varios módulos distribuidos bajo una arquitectura híbrida:

- **Frontend (PWA – Angular Standalone)**  
  Interfaz progresiva accesible desde navegador o dispositivo móvil.  
  Se comunica con los microservicios vía HTTP y WebSockets.  

- **Backend Principal (NestJS)**  
  Actúa como **coordinador y gateway** de las peticiones, implementando el patrón **MVC**.  
  Gestiona la autenticación, las áreas de venta, los pedidos y la comunicación entre microservicios.

- **Microservicios**  
  - **Pagos** → Maneja las transacciones (tarjeta, efectivo, diferido).  
  - **Notificaciones** → Envía avisos automáticos vía SMS o WhatsApp API.  

- **Base de Datos (PostgreSQL)**  
  Base relacional principal, optimizada para integridad y consultas analíticas.  
  Acceso a través de variables de entorno (sin exponer credenciales en el código).

- **Cache y Datos Temporales (Redis)**  
  Almacena sesiones, colas y datos efímeros que requieren alta velocidad.  

- **Comunicación en Tiempo Real (WebSockets)**  
  Utilizada entre cliente y vendedor para el flujo de pedidos en vivo.

- **Puertos Servidores**
  
  ***Api BackEnd:*** Puerto 3000.
  
  ***MicroServicio Notificaciones:*** Puerto 4000.
  
  ***MicroServicio Pagos:*** Puerto 5000.

---

## ⚙️ Estructura de Carpetas

```
/UniFood
│
├── unifood_frontend/          # Aplicación Angular PWA
│   └── src/                   # Componentes, vistas y servicios HTTP
│
├── unifood_backend/           # Backend principal NestJS (MVC)
│   ├── src/
│   │   ├── modules/           # Módulos de dominio (pedidos, usuarios, áreas, etc.)
│   │   ├── common/            # Middleware, filtros y pipes
│   │   └── main.ts            # Bootstrap del servidor principal
│
├── unifood_micro_pagos/       # Microservicio de pagos
├── unifood_micro_notificaciones/  # Microservicio de mensajería
├── unifood_micro_reportes/    # Microservicio de reportes
│
├── docker-compose.yml         # (Opcional) Orquestación local
├── README_UniFood.md          # Documentación del proyecto
└── .env.example               # Ejemplo de configuración de entorno
```

---

## 🚀 Ejecución del Proyecto

### 1. Configuración de entorno
Crea un archivo `.env` en cada módulo con las variables necesarias, por ejemplo:

```bash
# Backend principal
PORT=3000
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<dbname>
REDIS_URL=redis://localhost:6379
JWT_SECRET=unifood_secret
```

Cada microservicio debe contar con su propio `.env`, siguiendo el mismo patrón.

---

### 2. Instalación de dependencias
Ejecutar desde la raíz de cada servicio:

```bash
npm install
```

---

### 3. Ejecución en desarrollo

#### Backend y microservicios
```bash
npm run start:dev
```

#### Frontend Angular
```bash
ng serve
```

---

### 4. Acceso al sistema
Una vez en ejecución:

- **Frontend**: `http://localhost:4200`
- **API Gateway / Backend**: `http://localhost:3000`

---

## 🔄 Flujo General del Sistema

1. El **cliente** realiza su pedido desde la PWA.  
2. El **backend** valida y envía la orden al microservicio correspondiente.  
3. El **vendedor** visualiza el pedido en tiempo real (WebSocket).  
4. El **microservicio de pagos** procesa la transacción (segura y modular).  
5. El **microservicio de notificaciones** informa al cliente vía WhatsApp/SMS.  
6. Los **reportes** se generan periódicamente para análisis y supervisión.

---

## 🧠 Convenciones de Commit

Se siguen las **convenciones de Conventional Commits** para mantener un historial claro y semántico:

```
feat:    Nueva funcionalidad
fix:     Corrección de errores
docs:    Cambios en documentación
style:   Formato o estilo del código
refactor:Refactorización sin cambios funcionales
test:    Creación o modificación de tests
chore:   Cambios de mantenimiento
```

Ejemplo:
```
feat(pedidos): agregar validación de estado antes de confirmar pedido
```

---

## 🧪 Buenas Prácticas

- Usar **nombres descriptivos** para commits, ramas y módulos.  
- Mantener **una rama principal (`main`) estable** y usar **pull requests** para integrar cambios.  
- Evitar exponer **credenciales** o variables sensibles en el repositorio.  
- Cada microservicio debe poder ejecutarse de manera **independiente**.  
- Validar los esquemas de la base de datos antes de realizar migraciones.

---

## 🧰 Tecnologías Principales

| Capa | Tecnología | Descripción |
|------|-------------|-------------|
| Frontend | **Angular PWA** | Interfaz moderna e instalable |
| Backend | **NestJS** | Framework modular basado en Node.js |
| DB | **PostgreSQL** | Base de datos relacional |
| Cache | **Redis** | Almacenamiento rápido en memoria |
| Notificaciones | **Twilio / WhatsApp API** | Mensajería automática |
| Comunicación | **WebSockets** | Eventos en tiempo real |
| Infraestructura | **Docker (opcional)** | Contenedorización local y despliegue |

---

## 👨‍💻 Autor

**Equipo Loco**  
Universidad Tecnológica del Norte de Guanajuato (UTNG)  
_Ingenieria en Desarrollo y Gestion de Software Multiplataforma_  
Proyecto académico y de aplicación práctica.

---

> 🚧 **Nota:** Este proyecto está en desarrollo activo.  
> Se recomienda mantener los entornos separados (desarrollo / producción) y manejar los secretos mediante variables de entorno o servicios seguros como Vault o Doppler.
