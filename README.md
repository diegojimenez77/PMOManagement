# PMO Governance Portal

Aplicación web para la gestión centralizada de solicitudes de proyecto y del seguimiento de implementación post-aprobación, orientada a la Oficina de Gestión de Proyectos (PMO) de una institución bancaria.

Está construida como **Single Page Application (SPA)** con **HTML5, CSS3 y JavaScript vanilla**, sin frameworks ni bundler. El backend vive en **Supabase** (Postgres, Auth, Storage); el bundle **`@supabase/supabase-js@2` está en el repo** (`assets/js/vendor/supabase.js`, UMD). Fuentes y Material Symbols siguen vía `index.html`, en línea con `AGENTS.md`.

---

## 1. Resumen

| Aspecto | Descripción |
| --- | --- |
| **Entrada** | `index.html` monta `#app-root`; toda la UI se genera con `document.createElement` (sin `innerHTML`). |
| **Estado** | `AppState` en memoria; **sesión** vía Supabase Auth (el cliente conserva el token en `localStorage` internamente). **Solicitudes, comentarios y adjuntos** vienen de Postgres/Storage, no de `localStorage` de negocio. |
| **Navegación** | `navigateTo(route, param)` con rutas por rol. |
| **Estilos** | BEM, tokens en `:root`, `rem` con base 10px, diseño responsive. |
| **Datos** | Carga desde Supabase. Opcional: poblar con `data/pmo-demo-seed.json` y `npm run seed` (véase [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)). |

---

## 2. Perfiles (Supabase Auth + `public.profiles`)

La aplicación distingue **tres roles** (`solicitante`, `admin`, `project_manager` en base de datos). Debes **crear los usuarios en el panel de Autenticación** de Supabase (email/contraseña) y asignar el **rol** en `public.profiles` (los nuevos se registran como solicitante vía trigger; admin y PM requieren actualización de rol). Valores de ejemplo: `solicitante@banco.com`, `admin@banco.com`, `pm@banco.com`. Las contraseñas las defines tú; no viven en el código.

Tras el login, `navigateToHome()` redirige al dashboard según el rol leído del perfil.

---

## 3. Cómo funciona cada funcionalidad

### 3.1. Autenticación y sesión

- Rellene `assets/js/config.example.js` (o copie a `config.js` y apunte el `<script src>` de `index.html` allí) con la URL del proyecto y la clave **anon** pública: **Project Settings → API** en Supabase.
- Login y registro usan `signInWithPassword` y `signUp` de `supabase-js`. Tras un login correcto se carga el perfil (`fetchCurrentProfile`) y `AppState.currentUser` recibe `id` (UUID), `email` y `role` mapeado desde la fila de `profiles`.
- Al iniciar, `getSession` restaura la sesión; si no hay sesión, se muestra el login. **No** se persiste el usuario de negocio en `localStorage` propio; el cierre de sesión llama a `auth.signOut()` y limpia el estado.

### 3.2. Solicitante

- **Panel de solicitudes:** lista `AppState.requests` filtradas por `applicant` y resumen con totales por estado.
- **Nueva solicitud:** formulario con validación por campo. Se puede **enviar a revisión** o **guardar como borrador** (estado `Borrador`, sin validación estricta).
- **Ajustes:** si el estado es `Requiere Cambios`, se abre un formulario editable con todos los campos; al reenviar, la solicitud vuelve a `En Revisión` en la **misma etapa** (`stage`) en la que se pidieron ajustes (no se rebobina a Revisión PMO por defecto).
- **Rechazadas:** en detalle, **Reabrir solicitud** con desplegable de etapa destino (PMO, Evaluación financiera, Aprobación) y justificación; pasa a `En Revisión` con la etapa elegida.
- **Detalle:** comentarios del solicitante y lectura de historial; acciones según estado.

### 3.3. Administrador PMO

- **Panel de solicitudes (dashboard):** tabla con KPIs, filtros (área, prioridad, estado/etapa), paginación y fila clicable hacia el detalle.
- **Flujo de Gobierno:** visualización por las 5 “columnas lógicas” del ciclo (Borrador → Revisión PMO → … → Aprobado), con conteos y listas; las listas en tarjetas muestran **hasta 3 filas visibles** con scroll para el resto. Clic en un ítem navega al **detalle** de la solicitud (incluido borrador).
- **Etapas en la barra lateral (no hay “Panel de Aprobaciones” unificado):** entradas separadas para *Revisión PMO*, *Evaluación Financiera*, *Aprobación* y *Aprobadas*. Cada una abre una vista de lista de tipo “gobierno” con **todas** las solicitudes de esa etapa (sin límite de altura de lista).
- **Detalle (admin):** stepper, resumen, datos, panel de **Decisiones y comentarios** con acciones: avanzar fase (PMO → Técnica → Director), en Director final **aprobar solicitud**; solicitar ajustes; rechazar. Los comentarios negativos exigen texto suficiente. Las decisiones se registran en `comments`.
- **Métricas y reportes:** KPIs, gráficos interactivos (donut, barras, tabla ranking) y exportación del portafolio a CSV (UTF-8 con BOM) según criterio actual.

### 3.4. Project Manager (implementación)

- Solo se listan solicitudes con `status` **Aprobado** o **Cerrado** (post-implementación).
- Cada solicitud aprobada tiene un objeto `implementation`: etapa actual (`iniciacion` … `cierre`), documentos (datos de demo en JSONB al importar; **nuevas subidas** reales al bucket `documents` y metadatos en `request_document_files`, fusionados en la UI), bitácora del PM, historial de movimientos de etapa.
- **Kanban de implementación:** seis columnas fijas: Iniciación, Análisis y Diseño, Construcción, Pruebas, Go Live, Cierre. Cada documento requerido por etapa se valida antes de **Avanzar a la siguiente**; en la última etapa, **Cerrar proyecto** pasa el estado a `Cerrado`.
- **Filtro por tipo de proyecto:** barra de chips bajo el encabezado; filtra todas las columnas. El contador del título indica `X de N` proyectos.
- **Documentación por etapa (desde el detalle del PM):** pantalla que agrupa **toda** la documentación anexada por etapa, con resumen y estado de completitud.
- **Métricas de implementación:** KPIs de portafolio, distribución por etapa, gráfico por área, tabla del portafolio de implementación.

### 3.5. Reglas de negocio (PMO) — recordatorio

- Estados principales: `Borrador`, `En Revisión`, `Aprobado`, `Rechazado`, `Requiere Cambios`, y en implementación además `Cerrado`.
- Etapas de aprobación: `pmo` → `tecnica` → `director`; solo al estar en `director` y aprobar se marca **Aprobado** (o se rechaza / pide ajustes en cualquier fase de revisión).

### 3.6. Tecnología y restricciones de código

- Sin `innerHTML`; feedback con notificaciones DOM y errores de campo.
- `form.noValidate` + validación manual donde aplica.
- `AGENTS.md` indica: sin dependencias JS externas, HTML semántico, `const`/`let`, prevenir `default` en submit.

---

## 4. Estructura del repositorio

```
PMO/
├── index.html
├── AGENTS.md
├── README.md
├── package.json
├── data/                    # JSON para `npm run seed` (y alias de correo / UUIDs de demo)
├── scripts/                 # seed-from-json, generate-pmo-additional-50, extract-demo-seed
├── docs/
│   └── SUPABASE_SETUP.md
├── assets/
│   ├── css/styles.css
│   └── js/                  # app.js, pmoData.js, supabaseClient.js, config.example.js, vendor/supabase.js
└── supabase/
    ├── migrations/                      # Esquema Postgres versionado
    ├── assign_admin_role_by_email.sql   # Útil tras crear usuarios en Auth
    └── post_seed_setval_requests.sql   # Opcional: reajusta secuencia `requests_id_seq` tras cargar datos
```

> **Nota (Auth):** La sesión de Supabase vive en el almacenamiento que use el cliente JS de Auth (`localStorage` por defecto). Cerrar sesión desde la app o borrar el sitio en el navegador limpia la sesión; los datos de negocio están en Postgres/Storage, no en una clave local de demo.

---

## 5. Cómo ejecutar

No hace falta build. Opciones:

```bash
# Navegador: abrir index.html directamente, o
python -m http.server 8080
# Visitar http://localhost:8080
```

(La política CORS de `file://` puede afectar a algunas APIs en el futuro; para un despliegue serio use siempre un servidor estático o el mismo origen de la API.)

---

## 6. Reporte de mejores prácticas (análisis del código actual)

Resumen de la auditoría de ingeniería sobre el repositorio (arquitectura, seguridad, pruebas, a11y, rendimiento, mantenimiento). En **Cursor** puede existir además un canvas con el mismo contenido en formato tablero (`pmo-audit-report.canvas.tsx` bajo el directorio `canvases/` del *workspace* de Cursor, no en el repositorio git de esta carpeta).

| Prioridad | Cantidad aprox. | Temas centrales |
| --- | ---: | --- |
| **Crítico** | — | *Reducido:* ya hay Supabase (Auth, datos, RLS) y claves reales en `config` (no en repo). Sigue el riesgo de la **anon key** y XSS si se compromete el front. |
| **Alto** | 5 | `app.js` monolítico; sin tests automatizados; accesibilidad (foco, ARIA) incompleta; token de Auth en almacenamiento de sesión del cliente (higiene y CSP en producción). |
| **Medio** | 6 | Validación duplicada con servidor; carga de listas en cliente; métricas recalculadas en cliente; etc. |
| **Bajo** | 2 | Pequeñas duplicaciones en utilidades de fecha; filtros de UI no persistidos. |

**Fortalezas a mantener:** DOM seguro (sin `innerHTML`), notificaciones propias, validación explícita, contrato con Postgres/RLS, UI coherente y flujos de negocio ricos.

---

## 7. Próximos pasos: de prototipo a producto “100% real” y nivel top de mercado

Orden sugerido: **fundamentos que desbloquean el resto** → **seguridad y cumplimiento** → **producto y escalado** → **excelencia (calidad, UX enterprise)**.

### Fase A — Cimientos (obligatorios para producción)

1. **Backend y API** (REST o GraphQL): autenticación, CRUD de solicitudes, comentarios, transiciones de etapa, `implementation` y adjuntos reales, métricas agregadas en servidor.
2. **Base de datos** (p. ej. PostgreSQL) con esquema versionado, migraciones y *seed* solo en entornos no productivos.
3. **Sustituir el demo en el cliente** por `fetch` con manejo de errores, reintentos y estados de carga; eliminar credenciales del bundle.
4. **Autenticación real:** hash de contraseñas en servidor, sesiones o JWT en cookies `HttpOnly` + CSRF; idealmente **SSO** (SAML/OIDC) típico en banca.
5. **Autorización en servidor** (RBAC): ninguna acción crítica solo por el rol en el `switch` del front.
6. **`saveState` equivalente en servidor:** manejo de cuotas, transacciones y consistencia; en cliente, caché opcional, no verdad absoluta.
7. **try/catch** al persistir (y métrica de fallos) ya en cualquier capa de almacenamiento intermedia.

### Fase B — Seguridad, cumplimiento y operación

1. **CSP, headers seguros, rate limiting, sanitización** de entradas y validación con esquemas (Zod, Joi, etc.).
2. **Auditoría** de cada cambio de estado, comentario, login y descarga (actor, IP, timestamp) — frecuentemente requerido en banca.
3. **Adjuntos reales** (Object Storage, antivirus, límites de tamaño, encriptación en reposo).
4. **Backups, DR, monitoreo** (logs estructurados, alertas, trazas).
5. **PIA/ DPIA y políticas** según regulación del país (datos de empleados y clientes en solicitudes).

### Fase C — Producto y escalado funcional

1. **Notificaciones** (email, Teams/Slack) en cambio de etapa y menciones.
2. **Búsqueda y filtros** en servidor (texto, fechas, presupuesto, multi-área).
3. **SLA por etapa**, asignación de revisor, reglas por monto o tipo de riesgo.
4. **Multi-tenant** o al menos entornos `dev` / `staging` / `prod` con despliegue automatizado.
5. **Internacionalización** (español + inglés) si el banco opera en varios países.

### Fase D — Excelencia de mercado (diferenciadores)

1. **Test pyramid:** unitarios (utilidades, validadores), integración (API), e2e (Playwright) en CI en cada push.
2. **Modularizar el front** o migrar a un framework *si el equipo lo pide* manteniendo contrato de API; el monolito actual dificulta equipos grandes.
3. **Accesibilidad certificable** (WCAG 2.1 AA), foco al navegar, lectores de pantalla, teclado completo.
4. **Rendimiento:** code-splitting, paginación y filtros en servidor, lazy-load de gráficos pesados.
5. **Observabilidad de producto** (funnels, embudos de conversión etapa a etapa) y **reportes programados** (PDF, BI).
6. **Versionado de contenido** de la solicitud e historial de “quién cambió qué”.

### Checklist mínima para un piloto bancario serio

- [ ] API + BD con pruebas de integración.
- [ ] Sin secretos en el cliente; auth real + RBAC en servidor.
- [ ] Adjuntos y auditoría; TLS en todo tráfico.
- [ ] e2e de los flujos: crear → aprobar → implementar → cerrar.
- [ ] Runbook, monitoreo y plan de respaldo validado.
- [ ] (Opcional) Pen-test o revisión de seguridad de terceros antes de producción.

---

## 8. Referencias

- Especificación del agente y stack: `AGENTS.md`.
- Reporte de auditoría: **Sección 6** de este README; versión en canvas (Cursor IDE) si se generó en el proyecto.
- **Supabase (base de datos + Storage):** guía paso a paso en [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) y SQL en `supabase/migrations/`.

---

## 9. Licencia y uso

Proyecto de demostración. Los datos y credenciales son ficticios. Para uso institucional real, reemplazar el almacenamiento local y la autenticación según la política de la organización.
