# 📊 Módulo de Recomendaciones - UniFood

## 📝 Descripción General

El módulo de recomendaciones permite gestionar y mostrar productos destacados a los clientes, basándose en diferentes criterios como ventas, calificaciones u ofertas especiales. Este módulo está completamente integrado con el sistema y NO modifica ninguna tabla existente.

---

## 🗄️ Estructura de la Base de Datos

### **Nuevas Tablas Creadas**

#### 1. `recomendacion`
Tabla principal que almacena las recomendaciones de productos.

```sql
CREATE TABLE recomendacion (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES producto(id),
    tipo_recomendacion VARCHAR(50) NOT NULL, -- 'mas_vendido', 'mejor_calificado', 'oferta', 'manual'
    prioridad INT DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    fecha_inicio TIMESTAMP(6),
    fecha_fin TIMESTAMP(6),
    supervisor_id INT REFERENCES supervisor(id),
    metadata JSONB,
    created_at TIMESTAMP(6) DEFAULT now(),
    updated_at TIMESTAMP(6) DEFAULT now()
);
```

#### 2. `metrica_producto`
Almacena métricas calculadas de cada producto (ventas y calificaciones).

```sql
CREATE TABLE metrica_producto (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL UNIQUE REFERENCES producto(id),
    total_ventas INT DEFAULT 0,
    calificacion_promedio DECIMAL(3,2) DEFAULT 0.00,
    total_calificaciones INT DEFAULT 0,
    ultima_actualizacion TIMESTAMP(6) DEFAULT now()
);
```

#### 3. `recomendacion_interaccion`
Registra las interacciones de los clientes con las recomendaciones (analytics).

```sql
CREATE TABLE recomendacion_interaccion (
    id SERIAL PRIMARY KEY,
    recomendacion_id INT NOT NULL REFERENCES recomendacion(id),
    cliente_id INT REFERENCES cliente(id),
    tipo_interaccion VARCHAR(50), -- 'vista', 'click', 'agregado_carrito', 'comprado'
    fecha TIMESTAMP(6) DEFAULT now(),
    metadata JSONB
);
```

---

## 🚀 Instalación y Configuración

### **Paso 1: Ejecutar la Migración SQL**

Conéctate a tu base de datos PostgreSQL y ejecuta el script de migración:

```bash
psql -h dpg-d3iruvmmcj7s739g3qt0-a.oregon-postgres.render.com -U linux -d unifood -f unifood_backend/migrations/001_crear_modulo_recomendaciones.sql
```

O desde el cliente psql:

```sql
\i unifood_backend/migrations/001_crear_modulo_recomendaciones.sql
```

### **Paso 2: Generar Cliente Prisma**

```bash
cd unifood_backend
npx prisma generate
```

### **Paso 3: Verificar la Instalación**

Desde psql, verifica que las tablas se crearon correctamente:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%recomendacion%';
```

Deberías ver:
- `recomendacion`
- `metrica_producto`
- `recomendacion_interaccion`

---

## 📡 API Endpoints (Backend)

### **Endpoints Públicos** (Para Clientes)

#### 1. Obtener Recomendaciones Activas
```http
GET /unifood/api/recomendaciones/publicas
Query Params:
  - tipo?: 'mas_vendido' | 'mejor_calificado' | 'oferta' | 'manual'
  - limit?: number (default: 10)
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "producto_id": 5,
    "tipo_recomendacion": "mas_vendido",
    "prioridad": 5,
    "activo": true,
    "producto": {
      "id": 5,
      "nombre": "Tacos al Pastor",
      "precio": 45.00,
      "imagen_url": "...",
      "categoria": { "nombre": "Antojitos" }
    },
    "metricas": {
      "total_ventas": 150,
      "calificacion_promedio": 4.8
    }
  }
]
```

#### 2. Registrar Interacción
```http
POST /unifood/api/recomendaciones/interaccion
Body:
{
  "recomendacion_id": 1,
  "cliente_id": 10,
  "tipo_interaccion": "click",
  "metadata": {}
}
```

### **Endpoints de Supervisor**

#### 1. Obtener Todas las Recomendaciones
```http
GET /unifood/api/recomendaciones
Query Params:
  - tipo?: string
  - activo?: boolean
  - limit?: number
```

#### 2. Crear Recomendación Manual
```http
POST /unifood/api/recomendaciones
Body:
{
  "producto_id": 5,
  "tipo_recomendacion": "oferta",
  "prioridad": 10,
  "fecha_inicio": "2025-10-24",
  "fecha_fin": "2025-11-24",
  "metadata": { "descuento": 20 }
}
```

#### 3. Actualizar Recomendación
```http
PUT /unifood/api/recomendaciones/:id
Body:
{
  "activo": false,
  "prioridad": 5
}
```

#### 4. Eliminar Recomendación
```http
DELETE /unifood/api/recomendaciones/:id
```

#### 5. Generar Recomendaciones Automáticas (Más Vendidos)
```http
POST /unifood/api/recomendaciones/generar/mas-vendidos?limite=5
```

#### 6. Generar Recomendaciones Automáticas (Mejor Calificados)
```http
POST /unifood/api/recomendaciones/generar/mejor-calificados?limite=5
```

#### 7. Obtener Resumen
```http
GET /unifood/api/recomendaciones/resumen
```

**Respuesta:**
```json
{
  "total_recomendaciones": 15,
  "activas": 12,
  "inactivas": 3,
  "por_tipo": [
    { "tipo": "mas_vendido", "cantidad": 5 },
    { "tipo": "mejor_calificado", "cantidad": 5 },
    { "tipo": "oferta", "cantidad": 3 },
    { "tipo": "manual", "cantidad": 2 }
  ]
}
```

#### 8. Obtener Estadísticas de Interacciones
```http
GET /unifood/api/recomendaciones/:id/estadisticas
```

**Respuesta:**
```json
{
  "recomendacion_id": 1,
  "total_vistas": 150,
  "total_clicks": 80,
  "total_agregados_carrito": 30,
  "total_comprados": 20,
  "tasa_conversion": 13.33
}
```

---

## 🎨 Componentes Frontend

### **1. Para Clientes: `RecomendacionesHomeComponent`**

**Ubicación:** `unifood_frontend/src/app/components/recomendaciones-home/`

**Uso en Rutas:**
```typescript
// app.routes.ts
{
  path: 'cliente',
  component: ClienteLayoutComponent,
  canActivate: [clienteGuard],
  children: [
    { path: 'home', component: RecomendacionesHomeComponent },
    // ... otras rutas
  ]
}
```

**Características:**
- Muestra recomendaciones agrupadas por tipo (Más Vendidos, Mejor Calificados, Ofertas, Destacados)
- Carrusel responsivo de productos
- Registro automático de interacciones (vistas, clicks)
- Navegación al detalle del producto

### **2. Para Supervisores: `SupervisorRecomendacionesComponent`**

**Ubicación:** `unifood_frontend/src/app/components/supervisor-recomendaciones/`

**Uso en Rutas:**
```typescript
// app.routes.ts
{
  path: 'supervisor',
  component: SupervisorLayoutComponent,
  canActivate: [supervisorGuard],
  children: [
    { path: 'recomendaciones', component: SupervisorRecomendacionesComponent },
    // ... otras rutas
  ]
}
```

**Características:**
- Dashboard con resumen de recomendaciones
- Tabla para gestionar recomendaciones (activar/desactivar, eliminar)
- Filtros por tipo y estado
- Generación automática de recomendaciones (más vendidos, mejor calificados)
- Vista de estadísticas de interacciones
- Toggle para activar/desactivar recomendaciones

---

## 🧪 Testing con Postman

### **1. Crear Recomendación Manual**

```
POST http://localhost:3000/unifood/api/recomendaciones
Content-Type: application/json

{
  "producto_id": 1,
  "tipo_recomendacion": "oferta",
  "prioridad": 10,
  "fecha_inicio": "2025-10-24T00:00:00Z",
  "fecha_fin": "2025-11-24T00:00:00Z",
  "metadata": {
    "descuento": 20,
    "texto_promocional": "¡20% de descuento!"
  }
}
```

### **2. Generar Recomendaciones de Más Vendidos**

```
POST http://localhost:3000/unifood/api/recomendaciones/generar/mas-vendidos?limite=5
```

### **3. Obtener Recomendaciones Públicas**

```
GET http://localhost:3000/unifood/api/recomendaciones/publicas?limit=10
```

---

## 🔧 Mantenimiento y Actualización de Métricas

### **Actualización Manual de Métricas**

Para actualizar las métricas de un producto específico:

```bash
curl -X PUT http://localhost:3000/unifood/api/recomendaciones/producto/1/metricas
```

### **Actualización Automática Programada**

Puedes configurar un cron job o tarea programada para actualizar métricas periódicamente. Ejemplo con node-cron:

```typescript
// En un módulo de tareas programadas
import * as cron from 'node-cron';

// Actualizar métricas todos los días a las 3 AM
cron.schedule('0 3 * * *', async () => {
  const productos = await prisma.producto.findMany({ where: { estado: true } });
  for (const producto of productos) {
    await recomendacionService.actualizarMetricasProducto(producto.id);
  }
  console.log('Métricas actualizadas');
});
```

---

## 📊 Flujo de Trabajo Recomendado

### **Para Supervisores:**

1. **Configuración Inicial:**
   - Accede a `/supervisor/recomendaciones`
   - Genera recomendaciones automáticas de "Más Vendidos" y "Mejor Calificados"

2. **Gestión Diaria:**
   - Revisa las estadísticas de interacciones
   - Activa/desactiva recomendaciones según rendimiento
   - Crea ofertas especiales manualmente

3. **Monitoreo:**
   - Revisa la tasa de conversión de cada recomendación
   - Ajusta prioridades según resultados

### **Para Clientes:**

1. Al entrar a la app, ven automáticamente las recomendaciones en el home
2. Pueden filtrar por tipo de recomendación
3. Al hacer click, navegan al detalle del producto
4. Las interacciones se registran automáticamente para analytics

---

## 🎯 Tipos de Recomendaciones

| Tipo | Descripción | Cálculo |
|------|-------------|---------|
| **mas_vendido** 🔥 | Productos con más ventas | Automático (basado en `pedido_producto`) |
| **mejor_calificado** ⭐ | Productos con mejor calificación | Automático (basado en `producto_calificacion`) |
| **oferta** 💰 | Ofertas especiales | Manual (supervisor) |
| **manual** 📌 | Destacados personalizados | Manual (supervisor) |

---

## 🛠️ Troubleshooting

### **Error: "Tabla recomendacion no existe"**

**Solución:** Ejecuta el script de migración SQL:
```bash
psql -h <host> -U <user> -d unifood -f unifood_backend/migrations/001_crear_modulo_recomendaciones.sql
```

### **Error: "Cannot find module recomendacion.model"**

**Solución:** Verifica que el archivo existe en:
- Backend: `unifood_backend/src/models/recomendacion.model.ts`
- Frontend: `unifood_frontend/src/app/models/recomendacion.model.ts`

### **Las métricas no se actualizan**

**Solución:** Ejecuta manualmente la actualización:
```bash
curl -X POST http://localhost:3000/unifood/api/recomendaciones/generar/mas-vendidos
```

---

## 📈 Próximas Mejoras (Opcionales)

- [ ] Integración con microservicio de analytics
- [ ] Recomendaciones personalizadas por historial de cliente
- [ ] A/B testing de recomendaciones
- [ ] Exportación de reportes en PDF/Excel
- [ ] Notificaciones push cuando hay nuevas ofertas
- [ ] Sistema de puntos/gamificación

---

## ✅ Checklist de Implementación

- [x] Crear tablas en la base de datos
- [x] Implementar modelos y DTOs (Backend)
- [x] Crear RecomendacionService con lógica de negocio
- [x] Crear RecomendacionController con endpoints
- [x] Integrar RecomendacionModule en AppModule
- [x] Crear modelos e interfaces (Frontend)
- [x] Implementar RecomendacionService (Frontend)
- [x] Crear componente de home para clientes
- [x] Crear componente de gestión para supervisores
- [x] Documentación completa

---

## 📞 Soporte

Si tienes dudas o problemas con el módulo:

1. Revisa esta documentación
2. Verifica los logs del backend (`console.log` en servicios)
3. Usa las DevTools del navegador para errores del frontend
4. Consulta los ejemplos de Postman incluidos

---

¡El módulo de recomendaciones está listo para usar! 🎉

