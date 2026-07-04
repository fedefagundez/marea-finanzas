import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/index.js';
import { AppError } from '../middlewares/error.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';
import { adminMiddleware } from '../middlewares/admin.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

router.use(authMiddleware, asyncHandler(adminMiddleware));

router.get('/usuarios', asyncHandler(async (_req: AuthRequest, res) => {
  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      rol: true,
      createdAt: true,
      _count: {
        select: {
          ingresos: true,
          gastos: true,
          metas: true,
          miembros: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(usuarios.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    rol: u.rol,
    createdAt: u.createdAt,
    hogares: u._count.miembros,
    movimientos: u._count.ingresos + u._count.gastos,
    metas: u._count.metas,
  })));
}));

router.delete('/usuarios/:id', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  if (id === req.usuarioId) {
    throw new AppError(400, 'No puedes eliminarte a ti mismo');
  }

  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) {
    throw new AppError(404, 'Usuario no encontrado');
  }

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { usuarioId: id } }),
    prisma.meta.deleteMany({ where: { usuarioId: id } }),
    prisma.gasto.deleteMany({ where: { usuarioId: id } }),
    prisma.ingreso.deleteMany({ where: { usuarioId: id } }),
    prisma.miembroHogar.deleteMany({ where: { usuarioId: id } }),
    prisma.categoria.deleteMany({ where: { usuarioId: id } }),
    prisma.usuario.delete({ where: { id } }),
  ]);

  res.json({ mensaje: 'Usuario eliminado correctamente' });
}));

const resetPasswordSchema = z.object({
  password: z.string().min(8),
});

router.post('/usuarios/:id/reset-password', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const data = resetPasswordSchema.parse(req.body);

  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) {
    throw new AppError(404, 'Usuario no encontrado');
  }

  const passwordHash = await bcrypt.hash(data.password, config.bcrypt.saltRounds);

  await prisma.usuario.update({
    where: { id },
    data: { passwordHash },
  });

  res.json({ mensaje: 'Contraseña restablecida correctamente' });
}));

const changeRolSchema = z.object({
  rol: z.enum(['USER', 'ADMIN']),
});

router.put('/usuarios/:id/rol', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const data = changeRolSchema.parse(req.body);

  if (id === req.usuarioId) {
    throw new AppError(400, 'No puedes cambiar tu propio rol');
  }

  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) {
    throw new AppError(404, 'Usuario no encontrado');
  }

  await prisma.usuario.update({
    where: { id },
    data: { rol: data.rol },
  });

  res.json({ mensaje: `Rol actualizado a ${data.rol}` });
}));

export default router;
