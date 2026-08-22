# 🌟 ZELO Review — SaaS de Placas Inteligentes NFC + QR

Plataforma full-stack integral construida con **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM** y **PostgreSQL** para la administración, redirección dinámica, analítica en tiempo real y producción masiva de placas acrílicas inteligentes para reseñas de Google y marketing digital para negocios.

🌐 **URL de Producción:** [https://review.zelo.com.mx](https://review.zelo.com.mx)  
🖥️ **VPS IP:** `2.25.102.198`

---

## 📑 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Flujo de Funcionamiento (Hardware + Software)](#-flujo-de-funcionamiento-hardware--software)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Credenciales y Cuentas Demo](#-credenciales-y-cuentas-demo)
- [Variables de Entorno (.env)](#-variables-de-entorno-env)
- [Guía de Producción para Imprenta UV y Grabado Láser](#-guía-de-producción-para-imprenta-uv-y-grabado-láser)
- [Despliegue y Mantenimiento en VPS](#-despliegue-y-mantenimiento-en-vps)
- [CI/CD con GitHub Actions](#-cicd-con-github-actions)
- [Endpoints y Rutas Clave](#-endpoints-y-rutas-clave)

---

## ✨ Características Principales

### 1. 🌐 Landing Page Comercial de Alta Conversión (`/`)
- Presentación estética en modo oscuro con diseño **glassmorphic**, bordes sutiles y gradientes dorados/índigo.
- **Simulador Interactivo de Placa**: Permite a los clientes potenciales probar en vivo el toque NFC o el escaneo QR.
- **Calculadora de Retorno de Inversión (ROI)**: Proyección dinámica de reseñas mensuales según la cantidad de clientes atendidos al día.
- Catálogo de paquetes de compra (1 placa, Pack Restaurante Pro de 3 placas y Franquicias) y sección interactiva de preguntas frecuentes (FAQ).

### 2. ⚡ Motor de Redirección Ultra Rápido (`/r/[code]`)
- **Detección de Origen**: Identifica si el visitante abrió la placa mediante **Código QR** (`?src=qr`) o **Toque NFC** (`?src=nfc`).
- **Analítica Asíncrona No Bloqueante**: Registra IP anonimizada (SHA-256), sistema operativo (iOS, Android, Windows, etc.), tipo de dispositivo y navegador sin retrasar la redirección.
- **Modos de Comportamiento**:
  - **Redirección Directa (302)**: Redirige en menos de 50ms directamente a la ficha oficial de 5 estrellas de Google Reviews.
  - **Smart Bio-Hub (`/r/[code]/profile`)**: Portal interactivo para móviles con botón de 5 estrellas + animación de confetti (`canvas-confetti`), botón directo de WhatsApp con mensaje precargado, Instagram, Carta Digital / Menú PDF y conexión a red Wi-Fi.
  - **Placas de Fábrica sin Vincular**: Redirige a `/claim/[code]` para auto-activación guiada con PIN.

### 3. 📊 Panel del Negocio (`/dashboard`)
- **Métricas en Tiempo Real**: Total de interacciones, comparativa interactiva **📷 QR vs 📱 NFC** con porcentajes, gráfica de visitas en los últimos 14 días y stream en vivo de escaneos.
- **Administrador de Placas (`/dashboard/devices`)**: Selector de modo en 1 clic (Directo vs Smart Hub) y copiado rápido de URLs para programar chips NFC.
- **Personalizador de Smart Profile (`/dashboard/devices/[id]`)**:
  - Editor de temas visuales (`dark_gold`, `neon_indigo`, `emerald_luxury`, `ruby_elegance`, `clean_white`).
  - **Simulador de Smartphone en Vivo** en pantalla dividida.
- **Estudio & Descargador QR (`/dashboard/qr`)**: Generación y descarga en 1 clic en formato **PNG Alta Resolución (1000px)**, **PNG Imprenta 300 DPI (2400px)** y **Vectores SVG** para corte láser.
- **Ajustes Comerciales (`/dashboard/settings`)**: Configuración de redes, logo, WhatsApp y dirección física.

### 4. 🛠️ Panel SuperAdmin & Generador Masivo para Imprenta (`/admin`)
- **Control Global**: Total de placas en el mercado, volumen de visitas y comercios activos.
- **Generador de Lotes (VDP)**: Creación masiva de 50, 100 o 500 placas con prefijo personalizado (ej. `ZL-XXXXXX`) y PINs aleatorios únicos de seguridad.
- **Exportador ZIP para Imprenta UV**: Descarga en 1 clic un archivo `.zip` estructurado:
  - `01_QR_Codes_PNG_300DPI/`: Imágenes QR en ultra resolución nombradas por código (`ZL-XXXXXX_QR.png`).
  - `02_QR_Codes_Vector_SVG/`: Vectores SVG para máquinas de grabado láser.
  - `MANIFEST.csv`: Hoja de datos con columnas `[Code, PIN, QR_URL, NFC_URL, Status]` para control de calidad.
  - `LEEME_INSTRUCCIONES_PRODUCCION.txt`: Manual paso a paso para el taller de impresión.

---

## 🏗️ Arquitectura del Sistema

```
                    ┌─────────────────────────┐
                    │    Placa Acrílica Zelo  │
                    │   (Chip NFC + Código QR)│
                    └────────────┬────────────┘
                                 │
                   https://review.zelo.com.mx/r/ZL-DEMO01?src=nfc
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │  Next.js 14 Route /r    │
                    │  (Extracción Metadata)  │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┴──────────────────┐
              │                                     │
              ▼ (Async / Non-blocking)              ▼
    ┌──────────────────┐                  ┌──────────────────┐
    │  PostgreSQL 16   │                  │ Modo Dispositivo │
    │   (ScanEvents)   │                  └─────────┬────────┘
    └──────────────────┘                            │
                                ┌───────────────────┼───────────────────┐
                                │                   │                   │
                                ▼                   ▼                   ▼
                         DIRECT_REDIRECT      SMART_PROFILE       READY_TO_ASSIGN
                                │                   │                   │
                                ▼                   ▼                   ▼
                        Redirect HTTP 302     Smart Bio-Hub       Pantalla Claim
                        (Google Reviews)     (Reseñas/Redes)       (Activar PIN)
```

---

## 📱 Flujo de Funcionamiento (Hardware + Software)

1. **Producción**: El SuperAdmin genera un lote de placas desde `/admin/batches` y descarga el ZIP para la imprenta.
2. **Fabricación**: La imprenta graba el chip NFC (NTAG213/215) con la URL `https://review.zelo.com.mx/r/CODIGO?src=nfc` e imprime el QR con `https://review.zelo.com.mx/r/CODIGO?src=qr`.
3. **Entrega**: El cliente recibe su placa física con su PIN de seguridad de 4 dígitos.
4. **Activación**: El dueño escanea la placa o entra a `/claim/CODIGO`, ingresa su PIN y la placa queda vinculada a su cuenta.
5. **Uso Diario**: El comercio coloca la placa en su mesa/barra y los comensales tocan con su celular para calificar en Google en 1 segundo.

---

## 📂 Estructura del Proyecto

```
zelo-review/
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD automático con GitHub Actions en VPS
├── app/
│   ├── (marketing)/
│   │   ├── LandingClient.tsx       # Componente interactivo de landing page
│   │   └── page.tsx                # Página de inicio
│   ├── admin/
│   │   ├── batches/                # Generador de lotes y exportador ZIP imprenta
│   │   ├── businesses/             # Directorio de negocios clientes
│   │   ├── devices/                # Registro maestro de placas
│   │   ├── AdminNav.tsx            # Navegación del SuperAdmin
│   │   └── page.tsx                # Dashboard de métricas globales
│   ├── api/
│   │   ├── admin/                  # Endpoints administrativos
│   │   ├── auth/                   # Login, Register, Logout y Me
│   │   ├── business/               # Ajustes de negocio
│   │   ├── claim/                  # Activación de placas con PIN
│   │   └── devices/                # Configuración de placas y smart profiles
│   ├── claim/
│   │   └── [code]/                 # Página de activación para el usuario
│   ├── dashboard/
│   │   ├── devices/                # Lista y configuración de placas
│   │   ├── qr/                     # Estudio y descargador QR alta resolución
│   │   ├── settings/               # Ajustes de datos de contacto
│   │   ├── DashboardNav.tsx        # Navegación del panel negocio
│   │   └── page.tsx                # Gráficas de analítica QR vs NFC
│   ├── r/
│   │   └── [code]/
│   │       ├── profile/            # Vista móvil Smart Bio-Hub
│   │       └── route.ts            # Motor de redirección ultra rápido
│   ├── globals.css                 # Estilos Tailwind + Glassmorphism
│   └── layout.tsx                  # Root layout y SEO
├── lib/
│   ├── analytics.ts                # Parseo de User-Agent y registro de escaneos
│   ├── auth.ts                     # Autenticación JWT y cookies de sesión
│   ├── prisma.ts                   # Cliente Prisma singleton
│   ├── qr.ts                       # Generador de QR (SVG/PNG) y empaquetador ZIP
│   └── utils.ts                    # Utilidades de estilos y generadores de PIN
├── prisma/
│   ├── schema.prisma               # Modelos PostgreSQL
│   └── seed.ts                     # Cuentas demo, placas y analítica inicial
├── Caddyfile                       # Configuración Caddy SSL
├── deploy.sh                       # Script de despliegue en VPS
├── docker-compose.yml              # Orquestación Docker
├── Dockerfile                      # Build multi-stage Standalone
└── nginx.conf.example              # Configuración de Nginx Reverse Proxy
```

---

## 🔑 Credenciales y Cuentas Demo

| Rol | Correo Electrónico | Contraseña | URL de Acceso |
| :--- | :--- | :--- | :--- |
| **Super Administrador** | `admin@zelo.pe` | `admin123456` | `https://review.zelo.com.mx/admin` |
| **Dueño de Negocio (Demo)** | `demo@zelo.pe` | `demo123456` | `https://review.zelo.com.mx/dashboard` |

### Placas de Prueba Preconfiguradas:
- `ZL-DEMO01`: Modo **Redirección Directa** a Google Reviews (`https://review.zelo.com.mx/r/ZL-DEMO01?src=qr`)
- `ZL-DEMO02`: Modo **Smart Bio-Hub** con WhatsApp, Instagram, Menú y Wi-Fi (`https://review.zelo.com.mx/r/ZL-DEMO02?src=nfc`)
- `ZL-UNCLAIMED`: Placa de fábrica lista para vincular con PIN `8492` (`https://review.zelo.com.mx/claim/ZL-UNCLAIMED`)

---

## ⚙️ Variables de Entorno (.env)

Configuración recomendada para el VPS en `/var/www/zelo-review/.env`:

```env
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://review.zelo.com.mx"
NEXT_PUBLIC_APP_NAME="ZELO Review"

# Conexión local a PostgreSQL
DATABASE_URL="postgresql://zelo:zelo_secure_pass_2026@127.0.0.1:5432/zelo_db?schema=public"

# Seguridad JWT y SuperAdmin
JWT_SECRET="zelo_super_secret_jwt_key_928374829374829374928374982374"
ADMIN_REGISTRATION_KEY="zelo-admin-master-2026"
VPS_IP="2.25.102.198"
```

---

## 🖨️ Guía de Producción para Imprenta UV y Grabado Láser

### 1. Especificaciones de Placa Física Recomendadas:
- **Material**: Acrílico negro brillante o transparente de 3mm a 5mm.
- **Tamaño estándar**: 10 x 15 cm o 8 x 12 cm con base acrílica.
- **Chip NFC**: NTAG213, NTAG215 o NTAG216 adherido en la parte posterior o encapsulado.
- **Impresión**: Impresión UV de cama plana directa con tinta blanca + color + barniz de alto brillo.

### 2. Formato de URLs para Grabar:
- **Chip NFC**: `https://review.zelo.com.mx/r/CODIGO?src=nfc`
- **Código QR Impreso**: `https://review.zelo.com.mx/r/CODIGO?src=qr`

---

## 🖥️ Despliegue y Mantenimiento en VPS

### Comandos de Utilidad en el Servidor (`2.25.102.198`):

```bash
# Ver estado de la aplicación
pm2 status

# Ver logs en tiempo real
pm2 logs zelo-review --lines 50

# Reiniciar la aplicación
pm2 restart zelo-review

# Verificar conexión y tablas en PostgreSQL
sudo -u postgres psql -d zelo_db -c "\dt"
sudo -u postgres psql -d zelo_db -c "SELECT code, status, mode FROM devices;"

# Recargar Nginx
nginx -t && systemctl reload nginx
```

---

## 🚀 CI/CD con GitHub Actions

El repositorio cuenta con integración continua automática configurada en `.github/workflows/deploy.yml`.

Cada vez que realizas un `git push` a la rama `main`:
1. GitHub se conecta a tu VPS vía SSH (`2.25.102.198`).
2. Descarga los últimos cambios (`git pull origin main`).
3. Ejecuta las migraciones de base de datos (`npx prisma db push`).
4. Recompila la aplicación (`npm run build`).
5. Reinicia el proceso con **PM2** sin interrupciones para los usuarios.

---

## 📡 Endpoints y Rutas Clave

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/` | Landing page comercial |
| `GET` | `/login` | Inicio de sesión |
| `GET` | `/register` | Registro de nuevo negocio |
| `GET` | `/claim/[code]` | Formulario de activación de placa con PIN |
| `GET` | `/r/[code]` | Motor de redirección (parámetros `?src=qr` o `?src=nfc`) |
| `GET` | `/r/[code]/profile` | Vista del portal móvil Smart Bio-Hub |
| `GET` | `/dashboard` | Panel de métricas del negocio |
| `GET` | `/dashboard/devices` | Gestión y switch de modo de placas |
| `GET` | `/dashboard/qr` | Estudio y generador de códigos QR |
| `GET` | `/admin` | Panel de control SuperAdmin |
| `GET` | `/admin/batches` | Generador de lotes para producción |
| `GET` | `/api/admin/batches/[id]/export` | Descarga de paquete ZIP para imprenta |
| `POST` | `/api/claim` | API de reclamo y activación de placa |
| `PATCH` | `/api/devices/[id]` | API para actualizar modo y enlaces de placa |
