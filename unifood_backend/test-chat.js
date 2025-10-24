// Cargar variables de entorno desde .env
require('dotenv').config();

const io = require('socket.io-client');

// Configuración del cliente de prueba
const socket = io('http://localhost:3000/chat', {
  auth: {
    userId: 1
  }
});

socket.on('connect', () => {
  console.log('✅ Conectado al chat');
  
  // Enviar mensaje de prueba
  socket.emit('send_message', {
    mensaje: 'Hola, quiero algo saludable para comer',
    sessionId: 'test_session_' + Date.now()
  });
});

socket.on('message_response', (response) => {
  console.log('📨 Respuesta recibida:');
  console.log('Respuesta:', response.respuesta);
  console.log('Recomendaciones:', response.recomendaciones?.length || 0);
  console.log('Modelo usado:', response.metadata?.model || 'unknown');
  console.log('Es fallback:', response.metadata?.isFallback || false);
  console.log('---');
});

socket.on('recommendations', (data) => {
  console.log('🛍️ Recomendaciones:');
  data.recomendaciones.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec.nombre} - $${rec.precio}`);
  });
  console.log('---');
});

socket.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

socket.on('disconnect', () => {
  console.log('🔌 Desconectado del chat');
});

// Manejar cierre del proceso
process.on('SIGINT', () => {
  console.log('\n👋 Cerrando conexión...');
  socket.disconnect();
  process.exit(0);
});
