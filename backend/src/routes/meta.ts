import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { verificarMiembro } from '../lib/auth.js';
import { serializeDecimal } from '../lib/serializers.js';
import { AppError } from '../middlewares/error.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';

const router = Router();

const serializeMeta = (meta: { montoObjetivo: unknown; montoActual: unknown; cuotaMensual: unknown }) => ({
  ...serializeDecimal(meta, 'montoObjetivo'),
  ...serializeDecimal(meta, 'montoActual'),
  cuotaMensual: meta.cuotaMensual ? Number(meta.cuotaMensual) : null,
});

const createMetaSchema = z.object({
  hogarId: z.string().uuid(),
  nombre: z.string().min(1).max(100),
  montoObjetivo: z.number().positive(),
  fechaLimite: z.string(),
  cuotaMensual: z.number().positive().optional(),
  gastoId: z.string().uuid().optional(),
});

const updateMetaSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  montoObjetivo: z.number().positive().optional(),
  montoActual: z.number().min(0).optional(),
  fechaLimite: z.string().optional(),
  cuotaMensual: z.number().positive().optional().nullable(),
  gastoId: z.string().uuid().optional().nullable(),
});

router.get('/hogar/:hogarId', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const { hogarId } = req.params;
  await verificarMiembro(req.usuarioId!, hogarId);

  const metas = await prisma.meta.findMany({
    where: { hogarId },
    orderBy: { createdAt: 'desc' },
  });

  res.json(metas.map(serializeMeta));
}));

router.post('/', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const data = createMetaSchema.parse(req.body);
  await verificarMiembro(req.usuarioId!, data.hogarId);

  const meta = await prisma.meta.create({
    data: {
      nombre: data.nombre,
      montoObjetivo: data.montoObjetivo,
      fechaLimite: new Date(data.fechaLimite),
      cuotaMensual: data.cuotaMensual ?? null,
      gastoId: data.gastoId ?? null,
      hogarId: data.hogarId,
      usuarioId: req.usuarioId!,
    },
  });

  res.status(201).json(serializeMeta(meta));
}));

router.put('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const meta = await prisma.meta.findUnique({ where: { id: req.params.id } });
  if (!meta) throw new AppError(404, 'Meta no encontrada');

  await verificarMiembro(req.usuarioId!, meta.hogarId);

  const data = updateMetaSchema.parse(req.body);

  const actualizada = await prisma.meta.update({
    where: { id: req.params.id },
    data: {
      ...data,
      fechaLimite: data.fechaLimite ? new Date(data.fechaLimite) : undefined,
      cuotaMensual: data.cuotaMensual === undefined ? undefined : data.cuotaMensual,
      gastoId: data.gastoId === undefined ? undefined : data.gastoId,
    },
  });

  res.json(serializeMeta(actualizada));
}));

router.delete('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const meta = await prisma.meta.findUnique({ where: { id: req.params.id } });
  if (!meta) throw new AppError(404, 'Meta no encontrada');

  await verificarMiembro(req.usuarioId!, meta.hogarId);

  await prisma.meta.delete({ where: { id: req.params.id } });

  res.json({ mensaje: 'Meta eliminada' });
}));

export default router;
