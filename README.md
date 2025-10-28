# 🍔 UniFood – Plataforma de Autoservicio Universitario

**UniFood** es una plataforma integral de autoservicio diseñada para modernizar la experiencia de compra en cafeterías universitarias.  
Su arquitectura híbrida combina los patrones **Cliente–Servidor**, **MVC** y **Microservicios**, garantizando escalabilidad, mantenibilidad y alta disponibilidad.

---

## 🏗️ Arquitectura del Sistema

### Patrón Arquitectónico: Híbrido

La solución implementa una **arquitectura híbrida** que combina:

1. **MVC (Modelo-Vista-Controlador)** en el backend principal  
2. **Microservicios** para funcionalidades especializadas  
3. **Cliente-Servidor** para la comunicación frontend-backend

---

### 🧱 Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Angular PWA)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Cliente    │  │  Vendedor    │  │   Supervisor    │  │
│  │  Components  │  │  Components  │  │   Components    │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│           │                │                    │           │
│           └────────────────┴────────────────────┘           │
│                            │                                │
│                  WebSocket + HTTP/REST                      │
└────────────────────────────┼───────────────────────────────┘
│
┌────────────────────────────┼───────────────────────────────┐
│              BACKEND PRINCIPAL (NestJS - MVC)              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Controllers → Services → PostgreSQL Functions       │  │
│  │  (Presentación) (Negocio)   (Lógica en BD)          │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  WebSocket   │  │    Cache     │  │   Microservice  │  │
│  │   Gateway    │  │   Service    │  │     Gateway     │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└────────────────────────────┬───────────────────────────────┘
│
┌──────────────┼──────────────┐
│              │              │
┌─────────▼──────┐  ┌───▼────────┐ 
│ Microservicio  │  │Microservicio│
│     Pagos      │  │Notificaciones│ 
│   (Puerto 5000)│  │(Puerto 4000) │ 
└────────────────┘  └─────────────┘ 
```

---

## 🧩 Componentes del Sistema

### Frontend (PWA – Angular Standalone)
- Interfaz progresiva accesible desde navegador o dispositivo móvil  
- Se comunica con el backend vía HTTP REST y WebSockets  
- Implementa validación de modelos en el cliente  
- **URL Local:** `http://localhost:4200`

### Backend Principal (NestJS - Patrón MVC)
- **Ruta base API:** `http://localhost:3000/unifood/api/`  
- Actúa como **coordinador y gateway** de peticiones  
- Implementa el patrón **MVC**:
  - **Models (DTOs):** Validación de datos con `class-validator`
  - **Controllers:** Exponen endpoints REST
  - **Services:** Lógica de negocio y orquestación
- Gestiona autenticación JWT, áreas de venta y pedidos  
- Comunica microservicios entre sí  
- **Puerto:** `3000`

### Microservicios Independientes

| Servicio | Puerto | Responsabilidad |
|-----------|--------|-----------------|
| **Pagos** | 5000 | Transacciones (tarjeta, efectivo, diferido) |
| **Notificaciones** | 4000 | SMS y WhatsApp API |

### Base de Datos (PostgreSQL)
- Base relacional principal  
- **Lógica de negocio distribuida** en funciones y procedimientos almacenados  
- Garantiza integridad transaccional **ACID**  
- Acceso mediante variables de entorno (`.env`)

### Cache (Redis)
- Almacena catalogos de productos

### Comunicación en Tiempo Real (WebSockets)
- Implementado con **Socket.IO**  
- Salas por pedido: `pedido-{id}`  
- Salas por área: `area-{id}`  
- Notificaciones instantáneas entre cliente y vendedor

---

## 📁 Estructura de Carpetas

```
/UniFood
│
├── unifood_frontend/              
│   └── src/
│       ├── app/
│       │   ├── core/
│       │   ├── shared/
│       │   └── modules/
│       │       ├── cliente/
│       │       ├── vendedor/
│       │       └── supervisor/
│
├── unifood_backend/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── gateways/
│   │   ├── common/
│   │   ├── modules/
│   │   └── main.ts
│
├── unifood_micro_pagos/
│   └── src/
│       ├── controllers/
│       ├── services/
│       └── main.ts
│
├── unifood_micro_notificaciones/
│   └── src/
│       ├── controllers/
│       ├── services/
│       ├── templates/
│       └── main.ts
│
├── unifood_micro_reportes/
│   └── src/
│       ├── controllers/
│       ├── services/
│       └── main.ts
│
├── .env.example
└── README.md
```

---

## ⚙️ Configuración de Entorno

### Variables de Entorno Requeridas

#### Backend Principal (`unifood_backend/.env`)

```bash
# Servidor
PORT=3000
NODE_ENV=development

# Base de Datos PostgreSQL
DB_HOST=***********
DB_PORT=***********
DB_NAME=***********
DB_USER=***********
DB_PASSWORD=***********
DB_URI=***********

# Redis
REDIS_HOST=***********
REDIS_PORT=***********

# JWT
JWT_SECRET=***********
JWT_EXPIRES_IN=***********

# URLs de Microservicios
MS_PAGOS_URL=***********
MS_NOTIF_URL=***********

# CORS
CORS_ORIGIN=***********
```

#### Microservicio de Pagos (`unifood_micro_pagos/.env`)
```bash
PORT=***********
DB_HOST=***********
DB_PORT=***********
DB_NAME=***********
STRIPE_SECRET_KEY=***********
```

#### Microservicio de Notificaciones (`unifood_micro_notificaciones/.env`)
```bash
PORT=***********
DB_HOST=***********
DB_PORT=***********
DB_NAME=***********
TWILIO_ACCOUNT_SID=***********
TWILIO_AUTH_TOKEN=***********
TWILIO_PHONE_NUMBER=+***********
```

---

## 🚀 Instalación y Ejecución

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd UniFood
```

### 2. Instalar dependencias
```bash
# Backend principal
cd unifood_backend
npm install

# Microservicio Pagos
cd ../unifood_micro_pagos
npm install

# Microservicio Notificaciones
cd ../unifood_micro_notificaciones
npm install

# Frontend
cd ../unifood_frontend
npm install
```

### 3. Configurar bases de datos
Conexion mediante las credenciales de clever cloud

### 4. Ejecutar servicios

**Opción A – Manual**
```bash
# Terminal 1: Backend principal
cd unifood_backend
npm run start:dev

# Terminal 2: Microservicio Pagos
cd ../unifood_micro_pagos
npm run start:dev

# Terminal 3: Microservicio Notificaciones
cd ../unifood_micro_notificaciones
npm run start:dev

# Terminal 4: Frontend
cd ../unifood_frontend
ng serve
```

### 5. Acceder al sistema

- **Frontend:** [http://localhost:4200](http://localhost:4200)  
- **API Backend:** [http://localhost:3000/unifood/api/](http://localhost:3000/unifood/api/)  
---

## 📡 Endpoints Principales (Ejemplos)

**Base:** `http://localhost:3000/unifood/api`

### Pedidos
```
POST   /pedidos              - Crear pedido
GET    /pedidos              - Listar todos
GET    /pedidos/:id          - Obtener uno
PUT    /pedidos/:id/estado   - Actualizar estado
DELETE /pedidos/:id          - Cancelar pedido
```

### Productos
```
POST   /productos            - Crear producto
GET    /productos            - Listar con filtros
GET    /productos/:id        - Obtener uno
PUT    /productos/:id        - Actualizar
DELETE /productos/:id        - Eliminar
```

### Reportes
```
GET    /reportes/ventas      - Dashboard de ventas
POST   /reportes/generar     - Generar reporte personalizado
```

---

## 🔄 Flujo Completo de un Pedido (Gestion)

1. Cliente realiza pedido desde la PWA  
2. Backend valida DTO y ejecuta lógica en `Service`  
3. `Service` ejecuta función SQL en PostgreSQL  
4. Si el pago es con tarjeta → delega al microservicio de pagos  
5. WebSocket notifica al vendedor en tiempo real  
6. Vendedor cambia estado → `Service` actualiza en BD  
7. Si el pedido está “listo” → microservicio de notificaciones envía SMS  
8. Cliente recibe notificación y se actualiza la UI vía WebSocket  
9. Al entregar → se genera reporte en el microservicio correspondiente  

---

## 🧠 Convenciones de Desarrollo

### Commits (Conventional Commits)
| Tipo | Descripción |
|------|--------------|
| **feat:** | Nueva funcionalidad |
| **fix:** | Corrección de errores |
| **docs:** | Cambios en documentación |
| **style:** | Formato o estilo del código |
| **refactor:** | Refactorización sin cambios funcionales |
| **test:** | Creación o modificación de tests |
| **chore:** | Cambios de mantenimiento |

Ejemplo:
```bash
git commit -m "feat(pedidos): agregar validación de stock antes de crear pedido"
```

### Nombrado de Archivos
- Controladores → `recurso.controller.ts`  
- Servicios → `recurso.service.ts`  
- DTOs → `recurso.dto.ts`  
- Módulos → `recurso.module.ts`  
- Gateways → `recurso.gateway.ts`

---

## 🧪 Buenas Prácticas

- Mantener rama `main` estable y usar *pull requests*  
- Cada microservicio debe poder ejecutarse de manera independiente  
- No exponer credenciales en el código (`.env`)  
- Validar esquemas de BD antes de ejecutar migraciones  
- Usar funciones SQL en lugar de ORMs pesados  
- Implementar caché para consultas frecuentes  
- Manejar errores con excepciones HTTP de NestJS  
- Documentar funciones complejas con comentarios claros  

---

## 🧰 Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
|------|-------------|----------|-----------|
| Frontend | Angular PWA | 19+ | Interfaz progresiva |
| Backend | NestJS | 10+ | Framework MVC modular |
| Base de Datos | PostgreSQL | 15+ | Base relacional principal |
| Cache | Redis | 7+ | Almacenamiento en memoria |
| Comunicación | Socket.IO | 4+ | WebSockets en tiempo real |
| Validación | class-validator | 0.14+ | Validación de DTOs |
| Notificaciones | Twilio / WhatsApp API | — | Mensajería automática |
| Pagos | Paypal API | — | Procesamiento de pagos |

---

## 📚 Documentación Adicional

[Actividad_1_Unidad_2_ArquitecturaSoftware (2).pdf](https://github.com/user-attachments/files/23195039/Actividad_1_Unidad_2_ArquitecturaSoftware.2.pdf)

[Actividad_2_Unidad_2_ArquitecturaSoftware (1).pdf](https://github.com/user-attachments/files/23195041/Actividad_2_Unidad_2_ArquitecturaSoftware.1.pdf)

### Presentacion propuesta proyecto
https://www.canva.com/design/DAG23Kq2wTM/9lxYq0FvM7pDP0zwtK7h3Q/view?utm_content=DAG23Kq2wTM&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=hdf4ed411a1

---

## 👨‍💻 Equipo de Desarrollo

**Equipo Loco**  
Universidad Tecnológica del Norte de Guanajuato (UTNG)  
Ingeniería en Desarrollo y Gestión de Software Multiplataforma  

| Nombre | Rol |
|--------|-----|
| Carlos Samagey Aguayo Santana | FullStack |
| Juan Diedo Pardo Zamarripa | FullStack |
| Juan Francisco Rodriguez Guerrero | FullStack |

---

## 📝 Licencia

Este proyecto es un desarrollo académico para la **UTNG**.  
Todos los derechos reservados © 2025.

---

## 🚧 Estado del Proyecto

- **Versión Actual:** 1.0.0-beta  
- **Estado:** En desarrollo activo  

### Próximas Funcionalidades
- En Proceso

---

## 🆘 Soporte y Contacto

Para dudas o problemas:
- Crear un *issue* en el repositorio  

---

> **Nota:** Este proyecto está en desarrollo activo.  
> Se recomienda mantener los entornos separados (desarrollo / producción)  
> y manejar secretos mediante variables de entorno o servicios seguros.

