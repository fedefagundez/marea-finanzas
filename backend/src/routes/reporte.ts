import { Router } from 'express';
import { startOfMonth, endOfMonth, addMonths, format, parseISO, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import multer from 'multer';
import { prisma } from '../lib/prisma.js';
import { verificarMiembro } from '../lib/auth.js';
import { calcularTotales } from '../lib/reporte-utils.js';
import { esGastoVigente, ajustarFechaPorCierre } from '../lib/calculos.js';
import { csvEscape, csvParseLine } from '../lib/csv-utils.js';
import { AppError } from '../middlewares/error.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

async function obtenerMapaCierre(hogarId: string): Promise<Map<string, number>> {
  const tarjetas = await prisma.tarjetaCredito.findMany({
    where: { hogarId },
    select: { id: true, diaCierre: true },
  });
  return new Map(tarjetas.filter(t => t.diaCierre != null).map(t => [t.id, t.diaCierre!]));
}

function ajustarGastos<T extends { tarjetaId?: string | null; fechaInicio: Date | null }>(
  gastos: T[],
  mapaCierre: Map<string, number>,
) {
  return gastos.map(g => ajustarFechaPorCierre(g, mapaCierre));
}

async function cargarDatosReporte(hogarId: string) {
  const [ingresos, gastos] = await Promise.all([
    prisma.ingreso.findMany({ where: { hogarId } }),
    prisma.gasto.findMany({ where: { hogarId } }),
  ]);
  const mapaCierre = await obtenerMapaCierre(hogarId);
  return { ingresos, gastos: ajustarGastos(gastos, mapaCierre) };
}

router.get('/hogar/:hogarId/dashboard', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  await verificarMiembro(req.usuarioId!, req.params.hogarId);

  const hogarId = req.params.hogarId;
  const hoy = new Date();
  const mesActual = startOfMonth(hoy);
  const finMesActual = endOfMonth(hoy);

  const { ingresos, gastos: gastosAjustados } = await cargarDatosReporte(hogarId);

  const { totalIngresos, totalGastos, balance } = calcularTotales(
    ingresos,
    gastosAjustados,
    mesActual,
    finMesActual
  );

  res.json({
    mes: format(hoy, 'MMMM yyyy', { locale: es }),
    totalIngresos,
    totalGastos,
    balance,
  });
}));

router.get('/hogar/:hogarId/evolucion', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  await verificarMiembro(req.usuarioId!, req.params.hogarId);

  const hogarId = req.params.hogarId;
  const meses = parseInt(req.query.meses as string) || 6;
  const hoy = new Date();

  const { ingresos, gastos: gastosAjustados } = await cargarDatosReporte(hogarId);

  const resultados = [];

  for (let i = -meses + 1; i <= 0; i++) {
    const fecha = addMonths(hoy, i);
    const inicio = startOfMonth(fecha);
    const fin = endOfMonth(fecha);

    const { totalIngresos, totalGastos, balance } = calcularTotales(
      ingresos,
      gastosAjustados,
      inicio,
      fin
    );

    resultados.push({
      mes: format(fecha, 'yyyy-MM'),
      label: format(fecha, 'MMM yyyy', { locale: es }),
      ingresos: totalIngresos,
      gastos: totalGastos,
      balance,
    });
  }

  res.json(resultados);
}));

router.get('/hogar/:hogarId/proyeccion', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  await verificarMiembro(req.usuarioId!, req.params.hogarId);

  const hogarId = req.params.hogarId;
  const meses = parseInt(req.query.meses as string) || 3;
  const hoy = new Date();

  const { ingresos, gastos: gastosAjustados } = await cargarDatosReporte(hogarId);

  const resultados = [];

  for (let i = 0; i <= meses; i++) {
    const fecha = addMonths(hoy, i);
    const inicio = startOfMonth(fecha);
    const fin = endOfMonth(fecha);

    const { totalIngresos, totalGastos, balance } = calcularTotales(
      ingresos,
      gastosAjustados,
      inicio,
      fin,
      { incluirPuntuales: false }
    );

    resultados.push({
      mes: format(fecha, 'yyyy-MM'),
      label: format(fecha, 'MMM yyyy', { locale: es }),
      ingresos: totalIngresos,
      gastos: totalGastos,
      balance,
    });
  }

  res.json(resultados);
}));

router.get('/hogar/:hogarId/evolucion-completa', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  await verificarMiembro(req.usuarioId!, req.params.hogarId);

  const hogarId = req.params.hogarId;
  const pasado = parseInt(req.query.pasado as string) || 6;
  const futuro = parseInt(req.query.futuro as string) || 6;
  const hoy = new Date();

  const { ingresos, gastos: gastosAjustados } = await cargarDatosReporte(hogarId);

  const data: { mes: string; label: string; ingresos: number; gastos: number; balance: number; tipo: 'REAL' | 'PROYECTADO' }[] = [];

  for (let i = -pasado; i <= futuro; i++) {
    const fecha = addMonths(hoy, i);
    const inicio = startOfMonth(fecha);
    const fin = endOfMonth(fecha);
    const esFuturo = i > 0;

    const { totalIngresos, totalGastos, balance } = calcularTotales(
      ingresos,
      gastosAjustados,
      inicio,
      fin,
      { incluirPuntuales: !esFuturo }
    );

    data.push({
      mes: format(fecha, 'yyyy-MM'),
      label: format(fecha, 'MMM yyyy', { locale: es }),
      ingresos: totalIngresos,
      gastos: totalGastos,
      balance,
      tipo: esFuturo ? 'PROYECTADO' : 'REAL',
    });
  }

  res.json({ data });
}));

router.get('/hogar/:hogarId/balance-mes', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  await verificarMiembro(req.usuarioId!, req.params.hogarId);

  const hogarId = req.params.hogarId;
  const mesParam = req.query.mes as string;
  if (!mesParam || !/^\d{4}-\d{2}$/.test(mesParam)) {
    throw new AppError(400, 'El parámetro mes debe tener formato YYYY-MM');
  }

  const fecha = parseISO(`${mesParam}-01`);
  const inicio = startOfMonth(fecha);
  const fin = endOfMonth(fecha);
  const hoy = new Date();
  const esFuturo = isAfter(inicio, startOfMonth(hoy));

  const { ingresos, gastos: gastosAjustados } = await cargarDatosReporte(hogarId);

  const { totalIngresos, totalGastos, balance } = calcularTotales(
    ingresos,
    gastosAjustados,
    inicio,
    fin,
    { incluirPuntuales: !esFuturo }
  );

  res.json({
    mes: mesParam,
    totalIngresos,
    totalGastos,
    balance,
    tipo: esFuturo ? 'PROYECTADO' : 'REAL',
  });
}));

router.get('/hogar/:hogarId/distribucion-gastos', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  await verificarMiembro(req.usuarioId!, req.params.hogarId);

  const hogarId = req.params.hogarId;
  const hoy = new Date();
  const inicio = startOfMonth(hoy);
  const fin = endOfMonth(hoy);

  const gastos = await prisma.gasto.findMany({
    where: { hogarId },
    include: { categoria: { select: { id: true, nombre: true, icon: true } } },
  });
  const mapaCierre = await obtenerMapaCierre(hogarId);
  const gastosAjustados = ajustarGastos(gastos, mapaCierre);

  const filtrados = gastosAjustados.filter(g => esGastoVigente(g, inicio, fin));

  const agrupado: Record<string, { total: number; categoria: { id: string | null; nombre: string; icon: string } }> = {};

  for (const g of filtrados) {
    const key = g.categoriaId ?? '__sin_categoria__';
    if (!agrupado[key]) {
      agrupado[key] = {
        total: 0,
        categoria: g.categoria
          ? { id: g.categoria.id, nombre: g.categoria.nombre, icon: g.categoria.icon }
          : { id: null, nombre: 'Sin categoría', icon: '📂' },
      };
    }
    const montoGasto = Number(g.monto);
    agrupado[key].total += g.cuotasTotales ? montoGasto / g.cuotasTotales : montoGasto;
  }

  const totalGeneral = Object.values(agrupado).reduce((s, v) => s + v.total, 0);

  const resultado = Object.values(agrupado)
    .map(({ total, categoria }) => ({
      categoriaId: categoria.id,
      nombre: categoria.nombre,
      icon: categoria.icon,
      total,
      porcentaje: totalGeneral > 0 ? Math.round((total / totalGeneral) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  res.json(resultado);
}));

router.get('/hogar/:hogarId/movimientos-recientes', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  await verificarMiembro(req.usuarioId!, req.params.hogarId);

  const hogarId = req.params.hogarId;
  const limite = parseInt(req.query.limite as string) || 5;

  const [ingresos, gastos] = await Promise.all([
    prisma.ingreso.findMany({ where: { hogarId }, orderBy: { createdAt: 'desc' }, take: limite }),
    prisma.gasto.findMany({ where: { hogarId }, orderBy: { createdAt: 'desc' }, take: limite }),
  ]);

  const movimientos = [
    ...ingresos.map(i => ({
      id: i.id,
      tipo: 'INGRESO' as const,
      descripcion: i.descripcion,
      monto: Number(i.monto),
      fecha: i.fechaInicio ? i.fechaInicio.toISOString() : i.createdAt.toISOString(),
      fechaCreacion: i.createdAt.toISOString(),
    })),
    ...gastos.map(g => ({
      id: g.id,
      tipo: 'GASTO' as const,
      descripcion: g.descripcion,
      monto: Number(g.monto),
      fecha: g.fechaInicio ? g.fechaInicio.toISOString() : g.createdAt.toISOString(),
      fechaCreacion: g.createdAt.toISOString(),
    })),
  ];

  movimientos.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());

  res.json(movimientos.slice(0, limite));
}));

router.get('/hogar/:hogarId/exportar-csv', authMiddleware, asyncHandler(async (req: AuthRequest, res) => {
  await verificarMiembro(req.usuarioId!, req.params.hogarId);

  const hogarId = req.params.hogarId;

  const [ingresos, gastos, metas, tarjetas] = await Promise.all([
    prisma.ingreso.findMany({
      where: { hogarId },
      include: { usuario: { select: { username: true } } },
    }),
    prisma.gasto.findMany({
      where: { hogarId },
      include: { categoria: { select: { nombre: true, icon: true } }, usuario: { select: { username: true } }, tarjeta: { select: { nombre: true, ultimo4: true } } },
    }),
    prisma.meta.findMany({
      where: { hogarId },
      include: { usuario: { select: { username: true } } },
    }),
    prisma.tarjetaCredito.findMany({ where: { hogarId } }),
  ]);

  const tarjetaMap = new Map(tarjetas.map(t => [t.id, `${t.nombre} (****${t.ultimo4})`]));

  const header = 'tipo_movimiento,descripcion,monto,tipo,fecha_inicio,fecha_fin,categoria,usuario,tarjeta,cuotas_totales,cuotas_pagadas,monto_objetivo,monto_actual,fecha_limite,cuota_mensual,ultimo4,dia_cierre,created_at';
  const rows: string[] = [header];

  for (const ing of ingresos) {
    rows.push([
      'INGRESO',
      csvEscape(ing.descripcion),
      csvEscape(Number(ing.monto)),
      csvEscape(ing.tipo),
      csvEscape(ing.fechaInicio ? format(ing.fechaInicio, 'yyyy-MM-dd') : ''),
      csvEscape(ing.fechaFin ? format(ing.fechaFin, 'yyyy-MM-dd') : ''),
      '',
      csvEscape(ing.usuario?.username ?? ''),
      '', '', '',
      '', '', '', '',
      '', '',
      csvEscape(ing.createdAt ? format(ing.createdAt, 'yyyy-MM-dd HH:mm:ss') : ''),
    ].join(','));
  }

  for (const g of gastos) {
    rows.push([
      'GASTO',
      csvEscape(g.descripcion),
      csvEscape(Number(g.monto)),
      csvEscape(g.tipo),
      csvEscape(g.fechaInicio ? format(g.fechaInicio, 'yyyy-MM-dd') : ''),
      '',
      csvEscape(g.categoria ? `${g.categoria.icon} ${g.categoria.nombre}` : ''),
      csvEscape(g.usuario?.username ?? ''),
      csvEscape(g.tarjetaId ? (tarjetaMap.get(g.tarjetaId) ?? '') : ''),
      csvEscape(g.cuotasTotales ?? ''),
      csvEscape(g.cuotasPagadas),
      '', '', '', '',
      '', '',
      csvEscape(g.createdAt ? format(g.createdAt, 'yyyy-MM-dd HH:mm:ss') : ''),
    ].join(','));
  }

  for (const m of metas) {
    rows.push([
      'META',
      csvEscape(m.nombre),
      '', '', '',
      '',
      '',
      csvEscape(m.usuario?.username ?? ''),
      '',
      '', '',
      csvEscape(Number(m.montoObjetivo)),
      csvEscape(Number(m.montoActual)),
      csvEscape(format(m.fechaLimite, 'yyyy-MM-dd')),
      csvEscape(m.cuotaMensual ? Number(m.cuotaMensual) : ''),
      '', '',
      csvEscape(m.createdAt ? format(m.createdAt, 'yyyy-MM-dd HH:mm:ss') : ''),
    ].join(','));
  }

  for (const t of tarjetas) {
    rows.push([
      'TARJETA',
      csvEscape(t.nombre),
      '', '', '',
      '',
      '',
      '',
      '', '', '',
      '', '', '', '',
      csvEscape(t.ultimo4),
      csvEscape(t.diaCierre ?? ''),
      '',
    ].join(','));
  }

  const csv = rows.join('\n');
  const filename = `marea-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + csv);
}));

router.post('/hogar/:hogarId/importar-csv', authMiddleware, upload.single('archivo'), asyncHandler(async (req: AuthRequest, res) => {
  await verificarMiembro(req.usuarioId!, req.params.hogarId);

  if (!req.file) throw new AppError(400, 'Debes subir un archivo CSV');

  const hogarId = req.params.hogarId;
  const contenido = req.file.buffer.toString('utf-8').replace(/^\uFEFF/, '');
  const lineas = contenido.split('\n').map(l => l.trim()).filter(Boolean);

  if (lineas.length < 2) throw new AppError(400, 'El CSV está vacío');

  const cabeceras = lineas[0].split(',').map(h => h.trim().toLowerCase());
  const idx = (name: string) => cabeceras.indexOf(name);

  const idxTipoMov = idx('tipo_movimiento');
  const idxDesc = idx('descripcion');
  const idxMonto = idx('monto');
  const idxFecha = idx('fecha_inicio') !== -1 ? idx('fecha_inicio') : idx('fecha');
  const idxFechaFin = idx('fecha_fin');
  const idxTipo = idx('tipo');
  const idxCategoria = idx('categoria');
  const idxTarjeta = idx('tarjeta');
  const idxCuotasTotales = idx('cuotas_totales');
  const idxCuotasPagadas = idx('cuotas_pagadas');
  const idxMontoObj = idx('monto_objetivo');
  const idxMontoAct = idx('monto_actual');
  const idxFechaLim = idx('fecha_limite');
  const idxCuotaMensual = idx('cuota_mensual');
  const idxUltimo4 = idx('ultimo4');
  const idxDiaCierre = idx('dia_cierre');

  if (idxTipoMov === -1 || idxDesc === -1) {
    throw new AppError(400, 'El CSV debe tener las columnas: tipo_movimiento, descripcion');
  }

  let creados = 0;
  const errores: string[] = [];

  for (let i = 1; i < lineas.length; i++) {
    const cols = csvParseLine(lineas[i]);
    const tipoMov = (cols[idxTipoMov] ?? '').trim().toUpperCase();
    const descripcion = (cols[idxDesc] ?? '').trim();
    const montoRaw = (cols[idxMonto] ?? '').trim().replace(/[$,]/g, '');
    const monto = parseFloat(montoRaw);
    const fecha = idxFecha !== -1 ? (cols[idxFecha] ?? '').trim() : '';
    const fechaFinRaw = idxFechaFin !== -1 ? (cols[idxFechaFin] ?? '').trim() : '';
    const tipo = idxTipo !== -1 ? (cols[idxTipo] ?? '').trim().toUpperCase() : 'PUNTUAL';

    if (tipoMov === 'TARJETA') {
      if (!descripcion) {
        errores.push(`Línea ${i + 1}: tarjeta sin nombre`);
        continue;
      }
      const ultimo4 = idxUltimo4 !== -1 ? (cols[idxUltimo4] ?? '').trim() : '';
      const diaCierreRaw = idxDiaCierre !== -1 ? (cols[idxDiaCierre] ?? '').trim() : '';
      const diaCierre = parseInt(diaCierreRaw, 10);

      try {
        const existente = await prisma.tarjetaCredito.findFirst({
          where: { hogarId, nombre: descripcion },
        });
        if (!existente) {
          await prisma.tarjetaCredito.create({
            data: {
              hogarId,
              nombre: descripcion,
              ultimo4: ultimo4 || '0000',
              diaCierre: !isNaN(diaCierre) ? diaCierre : null,
            },
          });
          creados++;
        }
      } catch (e) {
        errores.push(`Línea ${i + 1}: error al crear tarjeta`);
      }
      continue;
    }

    if (tipoMov === 'META') {
      const montoObjRaw = idxMontoObj !== -1 ? (cols[idxMontoObj] ?? '').trim().replace(/[$,]/g, '') : '';
      const montoObj = parseFloat(montoObjRaw);
      const montoActRaw = idxMontoAct !== -1 ? (cols[idxMontoAct] ?? '').trim().replace(/[$,]/g, '') : '';
      const montoAct = parseFloat(montoActRaw);
      const fechaLim = idxFechaLim !== -1 ? (cols[idxFechaLim] ?? '').trim() : '';
      const cuotaMensualRaw = idxCuotaMensual !== -1 ? (cols[idxCuotaMensual] ?? '').trim().replace(/[$,]/g, '') : '';
      const cuotaMensual = parseFloat(cuotaMensualRaw);

      if (!descripcion || isNaN(montoObj) || montoObj <= 0) {
        errores.push(`Línea ${i + 1}: meta sin nombre o monto_objetivo inválido`);
        continue;
      }

      try {
        await prisma.meta.create({
          data: {
            hogarId,
            usuarioId: req.usuarioId!,
            nombre: descripcion,
            montoObjetivo: montoObj,
            montoActual: isNaN(montoAct) || montoAct < 0 ? 0 : montoAct,
            fechaLimite: fechaLim ? new Date(fechaLim) : new Date(),
            cuotaMensual: isNaN(cuotaMensual) ? null : cuotaMensual,
          },
        });
        creados++;
      } catch (e) {
        errores.push(`Línea ${i + 1}: error al crear meta`);
      }
      continue;
    }

    if (idxMonto === -1 || !descripcion || isNaN(monto) || monto <= 0) {
      errores.push(`Línea ${i + 1}: descripción o monto inválido`);
      continue;
    }

    if (tipoMov !== 'INGRESO' && tipoMov !== 'GASTO') {
      errores.push(`Línea ${i + 1}: tipo_movimiento debe ser INGRESO, GASTO, META o TARJETA`);
      continue;
    }

    const tipoValido = ['PUNTUAL', 'RECURRENTE', 'INDEFINIDO'].includes(tipo) ? tipo : 'PUNTUAL';
    const fechaInicio = fecha ? new Date(fecha) : undefined;
    const fechaFin = fechaFinRaw ? new Date(fechaFinRaw) : undefined;

    const cuotasTotalesRaw = idxCuotasTotales !== -1 ? (cols[idxCuotasTotales] ?? '').trim() : '';
    const cuotasTotales = parseInt(cuotasTotalesRaw, 10);
    const cuotasPagadasRaw = idxCuotasPagadas !== -1 ? (cols[idxCuotasPagadas] ?? '').trim() : '';
    const cuotasPagadas = parseInt(cuotasPagadasRaw, 10);

    let tarjetaId: string | undefined;

    if (idxTarjeta !== -1 && tipoMov === 'GASTO') {
      const tarjetaStr = (cols[idxTarjeta] ?? '').trim();
      if (tarjetaStr) {
        const tarjetaExistente = await prisma.tarjetaCredito.findFirst({
          where: { hogarId, nombre: tarjetaStr.split(' (****')[0] },
        });
        if (tarjetaExistente) tarjetaId = tarjetaExistente.id;
      }
    }

    try {
      if (tipoMov === 'INGRESO') {
        await prisma.ingreso.create({
          data: {
            hogarId,
            usuarioId: req.usuarioId!,
            descripcion,
            monto,
            tipo: tipoValido as 'PUNTUAL' | 'RECURRENTE' | 'INDEFINIDO',
            fechaInicio,
            fechaFin,
          },
        });
      } else {
        await prisma.gasto.create({
          data: {
            hogarId,
            usuarioId: req.usuarioId!,
            descripcion,
            monto,
            tipo: tipoValido as 'PUNTUAL' | 'RECURRENTE' | 'INDEFINIDO',
            fechaInicio,
            cuotasTotales: !isNaN(cuotasTotales) && cuotasTotales > 0 ? cuotasTotales : null,
            cuotasPagadas: !isNaN(cuotasPagadas) && cuotasPagadas >= 0 ? cuotasPagadas : 0,
            tarjetaId,
          },
        });
      }
      creados++;
    } catch (e) {
      errores.push(`Línea ${i + 1}: error al crear`);
    }
  }

  res.json({ mensaje: `Se importaron ${creados} movimientos${errores.length ? ` (${errores.length} errores)` : ''}`, errores: errores.length ? errores : undefined });
}));

export default router;