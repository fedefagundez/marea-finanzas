import { Router } from 'express';
import { startOfMonth, endOfMonth, addMonths, format, parseISO, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { prisma } from '../lib/prisma.js';
import { verificarMiembro } from '../lib/auth.js';
import { esIngresoVigente, esGastoVigente } from '../lib/calculos.js';
import { AppError } from '../middlewares/error.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';

const router = Router();

const calcularTotales = (
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

router.get('/hogar/:hogarId/dashboard', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await verificarMiembro(req.usuarioId!, req.params.hogarId);

    const hogarId = req.params.hogarId;
    const hoy = new Date();
    const mesActual = startOfMonth(hoy);
    const finMesActual = endOfMonth(hoy);

    const [ingresos, gastos] = await Promise.all([
      prisma.ingreso.findMany({ where: { hogarId } }),
      prisma.gasto.findMany({ where: { hogarId } }),
    ]);

    const { totalIngresos, totalGastos, balance } = calcularTotales(
      ingresos,
      gastos,
      mesActual,
      finMesActual
    );

    res.json({
      mes: format(hoy, 'MMMM yyyy', { locale: es }),
      totalIngresos,
      totalGastos,
      balance,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/hogar/:hogarId/evolucion', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await verificarMiembro(req.usuarioId!, req.params.hogarId);

    const hogarId = req.params.hogarId;
    const meses = parseInt(req.query.meses as string) || 6;
    const hoy = new Date();

    const [ingresos, gastos] = await Promise.all([
      prisma.ingreso.findMany({ where: { hogarId } }),
      prisma.gasto.findMany({ where: { hogarId } }),
    ]);

    const resultados = [];

    for (let i = -meses + 1; i <= 0; i++) {
      const fecha = addMonths(hoy, i);
      const inicio = startOfMonth(fecha);
      const fin = endOfMonth(fecha);

      const { totalIngresos, totalGastos, balance } = calcularTotales(
        ingresos,
        gastos,
        inicio,
        fin
      );

      resultados.push({
        mes: format(fecha, 'yyyy-MM'),
        label: format(fecha, 'MMM yyyy', { locale: es }),
        ingresos: totalIngresos,
        gastos: totalGastos,
        balance,
      });
    }

    res.json(resultados);
  } catch (error) {
    next(error);
  }
});

router.get('/hogar/:hogarId/proyeccion', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await verificarMiembro(req.usuarioId!, req.params.hogarId);

    const hogarId = req.params.hogarId;
    const meses = parseInt(req.query.meses as string) || 3;
    const hoy = new Date();

    const [ingresos, gastos] = await Promise.all([
      prisma.ingreso.findMany({ where: { hogarId } }),
      prisma.gasto.findMany({ where: { hogarId } }),
    ]);

    const resultados = [];

    for (let i = 0; i <= meses; i++) {
      const fecha = addMonths(hoy, i);
      const inicio = startOfMonth(fecha);
      const fin = endOfMonth(fecha);

      const { totalIngresos, totalGastos, balance } = calcularTotales(
        ingresos,
        gastos,
        inicio,
        fin,
        { incluirPuntuales: false }
      );

      resultados.push({
        mes: format(fecha, 'yyyy-MM'),
        label: format(fecha, 'MMM yyyy', { locale: es }),
        ingresos: totalIngresos,
        gastos: totalGastos,
        balance,
      });
    }

    res.json(resultados);
  } catch (error) {
    next(error);
  }
});

router.get('/hogar/:hogarId/balance-mes', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await verificarMiembro(req.usuarioId!, req.params.hogarId);

    const hogarId = req.params.hogarId;
    const mesParam = req.query.mes as string;
    if (!mesParam || !/^\d{4}-\d{2}$/.test(mesParam)) {
      throw new AppError(400, 'El parámetro mes debe tener formato YYYY-MM');
    }

    const fecha = parseISO(`${mesParam}-01`);
    const inicio = startOfMonth(fecha);
    const fin = endOfMonth(fecha);
    const hoy = new Date();
    const esFuturo = isAfter(inicio, startOfMonth(hoy));

    const [ingresos, gastos] = await Promise.all([
      prisma.ingreso.findMany({ where: { hogarId } }),
      prisma.gasto.findMany({ where: { hogarId } }),
    ]);

    const { totalIngresos, totalGastos, balance } = calcularTotales(
      ingresos,
      gastos,
      inicio,
      fin,
      { incluirPuntuales: !esFuturo }
    );

    res.json({
      mes: mesParam,
      totalIngresos,
      totalGastos,
      balance,
      tipo: esFuturo ? 'PROYECTADO' : 'REAL',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/hogar/:hogarId/movimientos-recientes', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await verificarMiembro(req.usuarioId!, req.params.hogarId);

    const hogarId = req.params.hogarId;
    const limite = parseInt(req.query.limite as string) || 5;

    const [ingresos, gastos] = await Promise.all([
      prisma.ingreso.findMany({ where: { hogarId }, orderBy: { createdAt: 'desc' }, take: limite }),
      prisma.gasto.findMany({ where: { hogarId }, orderBy: { createdAt: 'desc' }, take: limite }),
    ]);

    const movimientos = [
      ...ingresos.map(i => ({
        id: i.id,
        tipo: 'INGRESO' as const,
        descripcion: i.descripcion,
        monto: Number(i.monto),
        fecha: i.fechaInicio ? i.fechaInicio.toISOString() : i.createdAt.toISOString(),
        fechaCreacion: i.createdAt.toISOString(),
      })),
      ...gastos.map(g => ({
        id: g.id,
        tipo: 'GASTO' as const,
        descripcion: g.descripcion,
        monto: Number(g.monto),
        fecha: g.fechaInicio ? g.fechaInicio.toISOString() : g.createdAt.toISOString(),
        fechaCreacion: g.createdAt.toISOString(),
      })),
    ];

    movimientos.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());

    res.json(movimientos.slice(0, limite));
  } catch (error) {
    next(error);
  }
});

export default router;
