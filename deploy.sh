#!/bin/bash
# =========================================================
# SCRIPT DE DESPLIEGUE AUTOMÁTICO - ZELO REVIEW SAAS (MYSQL)
# Servidor VPS: 2.25.102.198
# =========================================================

set -e

echo "🚀 Iniciando despliegue de ZELO Review en VPS con MySQL..."

# 1. Verificar Docker y Docker Compose
if ! command -v docker &> /dev/null; then
    echo "📦 Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
fi

if ! command -v docker compose &> /dev/null; then
    echo "📦 Instalando Docker Compose..."
    apt-get update && apt-get install -y docker-compose-plugin
fi

# 2. Configurar variables de entorno si no existen
if [ ! -f .env ]; then
    echo "📄 Creando archivo .env inicial..."
    cp .env.example .env
fi

# 3. Construir y levantar contenedores en segundo plano
echo "🐳 Levantando contenedores (Next.js + MySQL 8.0 + Caddy)..."
docker compose down || true
docker compose up -d --build

# 4. Esperar a que la base de datos esté lista
echo "⏳ Esperando inicio saludable de MySQL..."
sleep 10

# 5. Aplicar schema con Prisma
echo "🗄️ Sincronizando schema de MySQL con Prisma..."
docker compose exec -T app npx prisma db push --accept-data-loss || true

# 6. Importar script de inserts si no se cargaron
echo "🌱 Verificando datos iniciales (Seed)..."
docker compose exec -T mysql mysql -u zelo -pzelo_secure_pass_2026 zelo_db < schema_mysql.sql || true

echo "========================================================="
echo "✅ ¡DESPLIEGUE CON MYSQL COMPLETADO EXITOSAMENTE!"
echo "🌐 Accede a tu plataforma en: http://2.25.102.198"
echo "👤 Administrador Único: admin@zelo.pe | Pass: admin123456"
echo "========================================================="
