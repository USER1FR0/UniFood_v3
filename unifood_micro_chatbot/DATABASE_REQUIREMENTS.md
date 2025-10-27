# 📊 Requisitos de Base de Datos - Microservicio Chatbot

Este documento detalla los requisitos de base de datos que el microservicio de chatbot necesita para funcionar correctamente.

## 🗄️ Base de Datos

- **Nombre:** `unifood_db`
- **Motor:** PostgreSQL 14+
- **Codificación:** UTF8

## 📋 Tablas Requeridas

El microservicio consume datos de las siguientes tablas existentes del backend principal:

### 1. Tabla `productos`

```sql
CREATE TABLE productos (
  id_producto SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio NUMERIC(10, 2) NOT NULL,
  imagen_url VARCHAR(500),
  categoria VARCHAR(100) NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columnas utilizadas por el chatbot:**
- `id_producto`: Identificador único
- `nombre`: Nombre del producto
- `descripcion`: Descripción del producto
- `precio`: Precio del producto
- `imagen_url`: URL de la imagen
- `categoria`: Categoría (bebidas, snacks, comidas, postres, etc.)
- `activo`: Estado del producto (solo se muestran productos activos)

---

### 2. Tabla `pedidos`

```sql
CREATE TABLE pedidos (
  id_pedido SERIAL PRIMARY KEY,
  id_usuario INTEGER NOT NULL,
  fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estado VARCHAR(50) NOT NULL,
  total NUMERIC(10, 2),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
```

**Columnas utilizadas por el chatbot:**
- `id_pedido`: Identificador del pedido
- `id_usuario`: ID del usuario que realizó el pedido
- `fecha_pedido`: Fecha de creación del pedido

---

### 3. Tabla `detalles_pedido`

```sql
CREATE TABLE detalles_pedido (
  id_detalle SERIAL PRIMARY KEY,
  id_pedido INTEGER NOT NULL,
  id_producto INTEGER NOT NULL,
  cantidad INTEGER NOT NULL,
  precio_unitario NUMERIC(10, 2) NOT NULL,
  FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
  FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);
```

**Columnas utilizadas por el chatbot:**
- `id_detalle`: Identificador único del detalle
- `id_pedido`: Relación con el pedido
- `id_producto`: Relación con el producto vendido
- `cantidad`: Cantidad de unidades vendidas

**Uso:** Calcular rankings de ventas y generar recomendaciones basadas en historial de compras.

---

### 4. Tabla `resenas`

```sql
CREATE TABLE resenas (
  id_resena SERIAL PRIMARY KEY,
  id_producto INTEGER NOT NULL,
  id_usuario INTEGER NOT NULL,
  calificacion INTEGER NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  comentario TEXT,
  fecha_resena TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
```

**Columnas utilizadas por el chatbot:**
- `id_resena`: Identificador único de la reseña
- `id_producto`: Producto reseñado
- `calificacion`: Calificación de 1 a 5 estrellas

**Uso:** Calcular promedios de calificación y rankings de mejor valorados.

---

### 5. Tabla `usuarios`

```sql
CREATE TABLE usuarios (
  id_usuario SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  rol VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Uso:** Referencia para validar existencia de usuarios en recomendaciones personalizadas.

---

## 🔍 Queries Principales Utilizadas

### Query 1: Ranking de Ventas

```sql
SELECT 
  p.id_producto,
  p.nombre,
  p.descripcion,
  p.precio,
  p.imagen_url,
  p.categoria,
  COUNT(dp.id_detalle) as total_ventas,
  COALESCE(AVG(r.calificacion), 0)::numeric(3,2) as promedio_calificacion,
  COUNT(DISTINCT r.id_resena) as total_resenas
FROM productos p
LEFT JOIN detalles_pedido dp ON p.id_producto = dp.id_producto
LEFT JOIN resenas r ON p.id_producto = r.id_producto
WHERE p.activo = true
GROUP BY p.id_producto
ORDER BY total_ventas DESC, promedio_calificacion DESC
LIMIT 10;
```

---

### Query 2: Ranking de Calificaciones

```sql
SELECT 
  p.id_producto,
  p.nombre,
  p.descripcion,
  p.precio,
  p.imagen_url,
  p.categoria,
  COALESCE(AVG(r.calificacion), 0)::numeric(3,2) as promedio_calificacion,
  COUNT(r.id_resena) as total_resenas,
  COUNT(DISTINCT dp.id_detalle) as total_ventas
FROM productos p
LEFT JOIN resenas r ON p.id_producto = r.id_producto
LEFT JOIN detalles_pedido dp ON p.id_producto = dp.id_producto
WHERE p.activo = true
GROUP BY p.id_producto
HAVING COUNT(r.id_resena) >= 3
ORDER BY promedio_calificacion DESC, total_resenas DESC
LIMIT 10;
```

**Nota:** Solo se incluyen productos con al menos 3 reseñas para garantizar que el promedio sea representativo.

---

### Query 3: Historial de Usuario

```sql
SELECT 
  p.id_producto,
  p.nombre,
  p.categoria,
  p.precio,
  COUNT(dp.id_detalle) as veces_comprado,
  MAX(ped.fecha_pedido) as ultima_compra
FROM productos p
INNER JOIN detalles_pedido dp ON p.id_producto = dp.id_producto
INNER JOIN pedidos ped ON dp.id_pedido = ped.id_pedido
WHERE ped.id_usuario = $1
GROUP BY p.id_producto
ORDER BY veces_comprado DESC, ultima_compra DESC;
```

---

### Query 4: Productos Populares por Categoría

```sql
SELECT 
  p.id_producto,
  p.nombre,
  p.descripcion,
  p.precio,
  p.imagen_url,
  p.categoria,
  COUNT(dp.id_detalle) as total_ventas,
  COALESCE(AVG(r.calificacion), 0)::numeric(3,2) as promedio_calificacion
FROM productos p
LEFT JOIN detalles_pedido dp ON p.id_producto = dp.id_producto
LEFT JOIN resenas r ON p.id_producto = r.id_producto
WHERE p.activo = true
  AND p.categoria = ANY($1)
  AND p.id_producto != ALL($3)
GROUP BY p.id_producto
ORDER BY total_ventas DESC, promedio_calificacion DESC
LIMIT $2;
```

---

## 📝 Datos de Prueba Mínimos

Para probar el microservicio, necesitas al menos:

### Productos (mínimo 10)

```sql
INSERT INTO productos (nombre, descripcion, precio, categoria, imagen_url, activo) VALUES
('Café Americano', 'Café negro tradicional', 2.50, 'bebidas', '/images/cafe.jpg', true),
('Empanada de Carne', 'Empanada casera de carne', 3.00, 'snacks', '/images/empanada.jpg', true),
('Jugo Natural', 'Jugo de frutas frescas', 3.50, 'bebidas', '/images/jugo.jpg', true),
('Sandwich Mixto', 'Pan con jamón y queso', 4.50, 'comidas', '/images/sandwich.jpg', true),
('Brownie', 'Brownie de chocolate', 2.00, 'postres', '/images/brownie.jpg', true),
('Té Helado', 'Té frío con limón', 2.00, 'bebidas', '/images/te.jpg', true),
('Pizza Personal', 'Pizza individual', 5.50, 'comidas', '/images/pizza.jpg', true),
('Galletas', 'Paquete de galletas', 1.50, 'snacks', '/images/galletas.jpg', true),
('Ensalada', 'Ensalada mixta fresca', 4.00, 'comidas', '/images/ensalada.jpg', true),
('Helado', 'Helado artesanal', 3.00, 'postres', '/images/helado.jpg', true);
```

### Usuarios (mínimo 2)

```sql
INSERT INTO usuarios (nombre, email, rol) VALUES
('Juan Pérez', 'juan@test.com', 'estudiante'),
('María García', 'maria@test.com', 'estudiante');
```

### Pedidos y Detalles

```sql
-- Pedido 1
INSERT INTO pedidos (id_usuario, estado, total) VALUES (1, 'completado', 6.00);
INSERT INTO detalles_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES 
(1, 1, 2, 2.50),
(1, 3, 1, 3.50);

-- Pedido 2
INSERT INTO pedidos (id_usuario, estado, total) VALUES (1, 'completado', 7.50);
INSERT INTO detalles_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES 
(2, 1, 1, 2.50),
(2, 4, 1, 4.50);
```

### Reseñas

```sql
INSERT INTO resenas (id_producto, id_usuario, calificacion, comentario) VALUES
(1, 1, 5, 'Excelente café'),
(1, 2, 4, 'Muy bueno'),
(2, 1, 5, 'Delicioso'),
(3, 2, 4, 'Rico y fresco'),
(4, 1, 5, 'Muy rico');
```

---

## ✅ Verificación de Requisitos

Ejecuta estos queries para verificar que tienes los datos mínimos:

```sql
-- Verificar productos activos
SELECT COUNT(*) as total_productos FROM productos WHERE activo = true;
-- Debe retornar al menos 5

-- Verificar pedidos con detalles
SELECT COUNT(*) as total_pedidos FROM pedidos;
-- Debe retornar al menos 1

-- Verificar detalles de pedidos
SELECT COUNT(*) as total_detalles FROM detalles_pedido;
-- Debe retornar al menos 1

-- Verificar reseñas
SELECT COUNT(*) as total_resenas FROM resenas;
-- Debe retornar al menos 1

-- Verificar usuarios
SELECT COUNT(*) as total_usuarios FROM usuarios;
-- Debe retornar al menos 1
```

---

## 🔐 Permisos Necesarios

El usuario de base de datos configurado en `.env` necesita los siguientes permisos:

```sql
GRANT SELECT ON productos TO tu_usuario;
GRANT SELECT ON pedidos TO tu_usuario;
GRANT SELECT ON detalles_pedido TO tu_usuario;
GRANT SELECT ON resenas TO tu_usuario;
GRANT SELECT ON usuarios TO tu_usuario;
```

**Nota:** El microservicio solo realiza operaciones de **lectura (SELECT)**, no modifica datos.

---

## 🚨 Troubleshooting

### Error: "relation 'productos' does not exist"

**Solución:** La tabla no existe. Verifica que estés conectado a la base de datos correcta y que las tablas estén creadas.

### Error: "column 'activo' does not exist"

**Solución:** La estructura de tu tabla productos es diferente. Ajusta el query en `database.service.ts` o agrega la columna:

```sql
ALTER TABLE productos ADD COLUMN activo BOOLEAN DEFAULT true;
```

### No se obtienen resultados en los rankings

**Solución:** Asegúrate de tener datos de prueba en las tablas (pedidos, detalles_pedido, reseñas).

---

## 📞 Contacto

Si tienes dudas sobre la estructura de la base de datos, consulta el schema completo en `unifood_backend/prisma/schema.prisma`.

