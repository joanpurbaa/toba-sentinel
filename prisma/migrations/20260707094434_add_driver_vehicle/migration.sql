/*
  Warnings:

  - You are about to drop the column `driverName` on the `shipments` table. All the data in the column will be lost.
  - You are about to drop the column `vehicleLabel` on the `shipments` table. All the data in the column will be lost.
  - You are about to drop the column `vehiclePlate` on the `shipments` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('AKTIF', 'CUTI', 'NONAKTIF');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('TERSEDIA', 'DIGUNAKAN', 'PERAWATAN');

-- AlterTable
ALTER TABLE "shipments" DROP COLUMN "driverName",
DROP COLUMN "vehicleLabel",
DROP COLUMN "vehiclePlate",
ADD COLUMN     "driverId" TEXT,
ADD COLUMN     "vehicleId" TEXT;

-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "simNumber" TEXT NOT NULL,
    "simType" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "DriverStatus" NOT NULL DEFAULT 'AKTIF',
    "usualVehicleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'TERSEDIA',
    "usualDriverId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plateNumber_key" ON "vehicles"("plateNumber");

-- CreateIndex
CREATE INDEX "shipments_driverId_idx" ON "shipments"("driverId");

-- CreateIndex
CREATE INDEX "shipments_vehicleId_idx" ON "shipments"("vehicleId");

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_usualVehicleId_fkey" FOREIGN KEY ("usualVehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_usualDriverId_fkey" FOREIGN KEY ("usualDriverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
