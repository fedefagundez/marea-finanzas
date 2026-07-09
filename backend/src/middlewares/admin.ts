import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from './auth.js';
import { AppError } from './error.js';

export const adminMiddleware = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.usuarioId },
    select: { rol: true },
  });

  if (!usuario || usuario.rol !== 'ADMIN') {
    throw new AppError(403, 'Acceso denegado: se requieren permisos de administrador');
  }

  req.usuarioRol = usuario.rol;
  next();
};
