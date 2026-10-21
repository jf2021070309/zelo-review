import { execute, query } from "./db";

/**
 * Tablas del módulo C-03 "Filtro inteligente de reseñas" + Generador QR.
 * Se crean automáticamente (CREATE TABLE IF NOT EXISTS) la primera vez que
 * cualquier endpoint del módulo se ejecuta, así no hace falta migración manual.
 * El mismo SQL está en /migrations/002_filtro_resenas.sql por si se prefiere correrlo a mano.
 */
export const REVIEW_SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS \`managers\` (
    \`id\` VARCHAR(64) NOT NULL,
    \`businessId\` VARCHAR(64) NULL,
    \`name\` VARCHAR(191) NOT NULL,
    \`role\` VARCHAR(100) NULL,
    \`channel\` ENUM('WHATSAPP','EMAIL','BOTH') NOT NULL DEFAULT 'WHATSAPP',
    \`whatsapp\` VARCHAR(50) NULL,
    \`email\` VARCHAR(191) NULL,
    \`accessToken\` VARCHAR(64) NOT NULL,
    \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
    \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`managers_accessToken_key\` (\`accessToken\`),
    KEY \`managers_businessId_idx\` (\`businessId\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`branches\` (
    \`id\` VARCHAR(64) NOT NULL,
    \`businessId\` VARCHAR(64) NULL,
    \`managerId\` VARCHAR(64) NULL,
    \`name\` VARCHAR(191) NOT NULL,
    \`address\` VARCHAR(255) NULL,
    \`googleReviewUrl\` TEXT NULL,
    \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (\`id\`),
    KEY \`branches_businessId_idx\` (\`businessId\`),
    KEY \`branches_managerId_idx\` (\`managerId\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`qr_codes\` (
    \`id\` VARCHAR(64) NOT NULL,
    \`code\` VARCHAR(32) NOT NULL,
    \`name\` VARCHAR(191) NOT NULL,
    \`type\` VARCHAR(30) NOT NULL,
    \`isDynamic\` TINYINT(1) NOT NULL DEFAULT 1,
    \`data\` MEDIUMTEXT NOT NULL,
    \`design\` MEDIUMTEXT NULL,
    \`businessId\` VARCHAR(64) NULL,
    \`branchId\` VARCHAR(64) NULL,
    \`status\` ENUM('ACTIVE','PAUSED') NOT NULL DEFAULT 'ACTIVE',
    \`createdBy\` VARCHAR(64) NULL,
    \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`qr_codes_code_key\` (\`code\`),
    KEY \`qr_codes_branchId_idx\` (\`branchId\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`qr_scans\` (
    \`id\` VARCHAR(64) NOT NULL,
    \`qrId\` VARCHAR(64) NOT NULL,
    \`ipHash\` VARCHAR(64) NULL,
    \`os\` VARCHAR(50) NULL,
    \`browser\` VARCHAR(50) NULL,
    \`deviceType\` VARCHAR(30) NULL,
    \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (\`id\`),
    KEY \`qr_scans_qrId_createdAt_idx\` (\`qrId\`, \`createdAt\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`uploads\` (
    \`id\` VARCHAR(64) NOT NULL,
    \`filename\` VARCHAR(255) NOT NULL,
    \`mime\` VARCHAR(120) NOT NULL,
    \`size\` INT NOT NULL,
    \`content\` LONGBLOB NOT NULL,
    \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`reviews\` (
    \`id\` VARCHAR(64) NOT NULL,
    \`qrId\` VARCHAR(64) NULL,
    \`branchId\` VARCHAR(64) NULL,
    \`authorName\` VARCHAR(191) NOT NULL,
    \`rating\` TINYINT NOT NULL,
    \`originalRating\` TINYINT NOT NULL,
    \`comment\` TEXT NULL,
    \`status\` ENUM('PUBLISHED','INTERCEPTED','RECOVERED') NOT NULL,
    \`source\` VARCHAR(20) NOT NULL DEFAULT 'QR',
    \`publishedAt\` DATETIME(3) NULL,
    \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (\`id\`),
    KEY \`reviews_qrId_idx\` (\`qrId\`),
    KEY \`reviews_branchId_idx\` (\`branchId\`),
    KEY \`reviews_status_idx\` (\`status\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`review_cases\` (
    \`id\` VARCHAR(64) NOT NULL,
    \`reviewId\` VARCHAR(64) NOT NULL,
    \`qrId\` VARCHAR(64) NULL,
    \`branchId\` VARCHAR(64) NULL,
    \`managerId\` VARCHAR(64) NULL,
    \`customerName\` VARCHAR(191) NULL,
    \`customerPhone\` VARCHAR(50) NULL,
    \`customerEmail\` VARCHAR(191) NULL,
    \`feedback\` TEXT NULL,
    \`status\` ENUM('OPEN','IN_PROGRESS','RESOLVED','RECOVERED','CLOSED') NOT NULL DEFAULT 'OPEN',
    \`customerToken\` VARCHAR(64) NOT NULL,
    \`managerToken\` VARCHAR(64) NOT NULL,
    \`lastCustomerMsgAt\` DATETIME(3) NULL,
    \`lastManagerMsgAt\` DATETIME(3) NULL,
    \`reminderSentAt\` DATETIME(3) NULL,
    \`followUpSentAt\` DATETIME(3) NULL,
    \`rerateInvitedAt\` DATETIME(3) NULL,
    \`newRating\` TINYINT NULL,
    \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`review_cases_customerToken_key\` (\`customerToken\`),
    UNIQUE KEY \`review_cases_managerToken_key\` (\`managerToken\`),
    KEY \`review_cases_status_idx\` (\`status\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`case_messages\` (
    \`id\` VARCHAR(64) NOT NULL,
    \`caseId\` VARCHAR(64) NOT NULL,
    \`sender\` ENUM('CUSTOMER','MANAGER','SYSTEM') NOT NULL,
    \`kind\` ENUM('TEXT','RERATE_INVITE','RATING_UPDATE','REMINDER','FOLLOW_UP') NOT NULL DEFAULT 'TEXT',
    \`body\` TEXT NOT NULL,
    \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (\`id\`),
    KEY \`case_messages_caseId_idx\` (\`caseId\`, \`createdAt\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS \`notifications\` (
    \`id\` VARCHAR(64) NOT NULL,
    \`caseId\` VARCHAR(64) NULL,
    \`managerId\` VARCHAR(64) NULL,
    \`audience\` ENUM('MANAGER','CUSTOMER') NOT NULL DEFAULT 'MANAGER',
    \`channel\` ENUM('WHATSAPP','EMAIL','WEBHOOK') NOT NULL,
    \`recipient\` VARCHAR(191) NULL,
    \`subject\` VARCHAR(255) NULL,
    \`body\` TEXT NOT NULL,
    \`deliveryUrl\` TEXT NULL,
    \`status\` ENUM('SENT','SIMULATED','FAILED') NOT NULL,
    \`provider\` VARCHAR(50) NULL,
    \`error\` TEXT NULL,
    \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (\`id\`),
    KEY \`notifications_caseId_idx\` (\`caseId\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

let schemaPromise: Promise<void> | null = null;

export function ensureReviewSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      for (const stmt of REVIEW_SCHEMA_STATEMENTS) {
        await execute(stmt);
      }
      // Sembrar una sucursal + gerente demo si está vacío (solo una vez)
      const existing = await query<any>("SELECT id FROM managers LIMIT 1");
      if (existing.length === 0) {
        const biz = await query<any>("SELECT id, googleReviewUrl FROM businesses ORDER BY createdAt ASC LIMIT 1");
        const businessId = biz[0]?.id || null;
        await execute(
          `INSERT INTO managers (id, businessId, name, role, channel, whatsapp, email, accessToken)
           VALUES (?, ?, ?, ?, 'WHATSAPP', ?, ?, ?)`,
          ["mgr-demo-0001", businessId, "Gerente Demo", "Gerente de sucursal", "51987654321", "gerente@ejemplo.com", "mgrtok-demo-" + Math.random().toString(36).slice(2, 12)]
        );
        await execute(
          `INSERT INTO branches (id, businessId, managerId, name, address, googleReviewUrl)
           VALUES (?, ?, ?, ?, ?, ?)`,
          ["brc-demo-0001", businessId, "mgr-demo-0001", "Sucursal Principal", "Av. La Marina 2450, San Miguel", biz[0]?.googleReviewUrl || null]
        );
      }
    })().catch((err) => {
      schemaPromise = null; // permitir reintento si la BD no estaba lista
      throw err;
    });
  }
  return schemaPromise;
}
