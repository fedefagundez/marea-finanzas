# Marea — Finanzas del hogar

**Marea** es una aplicación web multiusuario para gestionar las finanzas del hogar. Permite registrar ingresos y gastos (puntuales, recurrentes o indefinidos), proyectar balances futuros, administrar tarjetas de crédito con cuotas, categorizar movimientos, establecer metas de ahorro y compartir la gestión con otros miembros del hogar.

Está pensada para personas que quieren entender a dónde va su dinero mes a mes, planificar gastos futuros y mantener el control financiero del hogar en un solo lugar, con acceso compartido.

---

## Funcionalidades

- **Dashboard**: resumen del mes (ingresos, gastos, balance), variación vs mes anterior, distribución de gastos por categoría (gráfico tipo donut), evolución mensual con proyección a 6 meses (gráfico de líneas), balance por mes individual, movimientos recientes.
- **Ingresos**: alta, edición y baja de ingresos (puntuales, recurrentes, indefinidos). Filtros por rango de fechas con chips predefinidos (Este mes, Mes anterior, Últ. 3 meses, Últ. 6 meses, Este año).
- **Gastos**: alta, edición y baja de gastos. Soporte para cuotas (el monto total se divide mensualmente con seguimiento de cuotas pagadas). Filtros por fecha, tipo, categoría y tarjeta.
- **Tarjetas de crédito**: administración de tarjetas asociadas al hogar.
- **Categorías**: categorías globales por defecto (Comida, Transporte, Servicios, Entretenimiento, Salud, Otros) más categorías personalizadas por hogar con selector de emoji.
- **Metas de ahorro**: definición de metas con ahorro mensual (se sincroniza como gasto recurrente en el backend).
- **Hogares multiusuario**: creación de hogares, invitación por token, roles ADMIN/MIEMBRO.
- **Autenticación**: registro, login, recuperación de contraseña por email, JWT con refresh token.
- **Tema claro/oscuro**: conmutador en la barra de navegación.
- **Responsive**: sidebar colapsable en mobile, tablas adaptativas, filtros colapsables.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Angular 19 (standalone components, signals) |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Base de datos | SQLite (desarrollo, diseñado para migrar a PostgreSQL) |
| Autenticación | JWT (access 15 min + refresh 7 días) + bcrypt |
| UI | Sistema de diseño Marea (turquesa, fuentes Sora/Inter/JetBrains Mono, modo claro/oscuro) |
| Gráficos | Chart.js + ng2-charts + chartjs-plugin-annotation |
| Fecha | flatpickr, date-fns |

---

## Primeros pasos

### Requisitos

- Node.js 18+
- npm

### Backend

```bash
cd backend
npm install
cp .env.example .env   # configurar JWT_SECRET, etc.
npx prisma migrate dev
npm run prisma:seed    # carga categorías por defecto
npm run dev            # http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm start              # http://localhost:4200
```

---

## Uso

1. **Registrarse** en `/register`.
2. **Crear un hogar** desde `/hogares`. Serás ADMIN.
3. **Invitar miembros** compartiendo el token de invitación (solo ADMIN).
4. **Agregar tarjetas** de crédito desde la sección del hogar.
5. **Registrar gastos e ingresos** desde sus respectivas secciones.
6. **Dashboard** en `/dashboard` — todo el resumen mensual, evolución y distribución.
7. **Categorizar** los gastos para ver la distribución en el dashboard.
8. **Metas de ahorro** en `/metas` — definir una meta con ahorro mensual.

### Tipos de movimientos

| Tipo | Comportamiento |
|------|---------------|
| `PUNTUAL` | Ocurre una sola vez en la fecha indicada |
| `RECURRENTE` | Se repite mensualmente entre fecha inicio y fin. Admite cuotas. |
| `INDEFINIDO` | Se repite mensual desde la fecha de inicio sin fecha de fin |

### Proyecciones

El dashboard muestra balances proyectados a 6 meses basados únicamente en movimientos recurrentes e indefinidos vigentes. Los gastos con cuotas dejan de proyectarse una vez completadas.

---

## Scripts útiles

### Backend

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor con recarga en caliente |
| `npm run build` | Compilar TypeScript |
| `npm run prisma:generate` | Generar cliente Prisma |
| `npm run prisma:studio` | Abrir Prisma Studio (explorador de BD) |
| `npm run prisma:seed` | Sembrar datos iniciales |

### Frontend

| Comando | Descripción |
|---------|-------------|
| `npm start` | Servidor de desarrollo (puerto 4200) |
| `npm run build` | Compilar para producción |

---

## Licencia

Vea [LICENSE](./LICENSE).
