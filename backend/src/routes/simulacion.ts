import { Router } from 'express';
import { startOfMonth, endOfMonth, addMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { prisma } from '../lib/prisma.js';
import { verificarMiembro } from '../lib/auth.js';
import { calcularTotales, obtenerMapaCierre, ajustarGastos } from '../lib/reporte-utils.js';
import { esGastoVigente } from '../lib/calculos.js';
import { AppError } from '../middlewares/error.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';
import { z } from 'zod';

const router = Router();

const crearSimulacionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
});

const crearItemSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida').max(100),
  monto: z.number().positive('El monto debe ser positivo'),
  tipo: z.enum(['PUNTUAL', 'RECURRENTE', 'INDEFINIDO']),
  subtipo: z.enum(['INGRESO', 'GASTO']),
  fechaInicio: z.string().optional().nullable(),
  cuotasTotales: z.number().int().positive().optional().nullable(),
});

const actualizarItemSchema = z.object({
  descripcion: z.string().min(1).max(100).optional(),
  monto: z.number().positive().optional(),
  tipo: z.enum(['PUNTUAL', 'RECURRENTE', 'INDEFINIDO']).optional(),
  subtipo: z.enum(['INGRESO', 'GASTO']).optional(),
  fechaInicio: z.string().optional().nullable(),
  cuotasTotales: z.number().int().positive().optional().nullable(),
});

// ─── CRUD Simulaciones ────────────────────────────────────────

router.get('/hogar/:hogarId', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  await verificarMiembro(req.usuarioId!, req.params.hogarId);

  const simulaciones = await prisma.simulacion.findMany({
    where: { hogarId: req.params.hogarId },
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json(simulaciones.map(s => ({
    id: s.id,
    nombre: s.nombre,
    createdAt: s.createdAt,
    cantidadItems: s._count.items,
  })));
}));

router.post('/hogar/:hogarId', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  await verificarMiembro(req.usuarioId!, req.params.hogarId);

  const parsed = crearSimulacionSchema.parse(req.body);

  const simulacion = await prisma.simulacion.create({
    data: {
      nombre: parsed.nombre,
      hogarId: req.params.hogarId,
      usuarioId: req.usuarioId!,
    },
  });

  res.status(201).json(simulacion);
}));

router.put('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const simulacion = await prisma.simulacion.findUnique({ where: { id: req.params.id } });
  if (!simulacion) throw new AppError(404, 'Simulación no encontrada');
  await verificarMiembro(req.usuarioId!, simulacion.hogarId);

  const parsed = crearSimulacionSchema.parse(req.body);

  const actualizada = await prisma.simulacion.update({
    where: { id: req.params.id },
    data: { nombre: parsed.nombre },
  });

  res.json(actualizada);
}));

router.delete('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const simulacion = await prisma.simulacion.findUnique({ where: { id: req.params.id } });
  if (!simulacion) throw new AppError(404, 'Simulación no encontrada');
  await verificarMiembro(req.usuarioId!, simulacion.hogarId);

  await prisma.simulacion.delete({ where: { id: req.params.id } });

  res.json({ mensaje: 'Simulación eliminada' });
}));

// ─── CRUD Items de Simulación ─────────────────────────────────

router.get('/:id/items', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const simulacion = await prisma.simulacion.findUnique({ where: { id: req.params.id } });
  if (!simulacion) throw new AppError(404, 'Simulación no encontrada');
  await verificarMiembro(req.usuarioId!, simulacion.hogarId);

  const items = await prisma.itemSimulacion.findMany({
    where: { simulacionId: req.params.id },
    orderBy: { createdAt: 'asc' },
  });

  res.json(items);
}));

router.post('/:id/items', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const simulacion = await prisma.simulacion.findUnique({ where: { id: req.params.id } });
  if (!simulacion) throw new AppError(404, 'Simulación no encontrada');
  await verificarMiembro(req.usuarioId!, simulacion.hogarId);

  const parsed = crearItemSchema.parse(req.body);

  const item = await prisma.itemSimulacion.create({
    data: {
      simulacionId: req.params.id,
      descripcion: parsed.descripcion,
      monto: parsed.monto,
      tipo: parsed.tipo,
      subtipo: parsed.subtipo,
      fechaInicio: parsed.fechaInicio ? new Date(parsed.fechaInicio) : null,
      cuotasTotales: parsed.cuotasTotales ?? null,
    },
  });

  res.status(201).json(item);
}));

router.put('/items/:itemId', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const item = await prisma.itemSimulacion.findUnique({
    where: { id: req.params.itemId },
    include: { simulacion: true },
  });
  if (!item) throw new AppError(404, 'Item no encontrado');
  await verificarMiembro(req.usuarioId!, item.simulacion.hogarId);

  const parsed = actualizarItemSchema.parse(req.body);

  const data: Record<string, unknown> = {};
  if (parsed.descripcion !== undefined) data.descripcion = parsed.descripcion;
  if (parsed.monto !== undefined) data.monto = parsed.monto;
  if (parsed.tipo !== undefined) data.tipo = parsed.tipo;
  if (parsed.subtipo !== undefined) data.subtipo = parsed.subtipo;
  if (parsed.fechaInicio !== undefined) {
    data.fechaInicio = parsed.fechaInicio ? new Date(parsed.fechaInicio) : null;
  }
  if (parsed.cuotasTotales !== undefined) {
    data.cuotasTotales = parsed.cuotasTotales ?? null;
  }

  const actualizado = await prisma.itemSimulacion.update({
    where: { id: req.params.itemId },
    data,
  });

  res.json(actualizado);
}));

router.delete('/items/:itemId', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const item = await prisma.itemSimulacion.findUnique({
    where: { id: req.params.itemId },
    include: { simulacion: true },
  });
  if (!item) throw new AppError(404, 'Item no encontrado');
  await verificarMiembro(req.usuarioId!, item.simulacion.hogarId);

  await prisma.itemSimulacion.delete({ where: { id: req.params.itemId } });

  res.json({ mensaje: 'Item eliminado' });
}));

// ─── Proyección Combinada ─────────────────────────────────────

router.get('/:id/proyeccion', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const simulacion = await prisma.simulacion.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (!simulacion) throw new AppError(404, 'Simulación no encontrada');
  await verificarMiembro(req.usuarioId!, simulacion.hogarId);

  const meses = parseInt(req.query.meses as string) || 12;
  const hoy = new Date();

  const [ingresosReales, gastosReales] = await Promise.all([
    prisma.ingreso.findMany({ where: { hogarId: simulacion.hogarId } }),
    prisma.gasto.findMany({ where: { hogarId: simulacion.hogarId } }),
  ]);

  const mapaCierre = await obtenerMapaCierre(simulacion.hogarId);
  const gastosRealesAjustados = ajustarGastos(gastosReales, mapaCierre);

  // Separar items simulados por subtipo
  const itemsIngreso = simulacion.items
    .filter(i => i.subtipo === 'INGRESO')
    .map(i => ({
      tipo: i.tipo,
      monto: i.monto,
      fechaInicio: i.fechaInicio,
      fechaFin: null as Date | null,
      cuotasTotales: i.cuotasTotales,
      cuotasPagadas: 0,
    }));

  const itemsGasto = simulacion.items
    .filter(i => i.subtipo === 'GASTO')
    .map(i => ({
      tipo: i.tipo,
      monto: i.monto,
      fechaInicio: i.fechaInicio,
      cuotasTotales: i.cuotasTotales,
      cuotasPagadas: 0,
    }));

  const data: {
    mes: string;
    label: string;
    ingresos: number;
    gastos: number;
    balance: number;
    tipo: 'REAL' | 'SIMULADO';
  }[] = [];

  for (let i = 0; i <= meses; i++) {
    const fecha = addMonths(hoy, i);
    const inicio = startOfMonth(fecha);
    const fin = endOfMonth(fecha);

    const { totalIngresos: ingReal, totalGastos: gasReal } = calcularTotales(
      ingresosReales,
      gastosRealesAjustados,
      inicio,
      fin,
      { incluirPuntuales: false }
    );

    const { totalIngresos: ingSim, totalGastos: gasSim } = calcularTotales(
      itemsIngreso,
      itemsGasto,
      inicio,
      fin,
      { incluirPuntuales: false }
    );

    const ingresos = ingReal + ingSim;
    const gastos = gasReal + gasSim;

    data.push({
      mes: format(fecha, 'yyyy-MM'),
      label: format(fecha, 'MMM yyyy', { locale: es }),
      ingresos,
      gastos,
      balance: ingresos - gastos,
      tipo: 'SIMULADO',
    });
  }

  // Agregar meses pasados (solo datos reales)
  const pasados = parseInt(req.query.pasados as string) || 6;
  const dataCompleta: typeof data = [];

  for (let i = -pasados; i < 0; i++) {
    const fecha = addMonths(hoy, i);
    const inicio = startOfMonth(fecha);
    const fin = endOfMonth(fecha);

    const { totalIngresos, totalGastos, balance } = calcularTotales(
      ingresosReales,
      gastosRealesAjustados,
      inicio,
      fin,
      { incluirPuntuales: true }
    );

    dataCompleta.push({
      mes: format(fecha, 'yyyy-MM'),
      label: format(fecha, 'MMM yyyy', { locale: es }),
      ingresos: totalIngresos,
      gastos: totalGastos,
      balance,
      tipo: 'REAL',
    });
  }

  dataCompleta.push(...data);

  res.json({ data: dataCompleta, simulacion: { id: simulacion.id, nombre: simulacion.nombre } });
}));

export default router;
