import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { verificarMiembro } from '../lib/auth.js';
import { AppError } from '../middlewares/error.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';

const router = Router();

const tarjetaSchema = z.object({
  hogarId: z.string().uuid(),
  nombre: z.string().min(1).max(50),
  ultimo4: z.string().length(4).regex(/^\d+$/),
  diaCierre: z.number().int().min(1).max(31).optional(),
});

const updateTarjetaSchema = tarjetaSchema.omit({ hogarId: true }).partial();

router.post('/', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const data = tarjetaSchema.parse(req.body);
  await verificarMiembro(req.usuarioId!, data.hogarId);

  const tarjeta = await prisma.tarjetaCredito.create({
    data: {
      nombre: data.nombre,
      ultimo4: data.ultimo4,
      diaCierre: data.diaCierre,
      hogarId: data.hogarId,
    },
  });

  res.status(201).json(tarjeta);
}));

router.get('/hogar/:hogarId', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  await verificarMiembro(req.usuarioId!, req.params.hogarId);

  const tarjetas = await prisma.tarjetaCredito.findMany({
    where: { hogarId: req.params.hogarId },
    orderBy: { nombre: 'asc' },
  });

  res.json(tarjetas);
}));

router.put('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const tarjeta = await prisma.tarjetaCredito.findUnique({ where: { id: req.params.id } });

  if (!tarjeta) {
    throw new AppError(404, 'Tarjeta no encontrada');
  }

  await verificarMiembro(req.usuarioId!, tarjeta.hogarId);

  const data = updateTarjetaSchema.parse(req.body);

  const actualizada = await prisma.tarjetaCredito.update({
    where: { id: req.params.id },
    data,
  });

  res.json(actualizada);
}));

router.delete('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const tarjeta = await prisma.tarjetaCredito.findUnique({ where: { id: req.params.id } });

  if (!tarjeta) {
    throw new AppError(404, 'Tarjeta no encontrada');
  }

  await verificarMiembro(req.usuarioId!, tarjeta.hogarId);

  await prisma.tarjetaCredito.delete({ where: { id: req.params.id } });

  res.json({ mensaje: 'Tarjeta eliminada' });
}));

export default router;
