-- CreateEnum
CREATE TYPE "TipoRegistroManual" AS ENUM ('PAGO', 'RECORDATORIO', 'NOTA_GENERAL');

-- AlterTable
ALTER TABLE "Taller" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Transportista" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "RegistroManual" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoRegistroManual" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DOUBLE PRECISION,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" TEXT,
    "pedidoId" INTEGER,
    "tallerId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistroManual_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RegistroManual" ADD CONSTRAINT "RegistroManual_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroManual" ADD CONSTRAINT "RegistroManual_tallerId_fkey" FOREIGN KEY ("tallerId") REFERENCES "Taller"("id") ON DELETE SET NULL ON UPDATE CASCADE;
