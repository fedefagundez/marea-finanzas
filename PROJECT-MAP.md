# Mapa del Proyecto — Sistema de Economía del Hogar (Marea)

> Buffer de contexto para asistencia de IA. Este documento resume arquitectura, estructura, modelos, endpoints, flujos y reglas de negocio del proyecto.

---

## 1. Resumen Ejecutivo

Aplicación web para gestión financiera doméstica multiusuario. Permite registrar ingresos y gastos personales/hogareños, proyectar balances futuros, administrar tarjetas de crédito, crear metas de ahorro e invitar miembros a un hogar compartido.

- **Nombre en pantalla:** Marea — Finanzas del hogar
- **Frontend:** Angular 19 (standalone components, signals, HTTP interceptors)
- **Backend:** Node.js + Express + TypeScript + Prisma
- **Base de datos:** SQLite en desarrollo (schema diseñado para PostgreSQL)
- **Autenticación:** JWT (access token 15 min, refresh token 7 días) + bcrypt
- **Diseño:** Sistema de diseño Marea (turquesa/cian, modo claro/oscuro, fuentes Sora/Inter/JetBrains Mono)

---

## 2. Arquitectura General

```
┌─────────────────────────┐      HTTP/REST      ┌─────────────────────────┐      Prisma       ┌─────────────┐
│   Angular SPA (4200)    │ ◄──────────────────► │  Node.js API (3000)     │ ◄───────────────► │   SQLite    │
│  sistema-economia-hogar │                      │  sistema-economia-hogar │                   │   dev.db    │
│      /frontend          │                      │      /backend           │                   │             │
└─────────────────────────┘                      └─────────────────────────┘                   └─────────────┘
```

- CORS habilitado desde `FRONTEND_URL`.
- Tokens guardados en `localStorage`.
- `hogarId` seleccionado guardado en `localStorage`.
- Envío de correos: Nodemailer; en desarrollo usa cuenta Ethereal con URL de preview en consola.

---

## 3. Estructura de Carpetas

```
sistema-economia-hogar/
├── backend/
│   ├── src/
│   │   ├── app.ts                 # Configura Express, middlewares y rutas
│   │   ├── index.ts               # Entry point: conecta DB y levanta servidor
│   │   ├── config/index.ts        # Variables de entorno (.env)
│   │   ├── lib/prisma.ts          # Instancia de PrismaClient
│   │   ├── middlewares/
│   │   │   ├── auth.ts            # authMiddleware + AuthRequest
│   │   │   └── error.ts           # AppError + errorMiddleware (Zod)
│   │   ├── routes/
│   │   │   ├── auth.ts            # /api/auth/*
│   │   │   ├── hogar.ts           # /api/hogares/*
│   │   │   ├── ingreso.ts         # /api/ingresos/*
│   │   │   ├── gasto.ts           # /api/gastos/*
│   │   │   ├── tarjeta.ts         # /api/tarjetas/*
│   │   │   └── reporte.ts         # /api/reportes/*
│   │   └── services/
│   │       └── mail.service.ts    # Envío de recuperación de contraseña
│   ├── prisma/schema.prisma       # Modelos de datos
│   ├── .env                       # Configuración local
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.component.ts
│   │   │   ├── app.config.ts      # Providers: router, HTTP client, locale es-AR
│   │   │   ├── app.routes.ts      # Definición de rutas
│   │   │   ├── components/        # UI reutilizable
│   │   │   │   ├── confirm-modal/
│   │   │   │   ├── date-picker/   # flatpickr + ControlValueAccessor
│   │   │   │   ├── select/
│   │   │   │   ├── select-hogar/
│   │   │   │   └── toast/
│   │   │   ├── core/services/
│   │   │   │   └── theme.service.ts
│   │   │   ├── guards/auth.guard.ts
│   │   │   ├── interceptors/auth.interceptor.ts
│   │   │   ├── layout/
│   │   │   │   └── main-layout/   # Shell con rail de navegación
│   │   │   ├── models/index.ts    # Interfaces TypeScript
│   │   │   ├── pages/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── gastos/
│   │   │   │   ├── hogares/
│   │   │   │   ├── ingresos/
│   │   │   │   ├── login/
│   │   │   │   ├── metas/         # Metas de ahorro (localStorage + gastos)
│   │   │   │   ├── perfil/
│   │   │   │   ├── register/
│   │   │   │   ├── forgot-password/
│   │   │   │   └── reset-password/
│   │   │   └── services/          # Servicios API
│   │   │       ├── auth.service.ts
│   │   │       ├── gasto.service.ts
│   │   │       ├── hogar.service.ts
│   │   │       ├── ingreso.service.ts
│   │   │       ├── reporte.service.ts
│   │   │       ├── tarjeta.service.ts
│   │   │       ├── toast.service.ts
│   │   │       └── confirm.service.ts
│   │   ├── environments/
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.css             # Design tokens Marea + responsive
│   ├── angular.json
│   └── package.json
│
├── diseno.md                      # Documentación de diseño original
├── sistema.md                     # Requerimientos funcionales/no funcionales
├── PROMPT-MAREA-CLAUDE-v2.md      # Guía de aplicación del diseño Marea
└── PROJECT-MAP.md                 # Este archivo
```

---

## 4. Modelo de Datos (Prisma)

**Datasource actual:** SQLite (`provider = "sqlite"`).

### Entidades

| Modelo | Descripción | Campos clave |
|--------|-------------|--------------|
| `Usuario` | Cuenta de usuario | id, username (unique), email (unique), passwordHash |
| `PasswordResetToken` | Tokens de recuperación | token (unique), expiresAt, used, usuarioId |
| `Hogar` | Grupo familiar/económico | id, nombre, tokenInvitacion (unique) |
| `MiembroHogar` | Relación usuario-hogar con rol | usuarioId, hogarId, rol (ADMIN/MIEMBRO), joinedAt |
| `TarjetaCredito` | Tarjetas asociadas a un hogar | id, nombre, ultimo4, hogarId |
| `Ingreso` | Ingreso puntual/recurrente/indefinido | descripcion, monto (Decimal), tipo, fechaInicio, fechaFin |
| `Gasto` | Gasto puntual/recurrente/indefinido con cuotas | descripcion, monto (Decimal), tipo, fechaInicio, cuotasTotales, cuotasPagadas, tarjetaId |

### Relaciones

- Un `Usuario` puede tener muchos `MiembroHogar`.
- Un `Hogar` tiene muchos miembros, ingresos, gastos y tarjetas.
- `Gasto` opcionalmente referencia una `TarjetaCredito`.
- `Ingreso` y `Gasto` registran `usuarioId` (quién lo creó) y `hogarId` (a qué hogar pertenece).

---

## 5. API REST — Endpoints

### Autenticación (`/api/auth`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/register` | Registro; devuelve token, refreshToken y usuario |
| POST | `/login` | Login por username/email + password |
| POST | `/refresh` | Renueva access token con refresh token |
| GET | `/me` | Datos del usuario autenticado |
| POST | `/forgot-password` | Crea token de recuperación y envía email |
| POST | `/reset-password` | Valida token y cambia contraseña |

### Hogares (`/api/hogares`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/` | Crear hogar (creador = ADMIN) |
| GET | `/` | Listar hogares del usuario con miembros y tarjetas |
| GET | `/:id` | Detalle de hogar |
| POST | `/:id/invitar` | Genera/devuelve token de invitación (solo ADMIN) |
| POST | `/unirse` | Une usuario autenticado a hogar por token |
| DELETE | `/:id` | Eliminar hogar (solo ADMIN) |

### Ingresos (`/api/ingresos`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/` | Crear ingreso |
| GET | `/hogar/:hogarId` | Listar ingresos del hogar |
| PUT | `/:id` | Actualizar ingreso |
| DELETE | `/:id` | Eliminar ingreso |

### Gastos (`/api/gastos`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/` | Crear gasto |
| GET | `/hogar/:hogarId` | Listar gastos del hogar (incluye tarjeta) |
| PUT | `/:id` | Actualizar gasto |
| PUT | `/:id/pagar-cuota` | Incrementa cuotasPagadas en 1 |
| DELETE | `/:id` | Eliminar gasto |

### Tarjetas (`/api/tarjetas`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/` | Crear tarjeta |
| GET | `/hogar/:hogarId` | Listar tarjetas |
| PUT | `/:id` | Actualizar tarjeta |
| DELETE | `/:id` | Eliminar tarjeta |

### Reportes (`/api/reportes`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/hogar/:hogarId/dashboard` | Resumen del mes actual |
| GET | `/hogar/:hogarId/evolucion?meses=6` | Histórico de balances |
| GET | `/hogar/:hogarId/proyeccion?meses=3` | Proyección futura |
| GET | `/hogar/:hogarId/balance-mes?mes=YYYY-MM` | Balance de un mes específico |
| GET | `/hogar/:hogarId/movimientos-recientes?limite=5` | Últimos ingresos/gastos |

---

## 6. Frontend — Rutas y Páginas

| Ruta | Componente | Layout | Descripción |
|------|------------|--------|-------------|
| `/login` | LoginComponent | No | Inicio de sesión |
| `/register` | RegisterComponent | No | Registro |
| `/forgot-password` | ForgotPasswordComponent | No | Solicitud de recuperación |
| `/reset-password?token=...` | ResetPasswordComponent | No | Nueva contraseña |
| `/dashboard` | DashboardComponent | Sí | Resumen, balance, movimientos recientes |
| `/ingresos` | IngresosComponent | Sí | CRUD de ingresos |
| `/gastos` | GastosComponent | Sí | CRUD de gastos con cuotas |
| `/hogares` | HogaresComponent | Sí | Gestión de hogares, invitaciones y tarjetas |
| `/metas` | MetasComponent | Sí | Metas de ahorro (localStorage) |
| `/perfil` | PerfilComponent | Sí | Datos de usuario |

- Todas las rutas protegidas usan `authGuard`.
- El `MainLayoutComponent` contiene el rail de navegación, toggle de tema y cierre de sesión.
- Si no hay `hogarId` en `localStorage`, el dashboard muestra pantalla de bienvenida.

---

## 7. Reglas de Negocio Clave

### Tipos de movimientos

| Tipo | Ingreso | Gasto |
|------|---------|-------|
| `PUNTUAL` | Ocurre una vez en `fechaInicio` | Ocurre una vez en `fechaInicio` |
| `RECURRENTE` | Mensual entre `fechaInicio` y `fechaFin` | Mensual; admite `cuotasTotales` |
| `INDEFINIDO` | Mensual desde `fechaInicio` sin fin | Mensual sin fin; no admite cuotas |

### Gastos con cuotas

- `cuotasTotales` solo permitido para `RECURRENTE`.
- El monto total se divide por cuotas para mostrar el valor mensual.
- `pagar-cuota` incrementa `cuotasPagadas` hasta alcanzar `cuotasTotales`.
- Una vez completadas, el gasto recurrente deja de contar para proyecciones.

### Cálculo de balances

- **Mes actual (`dashboard`):** suma ingresos/gastos vigentes en el mes corriente.
- **Histórico (`evolucion`):** últimos N meses, incluye puntuales del mes.
- **Proyección (`proyeccion`):** próximos N meses, **solo recurrentes/indefinidos** vigentes; aplica lógica de cuotas.
- **Balance mes (`balance-mes`):** REAL si es mes actual/pasado, PROYECTADO si es futuro.

### Autorización

- Cada endpoint de hogar/ingreso/gasto/tarjeta/reporte verifica que el usuario sea miembro del hogar (`verificarMiembro`).
- Solo `ADMIN` puede invitar miembros o eliminar el hogar.

### Metas de ahorro

- Las metas se almacenan en `localStorage` bajo la clave `metas`.
- Si se define `cuotaMensual`, se crea/actualiza un gasto recurrente en el backend (`Ahorro meta: <nombre>`).
- Al eliminar una meta se elimina el gasto recurrente asociado.

---

## 8. Servicios del Frontend

| Servicio | Responsabilidad |
|----------|-----------------|
| `AuthService` | Login, register, refresh, forgot/reset password, guardar/leer tokens en localStorage |
| `HogarService` | CRUD hogares, invitar, unirse |
| `IngresoService` | CRUD ingresos |
| `GastoService` | CRUD gastos + `pagarCuota` |
| `TarjetaService` | CRUD tarjetas |
| `ReporteService` | Dashboard, evolución, proyección, balance mes, movimientos recientes |
| `ToastService` | Notificaciones tipo toast (signals) |
| `ConfirmService` | Modal de confirmación con Promise<boolean> |
| `ThemeService` | Toggle claro/oscuro con `data-theme` en body |

---

## 9. Componentes UI Compartidos

| Componente | Uso |
|------------|-----|
| `app-toast` | Contenedor global de notificaciones |
| `app-confirm-modal` | Modal de confirmación global |
| `app-date-picker` | Selector de fecha basado en flatpickr |
| `app-select` | Dropdown custom reemplaza `<select>` nativo |
| `app-select-hogar` | Variante del dropdown para hogares (misma implementación) |

---

## 10. Design System — Marea

- **Paleta:** turquesa primario (`#06B6D4`), índigo secundario, semánticos verde/rojo/amarillo, grises fríos con tinte cian.
- **Fuentes:** Sora (display), Inter (body), JetBrains Mono (monospace/tabular).
- **Modo oscuro:** activado vía `data-theme="dark"` en `<body>`; tokens CSS cambian superficies y textos.
- **Clases utilitarias clave:** `.card`, `.btn`, `.field`, `.tx` (tablas), `.badge`, `.balance-card`, `.mini-stat`, `.grid-2`, `.grid-3`, `.no-hogar`.
- **Responsive:** rail lateral en desktop; menú hamburguesa + rail colapsable en `< 768px`; tablas se transforman en tarjetas en `< 480px`.

---

## 11. Variables de Entorno (backend/.env)

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="..."
JWT_REFRESH_SECRET="..."
PORT=3000
FRONTEND_URL="http://localhost:4200"
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="..."
SMTP_PASS="..."
```

- Si no hay SMTP real configurado, los correos de recuperación se envían a Ethereal y la URL de preview se imprime en consola.

---

## 12. Scripts Útiles

### Backend

```bash
npm run dev          # tsx watch src/index.ts
npm run build        # tsc
npm run start        # node dist/index.js
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

### Frontend

```bash
npm start            # ng serve
npm run build        # ng build
```

---

## 13. Consideraciones para la IA

### Qué NO cambiar sin consultar

- La lógica de cálculo de balances en `reporte.ts` es sensible a fechas, cuotas y tipos.
- El schema de Prisma debe mantenerse alineado con las interfaces de `frontend/src/app/models/index.ts`.
- Los tipos `RECURRENTE`/`PUNTUAL`/`INDEFINIDO` están hardcodeados en frontend y backend.
- `hogarId` se guarda en `localStorage`; muchos componentes lo leen en `ngOnInit`.

### Patrones a respetar

- Componentes standalone de Angular; templates inline en `.component.ts`.
- Uso de `inject()` para servicios.
- Señales (`signal`) para estado local reactivo (toast, theme, confirm).
- `ControlValueAccessor` para `app-date-picker`.
- Manejo de errores vía `errorMiddleware` con `AppError` y `ZodError`.

### Deuda técnica / mejoras conocidas

- El dashboard tiene una gráfica de distribución de gastos hardcodeada (42% supermercado, 26% servicios); no refleja datos reales.
- Las metas no tienen modelo de datos en backend; viven en `localStorage`.
- No hay pruebas unitarias/e2e configuradas.
- El schema apunta a SQLite; en producción debería migrarse a PostgreSQL.
- No se usa el refresh token automáticamente en el interceptor; ante 401 se hace logout.

---

## 14. Flujos de Usuario Principales

### Registro y creación de hogar

```
Register → Login → Crear hogar → Ser ADMIN → Invitar por token/email
```

### Registrar un gasto con cuotas

```
Ir a /gastos → Nuevo gasto → Tipo RECURRENTE → Cuotas N → Guardar
→ En la tabla se muestra valor mensual y N cuotas
→ Botón +1 para registrar pago de cuota
```

### Unirse a un hogar existente

```
Recibir enlace /unirse?token=... → Login/Register → POST /api/hogares/unirse
→ Se crea MiembroHogar con rol MIEMBRO
```

### Ver balance futuro

```
Dashboard → Balance por mes → seleccionar mes/año futuro
→ Llama a /api/reportes/hogar/:id/balance-mes?mes=YYYY-MM
→ Muestra tipo PROYECTADO basado en recurrentes/indefinidos vigentes
```

---

*Última actualización: 2026-07-03*
