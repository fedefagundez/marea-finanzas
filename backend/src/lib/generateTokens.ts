import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';

export const generateTokens = (usuarioId: string) => {
  const token = jwt.sign({ usuarioId }, config.jwt.secret as Secret, {
    expiresIn: config.jwt.expiresIn,
  } as SignOptions);

  const refreshToken = jwt.sign({ usuarioId }, config.jwt.refreshSecret as Secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as SignOptions);

  return { token, refreshToken };
};
