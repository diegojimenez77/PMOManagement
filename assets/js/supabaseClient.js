/* global supabase */
/**
 * Cliente Supabase (UMD en vendor/supabase.js) y perfiles de app.
 * Requiere window.PMO_CONFIG con supabaseUrl y supabaseAnonKey.
 */
(function (global) {
    'use strict';

    const ROLE_TO_APP = {
        solicitante: 'solicitante',
        admin: 'admin',
        project_manager: 'project_manager'
    };

    let _client = null;

    function isConfigValid() {
        const c = global.PMO_CONFIG;
        if (!c || !c.supabaseUrl || !c.supabaseAnonKey) {
            return false;
        }
        const u = String(c.supabaseUrl).trim();
        const k = String(c.supabaseAnonKey).trim();
        if (u.indexOf('TU-PROYECTO') !== -1 || u.indexOf('placeholder') !== -1) {
            return false;
        }
        /* Clave anónima típica: JWT (empieza por eyJ). */
        if (k.length < 20 || k.indexOf('TU-CLAVE') !== -1 || k.indexOf('eyJ') !== 0) {
            return false;
        }
        if (u.indexOf('http://') === 0 || u.indexOf('https://') !== 0) {
            return false;
        }
        return true;
    }

    function getCreateClient() {
        const m = global.supabase;
        if (m && typeof m.createClient === 'function') {
            return m.createClient;
        }
        throw new Error('Carga assets/js/vendor/supabase.js antes de supabaseClient.js');
    }

    function getSupabase() {
        if (_client) {
            return _client;
        }
        if (!isConfigValid()) {
            throw new Error('Configure supabaseUrl y supabaseAnonKey en config (copia desde config.example.js).');
        }
        const c = global.PMO_CONFIG;
        const createClient = getCreateClient();
        _client = createClient(c.supabaseUrl, c.supabaseAnonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storage: global.localStorage
            }
        });
        return _client;
    }

    /** Descarta el cliente en memoria (p. ej. tras cambiar `PMO_CONFIG` sin recargar la página). */
    function resetClient() {
        _client = null;
    }

    function getAuthRedirectTo() {
        const c = global.PMO_CONFIG;
        if (c && c.authRedirectBaseUrl) {
            const b = String(c.authRedirectBaseUrl).replace(/\/$/, '');
            if (/\.html$/i.test(b)) {
                return b;
            }
            return b + '/index.html';
        }
        if (global.location && global.location.origin) {
            const rawPath = (global.location.pathname && global.location.pathname !== '/')
                ? global.location.pathname
                : '/index.html';
            return global.location.origin + rawPath;
        }
        return null;
    }

    /**
     * Envía correo con enlace para restablecer contraseña (configura Redirect URLs en Supabase).
     */
    async function requestPasswordResetEmail(email) {
        const redir = getAuthRedirectTo();
        if (!redir) {
            throw new Error('No se pudo determinar la URL de regreso. Defina authRedirectBaseUrl o abra la app con http://localhost/...');
        }
        return getSupabase().auth.resetPasswordForEmail(
            String(email).trim().toLowerCase(),
            { redirectTo: redir }
        );
    }

    async function fetchCurrentProfile() {
        const sb = getSupabase();
        const { data: userData, error: userError } = await sb.auth.getUser();
        if (userError) {
            throw userError;
        }
        if (!userData.user) {
            return null;
        }
        const { data, error } = await sb
            .from('profiles')
            .select('id, email, role, full_name, is_active, requested_role')
            .eq('id', userData.user.id)
            .single();
        if (error) {
            throw error;
        }
        return {
            id: data.id,
            email: data.email,
            fullName: data.full_name || '',
            appRole: ROLE_TO_APP[data.role] || 'solicitante',
            isActive: data.is_active !== false,
            requestedRole: data.requested_role || null,
            dbRole: data.role
        };
    }

    /**
     * Actualiza el nombre mostrable del perfil (RLS: solo su fila; trigger impide tocar rol).
     * @param {string} fullName Nombre o cadena vacía
     */
    async function updateMyFullName(fullName) {
        const sb = getSupabase();
        const { data: userData, error: userError } = await sb.auth.getUser();
        if (userError) {
            throw userError;
        }
        if (!userData.user) {
            throw new Error('No hay sesión de usuario.');
        }
        const trimmed = typeof fullName === 'string' ? fullName.trim() : '';
        return sb
            .from('profiles')
            .update({ full_name: trimmed === '' ? null : trimmed })
            .eq('id', userData.user.id);
    }

    /**
     * Acepta jsonb, string JSON o array de un elemento (PostgREST/JS).
     */
    function normalizeStorageStatsPayload(data) {
        if (data == null) {
            return null;
        }
        let o = data;
        if (typeof o === 'string') {
            try {
                o = JSON.parse(o);
            } catch (e) {
                return null;
            }
        }
        if (Array.isArray(o)) {
            o = o.length > 0 ? o[0] : null;
        }
        if (o == null || typeof o !== 'object') {
            return null;
        }
        const n = (key) => {
            const v = o[key];
            if (v == null) {
                return 0;
            }
            const x = Number(v);
            return Number.isFinite(x) ? x : 0;
        };
        return {
            database_total_bytes: n('database_total_bytes'),
            wal_bytes: n('wal_bytes'),
            public_schema_bytes: n('public_schema_bytes'),
            storage_documents_bytes: n('storage_documents_bytes'),
            storage_document_count: n('storage_document_count'),
            other_database_bytes: n('other_database_bytes'),
            free_tier_database_bytes_limit: n('free_tier_database_bytes_limit') || 524288000,
            free_tier_file_storage_bytes_limit: n('free_tier_file_storage_bytes_limit') || 1073741824
        };
    }

    /**
     * Estadísticas de almacenamiento (solo admin; requiere RPC en BD).
     * @returns {Promise<object|null>} objeto normalizado o null
     */
    async function getAdminStorageStats() {
        const sb = getSupabase();
        const { data, error } = await sb.rpc('get_admin_storage_stats');
        if (error) {
            throw error;
        }
        return normalizeStorageStatsPayload(data);
    }

    global.PMOSupabase = {
        isConfigValid,
        getSupabase,
        resetClient,
        fetchCurrentProfile,
        getAuthRedirectTo,
        requestPasswordResetEmail,
        updateMyFullName,
        getAdminStorageStats
    };
}(typeof window !== 'undefined' ? window : globalThis));
