-- CreateTable
CREATE TABLE "metas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "monto_objetivo" DECIMAL NOT NULL,
    "monto_actual" DECIMAL NOT NULL DEFAULT 0,
    "fecha_limite" DATETIME NOT NULL,
    "cuota_mensual" DECIMAL,
    "gasto_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hogar_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    CONSTRAINT "metas_hogar_id_fkey" FOREIGN KEY ("hogar_id") REFERENCES "hogares" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "metas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
