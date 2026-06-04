# AppEspinaBifida

App web interna de la Asociación de Espina Bífida para gestionar asociados, preregistros, servicios médicos (consultas y estudios), recibos, inventario (comodatos), usuarios y métricas.

## Stack
- **Next.js 16** (App Router) + React 19 + TypeScript 5
- **Tailwind CSS 4**
- **NextAuth 4** (Google + Credentials con bcrypt, sesión JWT)
- **Oracle Autonomous DB** vía **ORDS** (REST con Basic Auth)
- PDF: jspdf / html2pdf / react-to-print
- Gráficas y mapas: Recharts, react-simple-maps, Highcharts maps

## Requisitos
- Node.js 20+
- Acceso a la instancia ORDS (usuario y password)
- Credenciales Google OAuth (opcional, para login con Google)

## Setup

```bash
npm install
cp .env.local.example .env.local   # crear si no existe
npm run dev                        # http://localhost:3000
```

### Scripts
| Comando | Acción |
|---------|--------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Levanta el build |
| `npm run lint` | ESLint |

### Variables de entorno (`.env.local`)
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
JWT_SECRET=...
BASE_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
DB_USER=...           # usuario ORDS
DB_PASSWORD=...       # password ORDS
```

## Estructura

```
app/
├── api/                  # Route Handlers 
│   ├── auth/[...nextauth]
│   ├── asociados/ servicios/ recibos/ inventario/
│   ├── medicos/ laboratorios/ usuarios/ metricas/
│   └── login/
├── dashboard/ asociados/ servicios/[id]/ recibos/
├── inventory/ metricas/ usuarios/ registro-preregistro/
├── components/
│   ├── ui/               # Button, Modal, Input...
│   ├── nav/ inventory/ reciboWorkflow/
│   └── Modales, Listas, Filtros por dominio
├── lib/
│   ├── auth-options.ts   # Config NextAuth
│   ├── api/ db/ server/  # Clientes HTTP y helpers ORDS
│   ├── types/ utils/ pdf/
├── layout.tsx providers.tsx globals.css
middleware.ts             # Auth y autorización por rol
standalone-preregistro/   # App pública independiente de preregistro
```

## Flujo de datos
```
UI (page/componente) -> /api/<recurso>/route.ts -> ORDS REST -> Oracle DB
```
El frontend nunca habla directo con ORDS: pasa por las route handlers de `app/api/`, que añaden el Basic Auth con `DB_USER`/`DB_PASSWORD`.

## Roles y permisos (`middleware.ts`)

Roles: `superadmin`, `admin`, `secretaria`, `CEO`.

| Ruta | Acceso |
|------|--------|
| `/dashboard` | Cualquier autenticado |
| `/asociados`, `/recibos` | superadmin, admin, secretaria |
| `/servicios` | superadmin, admin, secretaria (editar: solo admin/superadmin) |
| `/inventory`, `/metricas` | superadmin, CEO |
| `/usuarios` | superadmin |

## Módulos
1. **Asociados / Preregistros** - alta, foto, credencial PDF.
2. **Servicios** - consultas y estudios (alta, edición, detalle, orden PDF).
3. **Recibos** - agrupan servicios, pagos, impresión.
4. **Inventario / Comodatos** - productos, movimientos, contrato PDF.
5. **Catálogos** - médicos y laboratorios.s
6. **Usuarios** - CRUD interno + bitácora de accesos.
7. **Métricas** - mapas y gráficas por estado, etapa, residencia, CURP.

