@echo off
REM Script de pruebas para el Microservicio de Chatbot UniFood
REM Ejecuta todas las pruebas básicas del servicio

echo ==========================================
echo PRUEBAS DEL MICROSERVICIO CHATBOT
echo ==========================================
echo.

set BASE_URL=http://localhost:6000

REM Test 1: Health Check
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo TEST 1: Health Check
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
curl -X GET "%BASE_URL%/chatbot/health" -H "Content-Type: application/json"
echo.
echo.
timeout /t 1 /nobreak >nul

REM Test 2: Ranking de Ventas
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo TEST 2: Ranking de Ventas
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
curl -X GET "%BASE_URL%/chatbot/rankings/ventas" -H "Content-Type: application/json"
echo.
echo.
timeout /t 1 /nobreak >nul

REM Test 3: Ranking de Calificaciones
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo TEST 3: Ranking de Calificaciones
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
curl -X GET "%BASE_URL%/chatbot/rankings/calificaciones" -H "Content-Type: application/json"
echo.
echo.
timeout /t 1 /nobreak >nul

REM Test 4: Consulta NLP - Productos más vendidos
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo TEST 4: Consulta NLP - Productos mas vendidos
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
curl -X POST "%BASE_URL%/chatbot/consulta" -H "Content-Type: application/json" -d "{\"mensaje\": \"cuales son los productos mas vendidos\"}"
echo.
echo.
timeout /t 1 /nobreak >nul

REM Test 5: Consulta NLP - Mejor calificados
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo TEST 5: Consulta NLP - Mejor calificados
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
curl -X POST "%BASE_URL%/chatbot/consulta" -H "Content-Type: application/json" -d "{\"mensaje\": \"que productos tienen mejor calificacion\"}"
echo.
echo.
timeout /t 1 /nobreak >nul

REM Test 6: Consulta NLP - Recomendaciones sin userId
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo TEST 6: Consulta NLP - Recomendaciones sin userId
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
curl -X POST "%BASE_URL%/chatbot/consulta" -H "Content-Type: application/json" -d "{\"mensaje\": \"dame recomendaciones\"}"
echo.
echo.
timeout /t 1 /nobreak >nul

REM Test 7: Recomendaciones para Usuario ID 1
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo TEST 7: Recomendaciones para Usuario ID 1
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
curl -X GET "%BASE_URL%/chatbot/recomendaciones/1" -H "Content-Type: application/json"
echo.
echo.
timeout /t 1 /nobreak >nul

REM Test 8: Consulta NLP - Saludo
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo TEST 8: Consulta NLP - Saludo
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
curl -X POST "%BASE_URL%/chatbot/consulta" -H "Content-Type: application/json" -d "{\"mensaje\": \"hola\"}"
echo.
echo.
timeout /t 1 /nobreak >nul

REM Test 9: Consulta NLP - Ayuda
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo TEST 9: Consulta NLP - Ayuda
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
curl -X POST "%BASE_URL%/chatbot/consulta" -H "Content-Type: application/json" -d "{\"mensaje\": \"ayuda\"}"
echo.
echo.
timeout /t 1 /nobreak >nul

REM Test 10: Estadísticas Generales
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo TEST 10: Estadisticas Generales
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
curl -X GET "%BASE_URL%/chatbot/estadisticas" -H "Content-Type: application/json"
echo.
echo.

echo.
echo ==========================================
echo TODAS LAS PRUEBAS COMPLETADAS
echo ==========================================
echo.

pause

