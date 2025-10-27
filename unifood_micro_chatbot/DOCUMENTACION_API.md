# 📚 Documentación API - Microservicio Chatbot UniFood

## 🌐 Información General

**URL Base:** `http://localhost:6000`  
**Puerto:** `6000`  
**Formato de respuesta:** JSON  
**Versión:** 1.0.0

---

## 📋 Endpoints Disponibles

### 1. Health Check
**`GET /chatbot/health`**

Verifica que el microservicio esté operativo.

**Respuesta Exitosa (200):**
```json
{
  "estado": "operativo",
  "microservicio": "unifood-chatbot",
  "version": "1.0.0",
  "timestamp": "2025-10-27T16:30:00.000Z",
  "mensaje": "✅ Microservicio de Chatbot funcionando correctamente"
}
```

---

### 2. Consulta en Lenguaje Natural
**`POST /chatbot/consulta`**

Procesa mensajes en lenguaje natural y detecta automáticamente la intención del usuario.

**Body:**
```json
{
  "mensaje": "¿Cuáles son los productos más vendidos?",
  "userId": 123  // Opcional: requerido para recomendaciones personalizadas
}
```

**Intenciones Detectadas:**
- 🛒 **Ranking de Ventas:** "más vendidos", "top ventas", "productos populares"
- ⭐ **Ranking de Calificaciones:** "mejor calificados", "top calificaciones", "mejor rating"
- 🎯 **Recomendaciones:** "recomiéndame", "sugerencias", "qué debería comprar"
- 📊 **Estadísticas:** "estadísticas", "análisis general", "resumen"
- 👋 **Saludo:** "hola", "buenos días", "hey"
- ❓ **Ayuda:** "ayuda", "qué puedes hacer", "cómo funciona"

**Ejemplo de Respuesta - Ranking de Ventas:**
```json
{
  "exito": true,
  "tipo_respuesta": "ranking_ventas",
  "mensaje_usuario": "¿Cuáles son los productos más vendidos?",
  "respuesta": "Aquí están los 10 productos más vendidos en UniFood:",
  "datos": {
    "tipo": "ventas",
    "total_productos": 10,
    "tiempo_consulta_ms": 45,
    "productos": [
      {
        "posicion": 1,
        "id_producto": 15,
        "nombre": "Cheesecake",
        "descripcion": "Delicioso cheesecake de la casa",
        "precio": 55.00,
        "categoria": "Postres",
        "imagen_url": "https://...",
        "total_ventas": 97,
        "promedio_calificacion": 4.07,
        "total_resenas": 14
      }
      // ... más productos
    ]
  },
  "timestamp": "2025-10-27T16:30:00.000Z"
}
```

**Ejemplo de Respuesta - Saludo:**
```json
{
  "tipo_respuesta": "saludo",
  "respuesta": "¡Hola! 👋 Soy el asistente virtual de UniFood. ¿En qué puedo ayudarte hoy?",
  "sugerencias": [
    "¿Cuáles son los productos más vendidos?",
    "¿Qué productos tienen mejor calificación?",
    "Dame recomendaciones personalizadas"
  ],
  "timestamp": "2025-10-27T16:30:00.000Z"
}
```

---

### 3. Ranking de Productos por Ventas
**`GET /chatbot/rankings/ventas`**

Obtiene directamente el ranking de productos más vendidos (sin procesar lenguaje natural).

**Respuesta Exitosa (200):**
```json
{
  "exito": true,
  "tipo_respuesta": "ranking_ventas",
  "datos": {
    "tipo": "ventas",
    "total_productos": 10,
    "tiempo_consulta_ms": 42,
    "productos": [
      {
        "posicion": 1,
        "id_producto": 15,
        "nombre": "Cheesecake",
        "descripcion": "Delicioso cheesecake de la casa",
        "precio": 55.00,
        "categoria": "Postres",
        "imagen_url": "https://...",
        "total_ventas": 97,
        "promedio_calificacion": 4.07,
        "total_resenas": 14
      },
      {
        "posicion": 2,
        "id_producto": 14,
        "nombre": "Flan Napolitano",
        "descripcion": "Flan tradicional napolitano",
        "precio": 35.00,
        "categoria": "Postres",
        "total_ventas": 56,
        "promedio_calificacion": 4.13,
        "total_resenas": 15
      }
      // ... más productos
    ]
  },
  "timestamp": "2025-10-27T16:30:00.000Z"
}
```

**Características:**
- ✅ Ordena por total de ventas (descendente)
- ✅ Incluye productos activos solamente
- ✅ Muestra calificación promedio y número de reseñas
- ✅ Límite: 10 productos por defecto

---

### 4. Ranking de Productos por Calificación
**`GET /chatbot/rankings/calificaciones`**

Obtiene productos mejor calificados (mínimo 3 reseñas para aparecer en el ranking).

**Respuesta Exitosa (200):**
```json
{
  "exito": true,
  "tipo_respuesta": "ranking_calificaciones",
  "datos": {
    "tipo": "calificaciones",
    "total_productos": 4,
    "tiempo_consulta_ms": 38,
    "criterio": "Mínimo 3 reseñas para aparecer en el ranking",
    "productos": [
      {
        "posicion": 1,
        "id_producto": 13,
        "nombre": "Brownie",
        "descripcion": "Brownie de chocolate belga",
        "precio": 40.00,
        "categoria": "Postres",
        "promedio_calificacion": 5.00,
        "total_resenas": 3,
        "total_ventas": 13
      },
      {
        "posicion": 2,
        "id_producto": 12,
        "nombre": "Pastel de Chocolate",
        "precio": 45.00,
        "categoria": "Postres",
        "promedio_calificacion": 4.60,
        "total_resenas": 5,
        "total_ventas": 50
      }
      // ... más productos
    ]
  },
  "timestamp": "2025-10-27T16:30:00.000Z"
}
```

**Características:**
- ✅ Filtro: Mínimo 3 reseñas
- ✅ Ordena por calificación promedio (descendente)
- ✅ Muestra número de ventas totales
- ✅ Límite: 10 productos

---

### 5. Estadísticas Generales
**`GET /chatbot/estadisticas`**

Obtiene un resumen completo con top 5 de ventas y top 5 de calificaciones.

**Respuesta Exitosa (200):**
```json
{
  "exito": true,
  "tipo_respuesta": "estadisticas_generales",
  "datos": {
    "fecha_consulta": "2025-10-27T16:30:00.000Z",
    "top_ventas": [
      {
        "posicion": 1,
        "id_producto": 15,
        "nombre": "Cheesecake",
        "total_ventas": 97,
        "promedio_calificacion": 4.07
      }
      // ... top 5
    ],
    "top_calificaciones": [
      {
        "posicion": 1,
        "id_producto": 13,
        "nombre": "Brownie",
        "promedio_calificacion": 5.00,
        "total_resenas": 3
      }
      // ... top 5
    ],
    "mensaje": "Estadísticas actualizadas en tiempo real"
  },
  "timestamp": "2025-10-27T16:30:00.000Z"
}
```

---

### 6. Recomendaciones Personalizadas
**`GET /chatbot/recomendaciones/:userId`**

Genera recomendaciones basadas en el historial de compras del usuario.

**Parámetros:**
- `userId` (número, requerido): ID del cliente

**Ejemplo:** `GET /chatbot/recomendaciones/5`

**Respuesta Exitosa - Usuario con historial (200):**
```json
{
  "exito": true,
  "tipo_respuesta": "recomendaciones",
  "datos": {
    "usuario_id": 5,
    "tiene_historial": true,
    "total_compras_previas": 12,
    "categorias_preferidas": ["Postres", "Bebidas", "Tortas"],
    "total_recomendaciones": 5,
    "recomendaciones": [
      {
        "posicion": 1,
        "id_producto": 18,
        "nombre": "Tres Leches",
        "descripcion": "Pastel tres leches casero",
        "precio": 50.00,
        "categoria": "Postres",
        "total_ventas": 45,
        "promedio_calificacion": 4.80,
        "razon_recomendacion": "Te gusta la categoría \"Postres\""
      },
      {
        "posicion": 2,
        "id_producto": 22,
        "nombre": "Smoothie de Fresa",
        "categoria": "Bebidas",
        "razon_recomendacion": "Te gusta la categoría \"Bebidas\""
      }
      // ... más recomendaciones
    ],
    "mensaje": "Basándonos en tus 12 compras anteriores, te recomendamos estos productos que creemos que te encantarán 😊"
  },
  "timestamp": "2025-10-27T16:30:00.000Z"
}
```

**Respuesta - Usuario sin historial (200):**
```json
{
  "exito": true,
  "tipo_respuesta": "recomendaciones",
  "datos": {
    "usuario_id": 1,
    "tiene_historial": false,
    "recomendaciones": [],
    "mensaje": "¡Aún no has realizado ningún pedido! Te invitamos a explorar nuestro catálogo y hacer tu primera compra. 🎉",
    "sugerencia": "Explora las categorías más populares en el menú principal"
  },
  "timestamp": "2025-10-27T16:30:00.000Z"
}
```

**Algoritmo de Recomendaciones:**
1. 📊 Analiza el historial de compras del usuario
2. 🏷️ Identifica las 3 categorías más compradas
3. 🔍 Busca productos populares de esas categorías
4. ❌ Excluye productos ya comprados
5. ✨ Completa con productos populares generales si es necesario
6. 🎯 Retorna top 5 recomendaciones con razón explicativa

---

## ⚠️ Manejo de Errores

### Error de Validación
```json
{
  "error": true,
  "mensaje": "El campo 'mensaje' es obligatorio y no puede estar vacío",
  "codigo": "MENSAJE_VACIO",
  "timestamp": "2025-10-27T16:30:00.000Z"
}
```

### Error de Tipo Inválido
```json
{
  "error": true,
  "mensaje": "Tipo de ranking inválido. Usa 'ventas' o 'calificaciones'",
  "tipos_validos": ["ventas", "calificaciones"],
  "timestamp": "2025-10-27T16:30:00.000Z"
}
```

### Error del Sistema
```json
{
  "error": true,
  "mensaje": "Error al procesar la consulta",
  "detalles": "Database connection timeout",
  "timestamp": "2025-10-27T16:30:00.000Z"
}
```

---

## 🧪 Ejemplos de Uso

### Con cURL

```bash
# Health Check
curl http://localhost:6000/chatbot/health

# Ranking de ventas
curl http://localhost:6000/chatbot/rankings/ventas

# Ranking de calificaciones
curl http://localhost:6000/chatbot/rankings/calificaciones

# Estadísticas generales
curl http://localhost:6000/chatbot/estadisticas

# Recomendaciones para usuario 5
curl http://localhost:6000/chatbot/recomendaciones/5

# Consulta en lenguaje natural
curl -X POST http://localhost:6000/chatbot/consulta \
  -H "Content-Type: application/json" \
  -d '{"mensaje": "¿Cuáles son los productos más vendidos?"}'

# Consulta con userId para recomendaciones
curl -X POST http://localhost:6000/chatbot/consulta \
  -H "Content-Type: application/json" \
  -d '{"mensaje": "Dame recomendaciones", "userId": 5}'
```

### Con PowerShell

```powershell
# Health Check
Invoke-RestMethod -Uri "http://localhost:6000/chatbot/health" -Method Get

# Ranking de ventas
Invoke-RestMethod -Uri "http://localhost:6000/chatbot/rankings/ventas" -Method Get

# Consulta NLP
$body = @{
    mensaje = "¿Cuáles son los productos más vendidos?"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:6000/chatbot/consulta" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"
```

### Con JavaScript/Fetch

```javascript
// Ranking de ventas
fetch('http://localhost:6000/chatbot/rankings/ventas')
  .then(response => response.json())
  .then(data => console.log(data));

// Consulta NLP
fetch('http://localhost:6000/chatbot/consulta', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mensaje: '¿Cuáles son los productos más vendidos?',
    userId: 5
  })
})
  .then(response => response.json())
  .then(data => console.log(data));
```

---

## 🗄️ Estructura de la Base de Datos

El microservicio se conecta a las siguientes tablas:

- **`producto`**: Productos del catálogo (columna `estado` = true para activos)
- **`categoria`**: Categorías de productos
- **`pedido`**: Pedidos de clientes (columna `cliente_id`)
- **`pedido_producto`**: Productos incluidos en cada pedido
- **`producto_calificacion`**: Calificaciones y reseñas (columna `resena`)

---

## 🔧 Configuración

Variables de entorno requeridas (archivo `.env`):

```env
# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_NAME=unifood

# Servidor
PORT=6000
```

---

## 📊 Métricas y Performance

- **Tiempo promedio de respuesta:** 30-50ms (con datos en BD)
- **Endpoints más rápidos:** Health Check (~2ms), Rankings directos (~40ms)
- **Endpoint más complejo:** Recomendaciones personalizadas (~60ms)
- **Caché:** Por implementar (Redis)

---

## 🚀 Inicio Rápido

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   # Edita .env con tus credenciales
   ```

3. **Compilar:**
   ```bash
   npm run build
   ```

4. **Iniciar en desarrollo:**
   ```bash
   npm run start:dev
   ```

5. **Probar:**
   ```bash
   node test-queries.js      # Pruebas de consultas SQL
   node test-endpoints.js    # Pruebas de endpoints REST
   ```

---

## 📞 Soporte

Para dudas o problemas con el microservicio, consulta:
- `README.md` - Guía general del proyecto
- `INICIO_RAPIDO.md` - Guía de configuración rápida
- `RESUMEN_EJECUTIVO.md` - Descripción técnica completa

---

**Última actualización:** 27 de Octubre, 2025  
**Versión:** 1.0.0  
**Equipo:** UniFood Development Team

