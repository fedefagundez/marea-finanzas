import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthRequest } from './auth.js';

export const adminMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.usuarioId },
    select: { rol: true },
  });

  if (!usuario || usuario.rol !== 'ADMIN') {
    res.status(403).json({ error: 'Acceso denegado: se requieren permisos de administrador' });
    return;
  }

  req.usuarioRol = usuario.rol;
  next();
};
