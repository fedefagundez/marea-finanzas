import { isWithinInterval, addMonths } from 'date-fns';

export interface IngresoParaCalculo {
  tipo: string;
  fechaInicio: Date | null;
  fechaFin: Date | null;
}

export interface GastoParaCalculo {
  tipo: string;
  fechaInicio: Date | null;
  cuotasTotales: number | null;
  cuotasPagadas: number;
}

export const calcularFechaFinCuotas = (
  fechaInicio: Date,
  cuotasTotales: number,
  cuotasPagadas: number
): Date => {
  const mesesRestantes = cuotasTotales - cuotasPagadas - 1;
  return addMonths(fechaInicio, mesesRestantes);
};

export const esIngresoVigente = (
  ingreso: IngresoParaCalculo,
  inicio: Date,
  fin: Date,
  { incluirPuntuales = true }: { incluirPuntuales?: boolean } = {}
): boolean => {
  if (ingreso.tipo === 'PUNTUAL') {
    if (!incluirPuntuales) return false;
    return !!ingreso.fechaInicio && isWithinInterval(ingreso.fechaInicio, { start: inicio, end: fin });
  }

  if (ingreso.tipo === 'RECURRENTE') {
    return !!ingreso.fechaInicio &&
      ingreso.fechaInicio <= fin &&
      (!ingreso.fechaFin || ingreso.fechaFin >= inicio);
  }

  // INDEFINIDO
  return (!ingreso.fechaInicio || ingreso.fechaInicio <= fin) &&
    (!ingreso.fechaFin || ingreso.fechaFin >= inicio);
};

export const esGastoVigente = (
  gasto: GastoParaCalculo,
  inicio: Date,
  fin: Date,
  { incluirPuntuales = true }: { incluirPuntuales?: boolean } = {}
): boolean => {
  if (gasto.tipo === 'PUNTUAL') {
    if (!incluirPuntuales) return false;
    return !!gasto.fechaInicio && isWithinInterval(gasto.fechaInicio, { start: inicio, end: fin });
  }

  if (gasto.tipo === 'RECURRENTE') {
    if (gasto.cuotasTotales && gasto.cuotasPagadas >= gasto.cuotasTotales) return false;

    if (!gasto.fechaInicio) return true;

    const fechaFinEstimada = gasto.cuotasTotales
      ? calcularFechaFinCuotas(gasto.fechaInicio, gasto.cuotasTotales, gasto.cuotasPagadas)
      : null;

    return gasto.fechaInicio <= fin && (!fechaFinEstimada || fechaFinEstimada >= inicio);
  }

  // INDEFINIDO
  if (gasto.cuotasTotales) return false;
  return (!gasto.fechaInicio || gasto.fechaInicio <= fin);
};
