# 🌐 Configuración para PostgreSQL en Render

Esta guía te ayudará a configurar correctamente el microservicio para conectarse a una base de datos PostgreSQL alojada en Render.

## 🔧 Paso 1: Crear el archivo `.env` en la ubicación correcta

**IMPORTANTE:** El archivo `.env` debe estar en la raíz del microservicio, NO en la raíz del proyecto.

```
✅ CORRECTO: unifood_micro_chatbot/.env
❌ INCORRECTO: unifood/semana 2/UniFood/.env
```

### Contenido del archivo `.env`:

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

## 🔐 Paso 2: Verificar Configuración de Render

### 2.1. Permitir Conexiones Externas

Por defecto, Render permite conexiones desde cualquier IP. Sin embargo, verifica en tu dashboard de Render:

1. Ve a tu servicio PostgreSQL en Render
2. Revisa la sección "Connections"
3. Asegúrate de que "External Connections" esté habilitado

### 2.2. Obtener Credenciales Correctas

En el dashboard de Render, busca:

- **External Database URL** (la URL completa)
- **Hostname:** `dpg-xxxxx-a.oregon-postgres.render.com`
- **Port:** `5432`
- **Database:** Nombre de tu base de datos
- **Username:** Usuario de la base de datos
- **Password:** Contraseña (haz clic en "Show" para verla)

## ✅ Paso 3: Verificar la Conexión

### 3.1. Desde tu Computadora con `psql`

```bash
psql "postgresql://linux:HU4qAMwJfpo0gZJOmoPVmNdY3KVbiHfl@dpg-d3iruvmmcj7s739g3qt0-a.oregon-postgres.render.com/unifood?sslmode=require"
```

Si la conexión es exitosa, verás el prompt de PostgreSQL:

```
unifood=>
```

### 3.2. Desde el Microservicio

```bash
cd unifood_micro_chatbot
npm run start:dev
```

Deberías ver:

```
🔍 Verificando conexión a PostgreSQL...
📋 Intentando conectar con:
   Host: dpg-d3iruvmmcj7s739g3qt0-a.oregon-postgres.render.com
   Puerto: 5432
   Usuario: linux
   Base de datos: unifood
   SSL: Habilitado
✅ Conexión a PostgreSQL exitosa: 2024-10-26T10:30:00.000Z
```

## 🐛 Troubleshooting

### Error: "la autentificación password falló para el usuario postgres"

**Causa:** El archivo `.env` no se está leyendo correctamente.

**Solución:**

1. Verifica que el archivo `.env` esté en `unifood_micro_chatbot/.env`
2. Verifica que no haya espacios antes/después de los valores
3. Reinicia el servidor después de modificar `.env`

### Error: "timeout expired"

**Causa:** No se puede alcanzar el servidor de Render.

**Solución:**

1. Verifica tu conexión a internet
2. Verifica que el hostname sea correcto
3. Verifica que Render esté operativo: https://status.render.com

### Error: "database 'unifood_db' does not exist"

**Causa:** El nombre de la base de datos es incorrecto.

**Solución:**

En Render, el nombre de la base de datos puede ser diferente. Usa el nombre exacto que aparece en el dashboard de Render:

```env
DB_NAME=unifood  # NO unifood_db
```

### Error: "no pg_hba.conf entry"

**Causa:** Falta SSL en la conexión.

**Solución:**

El código ya incluye soporte SSL automático. Verifica que tu `database.config.ts` tenga:

```typescript
ssl: process.env.DB_HOST && !process.env.DB_HOST.includes('localhost') 
  ? { rejectUnauthorized: false } 
  : false,
```

## 📊 Verificar Datos en la Base de Datos

Una vez conectado, verifica que las tablas necesarias existan:

```sql
-- Conectarse a la base de datos
psql "postgresql://linux:HU4qAMwJfpo0gZJOmoPVmNdY3KVbiHfl@dpg-d3iruvmmcj7s739g3qt0-a.oregon-postgres.render.com/unifood?sslmode=require"

-- Listar tablas
\dt

-- Debería mostrar:
--  public | productos
--  public | pedidos
--  public | detalles_pedido
--  public | resenas
--  public | usuarios

-- Verificar productos
SELECT COUNT(*) FROM productos;

-- Verificar pedidos
SELECT COUNT(*) FROM pedidos;
```

## 🚀 Iniciar el Microservicio

Una vez verificado todo:

```bash
cd unifood_micro_chatbot

# Instalar dependencias (si no lo hiciste antes)
npm install

# Iniciar en modo desarrollo
npm run start:dev
```

## 📝 Checklist de Verificación

- [ ] Archivo `.env` creado en `unifood_micro_chatbot/.env`
- [ ] Credenciales copiadas exactamente desde Render
- [ ] Nombre de la base de datos correcto (sin `_db` al final)
- [ ] Puerto es 6000 (no 3000)
- [ ] La base de datos tiene las tablas necesarias
- [ ] El servidor inicia sin errores
- [ ] El health check responde: `curl http://localhost:6000/chatbot/health`

## 🌐 Diferencias entre Local y Render

| Aspecto | Local | Render |
|---------|-------|--------|
| Host | `localhost` | `dpg-xxxxx.oregon-postgres.render.com` |
| User | `postgres` | `linux` (u otro) |
| Password | Tu password local | Password de Render |
| Database | `unifood_db` | `unifood` |
| SSL | No requerido | **Requerido** |
| Port | `5432` | `5432` |

## 💡 Consejos

1. **No compartas tus credenciales:** El archivo `.env` está en `.gitignore` para proteger tus credenciales.

2. **Usa variables de entorno en producción:** Para deploy en producción, configura las variables de entorno en el servicio de hosting, no uses archivos `.env`.

3. **Render Free Tier:** Si usas el tier gratuito de Render, la base de datos se suspende después de 90 días de inactividad.

4. **Backups:** Render hace backups automáticos en tiers de pago. Para el tier gratuito, haz backups manualmente.

## 📞 Recursos Adicionales

- **Documentación Render PostgreSQL:** https://render.com/docs/databases
- **Connection Troubleshooting:** https://render.com/docs/troubleshooting-database-connections
- **Status de Render:** https://status.render.com

---

**¡Tu microservicio debería conectarse exitosamente ahora! 🎉**

