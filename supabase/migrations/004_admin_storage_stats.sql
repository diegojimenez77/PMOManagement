-- PMO — Estadísticas de almacenamiento para administradores (plan gratuito Supabase, referencia)
-- Ejecutar en SQL Editor después de 001, 002 y 003.
-- Límites informativos: 500 MiB base de datos + 1 GiB almacenamiento de archivos (supabase.com/pricing)

create or replace function public.get_admin_storage_stats()
returns jsonb
language plpgsql
security definer
set search_path = public, storage, pg_temp
as $$
declare
  v_db bigint;
  v_public bigint;
  v_storage_bytes bigint;
  v_doc_count bigint;
  v_limit_db constant bigint := 524288000;   -- 500 * 1024^2 (cupo tip. plan Free)
  v_limit_file constant bigint := 1073741824; -- 1 * 1024^3
begin
  if not public.is_admin() then
    raise exception 'Solo los administradores pueden ver las estadísticas de almacenamiento';
  end if;

  v_db := (select pg_database_size(current_database()));

  /* Tablas y objetos de datos; sin contar índices aparte (van incluidos en el total de cada tabla) */
  v_public := coalesce((
    select sum(pg_total_relation_size(c.oid))::bigint
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p', 'm', 'f')
  ), 0);

  select
    coalesce(count(*), 0),
    coalesce(sum(
      case
        when o.metadata is null then 0::bigint
        else coalesce(
          nullif(trim(both from o.metadata->>'size'), '')::bigint,
          nullif(trim(both from o.metadata->>'contentLength'), '')::bigint,
          0::bigint
        )
      end
    ), 0)
  into v_doc_count, v_storage_bytes
  from storage.objects o
  where o.bucket_id = 'documents';

  return jsonb_build_object(
    'database_total_bytes', v_db,
    'public_schema_bytes', v_public,
    'storage_documents_bytes', coalesce(v_storage_bytes, 0),
    'storage_document_count', coalesce(v_doc_count, 0),
    'free_tier_database_bytes_limit', v_limit_db,
    'free_tier_file_storage_bytes_limit', v_limit_file,
    'other_database_bytes', greatest(0, v_db - v_public)
  );
end;
$$;

comment on function public.get_admin_storage_stats() is
  'Métricas aprox. de PG + suma de tamaños en storage.objects (metadata). Solo administradores.';

revoke all on function public.get_admin_storage_stats() from public;
grant execute on function public.get_admin_storage_stats() to authenticated;
