import { Pool } from 'pg';

/**
 * Configuración de conexión a PostgreSQL
 * Utiliza variables de entorno para credenciales
 * Soporta conexiones locales y en la nube (Render)
 */
export const databaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'unifood_db',
  max: 20, // Máximo de conexiones en el pool
  idleTimeoutMillis: 30000, // Tiempo de inactividad antes de cerrar conexión
  connectionTimeoutMillis: 10000, // Timeout de conexión (aumentado para Render)
  // SSL requerido para conexiones a Render y otros servicios en la nube
  ssl: process.env.DB_HOST && !process.env.DB_HOST.includes('localhost') 
    ? { rejectUnauthorized: false } 
    : false,
};

/**
 * Pool de conexiones compartido para toda la aplicación
 */
export const pool = new Pool(databaseConfig);

/**
 * Manejo de errores del pool
 */
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
  process.exit(-1);
});

/**
 * Función helper para verificar conexión
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    console.log('📋 Intentando conectar con:');
    console.log(`   Host: ${databaseConfig.host}`);
    console.log(`   Puerto: ${databaseConfig.port}`);
    console.log(`   Usuario: ${databaseConfig.user}`);
    console.log(`   Base de datos: ${databaseConfig.database}`);
    console.log(`   SSL: ${databaseConfig.ssl ? 'Habilitado' : 'Deshabilitado'}`);
    
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Conexión a PostgreSQL exitosa:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('\n❌ Error al conectar con PostgreSQL:');
    console.error(`   Mensaje: ${error.message}`);
    console.error(`   Código: ${error.code || 'N/A'}`);
    console.error('\n💡 Verifica:');
    console.error('   1. Que el archivo .env esté en: unifood_micro_chatbot/.env');
    console.error('   2. Que las credenciales sean correctas');
    console.error('   3. Que la base de datos esté accesible desde tu red');
    console.error('   4. Que Render permita conexiones externas (whitelist IP)\n');
    return false;
  }
}

