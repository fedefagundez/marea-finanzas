import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { config } from './config/index.js';
import { errorMiddleware } from './middlewares/error.js';
import authRoutes from './routes/auth.js';
import hogarRoutes from './routes/hogar.js';
import ingresoRoutes from './routes/ingreso.js';
import gastoRoutes from './routes/gasto.js';
import tarjetaRoutes from './routes/tarjeta.js';
import reporteRoutes from './routes/reporte.js';
import categoriaRoutes from './routes/categoria.js';
import metaRoutes from './routes/meta.js';
import adminRoutes from './routes/admin.js';
import simulacionRoutes from './routes/simulacion.js';

const app = express();

app.use(cors({ origin: config.frontendUrl }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/hogares', hogarRoutes);
app.use('/api/ingresos', ingresoRoutes);
app.use('/api/gastos', gastoRoutes);
app.use('/api/tarjetas', tarjetaRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/metas', metaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/simulaciones', simulacionRoutes);

const publicPath = path.resolve('public');
app.use(express.static(publicPath));

app.get('/debug-files', (_req, res) => {
  const listDir = (dir: string, prefix: string = ''): string[] => {
    try {
      return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry): string[] => {
        const full = path.join(dir, entry.name);
        const rel = prefix + entry.name;
        if (entry.isDirectory()) return [rel + '/', ...listDir(full, rel + '/')];
        return [rel];
      });
    } catch { return [`(error reading ${dir})`]; }
  };
  res.json({
    cwd: process.cwd(),
    publicPath,
    publicExists: fs.existsSync(publicPath),
    files: listDir(publicPath),
  });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.use(errorMiddleware);

export default app;
