-- Tras importar solicitudes (npm run seed / seed:extra), asegura el siguiente id.
select setval(
  'public.requests_id_seq',
  (select coalesce(max(id), 1) from public.requests)
);
