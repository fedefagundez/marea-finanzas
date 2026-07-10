import { PrismaClient } from '@prisma/client';

export const csvEscape = (val: unknown): string => {
  const s = String(val ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const csvParseLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else current += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { result.push(current); current = ''; }
      else current += ch;
    }
  }
  result.push(current);
  return result;
};

export interface CsvColumnIndices {
  tipoMov: number;
  desc: number;
  monto: number;
  fecha: number;
  fechaFin: number;
  tipo: number;
  categoria: number;
  tarjeta: number;
  cuotasTotales: number;
  cuotasPagadas: number;
  montoObj: number;
  montoAct: number;
  fechaLim: number;
  cuotaMensual: number;
  ultimo4: number;
  diaCierre: number;
}

export function resolveCsvColumns(cabeceras: string[]): CsvColumnIndices {
  const idx = (name: string) => cabeceras.indexOf(name);
  return {
    tipoMov: idx('tipo_movimiento'),
    desc: idx('descripcion'),
    monto: idx('monto'),
    fecha: idx('fecha_inicio') !== -1 ? idx('fecha_inicio') : idx('fecha'),
    fechaFin: idx('fecha_fin'),
    tipo: idx('tipo'),
    categoria: idx('categoria'),
    tarjeta: idx('tarjeta'),
    cuotasTotales: idx('cuotas_totales'),
    cuotasPagadas: idx('cuotas_pagadas'),
    montoObj: idx('monto_objetivo'),
    montoAct: idx('monto_actual'),
    fechaLim: idx('fecha_limite'),
    cuotaMensual: idx('cuota_mensual'),
    ultimo4: idx('ultimo4'),
    diaCierre: idx('dia_cierre'),
  };
}

export function parseTarjetaRow(
  cols: string[], idx: CsvColumnIndices, descripcion: string
): { nombre: string; ultimo4: string; diaCierre: number | null } | null {
  if (!descripcion) return null;
  const ultimo4 = idx.ultimo4 !== -1 ? (cols[idx.ultimo4] ?? '').trim() : '';
  const diaCierreRaw = idx.diaCierre !== -1 ? (cols[idx.diaCierre] ?? '').trim() : '';
  const diaCierre = parseInt(diaCierreRaw, 10);
  return {
    nombre: descripcion,
    ultimo4: ultimo4 || '0000',
    diaCierre: !isNaN(diaCierre) ? diaCierre : null,
  };
}

export function parseMetaRow(
  cols: string[], idx: CsvColumnIndices, descripcion: string
): { nombre: string; montoObjetivo: number; montoActual: number; fechaLimite: Date; cuotaMensual: number | null } | null {
  if (!descripcion) return null;
  const montoObjRaw = idx.montoObj !== -1 ? (cols[idx.montoObj] ?? '').trim().replace(/[$,]/g, '') : '';
  const montoObj = parseFloat(montoObjRaw);
  const montoActRaw = idx.montoAct !== -1 ? (cols[idx.montoAct] ?? '').trim().replace(/[$,]/g, '') : '';
  const montoAct = parseFloat(montoActRaw);
  const fechaLim = idx.fechaLim !== -1 ? (cols[idx.fechaLim] ?? '').trim() : '';
  const cuotaMensualRaw = idx.cuotaMensual !== -1 ? (cols[idx.cuotaMensual] ?? '').trim().replace(/[$,]/g, '') : '';
  const cuotaMensual = parseFloat(cuotaMensualRaw);
  if (isNaN(montoObj) || montoObj <= 0) return null;
  return {
    nombre: descripcion,
    montoObjetivo: montoObj,
    montoActual: isNaN(montoAct) || montoAct < 0 ? 0 : montoAct,
    fechaLimite: fechaLim ? new Date(fechaLim + 'T12:00:00') : new Date(),
    cuotaMensual: isNaN(cuotaMensual) ? null : cuotaMensual,
  };
}

export function parseMovimientoRow(
  cols: string[], idx: CsvColumnIndices, descripcion: string, montoRaw_: string
): { descripcion: string; monto: number; tipo: string; fechaInicio?: Date; fechaFin?: Date; cuotasTotales?: number | null; cuotasPagadas?: number } | null {
  const montoRaw = (cols[idx.monto] ?? '').trim().replace(/[$,]/g, '');
  const monto = parseFloat(montoRaw);
  if (!descripcion || isNaN(monto) || monto <= 0) return null;
  const tipo = idx.tipo !== -1 ? (cols[idx.tipo] ?? '').trim().toUpperCase() : 'PUNTUAL';
  const tipoValido = ['PUNTUAL', 'RECURRENTE', 'INDEFINIDO'].includes(tipo) ? tipo : 'PUNTUAL';
  const fecha = idx.fecha !== -1 ? (cols[idx.fecha] ?? '').trim() : '';
  const fechaFinRaw = idx.fechaFin !== -1 ? (cols[idx.fechaFin] ?? '').trim() : '';
  const cuotasTotalesRaw = idx.cuotasTotales !== -1 ? (cols[idx.cuotasTotales] ?? '').trim() : '';
  const cuotasTotales = parseInt(cuotasTotalesRaw, 10);
  const cuotasPagadasRaw = idx.cuotasPagadas !== -1 ? (cols[idx.cuotasPagadas] ?? '').trim() : '';
  const cuotasPagadas = parseInt(cuotasPagadasRaw, 10);
  return {
    descripcion,
    monto,
    tipo: tipoValido,
    fechaInicio: fecha ? new Date(fecha + 'T12:00:00') : undefined,
    fechaFin: fechaFinRaw ? new Date(fechaFinRaw + 'T12:00:00') : undefined,
    cuotasTotales: !isNaN(cuotasTotales) && cuotasTotales > 0 ? cuotasTotales : null,
    cuotasPagadas: !isNaN(cuotasPagadas) && cuotasPagadas >= 0 ? cuotasPagadas : 0,
  };
}

export async function resolveTarjetaId(
  prisma: PrismaClient, cols: string[], idx: CsvColumnIndices, hogarId: string
): Promise<string | undefined> {
  if (idx.tarjeta === -1) return undefined;
  const tarjetaStr = (cols[idx.tarjeta] ?? '').trim();
  if (!tarjetaStr) return undefined;
  const t = await prisma.tarjetaCredito.findFirst({
    where: { hogarId, nombre: tarjetaStr.split(' (****')[0] },
  });
  return t?.id;
}

export async function resolveCategoriaId(
  prisma: PrismaClient, cols: string[], idx: CsvColumnIndices, hogarId: string
): Promise<string | undefined> {
  if (idx.categoria === -1) return undefined;
  const catStr = (cols[idx.categoria] ?? '').trim();
  if (!catStr) return undefined;
  const spaceIdx = catStr.indexOf(' ');
  const icon = spaceIdx > 0 ? catStr.substring(0, spaceIdx).trim() : '📂';
  const nombre = spaceIdx > 0 ? catStr.substring(spaceIdx + 1).trim() : catStr;
  let cat = await prisma.categoria.findFirst({ where: { hogarId, nombre } });
  if (!cat) {
    cat = await prisma.categoria.create({ data: { hogarId, nombre, icon } });
  }
  return cat.id;
}
