# 🚀 Inicio Rápido - Microservicio Chatbot UniFood

## ⚡ Configuración Inicial (5 minutos)

### 1️⃣ Instalar Dependencias

```bash
cd unifood_micro_chatbot
npm install
```

### 2️⃣ Configurar Variables de Entorno

Crea el archivo `.env` en la raíz del microservicio:

```env
# Configuración de Base de Datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=root
DB_NAME=unifood_db

# Puerto del Microservicio
PORT=6000

# Backend Principal (para CORS)
BACKEND_URL=http://localhost:3000
```

### 3️⃣ Iniciar el Microservicio

```bash
npm run start:dev
```

El servicio se ejecutará en **http://localhost:6000**

---

## ✅ Verificación Rápida

### Health Check

```bash
curl http://localhost:6000/chatbot/health
```

**Respuesta esperada:**

```json
{
  "estado": "operativo",
  "microservicio": "unifood-chatbot",
  "version": "1.0.0",
  "mensaje": "✅ Microservicio de Chatbot funcionando correctamente"
}
```

---

## 🧪 Pruebas Básicas

### Prueba 1: Ranking de Ventas

```bash
curl http://localhost:6000/chatbot/rankings/ventas
```

### Prueba 2: Consulta en Lenguaje Natural

```bash
curl -X POST http://localhost:6000/chatbot/consulta \
  -H "Content-Type: application/json" \
  -d "{\"mensaje\": \"cuales son los productos mas vendidos\"}"
```

### Prueba 3: Recomendaciones para Usuario

```bash
curl http://localhost:6000/chatbot/recomendaciones/1
```

### Prueba 4: Ranking de Calificaciones

```bash
curl http://localhost:6000/chatbot/rankings/calificaciones
```

### Prueba 5: Estadísticas Generales

```bash
curl http://localhost:6000/chatbot/estadisticas
```

---

## 📡 Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/chatbot/health` | Health check del servicio |
| `POST` | `/chatbot/consulta` | Procesa mensajes en lenguaje natural |
| `GET` | `/chatbot/rankings/:tipo` | Obtiene rankings (ventas o calificaciones) |
| `GET` | `/chatbot/recomendaciones/:userId` | Genera recomendaciones personalizadas |
| `GET` | `/chatbot/estadisticas` | Obtiene estadísticas generales |

---

## 💬 Ejemplos de Consultas en Lenguaje Natural

El chatbot entiende consultas como:

- ✅ "¿Cuáles son los productos más vendidos?"
- ✅ "Muéstrame los 5 mejor calificados"
- ✅ "Dame recomendaciones personalizadas"
- ✅ "¿Qué me recomiendas?"
- ✅ "Top 10 ventas"
- ✅ "Productos más populares"
- ✅ "Mejores productos"

---

## 🔧 Comandos NPM

| Comando | Descripción |
|---------|-------------|
| `npm install` | Instala dependencias |
| `npm run start:dev` | Inicia en modo desarrollo (hot-reload) |
| `npm run build` | Compila el proyecto |
| `npm run start:prod` | Inicia en modo producción |
| `npm run lint` | Ejecuta linter |
| `npm test` | Ejecuta pruebas unitarias |

---

## 🐛 Troubleshooting

### ❌ Error: "No se pudo conectar a la base de datos"

**Causa:** PostgreSQL no está ejecutándose o las credenciales son incorrectas.

**Solución:**
1. Verifica que PostgreSQL esté corriendo
2. Confirma las credenciales en `.env`
3. Prueba la conexión manualmente:

```bash
psql -h localhost -U postgres -d unifood_db
```

### ❌ Error: "Puerto 6000 ya está en uso"

**Solución:** Cambia el puerto en `.env`:

```env
PORT=6001
```

### ❌ Error: "Cannot find module 'dotenv'"

**Solución:** Instala las dependencias:

```bash
npm install
```

---

## 📊 Arquitectura del Microservicio

```
┌─────────────────────────────────────────┐
│         Cliente (Frontend/cURL)          │
└────────────────┬────────────────────────┘
                 │ HTTP REST
                 ▼
┌─────────────────────────────────────────┐
│      ChatbotController (REST API)       │
│  - POST /consulta                        │
│  - GET  /rankings/:tipo                  │
│  - GET  /recomendaciones/:userId         │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         ChatbotService (NLP)             │
│  - Detecta intención del usuario         │
│  - Enruta a servicio correspondiente     │
└────┬────────────────┬───────────────────┘
     │                │
     ▼                ▼
┌──────────┐    ┌────────────────┐
│Analytics │    │Recomendaciones │
│Service   │    │Service         │
└────┬─────┘    └────┬───────────┘
     │               │
     └───────┬───────┘
             ▼
    ┌─────────────────┐
    │DatabaseService  │
    │(Acceso a datos) │
    └────────┬────────┘
             │
             ▼
      ┌──────────────┐
      │  PostgreSQL  │
      │ (unifood_db) │
      └──────────────┘
```

---

## 🎯 Funcionalidades Implementadas

### ✅ Procesamiento de Lenguaje Natural
- Detección de intenciones en español
- Extracción de parámetros (límites, tipos)
- Respuestas contextuales

### ✅ Rankings Analíticos
- **Ranking por Ventas:** Top productos más vendidos
- **Ranking por Calificaciones:** Top productos mejor valorados
- Cálculo en tiempo real desde la base de datos

### ✅ Sistema de Recomendaciones
- **Algoritmo híbrido:** Combina preferencias del usuario + popularidad
- **Análisis de historial:** Extrae categorías preferidas
- **Filtrado inteligente:** Excluye productos ya comprados

### ✅ Estadísticas Generales
- Métricas agregadas del sistema
- Top 5 de ventas y calificaciones
- Actualización en tiempo real

---

## 📈 Rendimiento Esperado

- **Ranking de ventas:** 30-60ms
- **Recomendaciones personalizadas:** 60-100ms
- **Procesamiento NLP:** <10ms
- **Health check:** <5ms

---

## 🔐 Seguridad

### ✅ Implementado
- Validación de inputs
- Queries parametrizadas (prevención SQL injection)
- CORS configurado
- Manejo de errores robusto

### ⚠️ Recomendado para Producción
- Implementar autenticación JWT
- Rate limiting (ej: 100 req/min por IP)
- Logging estructurado
- Monitoreo con métricas

---

## 📚 Siguiente Paso

Para integrar este microservicio con el frontend Angular, consulta la documentación de integración en el backend principal.

**Endpoint de integración sugerido:**

```typescript
// En el backend principal (puerto 3000)
async consultarChatbot(mensaje: string, userId: number) {
  const response = await fetch('http://localhost:6000/chatbot/consulta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mensaje, userId })
  });
  return response.json();
}
```

---

## 💡 Tips

1. **Desarrollo:** Usa `npm run start:dev` para hot-reload automático
2. **Logs:** Los logs se muestran en la consola con emojis para fácil identificación
3. **Testing:** Usa cURL o Postman para probar endpoints
4. **Integración:** El microservicio es completamente independiente y stateless

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs en la consola
2. Verifica la conexión a PostgreSQL
3. Confirma que el puerto 6000 esté disponible
4. Consulta el README.md completo

---

**¡Listo para usar! 🎉**

