import express from 'express';
import path from 'path';
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

app.use(express.static('public'));

app.get('*', (_req, res) => {
  res.sendFile(path.resolve('public/index.html'));
});

app.use(errorMiddleware);

export default app;
