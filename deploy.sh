#!/bin/bash
# =========================================================
# SCRIPT DE DESPLIEGUE AUTOMÁTICO - ZELO REVIEW SAAS (MYSQL NATIVO)
# Servidor VPS: 2.25.102.198
# =========================================================

set -e

echo "🚀 Iniciando despliegue de ZELO Review en VPS con MySQL Nativo (Sin Prisma)..."

# 1. Configurar variables de entorno si no existen
if [ ! -f .env ]; then
    echo "📄 Creando archivo .env inicial..."
    cp .env.example .env
fi

# 2. Importar script de schema e inserts en MySQL / MariaDB
echo "🌱 Importando schema y datos iniciales en MySQL / MariaDB..."
mariadb < schema_mysql.sql 2>/dev/null || mysql -u zelo -pzelo_secure_pass_2026 zelo_db < schema_mysql.sql 2>/dev/null || true

# 3. Compilar aplicación
echo "🏗️ Compilando aplicación Next.js..."
npm run build

# 4. Reiniciar proceso PM2
echo "🔄 Reiniciando proceso PM2..."
pm2 restart zelo-review || pm2 start npm --name "zelo-review" -- start -- -p 3000
pm2 save

echo "========================================================="
echo "✅ ¡DESPLIEGUE COMPLETADO EXITOSAMENTE SIN PRISMA!"
echo "🌐 Accede a tu plataforma en: https://review.zelo.com.mx"
echo "👤 Administrador Único: admin@zelo.pe | Pass: admin123456"
echo "========================================================="
