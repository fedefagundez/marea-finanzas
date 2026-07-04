# PROJECT MAP — Marea Finanzas del Hogar

> ⚠️ **EXCLUSIVO PARA IA.** Este archivo es contexto para asistentes de IA. No es documentación para humanos. Contiene la estructura, reglas y decisiones del proyecto en formato denso. Léelo completo antes de sugerir o ejecutar cambios.

---

## TECH STACK
- Frontend: Angular 19 (standalone components, signals, inject(), inline templates, es-AR locale)
- Backend: Node.js + Express + TypeScript
- ORM: Prisma (SQLite dev, schema ready for PostgreSQL)
- Auth: JWT (access 15m, refresh 7d) + bcrypt (12 rounds)
- UI: "Marea" design system (Cyan #06B6D4, Sora/Inter/JetBrains Mono, light/dark via `data-theme` on `<body>`)
- Charts: Chart.js 4.4.4 + ng2-charts 6.0.1 + chartjs-plugin-annotation
- Date picker: flatpickr via ControlValueAccessor

---

## BACKEND STRUCTURE
```
backend/src/
├── app.ts              # Express setup: CORS (FRONTEND_URL), json(), routes, error middleware
├── index.ts            # Entry: Prisma connect, start server, graceful shutdown
├── config/index.ts     # .env vars: PORT, JWT_SECRET, JWT_REFRESH_SECRET, SMTP_*
├── lib/
│   ├── prisma.ts       # PrismaClient singleton
│   ├── auth.ts         # verificarMiembro(usuarioId, hogarId) -> { id, rol, hogar }
│   ├── calculos.ts     # esIngresoVigente(), esGastoVigente() – date-range logic per tipo
│   └── serializers.ts  # serializeDecimal() – Decimal → number
├── middlewares/
│   ├── auth.ts         # authMiddleware: Bearer JWT → req.usuarioId
│   └── error.ts        # AppError class + errorMiddleware (handles AppError & ZodError)
├── routes/
│   ├── auth.ts         # /api/auth
│   ├── hogar.ts        # /api/hogares
│   ├── ingreso.ts      # /api/ingresos
│   ├── gasto.ts        # /api/gastos
│   ├── tarjeta.ts      # /api/tarjetas
│   ├── categoria.ts    # /api/categorias
│   └── reporte.ts      # /api/reportes
└── services/
    └── mail.service.ts # Resend SDK (consola en dev, API key en prod)
```

## FRONTEND STRUCTURE
```
frontend/src/app/
├── app.component.ts / app.config.ts / app.routes.ts
├── components/
│   ├── confirm-modal/  # Global confirm dialog (returns Promise<boolean>)
│   ├── date-picker/    # flatpickr wrapper (ControlValueAccessor)
│   ├── evolution-chart/ # Line chart: 13 months (6 past + current + 6 future), dashed projection, annotation divider
│   ├── select/         # Custom dropdown
│   ├── select-hogar/   # Household picker variant
│   └── toast/          # Global notification container (signals)
├── core/services/theme.service.ts
├── guards/auth.guard.ts
├── interceptors/auth.interceptor.ts  # Attaches Bearer token; on 401 → logout
├── layout/main-layout/  # Shell: sidebar rail + mobile header + <router-outlet>
├── models/index.ts      # All TypeScript interfaces (must mirror Prisma)
├── pages/
│   ├── categorias/     # CRUD categorías con emoji picker
│   ├── dashboard/      # Resumen, evolución, distribución, balance por mes, movimientos recientes
│   ├── gastos/         # CRUD gastos con cuotas, filtros, chips predefinidos
│   ├── hogares/        # CRUD hogares, invitaciones, tarjetas
│   ├── ingresos/       # CRUD ingresos, filtros, chips predefinidos
│   ├── login/ / register/ / forgot-password/ / reset-password/
│   ├── metas/          # Metas de ahorro (backend CRUD + sync gasto recurrente)
│   └── perfil/
├── services/
│   ├── auth.service.ts / categoria.service.ts / gasto.service.ts / hogar.service.ts
│   ├── ingreso.service.ts / reporte.service.ts / tarjeta.service.ts
│   └── toast.service.ts / confirm.service.ts
└── styles.css          # Design tokens + responsive
```

---

## PRISMA MODELS
```
Usuario:          id(uuid), username(unique), email(unique), passwordHash, createdAt
→ Meta[]
PasswordResetToken: id(uuid), token(unique), expiresAt, used(bool), usuarioId → Usuario(cascade)
Hogar:            id(uuid), nombre, tokenInvitacion(unique?), createdAt
MiembroHogar:     id(uuid), usuarioId → Usuario, hogarId → Hogar, rol(ADMIN|MIEMBRO), joinedAt
                  UNIQUE(usuarioId, hogarId)
TarjetaCredito:   id(uuid), nombre, ultimo4, hogarId → Hogar
Categoria:        id(uuid), nombre, icon(default📂), usuarioId?(→Usuario), hogarId?(→Hogar)
Meta:             id(uuid), nombre, montoObjetivo(Decimal), montoActual(Decimal default0),
                  fechaLimite(DateTime), cuotaMensual(Decimal?), gastoId(String?),
                  hogarId → Hogar, usuarioId → Usuario
                  null/null = global category
Ingreso:          id(uuid), descripcion, monto(Decimal), tipo(PUNTUAL|RECURRENTE|INDEFINIDO),
                  fechaInicio?, fechaFin?, hogarId → Hogar, usuarioId → Usuario
Gasto:            id(uuid), descripcion, monto(Decimal), tipo, fechaInicio?, cuotasTotales?,
                  cuotasPagadas(default0), tarjetaId?(→TarjetaCredito onDelete:SetNull),
                  categoriaId?(→Categoria onDelete:SetNull), hogarId → Hogar, usuarioId → Usuario
```

---

## API REST — ENDPOINTS

### Auth `/api/auth` (no auth)
| Método | Endpoint | Body/Params | Response |
|--------|----------|-------------|----------|
| POST | `/register` | { username, email, password } | { token, refreshToken, usuario } |
| POST | `/login` | { username OR email, password } | { token, refreshToken, usuario } |
| POST | `/refresh` | { refreshToken } | { token } |
| GET | `/me` | — | { id, username, email, createdAt } |
| POST | `/forgot-password` | { email } | Envía email (Ethereal en dev) |
| POST | `/reset-password` | { token, password } | Mensaje éxito |

### Hogares `/api/hogares` (auth)
| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/` | — | Crear (creador = ADMIN) |
| GET | `/` | — | Listar con miembros y tarjetas |
| GET | `/:id` | Miembro | Detalle |
| POST | `/:id/invitar` | ADMIN | Devuelve token invitación |
| POST | `/unirse` | — | { token } → join |
| DELETE | `/:id` | ADMIN | Eliminar |

### Ingresos `/api/ingresos` (auth)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/` | Crear |
| GET | `/hogar/:hogarId` | `?desde=&hasta=` |
| PUT | `/:id` | Actualizar |
| DELETE | `/:id` | Eliminar |

### Gastos `/api/gastos` (auth)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/` | Crear |
| GET | `/hogar/:hogarId` | `?desde=&hasta=&tipo=&categoriaId=&tarjetaId=` |
| PUT | `/:id` | Actualizar |
| PUT | `/:id/pagar-cuota` | Incrementa cuotasPagadas |
| DELETE | `/:id` | Eliminar |

### Tarjetas `/api/tarjetas` (auth)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/` | Crear |
| GET | `/hogar/:hogarId` | Listar |
| PUT | `/:id` | Actualizar |
| DELETE | `/:id` | Eliminar |

### Categorías `/api/categorias` (auth)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | `?hogarId=` (sin = globales) |
| POST | `/` | { nombre, icon, hogarId } |
| PUT | `/:id` | Solo user-created |
| DELETE | `/:id` | Solo user-created |

### Metas `/api/metas` (auth)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/` | Crear meta |
| GET | `/hogar/:hogarId` | Listar metas del hogar |
| PUT | `/:id` | Actualizar (montoActual, cuotaMensual, gastoId, etc.) |
| DELETE | `/:id` | Eliminar |

### Reportes `/api/reportes` (auth)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/hogar/:hogarId/dashboard` | Mes actual: ingresos, gastos, balance |
| GET | `/hogar/:hogarId/evolucion` | `?meses=N` (default6) |
| GET | `/hogar/:hogarId/proyeccion` | `?meses=N` (default3) solo recurrentes/indefinidos |
| GET | `/hogar/:hogarId/evolucion-completa` | `?pasado=6&futuro=6` → items con `tipo: REAL|PROYECTADO` |
| GET | `/hogar/:hogarId/balance-mes` | `?mes=YYYY-MM` |
| GET | `/hogar/:hogarId/distribucion-gastos` | Mes actual: categoría → { porcentaje, monto } |
| GET | `/hogar/:hogarId/movimientos-recientes` | `?limite=N` (default5) ingresos+gastos fusionados |

---

## FRONTEND ROUTES
| Ruta | Componente | Layout | authGuard |
|------|-----------|--------|-----------|
| `/login` | LoginComponent | No | No |
| `/register` | RegisterComponent | No | No |
| `/forgot-password` | ForgotPasswordComponent | No | No |
| `/reset-password` | ResetPasswordComponent | No | No (lee ?token=) |
| `/dashboard` | DashboardComponent | MainLayout | Sí |
| `/ingresos` | IngresosComponent | MainLayout | Sí |
| `/gastos` | GastosComponent | MainLayout | Sí |
| `/hogares` | HogaresComponent | MainLayout | Sí |
| `/categorias` | CategoriasComponent | MainLayout | Sí |
| `/metas` | MetasComponent | MainLayout | Sí | CRUD de metas con backend, cuota mensual opcional como gasto recurrente |
| `/perfil` | PerfilComponent | MainLayout | Sí |
| `**` | → redirect `/dashboard` | | |

MainLayout: sidebar rail + mobile header (hamburger) + `<router-outlet>` + theme toggle + logout.

---

## BUSINESS RULES

### Tipos de movimiento
| Tipo | Ingreso | Gasto |
|------|---------|-------|
| PUNTUAL | Una vez en fechaInicio | Una vez en fechaInicio |
| RECURRENTE | Mensual entre fechaInicio y fechaFin | Mensual; admite cuotasTotales |
| INDEFINIDO | Mensual desde fechaInicio sin fin | Mensual sin fin; NO admite cuotas |

### Cuotas (solo RECURRENTE en Gastos)
- Monto mensual = monto / cuotasTotales
- `pagar-cuota` → cuotasPagadas++ hasta cuotasTotales
- Completado → no cuenta para proyecciones

### Balances
- Dashboard: ingresos/gastos vigentes en mes actual
- Evolución: últimos N meses (incluye puntuales del mes)
- Proyección: próximos N meses, solo recurrentes/indefinidos vigentes con lógica de cuotas
- Balance-mes: REAL si pasado/actual, PROYECTADO si futuro

### Metas (localStorage key `metas`)
- Si `cuotaMensual` > 0 → crea/actualiza gasto recurrente "Ahorro meta: {nombre}" en backend
- Al eliminar meta → elimina gasto asociado

### AuthZ
- Todo endpoint de hogar/ingreso/gasto/tarjeta/reporte verifica membresía (`verificarMiembro`)
- Solo ADMIN: invitar miembros, eliminar hogar

---

## RESPONSIVE BREAKPOINTS
| Breakpoint | Cambios |
|------------|---------|
| ≤900px | Shell a 1 columna (sidebar colapsa) |
| ≤768px | Sidebar: position fixed (top:57px, left:0, right:0, bottom:0, z-index:99, overflow-y:auto); mobile-header z-index:100; tabla tx: min-width:100%, width:max-content, white-space:nowrap, card overflow-x:auto; filtros extra en Gastos ocultos tras toggle "+ Más filtros" |
| ≤480px | Tabla tx → block/card layout (thead hidden, td inline-block con data-label); main padding 10px; card padding 12px |

Nota: `.card:has(table.tx){overflow-x:auto}` está SIEMPRE activo (global), no solo en breakpoints.

---

## STORAGE KEYS (localStorage)
- `token` — JWT access
- `refreshToken` — JWT refresh
- `hogarId` — household seleccionado
- `metas` — ahorro goals array

---

## KNOWN DEBT / CONSTRAINTS
- Sin tests unitarios/e2e
- SQLite en dev (target PostgreSQL)
- Sin auto-refresh en interceptor (401 → logout directo)
- Tipos PUNTUAL/RECURRENTE/INDEFINIDO hardcodeados en frontend y backend
- Schema Prisma debe mantenerse alineado con `frontend/src/app/models/index.ts`
- Componentes standalone (sin NgModules), inject() para DI, signals para estado local reactivo
- `hogarId` de localStorage se lee en ngOnInit de varios componentes
- Cálculos de balances en `reporte.ts` son sensibles a fechas, cuotas y tipos

---

*Última actualización: 2026-07-03*  
*Nota: envío de emails con Resend SDK (dev: log por consola, prod: requiere `RESEND_API_KEY` en .env)*
