import { Router } from 'express';
import { startOfMonth, endOfMonth, addMonths, format, parseISO, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { prisma } from '../lib/prisma.js';
import { verificarMiembro } from '../lib/auth.js';
import { calcularTotales } from '../lib/reporte-utils.js';
import { esGastoVigente } from '../lib/calculos.js';
import { AppError } from '../middlewares/error.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';

const router = Router();

router.get('/hogar/:hogarId/dashboard', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
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
}));

router.get('/hogar/:hogarId/evolucion', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
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
}));

router.get('/hogar/:hogarId/proyeccion', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
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
}));

router.get('/hogar/:hogarId/evolucion-completa', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  await verificarMiembro(req.usuarioId!, req.params.hogarId);

  const hogarId = req.params.hogarId;
  const pasado = parseInt(req.query.pasado as string) || 6;
  const futuro = parseInt(req.query.futuro as string) || 6;
  const hoy = new Date();

  const [ingresos, gastos] = await Promise.all([
    prisma.ingreso.findMany({ where: { hogarId } }),
    prisma.gasto.findMany({ where: { hogarId } }),
  ]);

  const data: { mes: string; label: string; ingresos: number; gastos: number; balance: number; tipo: 'REAL' | 'PROYECTADO' }[] = [];

  for (let i = -pasado; i <= futuro; i++) {
    const fecha = addMonths(hoy, i);
    const inicio = startOfMonth(fecha);
    const fin = endOfMonth(fecha);
    const esFuturo = i > 0;

    const { totalIngresos, totalGastos, balance } = calcularTotales(
      ingresos,
      gastos,
      inicio,
      fin,
      { incluirPuntuales: !esFuturo }
    );

    data.push({
      mes: format(fecha, 'yyyy-MM'),
      label: format(fecha, 'MMM yyyy', { locale: es }),
      ingresos: totalIngresos,
      gastos: totalGastos,
      balance,
      tipo: esFuturo ? 'PROYECTADO' : 'REAL',
    });
  }

  res.json({ data });
}));

router.get('/hogar/:hogarId/balance-mes', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
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
}));

router.get('/hogar/:hogarId/distribucion-gastos', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  await verificarMiembro(req.usuarioId!, req.params.hogarId);

  const hogarId = req.params.hogarId;
  const hoy = new Date();
  const inicio = startOfMonth(hoy);
  const fin = endOfMonth(hoy);

  const gastos = await prisma.gasto.findMany({
    where: { hogarId },
    include: { categoria: { select: { id: true, nombre: true, icon: true } } },
  });

  const filtrados = gastos.filter(g => esGastoVigente(g, inicio, fin));

  const agrupado: Record<string, { total: number; categoria: { id: string | null; nombre: string; icon: string } }> = {};

  for (const g of filtrados) {
    const key = g.categoriaId ?? '__sin_categoria__';
    if (!agrupado[key]) {
      agrupado[key] = {
        total: 0,
        categoria: g.categoria
          ? { id: g.categoria.id, nombre: g.categoria.nombre, icon: g.categoria.icon }
          : { id: null, nombre: 'Sin categoría', icon: '📂' },
      };
    }
    agrupado[key].total += Number(g.monto);
  }

  const totalGeneral = Object.values(agrupado).reduce((s, v) => s + v.total, 0);

  const resultado = Object.values(agrupado)
    .map(({ total, categoria }) => ({
      categoriaId: categoria.id,
      nombre: categoria.nombre,
      icon: categoria.icon,
      total,
      porcentaje: totalGeneral > 0 ? Math.round((total / totalGeneral) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  res.json(resultado);
}));

router.get('/hogar/:hogarId/movimientos-recientes', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
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
}));

export default router;
