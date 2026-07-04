import { esIngresoVigente, esGastoVigente } from './calculos.js';

export const calcularTotales = (
  ingresos: { tipo: string; fechaInicio: Date | null; fechaFin: Date | null; monto: unknown }[],
  gastos: { tipo: string; fechaInicio: Date | null; cuotasTotales: number | null; cuotasPagadas: number; monto: unknown }[],
  inicio: Date,
  fin: Date,
  { incluirPuntuales = true }: { incluirPuntuales?: boolean } = {}
) => {
  const totalIngresos = ingresos
    .filter(ing => esIngresoVigente(ing, inicio, fin, { incluirPuntuales }))
    .reduce((sum, ing) => sum + Number(ing.monto), 0);

  const totalGastos = gastos
    .filter(gas => esGastoVigente(gas, inicio, fin, { incluirPuntuales }))
    .reduce((sum, gas) => sum + Number(gas.monto), 0);

  return { totalIngresos, totalGastos, balance: totalIngresos - totalGastos };
};
