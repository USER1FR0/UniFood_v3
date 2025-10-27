#!/bin/bash

# Script de pruebas para el Microservicio de Chatbot UniFood
# Ejecuta todas las pruebas básicas del servicio

echo "=========================================="
echo "🤖 PRUEBAS DEL MICROSERVICIO CHATBOT"
echo "=========================================="
echo ""

BASE_URL="http://localhost:6000"

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir títulos
print_test() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Test 1: Health Check
print_test "TEST 1: Health Check"
curl -X GET "$BASE_URL/chatbot/health" \
  -H "Content-Type: application/json" \
  -w "\n\n"
sleep 1

# Test 2: Ranking de Ventas
print_test "TEST 2: Ranking de Ventas"
curl -X GET "$BASE_URL/chatbot/rankings/ventas" \
  -H "Content-Type: application/json" \
  -w "\n\n"
sleep 1

# Test 3: Ranking de Calificaciones
print_test "TEST 3: Ranking de Calificaciones"
curl -X GET "$BASE_URL/chatbot/rankings/calificaciones" \
  -H "Content-Type: application/json" \
  -w "\n\n"
sleep 1

# Test 4: Consulta NLP - Productos más vendidos
print_test "TEST 4: Consulta NLP - Productos más vendidos"
curl -X POST "$BASE_URL/chatbot/consulta" \
  -H "Content-Type: application/json" \
  -d '{"mensaje": "cuales son los productos mas vendidos"}' \
  -w "\n\n"
sleep 1

# Test 5: Consulta NLP - Mejor calificados
print_test "TEST 5: Consulta NLP - Mejor calificados"
curl -X POST "$BASE_URL/chatbot/consulta" \
  -H "Content-Type: application/json" \
  -d '{"mensaje": "que productos tienen mejor calificacion"}' \
  -w "\n\n"
sleep 1

# Test 6: Consulta NLP - Recomendaciones sin userId
print_test "TEST 6: Consulta NLP - Recomendaciones sin userId"
curl -X POST "$BASE_URL/chatbot/consulta" \
  -H "Content-Type: application/json" \
  -d '{"mensaje": "dame recomendaciones"}' \
  -w "\n\n"
sleep 1

# Test 7: Recomendaciones para Usuario ID 1
print_test "TEST 7: Recomendaciones para Usuario ID 1"
curl -X GET "$BASE_URL/chatbot/recomendaciones/1" \
  -H "Content-Type: application/json" \
  -w "\n\n"
sleep 1

# Test 8: Consulta NLP - Saludo
print_test "TEST 8: Consulta NLP - Saludo"
curl -X POST "$BASE_URL/chatbot/consulta" \
  -H "Content-Type: application/json" \
  -d '{"mensaje": "hola"}' \
  -w "\n\n"
sleep 1

# Test 9: Consulta NLP - Ayuda
print_test "TEST 9: Consulta NLP - Ayuda"
curl -X POST "$BASE_URL/chatbot/consulta" \
  -H "Content-Type: application/json" \
  -d '{"mensaje": "ayuda"}' \
  -w "\n\n"
sleep 1

# Test 10: Estadísticas Generales
print_test "TEST 10: Estadísticas Generales"
curl -X GET "$BASE_URL/chatbot/estadisticas" \
  -H "Content-Type: application/json" \
  -w "\n\n"

echo ""
echo -e "${GREEN}=========================================="
echo "✅ TODAS LAS PRUEBAS COMPLETADAS"
echo "==========================================${NC}"
echo ""

