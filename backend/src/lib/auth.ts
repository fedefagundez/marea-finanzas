import { prisma } from './prisma.js';
import { AppError } from '../middlewares/error.js';

export const verificarMiembro = async (usuarioId: string, hogarId: string) => {
  const miembro = await prisma.miembroHogar.findUnique({
    where: { usuarioId_hogarId: { usuarioId, hogarId } },
  });

  if (!miembro) {
    throw new AppError(403, 'No eres miembro de este hogar');
  }

  return miembro;
};
