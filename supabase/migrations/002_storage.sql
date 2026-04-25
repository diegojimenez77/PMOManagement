-- PMO — Bucket y políticas de Storage
-- Ejecutar DESPUÉS de 001_initial_schema.sql
-- Convención de path:  "documents" bucket, nombre = "<request_id>/<uuid>_<filename>"
--   Ejemplo:  "42/550e8400-e29b-41d4-a716-446655440000_acta.pdf"

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  52428800, -- 50 MiB; ajusta en Storage → buckets si lo deseas
  null
)
on conflict (id) do nothing;

-- Políticas sobre storage.objects
-- (Supabase aplica RLS; si falla, en Dashboard → Storage → policies comprueba el estado)

drop policy if exists "documents select auth" on storage.objects;
create policy "documents select auth"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documents'
    and (
      public.is_admin()
      or (
        name ~ '^[0-9]+/'
        and exists (
          select 1
          from public.requests r
          where r.id = (substring(name from '^([0-9]+)'))::bigint
            and (
              r.applicant_id = auth.uid()
              or (public.is_project_manager() and r.status in ('Aprobado', 'Cerrado'))
            )
        )
      )
    )
  );

drop policy if exists "documents insert auth" on storage.objects;
create policy "documents insert auth"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and name ~ '^[0-9]+/'
    and exists (
      select 1
      from public.requests r
      where r.id = (substring(name from '^([0-9]+)'))::bigint
        and (
          r.applicant_id = auth.uid()
          or public.is_admin()
          or (public.is_project_manager() and r.status in ('Aprobado', 'Cerrado'))
        )
    )
  );

drop policy if exists "documents update auth" on storage.objects;
create policy "documents update auth"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'documents' and (public.is_admin() or owner = auth.uid()))
  with check (bucket_id = 'documents');

-- owner en storage.objects se rellena con auth.uid() al subir vía API de Supabase; si no, ajusta
drop policy if exists "documents delete auth" on storage.objects;
create policy "documents delete auth"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'documents'
    and (
      public.is_admin()
      or owner = auth.uid()
    )
  );
