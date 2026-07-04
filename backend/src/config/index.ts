import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4200',
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    expiresIn: '15m',
    refreshExpiresIn: '7d',
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
  },
  bcrypt: {
    saltRounds: 12,
  },
};
