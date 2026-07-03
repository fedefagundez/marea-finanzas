import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { verificarMiembro } from '../lib/auth.js';
import { serializeDecimal } from '../lib/serializers.js';
import { AppError } from '../middlewares/error.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';

const router = Router();

const serializeGasto = (gasto: { monto: unknown }) => serializeDecimal(gasto, 'monto');

const gastoBaseSchema = z.object({
  hogarId: z.string().uuid(),
  descripcion: z.string().min(1).max(100),
  monto: z.number().positive(),
  tipo: z.enum(['RECURRENTE', 'PUNTUAL', 'INDEFINIDO']),
  fechaInicio: z.string().transform(s => s ? new Date(s) : undefined).optional(),
  cuotasTotales: z.number().int().positive().optional(),
  cuotasPagadas: z.number().int().min(0).default(0),
  tarjetaId: z.string().uuid().optional(),
  categoriaId: z.string().uuid().optional(),
});

const gastoSchema = gastoBaseSchema.refine(data => data.tipo === 'INDEFINIDO' || data.fechaInicio, {
  message: 'Fecha inicio es requerida para este tipo',
  path: ['fechaInicio']
}).refine(data => data.tipo === 'RECURRENTE' || !data.cuotasTotales, {
  message: 'Las cuotas solo están permitidas para gastos recurrentes',
  path: ['cuotasTotales']
});

const updateGastoSchema = gastoBaseSchema.omit({ hogarId: true }).partial();

router.post('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const data = gastoSchema.parse(req.body);
    await verificarMiembro(req.usuarioId!, data.hogarId);

    if (data.tarjetaId) {
      const tarjeta = await prisma.tarjetaCredito.findUnique({ where: { id: data.tarjetaId } });
      if (!tarjeta || tarjeta.hogarId !== data.hogarId) {
        throw new AppError(400, 'Tarjeta no válida para este hogar');
      }
    }

    const gasto = await prisma.gasto.create({
      data: {
        descripcion: data.descripcion,
        monto: data.monto,
        tipo: data.tipo,
        fechaInicio: data.fechaInicio,
        cuotasTotales: data.cuotasTotales,
        cuotasPagadas: data.cuotasPagadas,
        tarjetaId: data.tarjetaId,
        categoriaId: data.categoriaId,
        hogarId: data.hogarId,
        usuarioId: req.usuarioId!,
      },
    });

    res.status(201).json(serializeGasto(gasto));
  } catch (error) {
    next(error);
  }
});

router.get('/hogar/:hogarId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await verificarMiembro(req.usuarioId!, req.params.hogarId);

    const gastos = await prisma.gasto.findMany({
      where: { hogarId: req.params.hogarId },
      include: {
        tarjeta: { select: { id: true, nombre: true, ultimo4: true } },
        categoria: { select: { id: true, nombre: true, icon: true } },
      },
      orderBy: { fechaInicio: 'desc' },
    });

    res.json(gastos.map(serializeGasto));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const gasto = await prisma.gasto.findUnique({ where: { id: req.params.id } });

    if (!gasto) {
      throw new AppError(404, 'Gasto no encontrado');
    }

    await verificarMiembro(req.usuarioId!, gasto.hogarId);

    const data = updateGastoSchema.parse(req.body);

    if (data.cuotasPagadas !== undefined && data.cuotasTotales !== undefined) {
      if (data.cuotasPagadas > data.cuotasTotales) {
        throw new AppError(400, 'Cuotas pagadas no puede superar cuotas totales');
      }
    }

    const actualizado = await prisma.gasto.update({
      where: { id: req.params.id },
      data,
    });

    res.json(serializeGasto(actualizado));
  } catch (error) {
    next(error);
  }
});

router.put('/:id/pagar-cuota', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const gasto = await prisma.gasto.findUnique({ where: { id: req.params.id } });

    if (!gasto) {
      throw new AppError(404, 'Gasto no encontrado');
    }

    await verificarMiembro(req.usuarioId!, gasto.hogarId);

    if (!gasto.cuotasTotales) {
      throw new AppError(400, 'Este gasto no tiene cuotas');
    }

    if (gasto.cuotasPagadas >= gasto.cuotasTotales) {
      throw new AppError(400, 'Todas las cuotas ya fueron pagadas');
    }

    const actualizado = await prisma.gasto.update({
      where: { id: req.params.id },
      data: { cuotasPagadas: gasto.cuotasPagadas + 1 },
    });

    res.json(serializeGasto(actualizado));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const gasto = await prisma.gasto.findUnique({ where: { id: req.params.id } });

    if (!gasto) {
      throw new AppError(404, 'Gasto no encontrado');
    }

    await verificarMiembro(req.usuarioId!, gasto.hogarId);

    await prisma.gasto.delete({ where: { id: req.params.id } });

    res.json({ mensaje: 'Gasto eliminado' });
  } catch (error) {
    next(error);
  }
});

export default router;
