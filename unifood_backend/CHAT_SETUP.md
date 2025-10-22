# Configuración del Chat con Gemini AI

## Problema Identificado

El chat estaba fallando porque los modelos de Gemini configurados ya no están disponibles en la API actual. Los errores mostraban:

```
[404 Not Found] models/gemini-pro is not found for API version v1beta
```

## Solución Implementada

### 1. Modelos Actualizados
Se actualizaron los modelos de Gemini según la documentación oficial:

- ✅ `gemini-2.5-flash` (modelo principal - equilibrado y rápido)
- ✅ `gemini-2.5-pro` (modelo alternativo - más potente para razonamiento complejo)
- ✅ `gemini-2.5-flash-lite` (modelo de respaldo - más rápido y rentable)
- ✅ `gemini-1.5-flash` (modelo legacy)
- ✅ `gemini-1.5-pro` (modelo legacy)

### 2. Mejoras en el Manejo de Errores
- Mejor logging para diagnosticar problemas
- Fallback automático a respuestas predefinidas cuando Gemini no está disponible
- Manejo robusto de errores en WebSocket

### 3. Configuración Requerida

#### Variables de Entorno
Crea un archivo `.env` en el directorio `unifood_backend/` con:

```env
# Configuración de Gemini AI
GEMINI_API_KEY=tu_api_key_de_gemini_aqui
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TEMPERATURE=0.4
CHAT_RECOMMENDATION_LIMIT=3

# Modelos disponibles:
# - gemini-2.5-flash (recomendado - equilibrado y rápido)
# - gemini-2.5-pro (más potente para razonamiento complejo)
# - gemini-2.5-flash-lite (más rápido y rentable)

# Otras configuraciones...
DATABASE_URL="postgresql://usuario:password@localhost:5432/unifood"
JWT_SECRET=tu_jwt_secret_aqui
```

#### Obtener API Key de Gemini
1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea una nueva API key
3. Copia la key y pégala en tu archivo `.env`

### 4. Probar el Chat

#### Opción 1: Script de Prueba
```bash
cd unifood_backend
node test-chat.js
```

#### Opción 2: Desde el Frontend
1. Asegúrate de que el backend esté corriendo en `http://localhost:3000`
2. Conecta el frontend Angular al WebSocket en `ws://localhost:3000/chat`

### 5. Funcionalidades del Chat

#### WebSocket Events
- `send_message`: Enviar mensaje al chat
- `join_session`: Unirse a una sesión específica
- `leave_session`: Abandonar una sesión
- `typing`: Indicar que el usuario está escribiendo

#### Respuestas del Servidor
- `message_response`: Respuesta del asistente
- `recommendations`: Recomendaciones de productos
- `error`: Errores del sistema

### 6. Modo Fallback

Si Gemini no está disponible, el sistema automáticamente:
- Usa respuestas predefinidas
- Recomienda productos básicos del catálogo
- Mantiene la funcionalidad del chat

### 7. Logs y Diagnóstico

El sistema ahora incluye logs detallados:
- Inicialización de modelos
- Cambios de modelo automáticos
- Uso de modo fallback
- Errores específicos de API

## Estado Actual

✅ Modelos de Gemini actualizados a versión 2.5 oficial
✅ Manejo de errores mejorado
✅ Modo fallback implementado
✅ Logging detallado
✅ WebSocket robusto
✅ Compatibilidad con modelos legacy

El chat ahora debería funcionar correctamente con los modelos oficiales más recientes de Gemini.

## Pruebas Adicionales

### Probar Modelos Disponibles
```bash
# Configurar tu API key
export GEMINI_API_KEY=tu_api_key_aqui

# Probar todos los modelos
node test-gemini-models.js
```

### Probar Chat Completo
```bash
# Probar funcionalidad del chat
node test-chat.js
```
