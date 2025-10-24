# ⚡ Inicio Rápido - Módulo de Recomendaciones

## 🎯 ¿Qué hace este módulo?

Permite a los **supervisores** gestionar recomendaciones de productos y a los **clientes** ver productos destacados en su pantalla principal.

---

## 🚀 Instalación en 3 Pasos

### **Paso 1: Ejecutar SQL** (⏱️ 30 segundos)

Conéctate a tu base de datos y ejecuta:

```bash
psql postgresql://linux:HU4qAMwJfpo0gZJOmoPVmNdY3KVbiHfl@dpg-d3iruvmmcj7s739g3qt0-a.oregon-postgres.render.com/unifood -f unifood_backend/migrations/001_crear_modulo_recomendaciones.sql
```

### **Paso 2: Generar Cliente Prisma** (⏱️ 10 segundos)

```bash
cd unifood_backend
npx prisma generate
```

### **Paso 3: Iniciar Servidor** (⏱️ 5 segundos)

```bash
npm run start:dev
```

✅ **¡Listo!** El módulo ya está funcionando.

---

## 🧪 Prueba Rápida con Postman

### 1️⃣ Generar Recomendaciones Automáticas

```
POST http://localhost:3000/unifood/api/recomendaciones/generar/mas-vendidos?limite=5
```

### 2️⃣ Ver Recomendaciones

```
GET http://localhost:3000/unifood/api/recomendaciones/publicas
```

### 3️⃣ Crear Oferta Manual

```
POST http://localhost:3000/unifood/api/recomendaciones
Content-Type: application/json

{
  "producto_id": 1,
  "tipo_recomendacion": "oferta",
  "prioridad": 10
}
```

---

## 🎨 Frontend - Integración

### Para Clientes (Home)

Agrega el componente en la ruta del home:

```typescript
// app.routes.ts
import { RecomendacionesHomeComponent } from './components/recomendaciones-home/recomendaciones-home.component';

{
  path: 'cliente',
  children: [
    { path: 'home', component: RecomendacionesHomeComponent },
  ]
}
```

### Para Supervisores (Dashboard)

Agrega el componente en el menú del supervisor:

```typescript
// app.routes.ts
import { SupervisorRecomendacionesComponent } from './components/supervisor-recomendaciones/supervisor-recomendaciones.component';

{
  path: 'supervisor',
  children: [
    { path: 'recomendaciones', component: SupervisorRecomendacionesComponent },
  ]
}
```

---

## 📊 Endpoints Principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/recomendaciones/publicas` | Obtener recomendaciones para clientes |
| `POST` | `/recomendaciones` | Crear recomendación manual |
| `PUT` | `/recomendaciones/:id` | Actualizar recomendación |
| `DELETE` | `/recomendaciones/:id` | Eliminar recomendación |
| `POST` | `/recomendaciones/generar/mas-vendidos` | Generar automáticamente |
| `GET` | `/recomendaciones/resumen` | Obtener estadísticas |

---

## 🔍 Verificar que Todo Funciona

### Backend:
```bash
curl http://localhost:3000/unifood/api/recomendaciones/publicas
```

### Frontend:
Navega a: `http://localhost:4200/cliente/home`

### Base de Datos:
```sql
SELECT COUNT(*) FROM recomendacion;
SELECT COUNT(*) FROM metrica_producto;
```

---

## 💡 Flujo de Trabajo Típico

1. **Supervisor** entra a `/supervisor/recomendaciones`
2. Hace click en **"Generar Más Vendidos"** → crea 5 recomendaciones automáticas
3. Hace click en **"Generar Mejor Calificados"** → crea 5 recomendaciones más
4. **Cliente** entra a `/cliente/home` y ve las recomendaciones
5. Cliente hace click en un producto → se registra la interacción
6. **Supervisor** revisa estadísticas y ajusta prioridades

---

## 🛠️ Solución de Problemas Comunes

### ❌ Error: "Tabla recomendacion no existe"
**Solución:** Ejecuta el script SQL del Paso 1

### ❌ Error: "Cannot find module recomendacion.model"
**Solución:** Verifica que copiaste todos los archivos correctamente

### ❌ Error 404 en endpoints
**Solución:** Reinicia el servidor (`npm run start:dev`)

---

## 📁 Archivos Creados

### Backend:
- ✅ `migrations/001_crear_modulo_recomendaciones.sql`
- ✅ `src/models/recomendacion.model.ts`
- ✅ `src/services/recomendacion.service.ts`
- ✅ `src/controllers/recomendacion.controller.ts`
- ✅ `src/modules/recomendacion.module.ts`
- ✅ `prisma/schema.prisma` (actualizado)

### Frontend:
- ✅ `src/app/models/recomendacion.model.ts`
- ✅ `src/app/services/recomendacion.service.ts`
- ✅ `src/app/components/recomendaciones-home/` (3 archivos)
- ✅ `src/app/components/supervisor-recomendaciones/` (3 archivos)

---

## 🎉 ¡Ahora Tienes!

✅ Sistema de recomendaciones funcional  
✅ Cálculo automático de productos más vendidos  
✅ Cálculo automático de mejor calificados  
✅ Dashboard para supervisores  
✅ Vista de recomendaciones para clientes  
✅ Analytics de interacciones  
✅ Sin modificación de tablas existentes  

---

## 📚 Documentación Completa

Para más detalles, revisa: `MODULO_RECOMENDACIONES_GUIA.md`

---

**¿Listo para empezar?** 🚀 ¡Ejecuta los 3 pasos y prueba con Postman!

