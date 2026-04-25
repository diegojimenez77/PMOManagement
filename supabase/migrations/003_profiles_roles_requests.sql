-- Solicitud de rol al registrarse, activación de cuentas, políticas de admin

alter table public.profiles
  add column if not exists is_active boolean not null default true;

alter table public.profiles
  add column if not exists requested_role public.app_role;

comment on column public.profiles.is_active is 'Si es false, el usuario no puede usar la app (revisar en cliente y RLS).';
comment on column public.profiles.requested_role is 'Rol solicitado al registro (admin/PM); null si solo solicitó ser solicitante o ya fue resuelto.';

-- Nuevo registro: metadata opcional raw_user_meta_data.requested_app_role
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  want text;
begin
  want := new.raw_user_meta_data->>'requested_app_role';
  insert into public.profiles (id, email, role, is_active, requested_role)
  values (
    new.id,
    coalesce(new.email, ''),
    'solicitante',
    true,
    case
      when want in ('admin', 'project_manager') then want::public.app_role
      else null
    end
  );
  return new;
end;
$$;

-- is_admin / is_project_manager: solo si la cuenta está activa
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select p.role = 'admin' and p.is_active
     from public.profiles p where p.id = auth.uid()),
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
    (select p.role = 'project_manager' and p.is_active
     from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- Usuario “normal” (no admin) con sesión activa y cuenta activa
create or replace function public.current_user_profile_active()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select p.is_active from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- Impedir que no-admins alteren role / is_active / requested_role
create or replace function public.profiles_enforce_mutable_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if (new.role, new.is_active, new.requested_role)
     is distinct from
     (old.role, old.is_active, old.requested_role) then
    raise exception 'Solo un administrador puede modificar el rol, la desactivación o la solicitud de rol.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_enforce_mutable on public.profiles;
create trigger profiles_enforce_mutable
  before update on public.profiles
  for each row execute function public.profiles_enforce_mutable_fields();

-- Política: admin puede actualizar cualquier perfil
drop policy if exists "profiles update admin" on public.profiles;
create policy "profiles update admin"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Leer: dueño, o inactivo puede leerse a sí mismo, o admin/PM
drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- Admin y PM pueden leer perfiles (emails, gestión; admin = todos)
drop policy if exists "profiles select admin pm" on public.profiles;
create policy "profiles select admin pm"
  on public.profiles for select
  to authenticated
  using (public.is_admin() or public.is_project_manager());

-- Requests: el solicitante solo si su cuenta está activa
drop policy if exists "requests select owner admin pm" on public.requests;
create policy "requests select owner admin pm"
  on public.requests for select
  to authenticated
  using (
    (applicant_id = auth.uid() and public.current_user_profile_active())
    or public.is_admin()
    or (
      public.is_project_manager()
      and status in ('Aprobado', 'Cerrado')
    )
  );

drop policy if exists "requests insert own" on public.requests;
create policy "requests insert own"
  on public.requests for insert
  to authenticated
  with check (
    applicant_id = auth.uid()
    and public.current_user_profile_active()
  );

drop policy if exists "requests update" on public.requests;
create policy "requests update"
  on public.requests for update
  to authenticated
  using (
    (applicant_id = auth.uid() and public.current_user_profile_active())
    or public.is_admin()
    or public.is_project_manager()
  )
  with check (
    (applicant_id = auth.uid() and public.current_user_profile_active())
    or public.is_admin()
    or public.is_project_manager()
  );

-- Comentarios: dueño inactivo no inserta
drop policy if exists "request_comments insert" on public.request_comments;
create policy "request_comments insert"
  on public.request_comments for insert
  to authenticated
  with check (
    exists (
      select 1 from public.requests r
      where r.id = request_id
        and (
          (r.applicant_id = auth.uid() and public.current_user_profile_active())
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
    and public.current_user_profile_active()
    and exists (
      select 1 from public.requests r
      where r.id = request_id
        and (r.applicant_id = auth.uid() or public.is_admin() or public.is_project_manager())
    )
  );
