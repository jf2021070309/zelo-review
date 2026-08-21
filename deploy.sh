#!/bin/bash
# =========================================================
# SCRIPT DE DESPLIEGUE AUTOMÁTICO - ZELO REVIEW SAAS
# Servidor VPS: 2.25.102.198
# =========================================================

set -e

echo "🚀 Iniciando despliegue de ZELO Review en VPS 2.25.102.198..."

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
echo "🐳 Levantando contenedores (Next.js + PostgreSQL + Caddy)..."
docker compose down || true
docker compose up -d --build

# 4. Esperar a que la base de datos esté lista
echo "⏳ Esperando inicio de PostgreSQL..."
sleep 5

# 5. Ejecutar migraciones de base de datos dentro del contenedor
echo "🗄️ Aplicando migraciones de Prisma..."
docker compose exec -T app npx prisma db push

# 6. Ejecutar script de datos iniciales (Seed)
echo "🌱 Ejecutando Seeding inicial..."
docker compose exec -T app npx tsx prisma/seed.ts || true

echo "========================================================="
echo "✅ ¡DESPLIEGUE COMPLETADO EXITOSAMENTE!"
echo "🌐 Accede a tu plataforma en: http://2.25.102.198"
echo "👤 Administrador: admin@zelo.pe | Pass: admin123456"
echo "🏢 Negocio Demo: demo@zelo.pe | Pass: demo123456"
echo "========================================================="
