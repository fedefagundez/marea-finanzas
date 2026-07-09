import { isWithinInterval, addMonths, startOfMonth } from 'date-fns';

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
  _cierreAjustado?: boolean;
}

export const ajustarFechaPorCierre = <T extends { tarjetaId?: string | null; fechaInicio: Date | null }>(
  gasto: T,
  mapaCierre: Map<string, number>
): T & { _cierreAjustado?: boolean } => {
  const diaCierre = gasto.tarjetaId ? mapaCierre.get(gasto.tarjetaId) : undefined;
  if (!diaCierre || !gasto.fechaInicio) return gasto;

  const dia = gasto.fechaInicio.getDate();
  if (dia <= diaCierre) return gasto;

  return {
    ...gasto,
    fechaInicio: startOfMonth(addMonths(gasto.fechaInicio, 1)),
    _cierreAjustado: true,
  };
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
    if (!incluirPuntuales && !gasto._cierreAjustado) return false;
    return !!gasto.fechaInicio && isWithinInterval(gasto.fechaInicio, { start: inicio, end: fin });
  }

  if (gasto.tipo === 'RECURRENTE') {
    if (!gasto.fechaInicio) return true;
    if (gasto.fechaInicio > fin) return false;

    if (gasto.cuotasTotales) {
      const fechaUltimaCuota = addMonths(gasto.fechaInicio, gasto.cuotasTotales - 1);
      return fechaUltimaCuota >= inicio;
    }

    return gasto.fechaInicio <= fin;
  }

  // INDEFINIDO
  if (gasto.cuotasTotales) return false;
  return (!gasto.fechaInicio || gasto.fechaInicio <= fin);
};
