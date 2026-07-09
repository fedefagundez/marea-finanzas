import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { verificarMiembro } from '../lib/auth.js';
import { AppError } from '../middlewares/error.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';

const router = Router();

const crearHogarSchema = z.object({
  nombre: z.string().min(1).max(100),
});

const unirseSchema = z.object({
  token: z.string(),
});

const invitarSchema = z.object({
  email: z.string().email().optional(),
});

// POST /api/hogares/unirse - debe ir ANTES de /:id
router.post('/unirse', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const data = unirseSchema.parse(req.body);

  const hogar = await prisma.hogar.findUnique({
    where: { tokenInvitacion: data.token },
  });

  if (!hogar) {
    throw new AppError(400, 'Token de invitación inválido');
  }

  const existente = await prisma.miembroHogar.findUnique({
    where: { usuarioId_hogarId: { usuarioId: req.usuarioId!, hogarId: hogar.id } },
  });

  if (existente) {
    throw new AppError(400, 'Ya eres miembro de este hogar');
  }

  await prisma.miembroHogar.create({
    data: {
      usuarioId: req.usuarioId!,
      hogarId: hogar.id,
      rol: 'MIEMBRO',
    },
  });

  res.json({ mensaje: 'Te uniste al hogar exitosamente', hogar });
}));

// POST /api/hogares - crear hogar
router.post('/', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const data = crearHogarSchema.parse(req.body);

  const hogar = await prisma.hogar.create({
    data: {
      nombre: data.nombre,
      tokenInvitacion: crypto.randomUUID(),
      miembros: {
        create: {
          usuarioId: req.usuarioId!,
          rol: 'ADMIN',
        },
      },
    },
    include: { miembros: true },
  });

  res.status(201).json(hogar);
}));

router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const hogares = await prisma.hogar.findMany({
    where: { miembros: { some: { usuarioId: req.usuarioId } } },
    select: {
      id: true,
      nombre: true,
      createdAt: true,
      tokenInvitacion: true,
      miembros: {
        select: { id: true, rol: true, usuario: { select: { id: true, username: true } } },
      },
      tarjetas: {
        select: { id: true, nombre: true, ultimo4: true, diaCierre: true },
        orderBy: { nombre: 'asc' },
      },
    },
  });

  res.json(hogares);
}));

router.get('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  await verificarMiembro(req.usuarioId!, req.params.id);

  const hogar = await prisma.hogar.findUnique({
    where: { id: req.params.id },
    include: {
      miembros: {
        include: { usuario: { select: { id: true, username: true, email: true } } },
      },
      tarjetas: true,
    },
  });

  if (!hogar) {
    throw new AppError(404, 'Hogar no encontrado');
  }

  res.json(hogar);
}));

router.post('/:id/invitar', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  invitarSchema.parse(req.body);

  const miembro = await verificarMiembro(req.usuarioId!, req.params.id);

  if (miembro.rol !== 'ADMIN') {
    throw new AppError(403, 'Solo el administrador puede invitar');
  }

  const hogar = await prisma.hogar.findUnique({ where: { id: req.params.id } });

  if (!hogar) {
    throw new AppError(404, 'Hogar no encontrado');
  }

  const token = hogar.tokenInvitacion || crypto.randomUUID();

  if (!hogar.tokenInvitacion) {
    await prisma.hogar.update({
      where: { id: req.params.id },
      data: { tokenInvitacion: token },
    });
  }

  res.json({ mensaje: 'Enlace de invitación', hogarId: hogar.id, tokenInvitacion: token });
}));

router.delete('/:hogarId/miembros/:miembroId', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const miembro = await verificarMiembro(req.usuarioId!, req.params.hogarId);

  if (miembro.rol !== 'ADMIN') {
    throw new AppError(403, 'Solo el administrador puede quitar miembros');
  }

  const target = await prisma.miembroHogar.findUnique({
    where: { id: req.params.miembroId },
  });

  if (!target || target.hogarId !== req.params.hogarId) {
    throw new AppError(404, 'Miembro no encontrado en este hogar');
  }

  if (target.usuarioId === req.usuarioId) {
    throw new AppError(400, 'No puedes eliminarte a ti mismo del hogar');
  }

  await prisma.miembroHogar.delete({ where: { id: req.params.miembroId } });

  res.json({ mensaje: 'Miembro eliminado del hogar' });
}));

router.delete('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const miembro = await verificarMiembro(req.usuarioId!, req.params.id);

  if (miembro.rol !== 'ADMIN') {
    throw new AppError(403, 'Solo el administrador puede eliminar el hogar');
  }

  await prisma.hogar.delete({ where: { id: req.params.id } });

  res.json({ mensaje: 'Hogar eliminado' });
}));

export default router;
