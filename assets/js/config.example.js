/**
 * Copia este archivo a `config.js` (mismo directorio) y rellena los valores.
 * `config.js` está en .gitignore y no se sube al repositorio.
 *
 * Claves: Supabase → Project Settings → API
 *   - Project URL
 *   - anon (public) key
 * Opcional — recuperación de contraseña (misma URL que uses en el navegador, debe estar
 *   en Supabase → Authentication → URL Configuration → Redirect URLs, p. ej. http://localhost:8080/index.html):
 *   authRedirectBaseUrl: 'http://localhost:8080'
 */
window.PMO_CONFIG = {
  supabaseUrl: 'https://TU-PROYECTO.supabase.co',
  supabaseAnonKey: 'TU-CLAVE-ANON-PUBLICA',
  // authRedirectBaseUrl: 'http://localhost:8080'
};
