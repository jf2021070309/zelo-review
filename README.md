# 🚀 ZELO Review — Plataforma SaaS de Placas Inteligentes NFC + QR

Plataforma full-stack completa desarrollada con **Next.js 14**, **TypeScript**, **Tailwind CSS**, **Prisma ORM** y **PostgreSQL** para la gestión, redirección dinámica, analítica en tiempo real y producción masiva de placas acrílicas inteligentes NFC + QR para negocios.

---

## 🌟 Características Principales

1. **🌐 Landing Page Comercial**:
   - Diseño moderno, oscuro/glassmorphic con presentación de placas acrílicas.
   - Simulador interactivo de toque NFC y escaneo QR.
   - Calculadora de retorno de inversión (ROI) y reseñas mensuales estimadas.
   - Catálogo de planes y preguntas frecuentes.

2. **⚡ Motor de Redirección Ultra Rápido (`/r/[code]`)**:
   - Soporte para origen `?src=qr` y `?src=nfc`.
   - Registro analítico asíncrono y no bloqueante (dispositivo, sistema operativo, navegador, IP anonimizada).
   - **Modo Redirección Directa**: Redirige en 50ms directamente a la ficha de reseñas de Google.
   - **Modo Smart Bio-Hub**: Despliega un portal interactivo con botón de 5 estrellas + confetti, WhatsApp, Instagram, Carta Menú en PDF y conexión rápida a Wi-Fi.

3. **📊 Panel de Control del Negocio (`/dashboard`)**:
   - Métricas en tiempo real: Total de escaneos, división **📷 QR vs 📱 NFC**, evolución en 14 días.
   - Administrador de placas físicas vinculadas con selector de modo instantáneo.
   - **Estudio & Descargador de QR**: Descarga en 1 clic en formato PNG de alta resolución (300 DPI) y SVG vectorial.
   - Personalizador visual del Smart Profile con simulador de smartphone en vivo.

4. **🛠️ Panel SuperAdmin & Generador Masivo para Imprenta (`/admin`)**:
   - Generación masiva de lotes de placas (ej. 50, 100, 500 unidades con prefijo `ZL-XXXXXX` y PINs únicos).
   - **Exportador ZIP para Imprenta**: Descarga en 1 clic un archivo comprimido con todos los códigos QR en PNG 300DPI, vectores SVG para grabado láser y un archivo `MANIFEST.csv` listo para el software RIP de la impresora UV.

5. **🔐 Flujo de Activación Guiado (`/claim/[code]`)**:
   - Cuando el cliente recibe su placa física, ingresa su código y PIN de 4 dígitos para vincularla a su negocio en segundos.

---

## 🏗️ Credenciales de Prueba (Seed)

| Rol | Correo | Contraseña | Panel |
| :--- | :--- | :--- | :--- |
| **Super Administrador** | `admin@zelo.pe` | `admin123456` | `/admin` |
| **Dueño de Negocio (Demo)** | `demo@zelo.pe` | `demo123456` | `/dashboard` |

### Placas de Prueba Preconfiguradas:
- `ZL-DEMO01`: Modo **Redirección Directa** a Google Reviews (`/r/ZL-DEMO01?src=qr`)
- `ZL-DEMO02`: Modo **Smart Bio-Hub** con WhatsApp, Instagram, Menú y Wi-Fi (`/r/ZL-DEMO02?src=nfc`)
- `ZL-UNCLAIMED`: Placa lista para activar con PIN `8492` (`/claim/ZL-UNCLAIMED`)

---

## 🚢 Despliegue en VPS (`2.25.102.198`)

El proyecto incluye configuración completa con Docker Compose (Next.js + PostgreSQL 16 + Caddy con SSL automático).

### Pasos para desplegar en tu servidor:

1. **Subir el código a tu VPS**:
   ```bash
   scp -r . root@2.25.102.198:/root/zelo-review
   ```

2. **Conectarse por SSH**:
   ```bash
   ssh root@2.25.102.198
   cd /root/zelo-review
   ```

3. **Ejecutar el script de despliegue automático**:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

4. **¡Listo!** Tu plataforma estará activa y funcionando en `http://2.25.102.198` o con tu dominio configurado en `Caddyfile`.
