-- PMO — Esquema inicial (PostgreSQL / Supabase)
-- Ejecutar en: Supabase → SQL Editor → Run
-- Requiere: extensión pgcrypto (habilitada por defecto en muchos proyectos)

create extension if not exists "pgcrypto";

-- Rol de aplicación (no confundir con roles de PostgreSQL)
do $$ begin
  create type public.app_role as enum ('solicitante', 'admin', 'project_manager');
exception
  when duplicate_object then null;
end $$;

-- Perfil: 1:1 con auth.users
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  role       public.app_role not null default 'solicitante',
  full_name  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (email);

-- Al registrarse vía Supabase Auth, crear fila en profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'solicitante');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helpers para políticas (Security Definer evita recursión en RLS)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select p.role = 'admin' from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.is_project_manager()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select p.role = 'project_manager' from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- Solicitudes
create table if not exists public.requests (
  id                  bigserial primary key,
  title               text not null,
  status              text not null,
  stage               text,
  request_date        date,
  applicant_id        uuid not null references public.profiles (id) on delete restrict,
  area                text not null,
  prioridad           text not null,
  tipo_proyecto       text not null,
  necesidad           text,
  impacto             text,
  presupuesto_estimado text,
  fecha_estimada_inicio date,
  implementation     jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists requests_applicant_id_idx on public.requests (applicant_id);
create index if not exists requests_status_idx on public.requests (status);
create index if not exists requests_stage_idx on public.requests (stage);

-- Comentarios (timeline)
create table if not exists public.request_comments (
  id         bigserial primary key,
  request_id bigint not null references public.requests (id) on delete cascade,
  author_id  uuid references public.profiles (id) on delete set null,
  author_email text,
  comment_date date not null default (current_date),
  text         text not null,
  created_at   timestamptz not null default now()
);

create index if not exists request_comments_request_id_idx on public.request_comments (request_id);

-- Metadatos de archivos (binario vive en Storage; aquí path + metadatos)
create table if not exists public.request_document_files (
  id            uuid primary key default gen_random_uuid(),
  request_id    bigint not null references public.requests (id) on delete cascade,
  kind          text not null check (kind in ('gobierno', 'implementation')),
  impl_stage    text,
  tag           text,
  storage_path  text not null,
  file_name     text not null,
  mime_type     text,
  size_bytes    bigint,
  uploaded_by   uuid not null references public.profiles (id),
  created_at    timestamptz not null default now()
);

create index if not exists request_document_files_request_id_idx on public.request_document_files (request_id);

-- RLS
alter table public.profiles          enable row level security;
alter table public.requests         enable row level security;
alter table public.request_comments enable row level security;
alter table public.request_document_files enable row level security;

-- profiles: lectura/actualización del propio registro
drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "profiles update own non role" on public.profiles;
-- En producción, restringe qué columnas puede tocar el usuario; aquí simplificado: update solo nombre
create policy "profiles update own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admins y PMs pueden leer perfiles (para mostrar email de solicitante en tablas)
drop policy if exists "profiles select admin pm" on public.profiles;
create policy "profiles select admin pm"
  on public.profiles for select
  to authenticated
  using (public.is_admin() or public.is_project_manager());

-- requests: leer
drop policy if exists "requests select owner admin pm" on public.requests;
create policy "requests select owner admin pm"
  on public.requests for select
  to authenticated
  using (
    applicant_id = auth.uid()
    or public.is_admin()
    or (
      public.is_project_manager()
      and status in ('Aprobado', 'Cerrado')
    )
  );

-- insert: el solicitante crea con su propio id
drop policy if exists "requests insert own" on public.requests;
create policy "requests insert own"
  on public.requests for insert
  to authenticated
  with check (applicant_id = auth.uid());

-- update: dueño, o admin, o PM solo en fases de implementación (ajusta según reglas)
drop policy if exists "requests update" on public.requests;
create policy "requests update"
  on public.requests for update
  to authenticated
  using (
    applicant_id = auth.uid()
    or public.is_admin()
    or public.is_project_manager()
  )
  with check (
    applicant_id = auth.uid()
    or public.is_admin()
    or public.is_project_manager()
  );

-- delete: solo admin (opcional: permite al solicitante borrar borradores)
drop policy if exists "requests delete admin" on public.requests;
create policy "requests delete admin"
  on public.requests for delete
  to authenticated
  using (public.is_admin());

-- comentarios: visible si la solicitud es visible
drop policy if exists "request_comments all if request visible" on public.request_comments;
create policy "request_comments select if request visible"
  on public.request_comments for select
  to authenticated
  using (
    exists (
      select 1 from public.requests r
      where r.id = request_comments.request_id
        and (
          r.applicant_id = auth.uid()
          or public.is_admin()
          or (public.is_project_manager() and r.status in ('Aprobado', 'Cerrado'))
        )
    )
  );

drop policy if exists "request_comments insert" on public.request_comments;
create policy "request_comments insert"
  on public.request_comments for insert
  to authenticated
  with check (
    exists (
      select 1 from public.requests r
      where r.id = request_id
        and (
          r.applicant_id = auth.uid()
          or public.is_admin()
          or (public.is_project_manager() and r.status in ('Aprobado', 'Cerrado'))
        )
    )
  );

-- metadatos de documentos
drop policy if exists "request_document_files select" on public.request_document_files;
create policy "request_document_files select"
  on public.request_document_files for select
  to authenticated
  using (
    exists (
      select 1 from public.requests r
      where r.id = request_document_files.request_id
        and (
          r.applicant_id = auth.uid()
          or public.is_admin()
          or (public.is_project_manager() and r.status in ('Aprobado', 'Cerrado'))
        )
    )
  );

drop policy if exists "request_document_files insert" on public.request_document_files;
create policy "request_document_files insert"
  on public.request_document_files for insert
  to authenticated
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.requests r
      where r.id = request_id
        and (r.applicant_id = auth.uid() or public.is_admin() or public.is_project_manager())
    )
  );

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_requests_updated_at on public.requests;
create trigger set_requests_updated_at
  before update on public.requests
  for each row execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
