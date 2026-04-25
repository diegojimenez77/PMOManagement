-- =============================================================================
-- Asignar rol de administrador PMO a un correo (para ver TODAS las solicitudes)
-- =============================================================================
-- Ejecútalo en: Supabase → SQL → New query
--
-- Causa habitual de “no veo las solicitudes” como “admin”:
-- el usuario se registró con Gmail pero en public.profiles sigue
-- role = 'solicitante'. RLS entonces solo devuelve solicitudes cuyo
-- applicant_id sea ese usuario, no el portafolio completo.
--
-- Tras ejecutar, cierre sesión en la app y vuelva a entrar (o F5) para
-- que el cliente vuelva a leer el perfil con role = 'admin'.
-- =============================================================================

-- Ajusta el correo exactamente como figura en Authentication → Users
-- (atención: "management" vs "managment")
update public.profiles
set
  role = 'admin'::public.app_role,
  is_active = true
where id in (
  select id
  from auth.users
  where lower(trim(coalesce(email, ''))) in (
    lower(trim('administradorpmomanagement@gmail.com')),
    lower(trim('administradorpmomanagment@gmail.com'))
  )
);

-- Comprueba el resultado
select p.id, p.email, p.role, p.is_active, p.requested_role
from public.profiles p
where p.id in (
  select id
  from auth.users
  where lower(trim(coalesce(email, ''))) in (
    lower(trim('administradorpmomanagement@gmail.com')),
    lower(trim('administradorpmomanagment@gmail.com'))
  )
);
