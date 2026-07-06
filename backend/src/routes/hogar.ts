import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { verificarMiembro } from '../lib/auth.js';
import { AppError } from '../middlewares/error.js';
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
router.post('/unirse', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    console.log('=== UNIRSE ===');
    console.log('Body:', JSON.stringify(req.body));
    console.log('UsuarioId:', req.usuarioId);

    const data = unirseSchema.parse(req.body);
    console.log('Token recibido:', data.token);

    // Buscar todos los hogares con token para debug
    const todosConToken = await prisma.hogar.findMany({
      where: { tokenInvitacion: { not: null } },
      select: { id: true, nombre: true, tokenInvitacion: true },
    });
    console.log('Hogares con token:', todosConToken.map(h => ({ nombre: h.nombre, token: h.tokenInvitacion })));

    const hogar = await prisma.hogar.findUnique({
      where: { tokenInvitacion: data.token },
    });

    console.log('Hogar encontrado:', hogar ? hogar.nombre : 'NO');

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

    console.log('OK - Miembro creado');
    res.json({ mensaje: 'Te uniste al hogar exitosamente', hogar });
  } catch (error) {
    console.error('Error en unirse:', error);
    next(error);
  }
});

// POST /api/hogares - crear hogar
router.post('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

// GET /api/hogares - listar hogares
router.get('/', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
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
          select: { id: true, nombre: true, ultimo4: true },
          orderBy: { nombre: 'asc' },
        },
      },
    });

    res.json(hogares);
  } catch (error) {
    next(error);
  }
});

// GET /api/hogares/:id
router.get('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

// POST /api/hogares/:id/invitar
router.post('/:id/invitar', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

// DELETE /api/hogares/:hogarId/miembros/:miembroId
router.delete('/:hogarId/miembros/:miembroId', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
});

// DELETE /api/hogares/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const miembro = await verificarMiembro(req.usuarioId!, req.params.id);

    if (miembro.rol !== 'ADMIN') {
      throw new AppError(403, 'Solo el administrador puede eliminar el hogar');
    }

    await prisma.hogar.delete({ where: { id: req.params.id } });

    res.json({ mensaje: 'Hogar eliminado' });
  } catch (error) {
    next(error);
  }
});

export default router;
