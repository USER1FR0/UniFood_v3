-- ============================================
-- MIGRACIÓN: Módulo de Recomendaciones
-- Fecha: 2025-10-24
-- Descripción: Crea nuevas tablas para el sistema de recomendaciones
--              SIN MODIFICAR tablas existentes
-- ============================================

-- 1. Tabla principal de recomendaciones
CREATE TABLE IF NOT EXISTS recomendacion (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL,
    tipo_recomendacion VARCHAR(50) NOT NULL CHECK (tipo_recomendacion IN ('mas_vendido', 'mejor_calificado', 'oferta', 'manual')),
    prioridad INT DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    fecha_inicio TIMESTAMP(6),
    fecha_fin TIMESTAMP(6),
    supervisor_id INT,
    metadata JSONB,
    created_at TIMESTAMP(6) DEFAULT now(),
    updated_at TIMESTAMP(6) DEFAULT now(),
    
    -- Foreign keys (sin modificar tablas existentes)
    CONSTRAINT fk_recomendacion_producto FOREIGN KEY (producto_id) 
        REFERENCES producto(id) ON DELETE CASCADE,
    CONSTRAINT fk_recomendacion_supervisor FOREIGN KEY (supervisor_id) 
        REFERENCES supervisor(id) ON DELETE SET NULL
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_recomendacion_activo_prioridad 
    ON recomendacion(activo, prioridad DESC);
    
CREATE INDEX IF NOT EXISTS idx_recomendacion_tipo 
    ON recomendacion(tipo_recomendacion, activo);

CREATE INDEX IF NOT EXISTS idx_recomendacion_producto 
    ON recomendacion(producto_id);

-- 2. Tabla de métricas de productos (cálculos automáticos)
CREATE TABLE IF NOT EXISTS metrica_producto (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL UNIQUE,
    total_ventas INT DEFAULT 0,
    calificacion_promedio DECIMAL(3,2) DEFAULT 0.00,
    total_calificaciones INT DEFAULT 0,
    ultima_actualizacion TIMESTAMP(6) DEFAULT now(),
    
    CONSTRAINT fk_metrica_producto FOREIGN KEY (producto_id) 
        REFERENCES producto(id) ON DELETE CASCADE
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_metrica_total_ventas 
    ON metrica_producto(total_ventas DESC);
    
CREATE INDEX IF NOT EXISTS idx_metrica_calificacion 
    ON metrica_producto(calificacion_promedio DESC);

-- 3. Tabla de interacciones con recomendaciones (analytics)
CREATE TABLE IF NOT EXISTS recomendacion_interaccion (
    id SERIAL PRIMARY KEY,
    recomendacion_id INT NOT NULL,
    cliente_id INT,
    tipo_interaccion VARCHAR(50) CHECK (tipo_interaccion IN ('vista', 'click', 'agregado_carrito', 'comprado')),
    fecha TIMESTAMP(6) DEFAULT now(),
    metadata JSONB,
    
    CONSTRAINT fk_interaccion_recomendacion FOREIGN KEY (recomendacion_id) 
        REFERENCES recomendacion(id) ON DELETE CASCADE,
    CONSTRAINT fk_interaccion_cliente FOREIGN KEY (cliente_id) 
        REFERENCES cliente(id) ON DELETE SET NULL
);

-- Índices para analytics
CREATE INDEX IF NOT EXISTS idx_interaccion_recomendacion 
    ON recomendacion_interaccion(recomendacion_id);
    
CREATE INDEX IF NOT EXISTS idx_interaccion_fecha 
    ON recomendacion_interaccion(fecha DESC);
    
CREATE INDEX IF NOT EXISTS idx_interaccion_cliente 
    ON recomendacion_interaccion(cliente_id);

-- ============================================
-- DATOS INICIALES (Opcional)
-- ============================================

-- Comentar esta sección si no quieres datos de prueba

-- Insertar métricas iniciales para productos existentes
INSERT INTO metrica_producto (producto_id, total_ventas, calificacion_promedio, total_calificaciones)
SELECT 
    p.id,
    COALESCE(COUNT(DISTINCT pp.pedido_id), 0) as total_ventas,
    COALESCE(AVG(pc.resena), 0.00) as calificacion_promedio,
    COALESCE(COUNT(pc.id), 0) as total_calificaciones
FROM producto p
LEFT JOIN pedido_producto pp ON p.id = pp.producto_id
LEFT JOIN producto_calificacion pc ON p.id = pc.producto_id
GROUP BY p.id
ON CONFLICT (producto_id) DO NOTHING;

-- ============================================
-- FUNCIÓN PARA ACTUALIZAR MÉTRICAS
-- ============================================

CREATE OR REPLACE FUNCTION actualizar_metricas_producto(p_producto_id INT)
RETURNS void AS $$
BEGIN
    INSERT INTO metrica_producto (
        producto_id, 
        total_ventas, 
        calificacion_promedio, 
        total_calificaciones,
        ultima_actualizacion
    )
    SELECT 
        p.id,
        COALESCE(COUNT(DISTINCT pp.pedido_id), 0),
        COALESCE(AVG(pc.resena), 0.00),
        COALESCE(COUNT(pc.id), 0),
        now()
    FROM producto p
    LEFT JOIN pedido_producto pp ON p.id = pp.producto_id
    LEFT JOIN producto_calificacion pc ON p.id = pc.producto_id
    WHERE p.id = p_producto_id
    GROUP BY p.id
    ON CONFLICT (producto_id) 
    DO UPDATE SET
        total_ventas = EXCLUDED.total_ventas,
        calificacion_promedio = EXCLUDED.calificacion_promedio,
        total_calificaciones = EXCLUDED.total_calificaciones,
        ultima_actualizacion = now();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER PARA ACTUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION actualizar_timestamp_recomendacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_recomendacion
    BEFORE UPDATE ON recomendacion
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_recomendacion();

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que las tablas se crearon correctamente
DO $$
BEGIN
    RAISE NOTICE '✓ Verificando tablas creadas...';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recomendacion') THEN
        RAISE NOTICE '  ✓ Tabla recomendacion creada';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'metrica_producto') THEN
        RAISE NOTICE '  ✓ Tabla metrica_producto creada';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recomendacion_interaccion') THEN
        RAISE NOTICE '  ✓ Tabla recomendacion_interaccion creada';
    END IF;
    
    RAISE NOTICE '✓ Migración completada exitosamente';
END $$;

