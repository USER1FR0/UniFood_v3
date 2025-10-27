import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DB_URI,
  // 🔥 PROBAR SIN SSL PRIMERO
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de BD:', err);
  process.exit(-1);
});

// Probar conexión
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error al conectar con la BD:', err.message);
  } else {
    console.log('✅ Microservicio de Pagos conectado a la BD');
  }
});