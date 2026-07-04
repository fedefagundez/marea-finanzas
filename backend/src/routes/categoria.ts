import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { verificarMiembro } from '../lib/auth.js';
import { AppError } from '../middlewares/error.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';

const router = Router();

const categoriaSchema = z.object({
  nombre: z.string().min(1).max(50),
  icon: z.string().min(1).max(10).default('📂'),
  hogarId: z.string().uuid(),
});

const updateCategoriaSchema = z.object({
  nombre: z.string().min(1).max(50).optional(),
  icon: z.string().min(1).max(10).optional(),
});

// GET /api/categorias?hogarId=xxx — globales + del hogar
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const hogarId = req.query.hogarId as string | undefined;

  if (!hogarId) {
    res.json(await prisma.categoria.findMany({
      where: { hogarId: null, usuarioId: null },
      orderBy: { nombre: 'asc' },
    }));
    return;
  }

  await verificarMiembro(req.usuarioId!, hogarId);

  const categorias = await prisma.categoria.findMany({
    where: {
      OR: [
        { hogarId: null, usuarioId: null },
        { hogarId },
      ],
    },
    orderBy: [{ hogarId: 'asc' }, { nombre: 'asc' }],
  });

  res.json(categorias);
}));

// POST /api/categorias
router.post('/', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const data = categoriaSchema.parse(req.body);
  await verificarMiembro(req.usuarioId!, data.hogarId);

  const categoria = await prisma.categoria.create({
    data: {
      nombre: data.nombre,
      icon: data.icon,
      hogarId: data.hogarId,
      usuarioId: req.usuarioId!,
    },
  });

  res.status(201).json(categoria);
}));

// PUT /api/categorias/:id
router.put('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const categoria = await prisma.categoria.findUnique({ where: { id: req.params.id } });

  if (!categoria) {
    throw new AppError(404, 'Categoría no encontrada');
  }

  if (categoria.usuarioId && categoria.usuarioId !== req.usuarioId) {
    throw new AppError(403, 'No puedes modificar esta categoría');
  }

  if (categoria.hogarId && categoria.usuarioId) {
    await verificarMiembro(req.usuarioId!, categoria.hogarId);
  }

  if (!categoria.usuarioId) {
    throw new AppError(403, 'No puedes modificar una categoría global');
  }

  const data = updateCategoriaSchema.parse(req.body);

  const actualizada = await prisma.categoria.update({
    where: { id: req.params.id },
    data,
  });

  res.json(actualizada);
}));

// DELETE /api/categorias/:id
router.delete('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const categoria = await prisma.categoria.findUnique({ where: { id: req.params.id } });

  if (!categoria) {
    throw new AppError(404, 'Categoría no encontrada');
  }

  if (categoria.usuarioId && categoria.usuarioId !== req.usuarioId) {
    throw new AppError(403, 'No puedes eliminar esta categoría');
  }

  if (categoria.hogarId && categoria.usuarioId) {
    await verificarMiembro(req.usuarioId!, categoria.hogarId);
  }

  if (!categoria.usuarioId) {
    throw new AppError(403, 'No puedes eliminar una categoría global');
  }

  await prisma.categoria.delete({ where: { id: req.params.id } });

  res.json({ mensaje: 'Categoría eliminada' });
}));

export default router;
