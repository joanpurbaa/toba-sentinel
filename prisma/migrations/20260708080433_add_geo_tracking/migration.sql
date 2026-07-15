-- AlterTable
ALTER TABLE "destinations" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "shipment_tracking_points" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_tracking_points_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shipment_tracking_points_shipmentId_recordedAt_idx" ON "shipment_tracking_points"("shipmentId", "recordedAt");

-- AddForeignKey
ALTER TABLE "shipment_tracking_points" ADD CONSTRAINT "shipment_tracking_points_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
