/*
  Warnings:

  - You are about to drop the column `batchNumber` on the `items` table. All the data in the column will be lost.
  - You are about to drop the column `expiryDate` on the `items` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "StorageCondition" AS ENUM ('SUHU_RUANG', 'DINGIN', 'BEKU');

-- AlterTable
ALTER TABLE "items" DROP COLUMN "batchNumber",
DROP COLUMN "expiryDate",
ADD COLUMN     "expiryWarningDays" INTEGER NOT NULL DEFAULT 90,
ADD COLUMN     "isControlledSubstance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "registrationNumber" TEXT,
ADD COLUMN     "storageCondition" "StorageCondition" NOT NULL DEFAULT 'SUHU_RUANG';

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "batchId" TEXT;

-- CreateTable
CREATE TABLE "item_batches" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "quantityReceived" INTEGER NOT NULL,
    "quantityRemaining" INTEGER NOT NULL,
    "vendorId" TEXT,
    "receivedById" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "item_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "item_batches_itemId_expiryDate_idx" ON "item_batches"("itemId", "expiryDate");

-- CreateIndex
CREATE INDEX "stock_movements_batchId_idx" ON "stock_movements"("batchId");

-- AddForeignKey
ALTER TABLE "item_batches" ADD CONSTRAINT "item_batches_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_batches" ADD CONSTRAINT "item_batches_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_batches" ADD CONSTRAINT "item_batches_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "item_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
