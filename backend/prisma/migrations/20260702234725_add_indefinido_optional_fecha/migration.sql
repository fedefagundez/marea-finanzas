-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_gastos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "fecha_inicio" DATETIME,
    "cuotas_totales" INTEGER,
    "cuotas_pagadas" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hogar_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "tarjeta_id" TEXT,
    CONSTRAINT "gastos_hogar_id_fkey" FOREIGN KEY ("hogar_id") REFERENCES "hogares" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "gastos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "gastos_tarjeta_id_fkey" FOREIGN KEY ("tarjeta_id") REFERENCES "tarjetas_credito" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_gastos" ("created_at", "cuotas_pagadas", "cuotas_totales", "descripcion", "fecha_inicio", "hogar_id", "id", "monto", "tarjeta_id", "tipo", "usuario_id") SELECT "created_at", "cuotas_pagadas", "cuotas_totales", "descripcion", "fecha_inicio", "hogar_id", "id", "monto", "tarjeta_id", "tipo", "usuario_id" FROM "gastos";
DROP TABLE "gastos";
ALTER TABLE "new_gastos" RENAME TO "gastos";
CREATE TABLE "new_ingresos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "fecha_inicio" DATETIME,
    "fecha_fin" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hogar_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    CONSTRAINT "ingresos_hogar_id_fkey" FOREIGN KEY ("hogar_id") REFERENCES "hogares" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ingresos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ingresos" ("created_at", "descripcion", "fecha_fin", "fecha_inicio", "hogar_id", "id", "monto", "tipo", "usuario_id") SELECT "created_at", "descripcion", "fecha_fin", "fecha_inicio", "hogar_id", "id", "monto", "tipo", "usuario_id" FROM "ingresos";
DROP TABLE "ingresos";
ALTER TABLE "new_ingresos" RENAME TO "ingresos";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
