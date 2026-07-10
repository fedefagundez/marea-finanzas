-- CreateTable
CREATE TABLE "simulaciones" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hogar_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,

    CONSTRAINT "simulaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_simulacion" (
    "id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "tipo" TEXT NOT NULL,
    "subtipo" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3),
    "cuotas_totales" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "simulacion_id" TEXT NOT NULL,

    CONSTRAINT "items_simulacion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "simulaciones" ADD CONSTRAINT "simulaciones_hogar_id_fkey" FOREIGN KEY ("hogar_id") REFERENCES "hogares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulaciones" ADD CONSTRAINT "simulaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_simulacion" ADD CONSTRAINT "items_simulacion_simulacion_id_fkey" FOREIGN KEY ("simulacion_id") REFERENCES "simulaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
