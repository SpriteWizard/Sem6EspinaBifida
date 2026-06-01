# Arquitectura del Proyecto — AppEspinaBifida

Aplicación web para la **Asociación de Espina Bífida** que gestiona asociados, preregistros, servicios médicos (consultas y estudios), recibos, inventario (comodatos), usuarios internos y métricas.

---

## 1. Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | **Next.js 16** (App Router) |
| Lenguaje | TypeScript 5 |
| UI | React 19, Tailwind CSS 4 |
| Autenticación | NextAuth 4 (Google + Credentials con bcrypt) |
| Base de datos | **Oracle Autonomous DB** vía **ORDS** (REST) — además `oracledb` para acceso directo |
| Gráficas / mapas | Recharts, Highcharts maps, react-simple-maps, topojson, world-atlas |
| PDF | jspdf, html2pdf.js, react-to-print |
| Utilidades UI | clsx, tailwind-merge, lucide-react |

Scripts (`package.json`):
- `dev` → `next dev`
- `build` → `next build`
- `start` → `next start`
- `lint` → `eslint`

> ⚠️ Nota del repo (AGENTS.md): esta versión de Next.js tiene **breaking changes**; consultar `node_modules/next/dist/docs/` antes de cambios.

---

## 2. Estructura de carpetas (top-level)

```
appespinabifida/
├── app/                       # App Router (rutas + APIs)
├── public/                    # Estáticos
├── standalone-preregistro/    # Submódulo / app independiente de preregistro público
├── middleware.ts              # Auth + autorización por rol
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs
├── package.json
└── .env.local                 # Credenciales (ORDS, Google OAuth, NextAuth)
```

---

## 3. Capa de rutas (`app/`)

### 3.1 Páginas (UI)

| Ruta | Propósito |
|------|-----------|
| `app/page.tsx` | Landing / login |
| `app/dashboard/page.tsx` | Tablero principal post-login |
| `app/asociados/page.tsx` | Listado / gestión de asociados |
| `app/asociados/preregistros/[folio]/` | Detalle de preregistro por folio |
| `app/servicios/page.tsx` | Listado de servicios (consultas + estudios) |
| `app/servicios/[id]/detalle-consulta/` | Detalle de consulta |
| `app/servicios/[id]/detalle-estudio/` | Detalle de estudio |
| `app/servicios/[id]/editar-consulta/` | Edición de consulta |
| `app/servicios/[id]/editar-estudio/` | Edición de estudio |
| `app/recibos/page.tsx` | Gestión de recibos / pagos |
| `app/inventory/page.tsx` | Inventario (productos en comodato) |
| `app/inventory/movimientos/page.tsx` | Historial de movimientos |
| `app/metricas/page.tsx` | Dashboards / métricas (mapas y gráficas) |
| `app/usuarios/page.tsx` | Administración de usuarios internos |
| `app/registro-preregistro/page.tsx` | Formulario público de preregistro |

`layout.tsx` define layout global; `providers.tsx` envuelve la app con providers (NextAuth `SessionProvider`, etc.); `globals.css` carga Tailwind 4.

### 3.2 API Routes (`app/api/`)

Todas son **Route Handlers** del App Router. Sirven como backend ligero que se comunica con ORDS.

```
app/api/
├── auth/[...nextauth]/        # NextAuth handler
├── login/
│   ├── route.ts               # Login alternativo
│   └── log_acceso/            # Bitácora de accesos
├── asociados/
│   ├── agregar/   editar/   obtener_asociado/   lista_asociados/
│   ├── fotoAsociado/          # Subida/recuperación de foto
│   ├── preRegistro/           # Crear preregistro
│   └── preregistros/          # Listar / gestionar preregistros
├── servicios/
│   ├── agregar/   editar/   obtener/   remover/
├── recibos/
│   ├── crear/   nuevo/   obtener/   pagar/
│   ├── agregarServicios/      # Vincular servicios a recibo
│   ├── ligarConsulta/         # Asociar consulta ↔ recibo
│   └── lista_pagos/
├── inventario/
│   ├── agregar/   editar/   obtener/   movimientos/
├── laboratorios/
│   ├── crear/   editar/   lista/   toggleLaboratorio/
├── medicos/
│   ├── crear/   editar/   lista_medicos/   toggleMedico/
├── usuarios/
│   ├── crear/   editar/   lista/   toggleUsuario/
└── metricas/
    ├── route.ts
    ├── curp-nl/   curp-foraneo/   por-curp/
    ├── por-estado/   por-residencia/   por-nacimiento/
    ├── por-etapa/   registros-mes/
```

---

## 4. Componentes (`app/components/`)

### 4.1 UI primitivos (`components/ui/`)
`Badge`, `Button`, `Input`, `Modal`, `Select`, `Switch`, `Textarea` — sistema de diseño base con Tailwind + `tailwind-merge` (`lib/utils/cn.ts`).

### 4.2 Navegación
- `components/nav/Topbar.tsx`

### 4.3 Listas / tablas
`ListaAsociados`, `ListaLaboratorios`, `ListaMedicos`, `ListaPreregistro`, `ListaUsuarios`, `ListaTabla`, `ListItemEstudio`.

### 4.4 Filtros
`Filtros`, `FiltrosLaboratorios`, `FiltrosMedicos`, `FiltrosPreregistro`, `FiltrosUsuarios`.

### 4.5 Modales de creación / edición
`CreateAsociadoModal`, `CreateLaboratorioModal`, `CreateMedicoModal`, `CreateUsuarioModal`, `ModalAsociado`, `ModalLaboratorio`, `ModalMedico`, `ModalPreregistro`, `ModalUsuario`, `NuevaConsultaModal`, `NuevoEstudioModal`, `NuevoServicioModal`, `EditarConsultaForm`, `EditarEstudioForm`.

### 4.6 Workflow de recibos (`components/reciboWorkflow/`)
`nuevaConsultaModal.tsx`, `nuevoEstudioModal.tsx`, `page.tsx` — flujo guiado para construir recibos a partir de consultas/estudios.

### 4.7 Inventario (`components/inventory/`)
`InventoryTable`, `InventoryItemDetailModal`, `NewProductModal`, `NewMovementModal`, `MovementHistoryList`, `ImprimirComodatoButton`.

### 4.8 Impresión / PDF
`imprimirRecibo.tsx`, `ImprimirCredencialButton`, `ImprimirOrdenButton`, `GenerarReporteButton`, `CredencialPreview`, `testImprimirRecibo/`.

### 4.9 Otros
`PadecimientoSelector`, `SolicitarEstudioButton`, `login.tsx`.

---

## 5. Capa de librería (`app/lib/`)

```
lib/
├── auth-options.ts          # Configuración NextAuth (Google + Credentials)
├── api/                     # Clientes HTTP del frontend
│   ├── inventory.ts
│   └── movements.ts
├── db/                      # Acceso a datos vía ORDS
│   └── user.ts              # getUserByEmail, getUserById...
├── server/                  # Helpers server-only (ORDS / SQL)
│   ├── inventory-ords.ts
│   ├── movement-users-ords.ts
│   └── ords-sql.ts
├── types/                   # Tipos TS compartidos
│   ├── inventory.ts
│   ├── movements.ts
│   └── metricas.ts
├── pdf/
│   └── reporte.ts           # Generación de reportes PDF
├── utils/
│   └── cn.ts                # clsx + tailwind-merge
├── data/                    # (vacío / placeholder)
└── servicios-utils.tsx      # Helpers de servicios
```

---

## 6. Autenticación y autorización

### 6.1 NextAuth (`app/lib/auth-options.ts`)
- **Providers**: Google OAuth + Credentials (email/password con `bcryptjs`).
- **Estrategia de sesión**: JWT.
- Verificación contra ORDS: `getUserByEmail` → compara `password_hash`.
- El token JWT incluye `role` del usuario.

### 6.2 Middleware (`middleware.ts`)
Protege rutas vía `withAuth` y aplica reglas por rol:

| Ruta | Roles permitidos |
|------|------------------|
| `/dashboard/*` | Cualquier autenticado |
| `/asociados/*` | superadmin, admin, secretaria |
| `/servicios/*` | superadmin, admin, secretaria (edición: solo superadmin/admin) |
| `/inventory/*` | superadmin, CEO |
| `/metricas/*` | superadmin, CEO |
| `/usuarios/*` | superadmin |
| `/recibos/*` | superadmin, admin, secretaria |

---

## 7. Modelo de datos (entidades principales)

Inferidas de las APIs:

- **Usuario** (interno): id, correo, nombre, password_hash, role (`superadmin` | `admin` | `secretaria` | `CEO`), estatus.
- **Asociado**: datos personales + foto + padecimiento + CURP.
- **Preregistro**: solicitud previa al alta de asociado (identificada por `folio`).
- **Médico** y **Laboratorio**: catálogos con toggle activo/inactivo.
- **Servicio**: consulta o estudio asociado a un asociado, médico/laboratorio.
- **Recibo**: agrupa servicios y registra pagos; puede ligarse a consulta.
- **Inventario / Movimiento**: productos en comodato y su historial.

Persistencia: **Oracle Autonomous DB** expuesta como REST vía **ORDS** (`/ords/admin/...`). Se autentica con `DB_USER` + `DB_PASSWORD` (Basic Auth) leídos de `.env.local`.

---

## 8. Flujo de datos típico

```
UI (page.tsx / componente)
        │  fetch
        ▼
app/api/<recurso>/route.ts   ← Route Handler
        │  fetch (Basic Auth)
        ▼
Oracle ORDS REST endpoint
        │
        ▼
Oracle Autonomous Database
```

Para acciones server-side se usan helpers de `app/lib/server/` y `app/lib/db/`. Los componentes cliente consumen los endpoints internos en `/api/*`.

---

## 9. Módulos funcionales

1. **Gestión de Asociados**: alta directa + flujo de preregistro (incluye app pública independiente en `standalone-preregistro/`), foto, credencial imprimible.
2. **Catálogos**: Médicos y Laboratorios con activación/desactivación.
3. **Servicios médicos**: Consultas y Estudios — alta, edición, detalle, impresión de órdenes.
4. **Recibos**: creación, vinculación con consultas/servicios, pagos, impresión.
5. **Inventario / Comodatos**: productos, movimientos (entradas/salidas), historial, contrato imprimible.
6. **Usuarios y accesos**: CRUD de usuarios internos, bitácora de accesos.
7. **Métricas**: distribución geográfica (mapas), por etapa, residencia, nacimiento, registros por mes.

---

## 10. Variables de entorno (`.env.local`)

Mínimo esperado:
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `DB_USER`, `DB_PASSWORD` (credenciales ORDS)

---

## 11. Convenciones del proyecto

- **App Router** estricto (no `pages/`).
- API encapsulada bajo `app/api/<recurso>/<accion>/route.ts`.
- Componentes en español, divididos por dominio + carpeta `ui/` para primitivos.
- Tipos compartidos en `app/lib/types/`.
- Estilos: Tailwind 4 + utilitario `cn()`.
- Lectura obligatoria de docs locales de Next.js antes de cambios (ver AGENTS.md).
