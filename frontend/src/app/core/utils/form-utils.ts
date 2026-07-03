export const toInputDate = (fecha?: string | null): string =>
  fecha ? fecha.split('T')[0] : '';

export const hoyInputDate = (): string => new Date().toISOString().split('T')[0];

export interface Validacion {
  ok: boolean;
  mensaje?: string;
}

export const validarDescripcion = (descripcion: string, maxLength = 100): Validacion => {
  const limpia = descripcion.trim();
  if (!limpia) return { ok: false, mensaje: 'La descripción es obligatoria' };
  if (limpia.length > maxLength) return { ok: false, mensaje: `La descripción no puede superar los ${maxLength} caracteres` };
  return { ok: true };
};

export const validarMontoPositivo = (monto: number): Validacion => {
  if (!monto || monto <= 0) return { ok: false, mensaje: 'El monto debe ser mayor a 0' };
  return { ok: true };
};

export const validarNombre = (nombre: string, maxLength = 100): Validacion => {
  const limpio = nombre.trim();
  if (!limpio) return { ok: false, mensaje: 'El nombre es obligatorio' };
  if (limpio.length > maxLength) return { ok: false, mensaje: `El nombre no puede superar los ${maxLength} caracteres` };
  return { ok: true };
};

export const validarUltimos4 = (ultimo4: string): Validacion => {
  if (!/^\d{4}$/.test(ultimo4.trim())) return { ok: false, mensaje: 'Los últimos 4 dígitos deben ser numéricos' };
  return { ok: true };
};
