-- ============================================================================
-- ZELO REVIEW SAAS - SCRIPT COMPLETO MYSQL CON TABLAS E INSERTS INICIALES
-- Versión compatible con MySQL 8.0+ / MariaDB 10.5+
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `zelo_db` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `zelo_db`;

-- Desactivar temporalmente revisión de claves foráneas para recreación limpia
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `scan_events`;
DROP TABLE IF EXISTS `smart_links`;
DROP TABLE IF EXISTS `smart_profiles`;
DROP TABLE IF EXISTS `devices`;
DROP TABLE IF EXISTS `batches`;
DROP TABLE IF EXISTS `businesses`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 1. TABLA: users
-- ----------------------------------------------------------------------------
CREATE TABLE `users` (
  `id` VARCHAR(36) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `role` ENUM('ADMIN', 'BUSINESS_OWNER') NOT NULL DEFAULT 'BUSINESS_OWNER',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. TABLA: businesses
-- ----------------------------------------------------------------------------
CREATE TABLE `businesses` (
  `id` VARCHAR(36) NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `logoUrl` TEXT NULL,
  `coverUrl` TEXT NULL,
  `googleReviewUrl` TEXT NULL,
  `phone` VARCHAR(50) NULL,
  `whatsapp` VARCHAR(50) NULL,
  `instagram` VARCHAR(100) NULL,
  `facebook` TEXT NULL,
  `website` TEXT NULL,
  `address` VARCHAR(255) NULL,
  `category` VARCHAR(100) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `businesses_slug_key` (`slug`),
  KEY `businesses_userId_fkey` (`userId`),
  CONSTRAINT `businesses_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. TABLA: batches (Lotes de producción física de placas)
-- ----------------------------------------------------------------------------
CREATE TABLE `batches` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `quantity` INT NOT NULL,
  `prefix` VARCHAR(10) NOT NULL DEFAULT 'ZL',
  `notes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. TABLA: devices (Placas acrílicas con QR + chip NFC)
-- ----------------------------------------------------------------------------
CREATE TABLE `devices` (
  `id` VARCHAR(36) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `activationPin` VARCHAR(20) NOT NULL,
  `status` ENUM('IN_PRODUCTION', 'READY_TO_ASSIGN', 'ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'READY_TO_ASSIGN',
  `mode` ENUM('DIRECT_REDIRECT', 'SMART_PROFILE') NOT NULL DEFAULT 'DIRECT_REDIRECT',
  `customDestinationUrl` TEXT NULL,
  `businessId` VARCHAR(36) NULL,
  `batchId` VARCHAR(36) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `devices_code_key` (`code`),
  KEY `devices_businessId_fkey` (`businessId`),
  KEY `devices_batchId_fkey` (`batchId`),
  CONSTRAINT `devices_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `businesses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `devices_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. TABLA: smart_profiles (Hub interactivo bio-link para placas SMART_PROFILE)
-- ----------------------------------------------------------------------------
CREATE TABLE `smart_profiles` (
  `id` VARCHAR(36) NOT NULL,
  `deviceId` VARCHAR(36) NOT NULL,
  `title` VARCHAR(191) NULL,
  `description` TEXT NULL,
  `theme` VARCHAR(50) NOT NULL DEFAULT 'dark_gold',
  `googleReviewUrl` TEXT NULL,
  `googleReviewEnabled` TINYINT(1) NOT NULL DEFAULT 1,
  `facebookUrl` TEXT NULL,
  `facebookEnabled` TINYINT(1) NOT NULL DEFAULT 0,
  `whatsappNumber` VARCHAR(50) NULL,
  `whatsappMessage` VARCHAR(255) NULL DEFAULT 'Hola! Vengo desde la placa Zelo.',
  `whatsappEnabled` TINYINT(1) NOT NULL DEFAULT 0,
  `instagramHandle` VARCHAR(100) NULL,
  `instagramEnabled` TINYINT(1) NOT NULL DEFAULT 0,
  `websiteUrl` TEXT NULL,
  `websiteEnabled` TINYINT(1) NOT NULL DEFAULT 0,
  `menuUrl` TEXT NULL,
  `menuEnabled` TINYINT(1) NOT NULL DEFAULT 0,
  `wifiSsid` VARCHAR(100) NULL,
  `wifiPassword` VARCHAR(100) NULL,
  `wifiEnabled` TINYINT(1) NOT NULL DEFAULT 0,
  `googleMapsUrl` TEXT NULL,
  `googleMapsEnabled` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `smart_profiles_deviceId_key` (`deviceId`),
  CONSTRAINT `smart_profiles_deviceId_fkey` FOREIGN KEY (`deviceId`) REFERENCES `devices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. TABLA: smart_links (Enlaces personalizados dentro de un smart profile)
-- ----------------------------------------------------------------------------
CREATE TABLE `smart_links` (
  `id` VARCHAR(36) NOT NULL,
  `profileId` VARCHAR(36) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `url` TEXT NOT NULL,
  `icon` VARCHAR(50) NOT NULL DEFAULT 'globe',
  `order` INT NOT NULL DEFAULT 0,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `smart_links_profileId_fkey` (`profileId`),
  CONSTRAINT `smart_links_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `smart_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. TABLA: scan_events (Registro de métricas QR vs NFC en tiempo real)
-- ----------------------------------------------------------------------------
CREATE TABLE `scan_events` (
  `id` VARCHAR(36) NOT NULL,
  `deviceId` VARCHAR(36) NOT NULL,
  `source` ENUM('QR', 'NFC', 'DIRECT', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  `ipHash` VARCHAR(191) NULL,
  `userAgent` TEXT NULL,
  `deviceType` VARCHAR(50) NULL,
  `os` VARCHAR(50) NULL,
  `browser` VARCHAR(50) NULL,
  `city` VARCHAR(100) NULL,
  `country` VARCHAR(100) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `scan_events_deviceId_createdAt_idx` (`deviceId`, `createdAt`),
  KEY `scan_events_source_idx` (`source`),
  CONSTRAINT `scan_events_deviceId_fkey` FOREIGN KEY (`deviceId`) REFERENCES `devices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- INSERTS DE DATOS INICIALES (SEED DATA LISTO PARA LOGIN Y PRUEBAS)
-- ============================================================================

-- 1. USUARIO ÚNICO (ADMINISTRADOR)
-- Admin: admin@zelo.pe | Contraseña: admin123456
INSERT INTO `users` (`id`, `email`, `password`, `name`, `role`, `createdAt`, `updatedAt`) VALUES
('usr-admin-00000000-0000-0000-0000-000000000001', 'admin@zelo.pe', '$2b$12$GLNTSS7DYKB07CGHpF.ZsOATzC2SDCb9zAozTdYW/51NbnAISkX.a', 'Administrador Zelo', 'ADMIN', NOW(), NOW());

-- 2. NEGOCIO DEMO
INSERT INTO `businesses` (`id`, `userId`, `name`, `slug`, `logoUrl`, `coverUrl`, `googleReviewUrl`, `phone`, `whatsapp`, `instagram`, `facebook`, `website`, `address`, `category`, `createdAt`, `updatedAt`) VALUES
('biz-fuego-00000000-0000-0000-0000-000000000001', 'usr-admin-00000000-0000-0000-0000-000000000001', 'Fuego Criollo Resto-Bar', 'fuego-criollo-restobar', NULL, NULL, 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4', '+51 987 654 321', '51987654321', 'fuegocriollo.pe', 'https://facebook.com/fuegocriolloperu', 'https://fuegocriollo.pe', 'Av. La Marina 2450, San Miguel, Lima', 'Restaurante & Bar', NOW(), NOW());

-- 3. LOTE DE FABRICACIÓN (BATCH)
INSERT INTO `batches` (`id`, `name`, `quantity`, `prefix`, `notes`, `createdAt`) VALUES
('bat-lote01-000000-0000-0000-0000-000000000001', 'Lote UV-01 - 50 Placas Acrílicas Zelo', 50, 'ZL', 'Producción inicial acrílico negro 10x15cm con acabado brillante y grabado láser', NOW());

-- 4. DISPOSITIVOS / PLACAS FÍSICAS
-- Dispositivo 1: Redirección directa a Google Reviews
-- Dispositivo 2: Smart Profile interactivo
-- Dispositivo 3: Placa nueva sin reclamar (lista para activar con PIN)
INSERT INTO `devices` (`id`, `code`, `activationPin`, `status`, `mode`, `customDestinationUrl`, `businessId`, `batchId`, `createdAt`, `updatedAt`) VALUES
('dev-demo01-000000-0000-0000-0000-000000000001', 'ZL-DEMO01', '1234', 'ACTIVE', 'DIRECT_REDIRECT', NULL, 'biz-fuego-00000000-0000-0000-0000-000000000001', 'bat-lote01-000000-0000-0000-0000-000000000001', NOW(), NOW()),
('dev-demo02-000000-0000-0000-0000-000000000002', 'ZL-DEMO02', '5678', 'ACTIVE', 'SMART_PROFILE', NULL, 'biz-fuego-00000000-0000-0000-0000-000000000001', 'bat-lote01-000000-0000-0000-0000-000000000001', NOW(), NOW()),
('dev-unclaimed-000-0000-0000-0000-000000000003', 'ZL-UNCLAIMED', '8492', 'READY_TO_ASSIGN', 'DIRECT_REDIRECT', NULL, NULL, 'bat-lote01-000000-0000-0000-0000-000000000001', NOW(), NOW());

-- 5. SMART PROFILE PARA ZL-DEMO02
INSERT INTO `smart_profiles` (
  `id`, `deviceId`, `title`, `description`, `theme`, 
  `googleReviewUrl`, `googleReviewEnabled`, 
  `facebookUrl`, `facebookEnabled`,
  `whatsappNumber`, `whatsappMessage`, `whatsappEnabled`, 
  `instagramHandle`, `instagramEnabled`, 
  `websiteUrl`, `websiteEnabled`, 
  `menuUrl`, `menuEnabled`, 
  `wifiSsid`, `wifiPassword`, `wifiEnabled`, 
  `googleMapsUrl`, `googleMapsEnabled`, 
  `createdAt`, `updatedAt`
) VALUES (
  'pro-demo02-000000-0000-0000-0000-000000000001',
  'dev-demo02-000000-0000-0000-0000-000000000002',
  'Fuego Criollo Resto-Bar',
  '¡Gracias por visitarnos! Califica tu experiencia y déjanos tu reseña en Google para seguir mejorando.',
  'dark_gold',
  'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
  1,
  'https://facebook.com/fuegocriolloperu',
  1,
  '51987654321',
  '¡Hola! Quisiera reservar una mesa en Fuego Criollo.',
  1,
  'fuegocriollo.pe',
  1,
  'https://fuegocriollo.pe',
  1,
  'https://fuegocriollo.pe/carta-digital.pdf',
  1,
  'FuegoCriollo_Clientes',
  'carnesybrasas2026',
  1,
  'https://maps.google.com',
  1,
  NOW(),
  NOW()
);

-- 6. SMART LINKS PARA ZL-DEMO02
INSERT INTO `smart_links` (`id`, `profileId`, `title`, `url`, `icon`, `order`, `isActive`, `createdAt`, `updatedAt`) VALUES
('lnk-pisco-000000-0000-0000-0000-000000000001', 'pro-demo02-000000-0000-0000-0000-000000000001', '🎁 Reclama tu Pisco Sour de Cortesía', 'https://fuegocriollo.pe/promociones', 'gift', 1, 1, NOW(), NOW()),
('lnk-spotify-0000-0000-0000-0000-000000000002', 'pro-demo02-000000-0000-0000-0000-000000000001', '🎵 Mira nuestra playlist en Spotify', 'https://spotify.com', 'globe', 2, 1, NOW(), NOW());

-- 7. EVENTOS DE ESCANEO DE PRUEBA (SCAN EVENTS QR Y NFC)
INSERT INTO `scan_events` (`id`, `deviceId`, `source`, `deviceType`, `os`, `browser`, `createdAt`) VALUES
(UUID(), 'dev-demo01-000000-0000-0000-0000-000000000001', 'NFC', 'mobile', 'iOS', 'Safari', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(UUID(), 'dev-demo01-000000-0000-0000-0000-000000000001', 'QR', 'mobile', 'Android', 'Chrome', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(UUID(), 'dev-demo02-000000-0000-0000-0000-000000000002', 'NFC', 'mobile', 'Android', 'Chrome', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(UUID(), 'dev-demo01-000000-0000-0000-0000-000000000001', 'QR', 'mobile', 'iOS', 'Safari', DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(UUID(), 'dev-demo02-000000-0000-0000-0000-000000000002', 'QR', 'mobile', 'Android', 'Chrome', DATE_SUB(NOW(), INTERVAL 8 HOUR)),
(UUID(), 'dev-demo01-000000-0000-0000-0000-000000000001', 'NFC', 'mobile', 'iOS', 'Safari', DATE_SUB(NOW(), INTERVAL 12 HOUR)),
(UUID(), 'dev-demo02-000000-0000-0000-0000-000000000002', 'QR', 'mobile', 'iOS', 'Safari', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(UUID(), 'dev-demo01-000000-0000-0000-0000-000000000001', 'NFC', 'mobile', 'Android', 'Chrome', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(UUID(), 'dev-demo02-000000-0000-0000-0000-000000000002', 'NFC', 'mobile', 'iOS', 'Safari', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(UUID(), 'dev-demo01-000000-0000-0000-0000-000000000001', 'QR', 'mobile', 'Android', 'Chrome', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(UUID(), 'dev-demo01-000000-0000-0000-0000-000000000001', 'QR', 'mobile', 'iOS', 'Safari', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(UUID(), 'dev-demo02-000000-0000-0000-0000-000000000002', 'NFC', 'mobile', 'iOS', 'Safari', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(UUID(), 'dev-demo01-000000-0000-0000-0000-000000000001', 'QR', 'mobile', 'Android', 'Chrome', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(UUID(), 'dev-demo02-000000-0000-0000-0000-000000000002', 'NFC', 'mobile', 'Android', 'Chrome', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(UUID(), 'dev-demo01-000000-0000-0000-0000-000000000001', 'QR', 'mobile', 'iOS', 'Safari', DATE_SUB(NOW(), INTERVAL 6 DAY));
