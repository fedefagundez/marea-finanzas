export interface DateRange {
  desde: string;
  hasta: string;
}

const calcularRango = (preset: string): DateRange => {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = hoy.getMonth();

  switch (preset) {
    case 'este-mes': {
      const desde = new Date(y, m, 1);
      const hasta = new Date(y, m + 1, 0);
      return { desde: desde.toISOString().slice(0, 10), hasta: hasta.toISOString().slice(0, 10) };
    }
    case 'mes-anterior': {
      const desde = new Date(y, m - 1, 1);
      const hasta = new Date(y, m, 0);
      return { desde: desde.toISOString().slice(0, 10), hasta: hasta.toISOString().slice(0, 10) };
    }
    case 'ultimos-3': {
      const desde = new Date(y, m - 3, 1);
      const hasta = hoy;
      return { desde: desde.toISOString().slice(0, 10), hasta: hasta.toISOString().slice(0, 10) };
    }
    case 'ultimos-6': {
      const desde = new Date(y, m - 6, 1);
      const hasta = hoy;
      return { desde: desde.toISOString().slice(0, 10), hasta: hasta.toISOString().slice(0, 10) };
    }
    case 'este-anio': {
      const desde = new Date(y, 0, 1);
      const hasta = new Date(y, 11, 31);
      return { desde: desde.toISOString().slice(0, 10), hasta: hasta.toISOString().slice(0, 10) };
    }
    default:
      return { desde: '', hasta: '' };
  }
};

export const presets = [
  { id: 'este-mes', label: 'Este mes' },
  { id: 'mes-anterior', label: 'Mes anterior' },
  { id: 'ultimos-3', label: 'Últ. 3 meses' },
  { id: 'ultimos-6', label: 'Últ. 6 meses' },
  { id: 'este-anio', label: 'Este año' },
];

export default calcularRango;
