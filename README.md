# Registro de Territorios Visitados

Aplicación web para registrar las visitas a los territorios de predicación, consultar las
cuadras pendientes, revisar el plan mensual de asignación y controlar las salidas diarias.

## Tecnologías

- [Astro](https://astro.build/) en modo SSR con adaptador de Netlify.
- [Tailwind CSS](https://tailwindcss.com/) para los estilos.
- [Supabase](https://supabase.com/) como base de datos (tabla `visitas`).
- TypeScript estricto, con la lógica del navegador organizada por módulos.

## Módulos (pestañas)

| Pestaña | Descripción |
| --- | --- |
| **Registro** | Alta, edición y eliminación de visitas (fecha, persona, turno, cantidad de personas, territorio y cuadras). |
| **Lista de territorios por visitar** | Estado de cada territorio por zonas: última visita, días transcurridos y cuadras faltantes. |
| **S-13_S** | Plan de asignación por rondas: bloques por persona con fecha de asignación y de completado. |
| **Control de salidas** | Resumen diario desde la primera visita, destacando los días sin salida registrada. |
| **Programar el mes** | Tabla con todos los días del mes seleccionado, su estado y las salidas. Incluye condiciones semanales y programación automática para los próximos 2 meses. |

## Estructura del proyecto

```text
src/
├── components/
│   ├── AppHeader.astro          # Cabecera, navegación y menú móvil
│   └── tabs/                    # Un componente por pestaña
│       ├── RegistroTab.astro
│       ├── PendientesTab.astro
│       ├── AsignacionesTab.astro
│       ├── ControlTab.astro
│       └── ProgramarMesTab.astro
├── layouts/
│   └── Layout.astro             # Documento HTML y tema inicial
├── lib/                         # Dominio y utilidades compartidas
│   ├── asignaciones.ts          # Cálculo de rondas y bloques
│   ├── cuadras.ts               # Expansión y normalización de cuadras
│   ├── fechas.ts                # Utilidades de fechas y meses
│   ├── personas.ts              # Lista de personas
│   ├── programar.ts             # Programación mensual y generación automática
│   ├── tabs.ts                  # Definición única de las pestañas
│   ├── territorios.ts           # Catálogo de territorios y grupos
│   ├── types.ts                 # Tipos compartidos
│   └── supabase.ts              # Cliente de Supabase (servidor)
├── client/                      # Código que se ejecuta en el navegador
│   ├── api.ts                   # Cliente HTTP de /api/visitas
│   ├── dom.ts                   # Helpers de DOM, escape y mensajes
│   ├── shell.ts                 # Pestañas, tema y menú móvil
│   ├── store.ts                 # Estado compartido de visitas
│   └── tabs/                    # Lógica de cada pestaña
├── pages/
│   ├── api/visitas.ts           # API REST (GET, POST, PUT, DELETE)
│   └── index.astro              # Composición de la página
└── styles/
    └── global.css               # Tema y clases reutilizables

tests/                           # Pruebas unitarias (Vitest)
├── asignaciones.test.ts
├── cuadras.test.ts
├── fechas.test.ts
└── programar.test.ts
```

## Comandos

```sh
npm install       # Instala las dependencias
npm run dev       # Servidor de desarrollo en http://localhost:4321
npm run check     # Comprobación de tipos y plantillas Astro
npm test          # Pruebas unitarias de las utilidades
npm run build     # Compila la aplicación para producción
npm run preview   # Previsualiza la compilación
```

## Variables de entorno

Crea un archivo `.env` en la raíz (puedes partir de `.env.example`):

```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## API

`/api/visitas` admite:

- `GET /api/visitas` y `GET /api/visitas?territorio_id=12`
- `POST /api/visitas` con `{ fecha, persona, turno, cantidad_personas, territorios: [{ territorio_id, cuadras }] }`
- `PUT /api/visitas` con `{ id, fecha, persona, turno, cantidad_personas, territorios }` (un territorio)
- `DELETE /api/visitas` con `{ id }`

El servidor valida fechas, turnos, territorios y que las cuadras existan en el territorio indicado.

## Programación automática

La pestaña **Programar el mes** incluye una tabla de **Condiciones** con dos filas
(**Mañana** y **Tarde**) y una columna por día de la semana. Cada selector permite elegir
una zona (`Irpavi`, `Bolonia y Caliri`, `Bella Vista`, `Irpavi 2`, `Alto Irpavi`) o
`No salida`.

Con esas condiciones, la aplicación genera sugerencias para los próximos **2 meses**:

- Solo completa días desde hoy que todavía no tengan visitas registradas.
- Dentro de cada zona elige el territorio con la última visita más antigua.
- Rota los territorios de la zona para no repetirlos mientras haya otros disponibles.
- Respeta los días anulados (hasta 6 fechas) y no genera nada después de la ventana.
- Las sugerencias se muestran como **Programado auto** y no se guardan en Supabase; las
  visitas reales se siguen registrando desde la pestaña **Registro**.
- Las condiciones y los días anulados se guardan en `localStorage` del navegador.

## CLIs

El proyecto se gestiona con GitHub CLI, Netlify CLI y Supabase CLI.

### GitHub

```sh
gh auth login
git push origin main
```

### Netlify

```sh
netlify login
netlify status
netlify deploy --build --prod
```

### Supabase

```sh
supabase login
supabase link --project-ref jbtgwqtnwymzisbqksuy
supabase projects list
```

El proyecto de Supabase es `territorios` (`jbtgwqtnwymzisbqksuy`). El estado local de la CLI
(`supabase/.temp/`) no se versiona.

## Despliegue

El proyecto está configurado para Netlify (`output: 'server'` y adaptador `@astrojs/netlify`).
El workflow `.github/workflows/keepalive.yml` hace una petición periódica a Supabase para evitar
que el proyecto gratuito entre en pausa.
