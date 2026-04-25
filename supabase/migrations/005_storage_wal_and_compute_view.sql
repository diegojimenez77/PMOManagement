-- Extiende get_admin_storage_stats con tamaño WAL (pg_ls_waldir) para el gráfico tipo Compute and Disk.
-- "Sistema / disponible" no se puede obtener de forma fiable vía SQL en el nodo: la UI deja tramo + leyenda.

create or replace function public.get_admin_storage_stats()
returns jsonb
language plpgsql
security definer
set search_path = public, storage, pg_temp
as $$
declare
  v_db bigint;
  v_wal bigint;
  v_public bigint;
  v_storage_bytes bigint;
  v_doc_count bigint;
  v_limit_db constant bigint := 524288000;
  v_limit_file constant bigint := 1073741824;
begin
  if not public.is_admin() then
    raise exception 'Solo los administradores pueden ver las estadísticas de almacenamiento';
  end if;

  v_db := (select pg_database_size(current_database()));

  v_wal := coalesce((select sum(size) from pg_ls_waldir()), 0::bigint);

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
    'wal_bytes', v_wal,
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
  'Métricas PG: bd, WAL (pg_ls_waldir), public, storage, cupos ref. Sistema libre: solo panel Supabase.';

revoke all on function public.get_admin_storage_stats() from public;
grant execute on function public.get_admin_storage_stats() to authenticated;
