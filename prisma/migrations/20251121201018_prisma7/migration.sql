/*
  Warnings:

  - Added the required column `orden` to the `Proceso` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Lote" ADD COLUMN     "fechaEstimadaFinalizacion" TIMESTAMP(3),
ADD COLUMN     "fechaIngresoProcesoActual" TIMESTAMP(3),
ADD COLUMN     "porcentajeCompletado" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tiempoRestanteDias" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Proceso" ADD COLUMN     "duracionEstandarDias" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "orden" INTEGER NOT NULL;
