# Guía: Supabase (base de datos + Storage) para PMO Governance Portal

Esta guía te lleva de cero a tener **PostgreSQL**, **autenticación**, **filas con RLS** y un **bucket privado** para documentos, listos para conectar desde la SPA en vanilla JS.

> **Tiempo estimado:** 45–90 minutos (primera vez).  
> **Prerrequisito:** cuenta en [supabase.com](https://supabase.com) (gratis).

---

## Parte 1 — Crear el proyecto en Supabase

1. Entra a [https://app.supabase.com](https://app.supabase.com) e inicia sesión.
2. **New project** → elige **Organization** (puedes usar la personal).
3. **Database password:** genera una contraseña fuerte y **guárdala** (la necesitarás para conexiones directas con herramientas SQL externas, no para el front).
4. **Region:** elige la más cercana a tus usuarios (p. ej. `South America` si existe, o `US East`).
5. Espera a que el estado pase a **Active**.

### Obtener claves del frontend

1. En el menú: **Project Settings** (engranaje) → **API**.
2. Anota:
   - **Project URL** → `https://xxxxx.supabase.co`
   - **anon public** (clave pública) → se usa en el navegador con **Row Level Security** activo.
3. **No compartas nunca** la clave `service_role`: solo servidor/trabajos admin.

Configura en tu copia local (ver `assets/js/config.example.js`):

- `PMO_CONFIG.supabaseUrl`
- `PMO_CONFIG.supabaseAnonKey`

---

## Parte 2 — Ejecutar el esquema SQL (tablas + RLS + perfil al registrarse)

1. En Supabase: **SQL Editor** → **New query**.
2. Abre el archivo del repositorio: `supabase/migrations/001_initial_schema.sql`.
3. Pega el contenido completo y pulsa **Run**.

Qué hace el script (resumen):

- Enum `app_role` (`solicitante`, `admin`, `project_manager`).
- Tabla `public.profiles` (1 fila por usuario, enlazada a `auth.users`).
- Trigger: al **registrarse** un usuario, se crea su `profile` (rol por defecto `solicitante`).
- Tablas `requests`, `request_comments` y `request_document_files` (metadatos de archivos en Storage).
- Campo `implementation` en `requests` como **JSONB** (compatible con el objeto actual de la app).
- **Row Level Security (RLS)** con políticas de partida: los solicitantes ven/editan lo propio; admin y PM según el rol (ajusta a tu regla de negocio final).

> Si algo falla, lee el mensaje en rojo: suele ser un orden de creación; el archivo está ordenado (extensiones, luego tablas, luego policies).

---

## Parte 3 — Storage (bucket privado para documentos)

1. En el repo, ejecuta en **SQL Editor** el contenido de:  
   `supabase/migrations/002_storage.sql`

O manualmente:

1. **Storage** → **New bucket**  
   - Name: `documents`  
   - **Public:** desactivado (privado; acceso vía RLS o URLs firmadas).

2. El script `002_storage.sql` crea políticas en `storage.objects` para que:
   - Usuarios autenticados puedan subir/actualizar/eliminar solo bajo el prefijo que coincida con su `request_id` (según implementación) **o** políticas amplias de demo que debes **restringir** antes de producción.

> En producción bancaria: endurecer paths (`request_id/carpeta/uuid_nombre.ext`), límite de tamaño, y escaneo antivirus (fuera de Supabase, vía cola o Edge Function).

---

## Parte 4 — Usuarios de prueba (Auth)

En **Authentication** → **Users** → **Add user**:

- Crea, por ejemplo, `solicitante@banco.com` y `admin@banco.com` con contraseñas de demo.
- Cada uno tendrá un registro en `auth.users` y, por el trigger, en `public.profiles`.

**Asignar rol admin o PM (SQL Editor):**

```sql
-- Sustituye el email
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'admin@banco.com');
```

Repite con `project_manager` para `pm@banco.com`.

> El login con email/contraseña debe estar **habilitado**: **Authentication** → **Providers** → **Email** → activado.

---

## Parte 5 — Probar desde el SQL Editor

```sql
-- Debe devolver 0 o más filas según RLS; como service role en editor a veces ves todo
select * from public.profiles limit 5;
select id, title, status from public.requests limit 5;
```

---

## Parte 6 — Conectar el frontend (esta SPA)

1. Rellena `PMO_CONFIG` en `assets/js/config.example.js`, o copia a `assets/js/config.js` (en `.gitignore`) y en `index.html` cambia el `<script src>` a `config.js` si prefieres no tocar el ejemplo en git.
2. Rellena `PMO_CONFIG.supabaseUrl` y `PMO_CONFIG.supabaseAnonKey` (**Project Settings → API**).
3. El repositorio incluye el bundle **UMD** de `@supabase/supabase-js@2` en `assets/js/vendor/supabase.js` (sin depender de un CDN en runtime). Puedes actualizarlo descargando el mismo archivo desde [jsDelivr: @supabase/supabase-js umd](https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js) o el paquete npm y copiando `dist/umd/supabase.js`.
4. Orden de scripts en `index.html`: `config` → `vendor/supabase.js` → `supabaseClient.js` → `pmoData.js` → `app.js`. La lógica usa `PMOSupabase` y `PMOData` (CRUD, comentarios, subidas a Storage).

**Estado actual del proyecto (implementado):** las solicitudes y comentarios viven en Postgres/RLS; el login es Supabase Auth; los adjuntos nuevos usan el bucket `documents` y `request_document_files` (y se fusionan en UI con entradas legacy en JSONB al importar el demo). Para poblar datos de prueba: `npm run extract-seed` (genera/actualiza `data/pmo-demo-seed.json`) y `npm run seed` con `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.

---

## Parte 7 — CORS y orígenes

- Si abres el HTML con `file://`, muchos navegadores bloquean o complican `fetch` a Supabase. **Usa un servidor local**, p. ej. `npx serve .` o `python -m http.server` en la raíz del proyecto.
- En Supabase: **Project Settings** → **Authentication** → **URL Configuration**:
  - **Site URL** y **Redirect URLs** deben incluir la **misma** URL con la que abres el `index.html` (p. ej. `http://localhost:8080`, `http://127.0.0.1:8080` y, si aplica, `.../index.html`) para el login por correo y para **“Recuperar contraseña”**; si el enlace del correo apunta a un origen no permitido, el reset falla.
  - Opcional en `config`: `authRedirectBaseUrl: 'http://localhost:8080'` para forzar el destino del enlace; si no se define, se usa el origen y ruta actuales del navegador.
- **Límite de correos (reset, registro, etc.):** con el servicio de correo integrado de Supabase aplica un **tope bajo de correos por hora** por proyecto. Si ve “email limit exceeded” / `over_email_send_rate_limit`, espere, evite reenviar en bucle, o configure **SMTP propio** en **Authentication → Emails** (límites distintos). [Documentación de límites de Auth](https://supabase.com/docs/guides/auth/rate-limits).

---

## Parte 8 — Límites del plan gratuito (referencia)

Revisa siempre [Precios — Supabase](https://supabase.com/pricing): almacenamiento de DB, de **Storage**, ancho de banda y número de usuarios activos. Para un piloto con pocos archivos y usuarios, el tier **Free** suele bastar.

---

## Parte 9 — Checklist antes de “producción”

- [ ] Políticas RLS revisadas (ningún acceso de más para el `anon` key).
- [ ] No exponer `service_role` en el front.
- [ ] Tamaño máximo de subida (Storage → límites + validación en cliente).
- [ ] Backups: plan de Supabase o export periódico.
- [ ] (Banca) escaneo de malware, DLP, retención documentada.

---

## Mapeo con el código actual (`app.js`)

Al leer/escribir en Supabase, alinea nombres con la base (snake_case) y el front (camelCase):

| Base (`requests`)         | App (`req`)           |
| ---                       | ---                   |
| `id`                      | `id`                  |
| `request_date`            | `date`                |
| `tipo_proyecto`           | `tipoProyecto`        |
| `applicant_id` (uuid)     | Sustituye `applicant` (email) por el uuid del `profiles` correspondiente |
| `implementation` (jsonb)  | `implementation`    |
| comentarios en tabla      | `comments[]` → filas de `request_comments` |

Hasta que migres el bundle completo, puedes dejar `useLocalFallback: true` y usar Supabase solo para pruebas de login o de una sola entidad.

---

## Archivos de este repositorio relacionados

| Archivo | Contenido |
| --- | --- |
| `supabase/migrations/001_initial_schema.sql` | Tablas, trigger de perfil, RLS. |
| `supabase/migrations/002_storage.sql` | Bucket `documents` + políticas Storage. |
| `assets/js/config.example.js` | Plantilla de URL y clave pública. |

---

## Ayuda frecuente

**Error: “new row violates row-level security”**  
→ Revisa que el usuario esté autenticado, que el `id` de la fila sea coherente con las policies (p. ej. `applicant_id = auth.uid()`).

**Error al subir a Storage: 403**  
→ Política de `storage.objects` o nombre del bucket incorrecto. Comprueba que el path en `upload` coincida con la policy.

**Quiero resetear solo datos de prueba**  
→ SQL: `truncate ... cascade` o borrar filas; **no** borres `auth.users` sin saber el efecto en cascada.

Con esto puedes dejar el **backend y el storage** listos; el siguiente paso en código es conectar el login y el primer `select` a `requests` según el rol.
