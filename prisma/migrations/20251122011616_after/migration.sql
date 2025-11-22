-- CreateEnum
CREATE TYPE "EstadoProceso" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'NO_ENVIADO');

-- AlterTable
ALTER TABLE "ProcesoRealizado" ADD COLUMN     "esTransporte" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "especificaciones" TEXT,
ADD COLUMN     "estado" "EstadoProceso" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "precio" DOUBLE PRECISION,
ADD COLUMN     "requiereAdelanto" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "fechaEntrada" DROP NOT NULL,
ALTER COLUMN "fechaEntrada" DROP DEFAULT;

-- CreateTable
CREATE TABLE "PlantillaPaso" (
    "id" SERIAL NOT NULL,
    "productoId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "duracionEstimadaDias" DOUBLE PRECISION,
    "precio" DOUBLE PRECISION,
    "requiereAdelanto" BOOLEAN NOT NULL DEFAULT false,
    "especificaciones" TEXT,
    "tallerPorDefectoId" INTEGER,
    "esTransporte" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantillaPaso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlantillaPaso_productoId_orden_idx" ON "PlantillaPaso"("productoId", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "PlantillaPaso_productoId_nombre_key" ON "PlantillaPaso"("productoId", "nombre");

-- AddForeignKey
ALTER TABLE "PlantillaPaso" ADD CONSTRAINT "PlantillaPaso_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantillaPaso" ADD CONSTRAINT "PlantillaPaso_tallerPorDefectoId_fkey" FOREIGN KEY ("tallerPorDefectoId") REFERENCES "Taller"("id") ON DELETE SET NULL ON UPDATE CASCADE;
