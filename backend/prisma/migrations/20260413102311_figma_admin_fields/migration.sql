-- AlterTable
ALTER TABLE "Category" ADD COLUMN "description" TEXT;

-- AlterTable
ALTER TABLE "Loan" ADD COLUMN "dueAt" DATETIME;

-- AlterTable
ALTER TABLE "School" ADD COLUMN "email" TEXT;
ALTER TABLE "School" ADD COLUMN "headmasterName" TEXT;
ALTER TABLE "School" ADD COLUMN "level" TEXT;
ALTER TABLE "School" ADD COLUMN "npsn" TEXT;
ALTER TABLE "School" ADD COLUMN "status" TEXT;
ALTER TABLE "School" ADD COLUMN "website" TEXT;

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN "email" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "lastLoginAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Inbound" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "supplierId" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inbound_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Inbound_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Inbound" ("createdAt", "date", "id", "note", "supplierId", "updatedAt") SELECT "createdAt", "date", "id", "note", "supplierId", "updatedAt" FROM "Inbound";
DROP TABLE "Inbound";
ALTER TABLE "new_Inbound" RENAME TO "Inbound";
CREATE TABLE "new_Outbound" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipient" TEXT,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Outbound_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Outbound" ("createdAt", "date", "id", "note", "updatedAt") SELECT "createdAt", "date", "id", "note", "updatedAt" FROM "Outbound";
DROP TABLE "Outbound";
ALTER TABLE "new_Outbound" RENAME TO "Outbound";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
