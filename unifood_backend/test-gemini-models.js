// Cargar variables de entorno desde .env
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configuración - Reemplaza con tu API key
const API_KEY = process.env.GEMINI_API_KEY || 'tu_api_key_aqui';

// Modelos oficiales según la documentación
const models = [
  'gemini-2.5-flash',
  'gemini-2.5-pro', 
  'gemini-2.5-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

async function testModel(modelName) {
  try {
    console.log(`\n🧪 Probando modelo: ${modelName}`);
    
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const prompt = "Responde en JSON con estructura: {respuesta: 'Hola, soy un asistente de comida', recomendaciones: []}";
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json'
      }
    });
    
    const response = await result.response;
    const text = response.text();
    
    console.log(`✅ ${modelName}: FUNCIONA`);
    console.log(`   Respuesta: ${text.substring(0, 100)}...`);
    
    return { model: modelName, status: 'success', response: text };
    
  } catch (error) {
    console.log(`❌ ${modelName}: ERROR`);
    console.log(`   Error: ${error.message}`);
    return { model: modelName, status: 'error', error: error.message };
  }
}

async function testAllModels() {
  console.log('🚀 Iniciando pruebas de modelos Gemini...\n');
  
  if (API_KEY === 'tu_api_key_aqui') {
    console.log('⚠️  Configura tu API key de Gemini en la variable de entorno GEMINI_API_KEY');
    console.log('   Ejemplo: GEMINI_API_KEY=tu_key_aqui node test-gemini-models.js');
    return;
  }
  
  const results = [];
  
  for (const model of models) {
    const result = await testModel(model);
    results.push(result);
    
    // Pequeña pausa entre pruebas
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Resumen de resultados:');
  console.log('========================');
  
  const workingModels = results.filter(r => r.status === 'success');
  const failingModels = results.filter(r => r.status === 'error');
  
  console.log(`✅ Modelos funcionando: ${workingModels.length}`);
  workingModels.forEach(r => console.log(`   - ${r.model}`));
  
  console.log(`❌ Modelos con error: ${failingModels.length}`);
  failingModels.forEach(r => console.log(`   - ${r.model}: ${r.error}`));
  
  if (workingModels.length > 0) {
    console.log(`\n🎯 Recomendación: Usa ${workingModels[0].model} como modelo principal`);
  }
}

// Ejecutar pruebas
testAllModels().catch(console.error);
