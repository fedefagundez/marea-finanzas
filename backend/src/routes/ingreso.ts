import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { verificarMiembro } from '../lib/auth.js';
import { serializeDecimal } from '../lib/serializers.js';
import { AppError } from '../middlewares/error.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';

const router = Router();

const serializeIngreso = (ingreso: { monto: unknown }) => serializeDecimal(ingreso, 'monto');

const ingresoBaseSchema = z.object({
  hogarId: z.string().uuid(),
  descripcion: z.string().min(1).max(100),
  monto: z.number().positive(),
  tipo: z.enum(['RECURRENTE', 'PUNTUAL', 'INDEFINIDO']),
  fechaInicio: z.string().transform(s => s ? new Date(s) : undefined).optional(),
  fechaFin: z.string().transform(s => s ? new Date(s) : undefined).optional(),
});

const ingresoSchema = ingresoBaseSchema.refine(data => data.tipo === 'INDEFINIDO' || data.fechaInicio, {
  message: 'Fecha inicio es requerida para este tipo',
  path: ['fechaInicio']
}).refine(data => !data.fechaFin || !data.fechaInicio || data.fechaFin >= data.fechaInicio, {
  message: 'Fecha fin debe ser mayor o igual a fecha inicio',
  path: ['fechaFin']
});

const updateIngresoSchema = ingresoBaseSchema.omit({ hogarId: true }).partial();

router.post('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const data = ingresoSchema.parse(req.body);
    await verificarMiembro(req.usuarioId!, data.hogarId);

    const ingreso = await prisma.ingreso.create({
      data: {
        descripcion: data.descripcion,
        monto: data.monto,
        tipo: data.tipo,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        hogarId: data.hogarId,
        usuarioId: req.usuarioId!,
      },
    });

    res.status(201).json(serializeIngreso(ingreso));
  } catch (error) {
    next(error);
  }
});

router.get('/hogar/:hogarId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    await verificarMiembro(req.usuarioId!, req.params.hogarId);

    const ingresos = await prisma.ingreso.findMany({
      where: { hogarId: req.params.hogarId },
      orderBy: { fechaInicio: 'desc' },
    });

    res.json(ingresos.map(serializeIngreso));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const ingreso = await prisma.ingreso.findUnique({ where: { id: req.params.id } });

    if (!ingreso) {
      throw new AppError(404, 'Ingreso no encontrado');
    }

    await verificarMiembro(req.usuarioId!, ingreso.hogarId);

    const data = updateIngresoSchema.parse(req.body);

    const actualizado = await prisma.ingreso.update({
      where: { id: req.params.id },
      data,
    });

    res.json(serializeIngreso(actualizado));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const ingreso = await prisma.ingreso.findUnique({ where: { id: req.params.id } });

    if (!ingreso) {
      throw new AppError(404, 'Ingreso no encontrado');
    }

    await verificarMiembro(req.usuarioId!, ingreso.hogarId);

    await prisma.ingreso.delete({ where: { id: req.params.id } });

    res.json({ mensaje: 'Ingreso eliminado' });
  } catch (error) {
    next(error);
  }
});

export default router;
