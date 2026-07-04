import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/index.js';
import { AppError } from '../middlewares/error.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { generateTokens } from '../lib/generateTokens.js';
import { sendPasswordResetEmail } from '../services/mail.service.js';

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/).transform(s => s.trim()),
  email: z.string().email().transform(s => s.trim()),
  password: z.string().min(8),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

router.post('/register', asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);

  const existente = await prisma.usuario.findFirst({
    where: { OR: [{ username: data.username }, { email: data.email }] },
  });

  if (existente) {
    throw new AppError(400, 'Usuario o email ya registrado');
  }

  const passwordHash = await bcrypt.hash(data.password, config.bcrypt.saltRounds);

  const usuario = await prisma.usuario.create({
    data: {
      username: data.username,
      email: data.email,
      passwordHash,
    },
  });

  const { token, refreshToken } = generateTokens(usuario.id);

  res.status(201).json({ token, refreshToken, usuario: { id: usuario.id, username: usuario.username, email: usuario.email } });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);

  const usuario = await prisma.usuario.findFirst({
    where: { OR: [{ username: data.username }, { email: data.username }] },
  });

  if (!usuario) {
    throw new AppError(401, 'Credenciales inválidas');
  }

  const valido = await bcrypt.compare(data.password, usuario.passwordHash);

  if (!valido) {
    throw new AppError(401, 'Credenciales inválidas');
  }

  const { token, refreshToken } = generateTokens(usuario.id);

  res.json({ token, refreshToken, usuario: { id: usuario.id, username: usuario.username, email: usuario.email } });
}));

router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError(400, 'Refresh token requerido');
  }

  const payload = jwt.verify(refreshToken, config.jwt.refreshSecret) as { usuarioId: string };

  const usuario = await prisma.usuario.findUnique({ where: { id: payload.usuarioId } });

  if (!usuario) {
    throw new AppError(401, 'Usuario no encontrado');
  }

  const token = jwt.sign({ usuarioId: usuario.id }, config.jwt.secret as Secret, {
    expiresIn: config.jwt.expiresIn,
  } as SignOptions);

  res.json({ token });
}));

router.get('/me', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.usuarioId },
    select: { id: true, username: true, email: true, createdAt: true },
  });

  if (!usuario) {
    throw new AppError(404, 'Usuario no encontrado');
  }

  res.json(usuario);
}));

router.post('/forgot-password', asyncHandler(async (req, res) => {
  const data = forgotPasswordSchema.parse(req.body);

  const usuario = await prisma.usuario.findUnique({
    where: { email: data.email },
  });

  if (usuario) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        token,
        usuarioId: usuario.id,
        expiresAt,
      },
    });

    const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
    await sendPasswordResetEmail(usuario.email, resetUrl);
  }

  res.json({ message: 'Si el email está registrado, recibirás instrucciones para restablecer tu contraseña.' });
}));

router.post('/reset-password', asyncHandler(async (req, res) => {
  const data = resetPasswordSchema.parse(req.body);

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: data.token },
    include: { usuario: true },
  });

  if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
    throw new AppError(400, 'El enlace de recuperación es inválido o ha expirado');
  }

  const passwordHash = await bcrypt.hash(data.password, config.bcrypt.saltRounds);

  await prisma.$transaction([
    prisma.usuario.update({
      where: { id: resetToken.usuarioId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    }),
  ]);

  res.json({ message: 'Contraseña actualizada correctamente' });
}));

export default router;
