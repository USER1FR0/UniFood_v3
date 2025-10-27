# 🔧 Solución al Error de Conexión PostgreSQL

## ❌ Problema Detectado

El error que viste:

```
❌ Error al conectar con PostgreSQL: la autentificación password falló para el usuario "postgres"
```

Indica que el archivo `.env` **NO se está leyendo correctamente** porque está intentando conectarse con el usuario por defecto `"postgres"` en lugar de tu usuario de Render `"linux"`.

## ✅ Solución en 3 Pasos

### 📍 Paso 1: Crear el archivo `.env` en la ubicación correcta

**IMPORTANTE:** El archivo debe estar en `unifood_micro_chatbot/.env`, NO en la raíz del proyecto.

#### En Windows (usando el explorador de archivos):

1. Navega a la carpeta: `unifood\semana 2\UniFood\unifood_micro_chatbot\`
2. Haz clic derecho → Nuevo → Documento de texto
3. Nómbralo exactamente como `.env` (sin extensión .txt)
4. Si Windows te pregunta, confirma el cambio de nombre

#### Usando la terminal:

```bash
cd "unifood\semana 2\UniFood\unifood_micro_chatbot"
type nul > .env
notepad .env
```

### 📝 Paso 2: Copiar esta configuración EXACTA en el archivo `.env`

```env
# Entorno
NODE_ENV=development

# Puerto del Microservicio de Chatbot
PORT=6000

# Base de datos PostgreSQL en Render
DB_HOST=dpg-d3iruvmmcj7s739g3qt0-a.oregon-postgres.render.com
DB_PORT=5432
DB_USER=linux
DB_PASSWORD=HU4qAMwJfpo0gZJOmoPVmNdY3KVbiHfl
DB_NAME=unifood

# Backend Principal (para CORS)
BACKEND_URL=http://localhost:3000
```

**⚠️ IMPORTANTE:**
- No debe haber espacios antes o después del `=`
- No debe haber comillas en los valores
- Asegúrate de copiar EXACTAMENTE las credenciales

### 🧪 Paso 3: Ejecutar el diagnóstico

Ejecuta el script de diagnóstico para verificar que todo esté correcto:

```bash
cd unifood_micro_chatbot
npm run diagnostico
```

**Deberías ver:**

```
🔍 DIAGNÓSTICO DE CONFIGURACIÓN - Microservicio Chatbot
============================================================

1️⃣ Verificando archivo .env...
   ✅ Archivo .env encontrado en la ubicación correcta

2️⃣ Verificando variables de entorno...
   ✅ DB_HOST: dpg-d3iruvmmcj7s739g3qt0-a.oregon-postgres.render.com
   ✅ DB_PORT: 5432
   ✅ DB_USER: linux
   ✅ DB_PASSWORD: ********************************** (oculto)
   ✅ DB_NAME: unifood
   ✅ PORT: 6000

3️⃣ Verificando configuración del puerto...
   ✅ Puerto configurado: 6000

4️⃣ Verificando tipo de conexión...
   ☁️  Conexión REMOTA (Render) detectada
   ℹ️  SSL: Habilitado automáticamente

5️⃣ Verificando dependencias...
   ✅ node_modules encontrado

6️⃣ Verificando archivos críticos del proyecto...
   ✅ package.json
   ✅ tsconfig.json
   ✅ src/main.ts
   [...]

7️⃣ Probando conexión a PostgreSQL...
   ⏳ Intentando conectar...
   ✅ CONEXIÓN EXITOSA
   🕐 Hora del servidor: 2024-10-26T10:30:00.000Z
   📦 PostgreSQL: PostgreSQL 14.x

8️⃣ Verificando tablas requeridas...
   ✅ Tabla "productos" encontrada
   ✅ Tabla "pedidos" encontrada
   [...]

============================================================
✅ DIAGNÓSTICO COMPLETADO EXITOSAMENTE
============================================================
```

## 🚀 Paso 4: Iniciar el Microservicio

Si el diagnóstico fue exitoso, inicia el servidor:

```bash
npm run start:dev
```

**Deberías ver:**

```
[Nest] Starting Nest application...
🔍 Verificando conexión a PostgreSQL...
📋 Intentando conectar con:
   Host: dpg-d3iruvmmcj7s739g3qt0-a.oregon-postgres.render.com
   Puerto: 5432
   Usuario: linux
   Base de datos: unifood
   SSL: Habilitado
✅ Conexión a PostgreSQL exitosa: 2024-10-26T10:30:00.000Z

============================================================
🤖 MICROSERVICIO DE CHATBOT INTELIGENTE - UNIFOOD
============================================================
✅ Servidor ejecutándose en: http://localhost:6000
📡 Health check: http://localhost:6000/chatbot/health
============================================================
```

## 🧪 Paso 5: Probar el Microservicio

En otra terminal, ejecuta:

```bash
curl http://localhost:6000/chatbot/health
```

**Respuesta esperada:**

```json
{
  "estado": "operativo",
  "microservicio": "unifood-chatbot",
  "version": "1.0.0",
  "timestamp": "2024-10-26T10:30:00.000Z",
  "mensaje": "✅ Microservicio de Chatbot funcionando correctamente"
}
```

---

## 🐛 Si Aún Tienes Problemas

### Problema 1: El archivo `.env` no se lee

**Síntomas:**
- El diagnóstico muestra valores por defecto (postgres, localhost)
- Error de autenticación

**Solución:**
```bash
# Verifica que el archivo existe en la ubicación correcta
cd unifood_micro_chatbot
dir .env        # Windows
ls -la .env     # Linux/Mac

# Si no existe, créalo:
echo. > .env
notepad .env
```

### Problema 2: Error "ENOTFOUND"

**Síntomas:**
```
Error: getaddrinfo ENOTFOUND dpg-d3iruvmmcj7s739g3qt0...
```

**Solución:**
- Verifica tu conexión a internet
- Verifica que el hostname esté correcto (sin espacios)
- Prueba hacer ping: `ping dpg-d3iruvmmcj7s739g3qt0-a.oregon-postgres.render.com`

### Problema 3: Error "timeout expired"

**Síntomas:**
```
Error: timeout expired
```

**Solución:**
- Tu firewall puede estar bloqueando la conexión
- Render puede estar experimentando problemas (verifica: https://status.render.com)
- Tu ISP puede estar bloqueando el puerto 5432

### Problema 4: Tablas no encontradas

**Síntomas:**
- El diagnóstico conecta pero no encuentra tablas

**Solución:**
- Verifica que estés conectándote a la base de datos correcta
- Ejecuta las migraciones del backend principal primero
- Verifica en Render que las tablas existan

---

## 📋 Checklist Final

- [ ] Archivo `.env` creado en `unifood_micro_chatbot/.env`
- [ ] Credenciales copiadas exactamente
- [ ] Puerto configurado como 6000 (no 3000)
- [ ] Diagnóstico ejecutado: `npm run diagnostico`
- [ ] Diagnóstico completado exitosamente
- [ ] Servidor iniciado: `npm run start:dev`
- [ ] Health check responde correctamente

---

## 📞 Documentos de Ayuda

- **`CONFIGURACION_RENDER.md`** - Guía completa para configurar Render
- **`DATABASE_REQUIREMENTS.md`** - Requisitos de base de datos
- **`INICIO_RAPIDO.md`** - Guía de inicio rápido
- **`README.md`** - Documentación completa

---

## 💡 Resumen del Error Original

Tu archivo `.env` original tenía estos problemas:

1. ❌ **Ubicación incorrecta:** Estaba en la raíz del proyecto, no en `unifood_micro_chatbot/`
2. ❌ **Puerto duplicado:** Tenías `PORT=3000` y luego `PORT=6000`
3. ⚠️ **Faltaba SSL:** No estaba configurado (ya lo agregué automáticamente al código)

Con los cambios que hice al código, ahora:

- ✅ El código busca el `.env` en la ubicación correcta del microservicio
- ✅ SSL se habilita automáticamente para conexiones remotas
- ✅ Mensajes de error más descriptivos
- ✅ Script de diagnóstico para verificar configuración

---

**¡Todo debería funcionar ahora! 🎉**

Si sigues teniendo problemas después de seguir estos pasos, ejecuta el diagnóstico y comparte la salida completa.

