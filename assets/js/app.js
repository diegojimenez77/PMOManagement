/* =========================================================================
   PMO Governance Portal - SPA Vanilla JS
   - Sin frameworks, sin innerHTML, sin alerts.
   - Feedback visual mediante notificaciones DOM y mensajes inline.
   ========================================================================= */

/* ------------------------------- Constantes ------------------------------ */

const STATUS = {
    DRAFT: 'Borrador',
    PENDING: 'En Revisión',
    APPROVED: 'Aprobado',
    REJECTED: 'Rechazado',
    CHANGES: 'Requiere Cambios',
    CLOSED: 'Cerrado'
};

const STAGE = {
    PMO: 'pmo',
    TECNICA: 'tecnica',
    DIRECTOR: 'director'
};

const STAGE_LABELS = {
    pmo: 'Revisión PMO',
    tecnica: 'Evaluación Financiera',
    director: 'Aprobación'
};

const STAGE_ORDER = [STAGE.PMO, STAGE.TECNICA, STAGE.DIRECTOR];

const LIFECYCLE_STEPS = [
    { key: 'borrador', label: 'Borrador', icon: 'edit_note' },
    { key: 'revision_pmo', label: 'Revisión PMO', icon: 'engineering' },
    { key: 'evaluacion', label: 'Evaluación Financiera', icon: 'balance' },
    { key: 'aprobacion', label: 'Aprobación', icon: 'verified_user' },
    { key: 'aprobado', label: 'Aprobado', icon: 'flag' }
];

function getLifecycleIndex(req) {
    if (req.status === STATUS.DRAFT) return 0;
    if (req.status === STATUS.APPROVED) return 4;
    if (req.status === STATUS.PENDING) {
        if (req.stage === STAGE.TECNICA) return 2;
        if (req.stage === STAGE.DIRECTOR) return 3;
        return 1;
    }
    const stageIndex = STAGE_ORDER.indexOf(req.stage || STAGE.PMO);
    return stageIndex >= 0 ? stageIndex + 1 : 1;
}

const ROLE_SOLICITANTE = 'solicitante';
const ROLE_ADMIN = 'admin';

const AREAS = [
    { value: 'ti', label: 'Tecnología de la Información' },
    { value: 'finanzas', label: 'Finanzas' },
    { value: 'operaciones', label: 'Operaciones' },
    { value: 'riesgos', label: 'Riesgos' },
    { value: 'recursos_humanos', label: 'Recursos Humanos' },
    { value: 'marketing', label: 'Marketing' }
];

const PRIORIDADES = [
    { value: 'alta', label: 'Alta' },
    { value: 'media', label: 'Media' },
    { value: 'baja', label: 'Baja' }
];

const TIPOS_PROYECTO = [
    { value: 'infraestructura', label: 'Infraestructura' },
    { value: 'desarrollo', label: 'Desarrollo de Software' },
    { value: 'integracion', label: 'Integración de Sistemas' },
    { value: 'seguridad', label: 'Seguridad y Cumplimiento' },
    { value: 'analitica', label: 'Analítica y Datos' },
    { value: 'transformacion', label: 'Transformación Digital' }
];

const ROLE_PM = 'project_manager';

/** Etiquetas de roles almacenados en public.profiles.role / requested_role */
const DB_ROLE_LABELS = {
    solicitante: 'Solicitante',
    admin: 'Administrador',
    project_manager: 'Project Manager'
};

const IMPL_STAGE = {
    INICIACION:   'iniciacion',
    ANALISIS:     'analisis',
    CONSTRUCCION: 'construccion',
    PRUEBAS:      'pruebas',
    GO_LIVE:      'go_live',
    CIERRE:       'cierre'
};

const IMPL_STAGE_ORDER = ['iniciacion','analisis','construccion','pruebas','go_live','cierre'];

/* EXPUESTO: pmoData.js (IIFE) usa window.IMPL_STAGE / window.IMPL_STAGE_ORDER al fusionar filas de Storage. */
if (typeof window !== 'undefined') {
    window.IMPL_STAGE_ORDER = IMPL_STAGE_ORDER;
    window.IMPL_STAGE = IMPL_STAGE;
}

const IMPL_STAGES_CONFIG = [
    {
        key: 'iniciacion', label: 'Iniciación', icon: 'rocket_launch', color: '#6366f1',
        docs: [
            { tag: 'acta_constitucion',   label: 'Acta de Constitución del Proyecto', required: true  },
            { tag: 'stakeholders',        label: 'Registro de Stakeholders',           required: true  },
            { tag: 'plan_comunicacion',   label: 'Plan de Comunicación',               required: false },
            { tag: 'acta_kickoff',        label: 'Acta de Kick-off',                   required: false }
        ]
    },
    {
        key: 'analisis', label: 'Análisis y Diseño', icon: 'design_services', color: '#0ea5e9',
        docs: [
            { tag: 'brd_frd',            label: 'Documento de Requerimientos (BRD/FRD)', required: true  },
            { tag: 'arquitectura',       label: 'Arquitectura / Diseño de Solución',      required: true  },
            { tag: 'plan_proyecto',      label: 'Plan de Proyecto (Cronograma)',           required: true  },
            { tag: 'matriz_riesgos',     label: 'Análisis y Matriz de Riesgos',            required: false },
            { tag: 'aprobacion_diseno',  label: 'Acta de Aprobación de Diseño',            required: false }
        ]
    },
    {
        key: 'construccion', label: 'Construcción', icon: 'construction', color: '#f59e0b',
        docs: [
            { tag: 'informe_avance',    label: 'Informe de Progreso / Avance',       required: true  },
            { tag: 'doc_tecnica',       label: 'Documentación Técnica',              required: false },
            { tag: 'actas_seguimiento', label: 'Actas de Reuniones de Seguimiento', required: false },
            { tag: 'control_cambios',   label: 'Control de Cambios al Alcance',      required: false }
        ]
    },
    {
        key: 'pruebas', label: 'Pruebas', icon: 'bug_report', color: '#ef4444',
        docs: [
            { tag: 'plan_pruebas',      label: 'Plan de Pruebas (UAT)',                   required: true },
            { tag: 'reporte_pruebas',   label: 'Reporte de Ejecución de Pruebas',         required: true },
            { tag: 'reporte_defectos',  label: 'Reporte de Defectos',                     required: true },
            { tag: 'certificacion_uat', label: 'Acta de Certificación / Aceptación UAT',  required: true }
        ]
    },
    {
        key: 'go_live', label: 'Go Live', icon: 'flag', color: '#10b981',
        docs: [
            { tag: 'checklist_produccion', label: 'Checklist de Pase a Producción',  required: true  },
            { tag: 'plan_despliegue',      label: 'Plan de Despliegue y Rollback',   required: true  },
            { tag: 'comunicacion_usuarios',label: 'Comunicación a Usuarios Finales', required: false },
            { tag: 'acta_produccion',      label: 'Acta de Puesta en Producción',    required: true  }
        ]
    },
    {
        key: 'cierre', label: 'Cierre', icon: 'task_alt', color: '#8b5cf6',
        docs: [
            { tag: 'acta_cierre',               label: 'Acta de Cierre del Proyecto',         required: true  },
            { tag: 'lecciones_aprendidas',      label: 'Informe de Lecciones Aprendidas',     required: true  },
            { tag: 'evaluacion_beneficios',     label: 'Evaluación de Beneficios Realizados', required: false },
            { tag: 'transferencia_conocimiento',label: 'Transferencia de Conocimiento',       required: false }
        ]
    }
];

/* ------------------------------- Estado --------------------------------- */

const AppState = {
    currentUser: null,
    currentView: null,
    requests: [],
    filters: {
        area: '',
        prioridad: '',
        estado: ''
    },
    pagination: {
        page: 1,
        pageSize: 5
    }
};

/** pmoData.js sincroniza con window.AppState (misma referencia que AppState). */
if (typeof window !== 'undefined') {
    window.AppState = AppState;
}

/* ------------------------------- Utilidades ----------------------------- */

async function refreshRequestsFromServer() {
    try {
        AppState.requests = await PMOData.fetchAllRequests();
    } catch (error) {
        console.error(error);
        showNotification('No se pudieron cargar las solicitudes desde el servidor.', 'error');
    }
}

async function persistRequestUpdate(req) {
    try {
        await PMOData.updateRequest(req);
    } catch (error) {
        console.error(error);
        showNotification('Error al guardar: ' + (error.message || 'Desconocido'), 'error');
        throw error;
    }
}

async function addCommentToRequest(req, text, dateStr) {
    const d = dateStr || new Date().toISOString().split('T')[0];
    await PMOData.insertRequestComment(req.id, text, d);
    if (!req.comments) {
        req.comments = [];
    }
    req.comments.push({
        author: AppState.currentUser.email,
        date: d,
        text: text
    });
}

/** Nombre visible: nombre completo o parte local del correo. */
function getUserDisplayName(user) {
    if (!user) {
        return 'Usuario';
    }
    const name = user.fullName && String(user.fullName).trim();
    if (name) {
        return name;
    }
    const email = user.email;
    if (email && email.indexOf('@') !== -1) {
        return email.split('@')[0];
    }
    return 'Usuario';
}

/** Hasta dos letras para el avatar circular. */
function getUserInitials(displayName) {
    const s = (displayName || 'U').trim();
    if (!s) {
        return 'U';
    }
    const parts = s.split(/\s+/).filter((p) => p.length > 0);
    if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return s.charAt(0).toUpperCase();
}

/** Acceso a Mi perfil: avatar con iniciales + nombre (barra lateral). */
function createSidebarUserProfile(activeRoute) {
    const user = AppState.currentUser;
    const bar = document.createElement('button');
    bar.type = 'button';
    bar.className = 'user-profile-bar';
    if (activeRoute === 'mi_perfil') {
        bar.classList.add('user-profile-bar--active');
    }
    bar.setAttribute('aria-label', 'Abrir mi perfil');
    const display = getUserDisplayName(user);
    const initials = getUserInitials(display);

    const avatar = document.createElement('div');
    avatar.className = 'user-profile-bar__avatar';
    avatar.setAttribute('aria-hidden', 'true');
    const initSpan = document.createElement('span');
    initSpan.className = 'user-profile-bar__initials';
    initSpan.textContent = initials;
    avatar.appendChild(initSpan);
    bar.appendChild(avatar);

    const textCol = document.createElement('div');
    textCol.className = 'user-profile-bar__text';
    const nameEl = document.createElement('span');
    nameEl.className = 'user-profile-bar__name';
    nameEl.textContent = display;
    if (user && user.email) {
        nameEl.title = user.email;
    }
    textCol.appendChild(nameEl);
    const sub = document.createElement('span');
    sub.className = 'user-profile-bar__sub';
    sub.textContent = 'Mi perfil';
    textCol.appendChild(sub);
    bar.appendChild(textCol);

    bar.addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo('mi_perfil');
    });

    return bar;
}

function clearAppRoot() {
    const root = document.getElementById('app-root');
    while (root.firstChild) {
        root.removeChild(root.firstChild);
    }
    return root;
}

function formatRequestId(id) {
    const padded = String(id).padStart(3, '0');
    const year = new Date().getFullYear();
    return `REQ-${year}-${padded}`;
}

function formatCurrency(value) {
    const num = Number(value);
    if (Number.isNaN(num) || !Number.isFinite(num)) {
        return '$0';
    }
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(num);
}

function formatDate(dateString) {
    if (!dateString) return '—';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/** Tamaño en bytes a texto legible (base 1024). */
function formatBytes(numBytes) {
    const n = Number(numBytes);
    if (!Number.isFinite(n) || n < 0) {
        return '—';
    }
    if (n < 1000) {
        return String(Math.round(n)) + ' B';
    }
    const units = ['KB', 'MB', 'GB', 'TB'];
    let v = n;
    let i = 0;
    const base = 1024;
    while (v >= base && i < units.length - 1) {
        v /= base;
        i += 1;
    }
    const roundUp = (v % 1) < 0.05 || v >= 10;
    return (roundUp ? Math.round(v) : v.toFixed(1)) + ' ' + units[i];
}

function getStatusBadgeClass(status) {
    switch (status) {
        case STATUS.PENDING:
            return 'badge--pending';
        case STATUS.APPROVED:
            return 'badge--approved';
        case STATUS.REJECTED:
        case STATUS.CHANGES:
            return 'badge--error';
        case STATUS.CLOSED:
            return 'badge--closed';
        case STATUS.DRAFT:
        default:
            return 'badge--draft';
    }
}

function getLabelFromValue(list, value) {
    const found = list.find((item) => item.value === value);
    return found ? found.label : value || '—';
}

function createIcon(name, extraClass) {
    const span = document.createElement('span');
    span.className = 'material-symbols-outlined';
    if (extraClass) {
        span.classList.add(extraClass);
    }
    span.textContent = name;
    return span;
}

function createIconButton(iconName, title, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'icon-button';
    button.title = title;
    button.setAttribute('aria-label', title);
    button.appendChild(createIcon(iconName));
    if (typeof onClick === 'function') {
        button.addEventListener('click', onClick);
    }
    return button;
}

function createButton(text, variant, iconName, onClick, type) {
    const button = document.createElement('button');
    button.type = type || 'button';
    button.className = `button button--${variant || 'primary'}`;
    if (iconName) {
        const icon = createIcon(iconName, 'button__icon');
        button.appendChild(icon);
    }
    const label = document.createElement('span');
    label.textContent = text;
    button.appendChild(label);
    if (typeof onClick === 'function') {
        button.addEventListener('click', onClick);
    }
    return button;
}

function createBadge(status) {
    const badge = document.createElement('span');
    badge.className = `badge ${getStatusBadgeClass(status)}`;
    badge.textContent = status;
    return badge;
}

function createFormField(options) {
    const { id, label, type, required, placeholder, value, rows, choices } = options;

    const group = document.createElement('div');
    group.className = 'form-group';

    const labelEl = document.createElement('label');
    labelEl.className = 'form-label text-label-caps';
    labelEl.setAttribute('for', id);
    labelEl.textContent = label;
    group.appendChild(labelEl);

    let input;
    if (type === 'textarea') {
        input = document.createElement('textarea');
        input.rows = rows || 4;
    } else if (type === 'select') {
        input = document.createElement('select');
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.disabled = true;
        placeholderOption.selected = true;
        placeholderOption.textContent = placeholder || 'Seleccione una opción...';
        input.appendChild(placeholderOption);
        if (Array.isArray(choices)) {
            choices.forEach((choice) => {
                const option = document.createElement('option');
                option.value = choice.value;
                option.textContent = choice.label;
                if (value === choice.value) {
                    option.selected = true;
                    placeholderOption.selected = false;
                }
                input.appendChild(option);
            });
        }
    } else {
        input = document.createElement('input');
        input.type = type || 'text';
    }

    input.id = id;
    input.name = id;
    input.className = 'form-input form-input--plain';
    if (required) {
        input.required = true;
    }
    if (placeholder && type !== 'select') {
        input.placeholder = placeholder;
    }
    if (value !== undefined && value !== null && type !== 'select') {
        input.value = value;
    }

    input.addEventListener('input', () => clearFieldError(input));
    input.addEventListener('change', () => clearFieldError(input));

    group.appendChild(input);

    return { group, input };
}

function showFieldError(input, message) {
    clearFieldError(input);
    input.classList.add('form-input--invalid');
    const error = document.createElement('span');
    error.className = 'form-error';
    error.textContent = message;
    error.dataset.errorFor = input.id;
    if (input.parentElement) {
        input.parentElement.appendChild(error);
    }
}

function clearFieldError(input) {
    input.classList.remove('form-input--invalid');
    if (input.parentElement) {
        const errors = input.parentElement.querySelectorAll('.form-error');
        errors.forEach((node) => node.remove());
    }
}

function ensureNotificationsContainer() {
    let container = document.getElementById('notifications');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notifications';
        container.className = 'notifications';
        document.body.appendChild(container);
    }
    return container;
}

/**
 * Convierte errores de red de supabase-js en texto útil (es).
 * "Failed to fetch" no es validación: indica que el navegador no pudo conectar.
 */
function formatAuthClientError(err) {
    const msg = (err && err.message) ? String(err.message) : '';
    const lower = msg.toLowerCase();
    const code = err && err.code ? String(err.code) : '';
    if (
        code === 'over_email_send_rate_limit'
        || lower.indexOf('email rate limit') !== -1
        || (lower.indexOf('email') !== -1 && lower.indexOf('limit') !== -1 && lower.indexOf('exceed') !== -1)
    ) {
        return 'Límite de correos de autenticación alcanzado (política de Supabase: pocas notificaciones por hora con el servicio de correo integrado). Vuelva a intentar más tarde, reduzca las pruebas en desarrollo, o en Supabase: Authentication → Emails configure SMTP propio para límites mayores. Si acaba de enviar un enlace, espere 1 h o revise la bandeja: quizá el correo ya se envió.';
    }
    if (
        lower.indexOf('failed to fetch') !== -1
        || lower.indexOf('networkerror') !== -1
        || lower === 'fetch failed'
        || lower.indexOf('load failed') !== -1
    ) {
        return 'No se pudo conectar con el servidor. Abra la app por http://localhost (no use file://), compruebe la URL y la clave anónima en el archivo de config, y que el proyecto de Supabase esté activo.';
    }
    return msg || 'Error de autenticación.';
}

/**
 * Aplica el perfil a AppState; si la cuenta está desactivada, cierra sesión.
 * @returns {Promise<boolean>} true si la sesión puede continuar
 */
async function applyProfileAfterAuth(profile) {
    if (!profile) {
        return false;
    }
    if (profile.isActive === false) {
        try {
            await PMOSupabase.getSupabase().auth.signOut();
        } catch (e) {
            console.warn(e);
        }
        showNotification('Su cuenta está desactivada. Contacte al administrador de la PMO.', 'error');
        return false;
    }
    AppState.currentUser = {
        id: profile.id,
        email: profile.email,
        role: profile.appRole,
        fullName: profile.fullName || ''
    };
    return true;
}

function showNotification(message, type) {
    const kind = type || 'info';
    const container = ensureNotificationsContainer();

    const notification = document.createElement('div');
    notification.className = `notification notification--${kind}`;
    notification.setAttribute('role', 'status');

    const iconName = kind === 'success' ? 'check_circle'
        : kind === 'error' ? 'error'
        : 'info';
    notification.appendChild(createIcon(iconName, 'notification__icon'));

    const content = document.createElement('div');
    content.className = 'notification__content';
    content.textContent = message;
    notification.appendChild(content);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'notification__close';
    closeBtn.setAttribute('aria-label', 'Cerrar notificación');
    closeBtn.appendChild(createIcon('close'));
    closeBtn.addEventListener('click', () => notification.remove());
    notification.appendChild(closeBtn);

    container.appendChild(notification);

    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 4000);
}

/* ------------------------------- Router --------------------------------- */

function navigateTo(route, param) {
    const publicRoute = (
        route === 'landing'
        || route === 'login'
        || route === 'register'
        || route === 'forgot_password'
        || route === 'nueva_contrasena'
        || route === 'politica_seguridad'
        || route === 'terminos_servicio'
        || route === 'soporte_sistemas'
    );
    if (!AppState.currentUser && !publicRoute) {
        navigateTo('landing');
        return;
    }

    switch (route) {
        case 'landing':
            renderLanding();
            break;
        case 'login':
            renderLogin();
            break;
        case 'register':
            renderRegister();
            break;
        case 'forgot_password':
            renderForgotPassword();
            break;
        case 'nueva_contrasena':
            renderNuevaContrasena();
            break;
        case 'politica_seguridad':
            renderLegalPage('politica_seguridad');
            break;
        case 'terminos_servicio':
            renderLegalPage('terminos_servicio');
            break;
        case 'soporte_sistemas':
            renderLegalPage('soporte_sistemas');
            break;
        case 'dashboard_solicitante':
            renderDashboardSolicitante();
            break;
        case 'dashboard_admin':
            renderDashboardAdmin();
            break;
        case 'nueva_solicitud':
            renderNuevaSolicitud(param);
            break;
        case 'metricas':
            renderMetricas();
            break;
        case 'flujo_gobierno':
            renderFlujoGobierno();
            break;
        case 'etapa_pmo':
            renderEtapaSolicitudes('revision_pmo');
            break;
        case 'etapa_tecnica':
            renderEtapaSolicitudes('evaluacion');
            break;
        case 'etapa_director':
            renderEtapaSolicitudes('aprobacion');
            break;
        case 'etapa_aprobado':
            renderEtapaSolicitudes('aprobado');
            break;
        case 'detalle_solicitud':
            renderDetalleSolicitud(param);
            break;
        case 'dashboard_pm':
            renderDashboardPM(param || null);
            break;
        case 'detalle_pm':
            renderDetallePM(param);
            break;
        case 'metricas_pm':
            renderMetricasPM();
            break;
        case 'docs_pm':
            renderDocsPM(param);
            break;
        case 'admin_usuarios':
            renderAdminUsuarios();
            break;
        case 'mi_perfil':
            renderMiPerfil();
            break;
        case 'admin_storage':
            renderAdminStorage();
            break;
        default:
            renderLanding();
    }
}

function navigateToHome() {
    if (AppState.currentUser?.role === ROLE_ADMIN) {
        navigateTo('dashboard_admin');
    } else if (AppState.currentUser?.role === ROLE_PM) {
        navigateTo('dashboard_pm');
    } else {
        navigateTo('dashboard_solicitante');
    }
}

function logout() {
    void (async () => {
        try {
            await PMOSupabase.getSupabase().auth.signOut();
        } catch (e) {
            console.warn(e);
        }
        AppState.currentUser = null;
        AppState.requests = [];
        showNotification('Sesión cerrada correctamente.', 'info');
        navigateTo('landing');
    })();
}

/* -------------------- Páginas legales (público, footer login) ------------ */

const PMO_LEGAL_PAGES = {
    politica_seguridad: {
        title: 'Política de Seguridad de la Información',
        lastUpdated: '25 de abril de 2026',
        intro:
            'Este documento establece lineamientos mínimos para el uso del portal de gobierno de la Oficina de Proyectos (PMO) y el tratamiento de la información a la que se accede a través de la misma. Su cumplimiento es obligatorio para todo el personal autorizado.',
        sections: [
            {
                title: '1. Marco y finalidad',
                paragraphs: [
                    'La plataforma está destinada a la gestión de solicitudes de proyecto, seguimiento de estados, comentarios y métricas asociadas, conforme a las políticas internas de riesgo y tecnología de la institución.',
                    'La seguridad de la información es responsabilidad compartida entre el área de tecnología, la PMO y cada usuario. Estas disposiciones complementan, sin sustituir, la normativa corporativa de ciberseguridad y privacidad vigente.'
                ]
            },
            {
                title: '2. Clasificación y confidencialidad',
                paragraphs: [
                    'Los datos tratados (identidad de usuarios, descripciones de solicitudes, presupuestos, documentación adjunta) pueden contener información sensible o reservada. El usuario debe asumir, salvo indicación en contrario, un nivel de confidencialidad equivalente a “uso interno restringido”.',
                    'Queda prohibido copiar, difundir o almacenar en sistemas no autorizados (correo personal, unidades de consumo, mensajería pública) información obtenida del portal, salvo autorización expresa o requerimiento de auditoría bajo control documentado.'
                ]
            },
            {
                title: '3. Controles de acceso y autenticación',
                paragraphs: [
                    'El acceso se otorga mediante identidad verificable (correo institucional o dominio aprobado) y credenciales personales. Está prohibido compartir cuentas, credenciales o dispositivos de autenticación reforzada si la institución los habilita.',
                    'Los roles (solicitante, administrador PMO, project manager) definen el alcance de visualización y acciones. Toda excepción de rol debe ser solicitada y aprobada a través de los canales oficiales de administración de cuentas.'
                ]
            },
            {
                title: '4. Uso aceptable',
                paragraphs: [
                    'El usuario se compromete a utilizar el servicio con fines legítimos y profesionales, sin intentar eludir controles, sondear vulnerabilidades no autorizadas, sobrecargar intencionadamente la infraestructura ni alojar software malicioso a través de adjuntos o enlaces.',
                    'Los comentarios y descripciones deben redactarse con lenguaje respetuoso, sin datos personales de terceros no necesarios para la gestión de la solicitud, en línea con la protección de datos personales y las políticas de conducta de la organización.'
                ]
            },
            {
                title: '5. Registros, trazabilidad e incidentes',
                paragraphs: [
                    'Pueden registrarse, con fines de auditoría y seguridad, accesos, acciones relevantes, direcciones IP aproximadas e identificadores técnicos, de acuerdo con la ley aplicable y las políticas de retención de la entidad.',
                    'Debe notificarse de inmediato a Ciberseguridad y a la PMO cualquier acceso no reconocido, fuga de credenciales, extravío de equipo o anomalía que pueda afectar la confidencialidad, integridad o disponibilidad del servicio.'
                ]
            },
            {
                title: '6. Actualizaciones y contacto',
                paragraphs: [
                    'Esta política puede ser actualizada. La versión en vigor se publicará en el portal; el uso continuado implica aceptación de las modificaciones materialmente notificadas.',
                    'Dudas sobre su aplicación pueden canalizarse a través de “Soporte de Sistemas” y a la oficina de riesgo y cumplimiento, según el procedimiento interno de la institución.'
                ]
            }
        ]
    },
    terminos_servicio: {
        title: 'Términos del Servicio',
        lastUpdated: '25 de abril de 2026',
        intro:
            'Los presentes términos rigen el uso del portal de PMO. Al acceder o utilizar el servicio, usted declara haber leído y aceptado estas condiciones en el marco de su relación con la organización o su contratista autorizada, según corresponda.',
        sections: [
            {
                title: '1. Descripción del servicio',
                paragraphs: [
                    'El portal permite crear y dar seguimiento a solicitudes de proyecto, conectar a solicitantes y equipos de gobierno (PMO, tecnología, dirección), y consultar estados, comentarios e indicadores operativos definidos en la solución desplegada.',
                    'La funcionalidad concreta (flujos, aprobaciones, plazos, reportes) puede evolucionar. La institución procurará mantener un comportamiento razonablemente equivalente y notificará cambios sustanciales por los canales internos o dentro de la propia aplicación.'
                ]
            },
            {
                title: '2. Cuentas y requisitos de acceso',
                paragraphs: [
                    'Quien utilice el servicio declara contar con facultad para vincular a su área o representar la necesidad de proyecto indicada, según el modelo de gobierno interno.',
                    'Las credenciales son personales. El incumplimiento (uso indebido, suplantación, múltiples identidades) puede conllevar la suspensión de acceso y el inicio de actuaciones disciplinarias o legales según el caso.'
                ]
            },
            {
                title: '3. Uso permitido y restricciones',
                paragraphs: [
                    'Se permite el envío de información necesaria para evaluar, priorizar y ejecutar las solicitudes. No está permitido utilizar el portal para fines ilícitos, publicidad, archivos ajenos al objeto del negocio o contenido ofensivo.',
                    'La carga de archivos (documentos, imágenes) responde a las cuotas, formatos y límites técnicos configurados. El usuario es responsable de respetar la propiedad intelectual y de no incluir software ejecutable o macros no validadas cuando la política lo restrinja.'
                ]
            },
            {
                title: '4. Disponibilidad y mantenimiento',
                paragraphs: [
                    'Se busca un nivel de disponibilidad alineado con plataformas de productividad similares (objetivo típico en la industria: 99,5 % mensual, excluidas ventanas anunciadas), sin que ello constituya obligación sino orientación. Pueden producirse interrupciones por mantenimiento, actualizaciones o causas de fuerza mayor.',
                    'La institución no será responsable por demoras, errores o daños derivados de fallos de conectividad, proveedores de nube, terceros integrados o factores ajenos a un control razonable.'
                ]
            },
            {
                title: '5. Propiedad intelectual y datos',
                paragraphs: [
                    'El diseño de la aplicación, su marca, textos y componentes propios permanecen bajo la titularidad de la entidad o de sus licenciantes, salvo componentes de código abierto sujetos a sus respectivas licencias.',
                    'Los metadatos y el contenido aportado por el usuario, en el marco de su labor, se consideran adecuados al objeto del servicio; su tratamiento se regirá por la política de privacidad y las normas internas de la organización, incluida la Política de Seguridad de la Información.'
                ]
            },
            {
                title: '6. Limitación de responsabilidad e indemnidad',
                paragraphs: [
                    'Dentro de lo permitido por ley, el servicio se ofrece “tal cual” y “según disponibilidad”, sin garantías tácitas de comerciabilidad o adecuación a un fin particular, más allá de la diligencia razonable en su operación.',
                    'En ningún caso la responsabilidad agregada frente a un usuario superará, para reclamaciones directas, el equivalente a las cuotas o costes demostrables vinculados al incidente, salvo dolo, culpa grave o disposición legal imperativa en contrario.'
                ]
            },
            {
                title: '7. Modificación, suspensión y ley aplicable',
                paragraphs: [
                    'La institución puede modificar los términos; la publicación en el portal notifica a los usuarios, salvo que se requiera aceptación explícita adicional (por ejemplo, cambios de tratamiento de datos sujetos a requisito legal).',
                    'Para la resolución de controversias se aplicarán la legislación y los tribunales de la sede de la entidad, sin perjuicio de mecanismos arbitrales o laborales distintos que deriven de contratos o convenios colectivos vigentes con el usuario, si aplica.'
                ]
            }
        ]
    },
    soporte_sistemas: {
        title: 'Soporte de Sistemas',
        lastUpdated: '25 de abril de 2026',
        intro:
            'A continuación se describen canales, horarios y expectativas de respuesta con el estilo adoptado comúnmente en productos de software empresarial. Los tiempos son orientativos y no sustituyen acuerdos de nivel de servicio (SLA) firmados entre áreas, cuando existan.',
        sections: [
            {
                title: '1. Objetivo del soporte',
                paragraphs: [
                    'El área de soporte atiende incidencias técnicas del portal (acceso, rendimiento, errores de la aplicación, configuración de perfiles) y deriva, cuando procede, a la PMO o a ciberseguridad para cuestiones de negocio o de riesgo.',
                    'Cada reporte se registra con un identificador interno y prioridad, en línea con tablas de severidad alineadas a buenas prácticas ITIL / SDM.'
                ]
            },
            {
                title: '2. Canales oficiales',
                paragraphs: [
                    'Mesa de ayuda / Service Desk: número y extensión publicados en el directorio interno. Correo: soporte@institucion.com (sustituya por el buzón real de su organización; este texto es de referencia de producto).',
                    'Intranet: busque el catálogo de servicio “Aplicación PMO” para apertura de tickets, base de conocimiento (FAQ) e instructivos. No atendemos requerimientos con datos sensibles por canales no corporativos (WhatsApp personal, etc.).'
                ],
                list: [
                    'Ticket de categoría "Acceso y roles" (cuentas, bloqueos, asignación de perfiles).',
                    'Ticket de categoría "Defecto o error" (mensajes 500, pantallas inaccesibles, datos inconsistentes).',
                    'Ticket de categoría "Mejora" (evolutivos no urgentes) con prioridad normal.'
                ]
            },
            {
                title: '3. Horario de atención',
                paragraphs: [
                    'Días laborables, de 08:00 a 20:00 en la zona horaria de la cabecera, con guardia básica o guardia 24/7 solamente si la contratación institucional lo estipula. Fuera de horario, el ticket se encola y se responde al siguiente día hábil, salvo incidentes P1 (críticos) cubiertos por el modelo on-call, cuando esté desplegado.',
                    'Los fines de semana y festivos locales: solo respuesta a incidentes críticos aprobados por el centro de mando, si aplica a su unidad de negocio.'
                ]
            },
            {
                title: '4. Criterios de severidad (orientativos, industria)',
                paragraphs: [
                    'A efectos de priorización, muchas plantillas corporativas emplean cuatro niveles, similares a productos de mercado; los plazos son máximos orientativos de primera respuesta, no de resolución completa, salvo que su SLA indique otra cosa.',
                    'P1 (crítico): servicio totalmente inaccesible o brecha de seguridad en curso; primera respuesta típica < 1 h laboral. P2 (alto): degradación severa; típica < 4 h. P3 (medio): fallo parcial, workaround disponible; típica < 1 día. P4 (bajo): consultas, mejoras, documentación; típica < 2–3 días laborables.'
                ],
                list: [
                    'Indique siempre: pantalla, hora, navegador, ID de solicitud, captura de error (sin datos clasificados).',
                    'Un solo ticket por incidencia evita la fragmentación y acelera el cierre con causa raíz documentada.'
                ]
            },
            {
                title: '5. Escalación y fuera de alcance',
                paragraphs: [
                    'Tras un tiempo de espera o si no hay progreso, el ticket escala a segundo nivel (arquitectura de aplicación o DBA) y, si procede, a la PMO o al responsable de negocio indicado en el anexo de gobierno.',
                    'Queda fuera de alcance el soporte a equipos de usuario no gestionados, redes domésticas, o decisiones de prioridad de proyectos, que competen a los comités de inversión o a la propia PMO, no a la mesa de ayuda de sistemas.'
                ]
            }
        ]
    }
};

/**
 * @param {'politica_seguridad'|'terminos_servicio'|'soporte_sistemas'} pageId
 */
function renderLegalPage(pageId) {
    const def = PMO_LEGAL_PAGES[pageId];
    if (!def) {
        navigateTo('login');
        return;
    }
    AppState.currentView = pageId;
    const root = clearAppRoot();
    document.body.classList.add('has-fixed-footer');

    const main = document.createElement('main');
    main.className = 'legal-page';

    const decor = document.createElement('div');
    decor.className = 'legal-page__decor';
    decor.setAttribute('aria-hidden', 'true');
    const g1 = document.createElement('div');
    g1.className = 'legal-page__glow legal-page__glow--1';
    const g2 = document.createElement('div');
    g2.className = 'legal-page__glow legal-page__glow--2';
    decor.appendChild(g1);
    decor.appendChild(g2);
    main.appendChild(decor);

    const inner = document.createElement('div');
    inner.className = 'legal-page__inner';

    const back = document.createElement('a');
    back.href = '#';
    back.className = 'legal-page__back';
    const backIcon = createIcon('arrow_back', 'legal-page__back-icon');
    const backSpan = document.createElement('span');
    backSpan.textContent = 'Volver al inicio de sesión';
    back.appendChild(backIcon);
    back.appendChild(backSpan);
    back.addEventListener('click', (ev) => {
        ev.preventDefault();
        navigateTo('login');
    });

    const h1 = document.createElement('h1');
    h1.className = 'legal-page__title text-headline-md';
    h1.textContent = def.title;

    const meta = document.createElement('p');
    meta.className = 'legal-page__meta text-body-sm';
    meta.textContent = `Documento informativo · Última actualización: ${def.lastUpdated}`;

    const intro = document.createElement('p');
    intro.className = 'legal-page__intro text-body-sm';
    intro.textContent = def.intro;

    const article = document.createElement('article');
    article.className = 'legal-page__article';

    def.sections.forEach((sec) => {
        const section = document.createElement('section');
        section.className = 'legal-page__section';
        const h2 = document.createElement('h2');
        h2.className = 'legal-page__section-title text-title-sm';
        h2.textContent = sec.title;
        section.appendChild(h2);
        sec.paragraphs.forEach((pt) => {
            const p = document.createElement('p');
            p.className = 'legal-page__paragraph text-body-sm';
            p.textContent = pt;
            section.appendChild(p);
        });
        if (sec.list && sec.list.length > 0) {
            const ul = document.createElement('ul');
            ul.className = 'legal-page__list';
            sec.list.forEach((line) => {
                const li = document.createElement('li');
                li.className = 'legal-page__list-item text-body-sm';
                li.textContent = line;
                ul.appendChild(li);
            });
            section.appendChild(ul);
        }
        article.appendChild(section);
    });

    inner.appendChild(back);
    inner.appendChild(h1);
    inner.appendChild(meta);
    inner.appendChild(intro);
    inner.appendChild(article);

    main.appendChild(inner);
    root.appendChild(main);
    root.appendChild(createAuthFooter({ showInicio: true }));
}

/**
 * @param {{ showInicio?: boolean }} [options] En la portada no se muestra el enlace Inicio
 * @returns {HTMLElement}
 */
function createAuthFooter(options) {
    const showInicio = !options || options.showInicio !== false;
    const footer = document.createElement('footer');
    footer.className = 'footer footer--login';
    const links = document.createElement('div');
    links.className = 'footer__links';
    const baseItems = [
        { text: 'Política de Seguridad', route: 'politica_seguridad' },
        { text: 'Términos del Servicio', route: 'terminos_servicio' },
        { text: 'Soporte de Sistemas', route: 'soporte_sistemas' }
    ];
    const items = showInicio
        ? [{ text: 'Inicio', route: 'landing' }, ...baseItems]
        : baseItems;
    items.forEach(({ text, route }) => {
        const a = document.createElement('a');
        a.href = '#';
        a.className = 'footer__link';
        a.textContent = text;
        a.addEventListener('click', (ev) => {
            ev.preventDefault();
            navigateTo(route);
        });
        links.appendChild(a);
    });
    footer.appendChild(links);
    return footer;
}

/* ------------------------ Landing (portada) ----------------------------- */

const LANDING_FEATURES = [
    { icon: 'account_tree', title: 'Etapas y gobierno', text: 'De borrador a aprobado, con visibilidad para PMO y Tecnología.' },
    { icon: 'chat', title: 'Comentarios y trazabilidad', text: 'Diálogo y registro en un solo lugar.' },
    { icon: 'bar_chart', title: 'Métricas', text: 'Cartera, estados y desempeño a la vista.' },
    { icon: 'group', title: 'Roles', text: 'Solicitante, PM, administrador: permisos claros.' },
    { icon: 'description', title: 'Solicitudes', text: 'Formularios consistentes hacia Tecnología.' },
    { icon: 'cloud_upload', title: 'Evidencia', text: 'Documentos y etapas alineados al flujo.' }
];

const LANDING_BENEFITS = [
    { title: 'Prioriza y da seguimiento en un solo espacio', kicker: 'Cartera' },
    { title: 'Etapas, aprobaciones y roles con el mismo criterio', kicker: 'Gobierno' },
    { title: 'Comentarios e historial listos al revisar', kicker: 'Trazabilidad' }
];

function createLandingFeatureCard(data, index) {
    const card = document.createElement('article');
    const tone = ['a', 'b', 'c'][index % 3];
    card.className = `landing__feature landing__feature--${tone}`;
    const iconWrap = document.createElement('div');
    iconWrap.className = 'landing__feature-icon';
    iconWrap.appendChild(createIcon(data.icon, 'landing__feature-icon-glyph'));
    const h3 = document.createElement('h3');
    h3.className = 'landing__feature-title text-title-sm';
    h3.textContent = data.title;
    const p = document.createElement('p');
    p.className = 'landing__feature-text text-body-sm';
    p.textContent = data.text;
    card.appendChild(iconWrap);
    card.appendChild(h3);
    card.appendChild(p);
    return card;
}

function createLandingCtaGroup(modifier) {
    const group = document.createElement('div');
    group.className = modifier
        ? `landing__actions landing__actions--${modifier}`
        : 'landing__actions';
    const startBtn = createButton('Comenzar', 'primary', 'rocket_launch', () => {
        navigateTo('register');
    });
    startBtn.setAttribute('aria-label', 'Crear una cuenta: comenzar');
    group.appendChild(startBtn);
    if (modifier !== 'hero') {
        const loginBtn = createButton('Iniciar sesión', 'secondary', 'login', () => {
            navigateTo('login');
        });
        group.appendChild(loginBtn);
    }
    return group;
}

function renderLanding() {
    AppState.currentView = 'landing';
    document.title = 'PMO Workflow — Gobierno de solicitudes de proyecto';
    const root = clearAppRoot();
    document.body.classList.add('has-fixed-footer');

    const main = document.createElement('main');
    main.className = 'landing';
    main.setAttribute('aria-label', 'Portada del producto PMO Workflow');

    const bg = document.createElement('div');
    bg.className = 'landing__bg';
    bg.setAttribute('aria-hidden', 'true');
    const o1 = document.createElement('div');
    o1.className = 'landing__orb landing__orb--1';
    const o2 = document.createElement('div');
    o2.className = 'landing__orb landing__orb--2';
    const o3 = document.createElement('div');
    o3.className = 'landing__orb landing__orb--3';
    bg.appendChild(o1);
    bg.appendChild(o2);
    bg.appendChild(o3);
    main.appendChild(bg);

    const header = document.createElement('header');
    header.className = 'landing__header';
    const headInner = document.createElement('div');
    headInner.className = 'landing__header-inner';
    const logo = document.createElement('a');
    logo.href = '#';
    logo.className = 'landing__logo';
    logo.setAttribute('aria-label', 'PMO Workflow, inicio de portada');
    logo.appendChild(createIcon('account_tree', 'landing__logo-icon'));
    const logoText = document.createElement('span');
    logoText.className = 'landing__logo-text';
    logoText.textContent = 'PMO Workflow';
    logo.appendChild(logoText);
    logo.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    const nav = document.createElement('div');
    nav.className = 'landing__nav-cta';
    const navIn = createButton('Iniciar sesión', 'secondary', 'login', () => {
        navigateTo('login');
    });
    navIn.classList.add('button--sm');
    nav.appendChild(navIn);
    headInner.appendChild(logo);
    headInner.appendChild(nav);
    header.appendChild(headInner);
    main.appendChild(header);

    const wrap = document.createElement('div');
    wrap.className = 'landing__wrap';

    const hero = document.createElement('section');
    hero.className = 'landing__hero';
    hero.setAttribute('aria-labelledby', 'landing-hero-title');
    const heroBox = document.createElement('div');
    heroBox.className = 'landing__panel landing__panel--hero';
    const eyebrow = document.createElement('p');
    eyebrow.className = 'landing__eyebrow text-label-caps';
    eyebrow.textContent = 'Cartera · Gobierno · Tecnología';
    const h1 = document.createElement('h1');
    h1.id = 'landing-hero-title';
    h1.className = 'landing__title';
    h1.textContent = 'Administra tu portafolio de proyectos, de la idea a la puesta en producción';
    const lead = document.createElement('p');
    lead.className = 'landing__lead text-body-md';
    lead.textContent = 'Solicitudes, comentarios y métricas sin dispersar en correos ni hojas.';
    const heroCta = createLandingCtaGroup('hero');
    heroBox.appendChild(eyebrow);
    heroBox.appendChild(h1);
    heroBox.appendChild(lead);
    heroBox.appendChild(heroCta);
    hero.appendChild(heroBox);
    wrap.appendChild(hero);

    const strip = document.createElement('div');
    strip.className = 'landing__strip landing__panel landing__panel--mid';
    const stripLabel = document.createElement('p');
    stripLabel.className = 'landing__strip-title text-title-sm';
    stripLabel.textContent = 'Una sola vista de la cartera, riesgo bajo control';
    const labels = document.createElement('ul');
    labels.className = 'landing__strip-list';
    ['Cartera', 'Riesgo', 'Auditoría'].forEach((t) => {
        const li = document.createElement('li');
        li.className = 'landing__strip-item text-body-sm';
        li.textContent = t;
        labels.appendChild(li);
    });
    strip.appendChild(stripLabel);
    strip.appendChild(labels);
    wrap.appendChild(strip);

    const featSection = document.createElement('section');
    featSection.className = 'landing__section';
    featSection.setAttribute('aria-labelledby', 'landing-feat-h');
    const featHead = document.createElement('h2');
    featHead.id = 'landing-feat-h';
    featHead.className = 'landing__section-title text-headline-md';
    featHead.textContent = 'Lo esencial, en claro';
    const grid = document.createElement('div');
    grid.className = 'landing__grid';
    LANDING_FEATURES.forEach((item, index) => {
        grid.appendChild(createLandingFeatureCard(item, index));
    });
    featSection.appendChild(featHead);
    featSection.appendChild(grid);
    wrap.appendChild(featSection);

    const benSection = document.createElement('section');
    benSection.className = 'landing__section';
    benSection.setAttribute('aria-labelledby', 'landing-ben-h');
    const benHead = document.createElement('h2');
    benHead.id = 'landing-ben-h';
    benHead.className = 'landing__section-title text-headline-md';
    benHead.textContent = 'Tres capas, un solo flujo';
    const benRow = document.createElement('div');
    benRow.className = 'landing__benefit-row';
    LANDING_BENEFITS.forEach((b, i) => {
        const bCard = document.createElement('div');
        bCard.className = `landing__benefit-pill landing__benefit-pill--${(i % 3) + 1}`;
        const bK = document.createElement('span');
        bK.className = 'landing__benefit-pill-k';
        bK.textContent = b.kicker;
        const bTitle = document.createElement('h3');
        bTitle.className = 'landing__benefit-pill-t';
        bTitle.textContent = b.title;
        bCard.appendChild(bK);
        bCard.appendChild(bTitle);
        benRow.appendChild(bCard);
    });
    benSection.appendChild(benHead);
    benSection.appendChild(benRow);
    wrap.appendChild(benSection);

    const cta = document.createElement('section');
    cta.className = 'landing__section landing__section--cta';
    cta.setAttribute('aria-labelledby', 'landing-cta-h');
    const ctaBox = document.createElement('div');
    ctaBox.className = 'landing__cta-box';
    const ctaH = document.createElement('h2');
    ctaH.id = 'landing-cta-h';
    ctaH.className = 'landing__cta-title text-headline-md';
    ctaH.textContent = 'Entre al portal';
    const ctaP = document.createElement('p');
    ctaP.className = 'landing__cta-lead text-body-sm';
    ctaP.textContent = 'Cuenta nueva o inicio de sesión con su usuario institucional.';
    ctaBox.appendChild(ctaH);
    ctaBox.appendChild(ctaP);
    ctaBox.appendChild(createLandingCtaGroup('footer'));
    cta.appendChild(ctaBox);
    wrap.appendChild(cta);

    main.appendChild(wrap);
    root.appendChild(main);
    root.appendChild(createAuthFooter({ showInicio: false }));
}

/* ------------------------------- Login ---------------------------------- */

function renderLogin() {
    AppState.currentView = 'login';
    document.title = 'Iniciar sesión — PMO Bancaria';
    const root = clearAppRoot();
    document.body.classList.add('has-fixed-footer');

    const loginView = document.createElement('main');
    loginView.className = 'login-view';

    const decor = document.createElement('div');
    decor.className = 'login-view__decor';
    decor.setAttribute('aria-hidden', 'true');
    const glow1 = document.createElement('div');
    glow1.className = 'login-view__glow login-view__glow--1';
    const glow2 = document.createElement('div');
    glow2.className = 'login-view__glow login-view__glow--2';
    decor.appendChild(glow1);
    decor.appendChild(glow2);
    loginView.appendChild(decor);

    const frame = document.createElement('div');
    frame.className = 'login-view__frame';

    const pageHeader = document.createElement('header');
    pageHeader.className = 'login-view__header';
    const backToLanding = document.createElement('a');
    backToLanding.href = '#';
    backToLanding.className = 'login-view__back';
    backToLanding.setAttribute('aria-label', 'Volver a la portada');
    backToLanding.title = 'Volver a la portada';
    backToLanding.appendChild(createIcon('arrow_back', 'login-view__back-icon'));
    backToLanding.addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo('landing');
    });
    pageHeader.appendChild(backToLanding);
    frame.appendChild(pageHeader);

    const shell = document.createElement('div');
    shell.className = 'login-view__shell';

    const brand = document.createElement('aside');
    brand.className = 'login-view__brand';
    brand.setAttribute('aria-label', 'Descripción del portal');

    const brandInner = document.createElement('div');
    brandInner.className = 'login-view__brand-inner';

    const brandKicker = document.createElement('p');
    brandKicker.className = 'login-view__brand-kicker';
    brandKicker.textContent = 'Banca · Tecnología';

    const brandTitle = document.createElement('h2');
    brandTitle.className = 'login-view__brand-title';
    brandTitle.textContent = 'Oficina de Proyectos';

    const brandSub = document.createElement('p');
    brandSub.className = 'login-view__brand-sub';
    brandSub.textContent =
        'Gobierno, trazabilidad y priorización de solicitudes hacia el área de tecnología.';

    const brandBadge = document.createElement('div');
    brandBadge.className = 'login-view__brand-badge';
    const badgeIcon = createIcon('verified_user', 'login-view__brand-badge-icon');
    const badgeText = document.createElement('span');
    badgeText.textContent = 'Entorno corporativo';
    brandBadge.appendChild(badgeIcon);
    brandBadge.appendChild(badgeText);

    brandInner.appendChild(brandKicker);
    brandInner.appendChild(brandTitle);
    brandInner.appendChild(brandSub);
    brandInner.appendChild(brandBadge);
    brand.appendChild(brandInner);

    const cardCol = document.createElement('div');
    cardCol.className = 'login-view__card-col';

    const loginCard = document.createElement('div');
    loginCard.className = 'login-card';

    const header = document.createElement('div');
    header.className = 'login-card__header';

    const iconContainer = document.createElement('div');
    iconContainer.className = 'login-card__icon-container';
    iconContainer.appendChild(createIcon('account_tree', 'login-card__icon'));
    header.appendChild(iconContainer);

    const title = document.createElement('h1');
    title.className = 'text-headline-md login-card__title';
    title.textContent = 'Portal de Gobierno PMO';
    header.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'text-body-sm login-card__subtitle';
    subtitle.textContent = 'Inicie sesión para administrar las solicitudes de proyecto';
    header.appendChild(subtitle);

    loginCard.appendChild(header);

    const form = document.createElement('form');
    form.noValidate = true;

    const emailField = createFormField({
        id: 'login-email',
        label: 'Correo Electrónico',
        type: 'email',
        required: true,
        placeholder: 'usuario@banco.com'
    });
    form.appendChild(emailField.group);

    const passwordField = createFormField({
        id: 'login-password',
        label: 'Contraseña',
        type: 'password',
        required: true,
        placeholder: 'Ingrese su contraseña'
    });
    form.appendChild(passwordField.group);

    const forgotP = document.createElement('p');
    forgotP.className = 'login-card__forgot text-body-sm';
    const forgotLink = document.createElement('a');
    forgotLink.href = '#';
    forgotLink.className = 'login-card__link';
    forgotLink.textContent = '¿Olvidó su contraseña?';
    forgotLink.addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo('forgot_password');
    });
    forgotP.appendChild(forgotLink);
    form.appendChild(forgotP);

    const submitBtn = createButton('Iniciar Sesión', 'primary', 'login', null, 'submit');
    submitBtn.classList.add('button--block');
    form.appendChild(submitBtn);

    const registerP = document.createElement('p');
    registerP.className = 'login-card__register text-body-sm';
    const registerLink = document.createElement('a');
    registerLink.href = '#';
    registerLink.className = 'login-card__link';
    registerLink.textContent = 'Crear una cuenta (solicitante)';
    registerLink.addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo('register');
    });
    registerP.appendChild(registerLink);
    form.appendChild(registerP);

    if (!PMOSupabase.isConfigValid()) {
        const errBox = document.createElement('p');
        errBox.className = 'login-card__error text-body-sm';
        errBox.textContent = 'Falta configurar Supabase: URL (https://….supabase.co) y clave pública anon (empieza por eyJ) en el archivo de config.';
        form.appendChild(errBox);
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const email = emailField.input.value.trim();
        const password = passwordField.input.value;

        let hasError = false;
        if (!email) {
            showFieldError(emailField.input, 'Ingrese un correo electrónico.');
            hasError = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showFieldError(emailField.input, 'Ingrese un correo electrónico válido.');
            hasError = true;
        }

        if (!password) {
            showFieldError(passwordField.input, 'Ingrese su contraseña.');
            hasError = true;
        }

        if (hasError) {
            return;
        }

        if (!PMOSupabase.isConfigValid()) {
            showNotification('Configuración de Supabase incompleta. Copie Project URL y la clave anon (eyJ...) desde el panel, en su archivo de config.', 'error');
            return;
        }

        void (async () => {
            const sb = PMOSupabase.getSupabase();
            const { data, error } = await sb.auth.signInWithPassword({ email, password });
            if (error) {
                const net = formatAuthClientError(error);
                if (net.indexOf('No se pudo conectar') === 0) {
                    showNotification(net, 'error');
                    return;
                }
                showFieldError(passwordField.input, 'Credenciales incorrectas o cuenta no verificada.');
                showNotification(error.message || 'No se pudo iniciar sesión.', 'error');
                return;
            }
            if (!data.user) {
                return;
            }
            try {
                const profile = await PMOSupabase.fetchCurrentProfile();
                const ok = await applyProfileAfterAuth(profile);
                if (!ok) {
                    return;
                }
                await refreshRequestsFromServer();
                showNotification(`Bienvenido al portal, ${profile.email}.`, 'success');
                navigateToHome();
            } catch (err) {
                console.error(err);
                showNotification('No se pudo cargar el perfil. Intente de nuevo.', 'error');
            }
        })();
    });

    loginCard.appendChild(form);

    const footerNote = document.createElement('div');
    footerNote.className = 'login-footer-note text-body-sm';
    footerNote.appendChild(createIcon('verified_user'));
    const noteText = document.createElement('span');
    noteText.textContent = 'Acceso restringido a personal autorizado';
    footerNote.appendChild(noteText);
    loginCard.appendChild(footerNote);

    cardCol.appendChild(loginCard);
    shell.appendChild(brand);
    shell.appendChild(cardCol);
    frame.appendChild(shell);
    loginView.appendChild(frame);

    root.appendChild(loginView);
    root.appendChild(createAuthFooter());
}

function renderRegister() {
    AppState.currentView = 'register';
    document.title = 'Crear cuenta — PMO Workflow';
    const root = clearAppRoot();
    document.body.classList.add('has-fixed-footer');

    const main = document.createElement('main');
    main.className = 'login-view';

    const decor = document.createElement('div');
    decor.className = 'login-view__decor';
    decor.setAttribute('aria-hidden', 'true');
    const regGlow1 = document.createElement('div');
    regGlow1.className = 'login-view__glow login-view__glow--1';
    const regGlow2 = document.createElement('div');
    regGlow2.className = 'login-view__glow login-view__glow--2';
    decor.appendChild(regGlow1);
    decor.appendChild(regGlow2);
    main.appendChild(decor);

    const frame = document.createElement('div');
    frame.className = 'login-view__frame';
    const pageHeader = document.createElement('header');
    pageHeader.className = 'login-view__header';
    const regBackLanding = document.createElement('a');
    regBackLanding.href = '#';
    regBackLanding.className = 'login-view__back';
    regBackLanding.setAttribute('aria-label', 'Volver a la portada');
    regBackLanding.title = 'Volver a la portada';
    regBackLanding.appendChild(createIcon('arrow_back', 'login-view__back-icon'));
    regBackLanding.addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo('landing');
    });
    pageHeader.appendChild(regBackLanding);
    frame.appendChild(pageHeader);

    const shell = document.createElement('div');
    shell.className = 'login-view__shell login-view__shell--register';

    const cardCol = document.createElement('div');
    cardCol.className = 'login-view__card-col';

    const card = document.createElement('div');
    card.className = 'login-card';

    const header = document.createElement('div');
    header.className = 'login-card__header';
    const iconC = document.createElement('div');
    iconC.className = 'login-card__icon-container';
    iconC.appendChild(createIcon('person_add', 'login-card__icon'));
    header.appendChild(iconC);
    const title = document.createElement('h1');
    title.className = 'text-headline-md login-card__title';
    title.textContent = 'Crear cuenta';
    header.appendChild(title);
    const sub = document.createElement('p');
    sub.className = 'text-body-sm login-card__subtitle';
    sub.textContent = 'Elija el perfil deseado. Los roles Administrador o Project Manager requieren aprobación de un administrador; hasta entonces su acceso es como solicitante.';
    header.appendChild(sub);
    card.appendChild(header);

    const form = document.createElement('form');
    form.noValidate = true;
    const emailF = createFormField({ id: 'reg-email', label: 'Correo', type: 'email', required: true, placeholder: 'usuario@banco.com' });
    const regRoleF = createFormField({
        id: 'reg-role',
        label: 'Tipo de cuenta deseada',
        type: 'select',
        required: true,
        value: 'solicitante',
        choices: [
            { value: 'solicitante', label: 'Solicitante' },
            { value: 'admin', label: 'Administrador PMO' },
            { value: 'project_manager', label: 'Project Manager' }
        ]
    });
    const pass1 = createFormField({ id: 'reg-pw1', label: 'Contraseña (mín. 6 caracteres)', type: 'password', required: true, placeholder: 'Contraseña' });
    const pass2 = createFormField({ id: 'reg-pw2', label: 'Confirmar contraseña', type: 'password', required: true, placeholder: 'Repita la contraseña' });
    form.appendChild(emailF.group);
    form.appendChild(regRoleF.group);
    form.appendChild(pass1.group);
    form.appendChild(pass2.group);
    const btn = createButton('Registrarme', 'primary', 'person_add', null, 'submit');
    btn.classList.add('button--block');
    form.appendChild(btn);

    const back = document.createElement('a');
    back.href = '#';
    back.className = 'login-card__link text-body-sm';
    back.textContent = 'Volver a inicio de sesión';
    back.addEventListener('click', (ev) => {
        ev.preventDefault();
        navigateTo('login');
    });
    const backP = document.createElement('p');
    backP.className = 'login-card__register';
    backP.appendChild(back);
    form.appendChild(backP);

    if (!PMOSupabase.isConfigValid()) {
        const errBox = document.createElement('p');
        errBox.className = 'login-card__error text-body-sm';
        errBox.textContent = 'Falta configurar Supabase: URL y clave pública anon en el archivo de config.';
        form.appendChild(errBox);
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!PMOSupabase.isConfigValid()) {
            showNotification('Configuración de Supabase incompleta. Rellene la URL (https://xxxxx.supabase.co) y la clave anon pública (eyJ...) en el config.', 'error');
            return;
        }
        const em = emailF.input.value.trim();
        const p1 = pass1.input.value;
        const p2 = pass2.input.value;
        if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
            showFieldError(emailF.input, 'Ingrese un correo válido.');
            return;
        }
        if (p1.length < 6) {
            showFieldError(pass1.input, 'Mínimo 6 caracteres.');
            return;
        }
        if (p1 !== p2) {
            showFieldError(pass2.input, 'Las contraseñas no coinciden.');
            return;
        }
        const tipoCuenta = regRoleF.input.value;
        void (async () => {
            const { data, error } = await PMOSupabase.getSupabase().auth.signUp({
                email: em,
                password: p1,
                options: { data: { requested_app_role: tipoCuenta } }
            });
            if (error) {
                showNotification(formatAuthClientError(error), 'error');
                return;
            }
            if (data.user && !data.session) {
                let msg = 'Revise su correo para confirmar el registro, luego inicie sesión.';
                if (tipoCuenta === 'admin' || tipoCuenta === 'project_manager') {
                    msg = 'Cuenta creada. Tras confirmar el correo, inicie sesión. Un administrador deberá aprobar su solicitud de rol de ' + (DB_ROLE_LABELS[tipoCuenta] || tipoCuenta) + '.';
                }
                showNotification(msg, 'info');
                navigateTo('login');
            } else if (data.session) {
                try {
                    const profile = await PMOSupabase.fetchCurrentProfile();
                    const ok = await applyProfileAfterAuth(profile);
                    if (!ok) {
                        return;
                    }
                    await refreshRequestsFromServer();
                    let msg = 'Cuenta creada correctamente.';
                    if (profile.requestedRole === 'admin' || profile.requestedRole === 'project_manager') {
                        msg = 'Cuenta creada. Un administrador debe aprobar su solicitud de ' + (DB_ROLE_LABELS[profile.requestedRole] || 'rol') + ' en Usuarios y cuentas.';
                    }
                    showNotification(msg, 'success');
                    navigateToHome();
                } catch (e) {
                    console.error(e);
                    showNotification('Cuenta creada. Inicie sesión.', 'info');
                    navigateTo('login');
                }
            }
        })();
    });

    card.appendChild(form);

    const regBrand = document.createElement('aside');
    regBrand.className = 'login-view__brand';
    regBrand.setAttribute('aria-label', 'Información sobre el registro');
    const regBrandInner = document.createElement('div');
    regBrandInner.className = 'login-view__brand-inner';
    const regKicker = document.createElement('p');
    regKicker.className = 'login-view__brand-kicker';
    regKicker.textContent = 'Cuenta nueva';
    const regBrandTitle = document.createElement('h2');
    regBrandTitle.className = 'login-view__brand-title';
    regBrandTitle.textContent = 'Únase a PMO Workflow';
    const regBrandSub = document.createElement('p');
    regBrandSub.className = 'login-view__brand-sub';
    regBrandSub.textContent =
        'Cree su acceso con correo institucional. Los roles de administrador o Project Manager requieren validación; hasta entonces podrá actuar como solicitante.';
    const regBadge = document.createElement('div');
    regBadge.className = 'login-view__brand-badge';
    regBadge.appendChild(createIcon('mark_email_unread', 'login-view__brand-badge-icon'));
    const regBadgeText = document.createElement('span');
    regBadgeText.textContent = 'Confirme el correo para activar';
    regBadge.appendChild(regBadgeText);
    regBrandInner.appendChild(regKicker);
    regBrandInner.appendChild(regBrandTitle);
    regBrandInner.appendChild(regBrandSub);
    regBrandInner.appendChild(regBadge);
    regBrand.appendChild(regBrandInner);

    cardCol.appendChild(card);
    shell.appendChild(cardCol);
    shell.appendChild(regBrand);
    frame.appendChild(shell);
    main.appendChild(frame);
    root.appendChild(main);
    root.appendChild(createAuthFooter());
}

function renderForgotPassword() {
    AppState.currentView = 'forgot_password';
    const root = clearAppRoot();
    document.body.classList.add('has-fixed-footer');

    const main = document.createElement('main');
    main.className = 'login-view';

    const card = document.createElement('div');
    card.className = 'login-card';

    const header = document.createElement('div');
    header.className = 'login-card__header';
    const iconC = document.createElement('div');
    iconC.className = 'login-card__icon-container';
    iconC.appendChild(createIcon('lock_reset', 'login-card__icon'));
    header.appendChild(iconC);
    const title = document.createElement('h1');
    title.className = 'text-headline-md login-card__title';
    title.textContent = 'Recuperar contraseña';
    header.appendChild(title);
    const sub = document.createElement('p');
    sub.className = 'text-body-sm login-card__subtitle';
    sub.textContent = 'Escriba su correo. Recibirá un enlace para restablecer la contraseña (reviso también el spam).';
    header.appendChild(sub);
    card.appendChild(header);

    const form = document.createElement('form');
    form.noValidate = true;
    const emailF = createFormField({
        id: 'forgot-email',
        label: 'Correo electrónico',
        type: 'email',
        required: true,
        placeholder: 'usuario@banco.com'
    });
    form.appendChild(emailF.group);

    const submitBtn = createButton('Enviar enlace', 'primary', 'send', null, 'submit');
    submitBtn.classList.add('button--block');
    form.appendChild(submitBtn);

    const back = document.createElement('a');
    back.href = '#';
    back.className = 'login-card__link text-body-sm';
    back.textContent = 'Volver a inicio de sesión';
    back.addEventListener('click', (ev) => {
        ev.preventDefault();
        navigateTo('login');
    });
    const backP = document.createElement('p');
    backP.className = 'login-card__register';
    backP.appendChild(back);
    form.appendChild(backP);

    if (!PMOSupabase.isConfigValid()) {
        const errBox = document.createElement('p');
        errBox.className = 'login-card__error text-body-sm';
        errBox.textContent = 'Falta configurar Supabase en el archivo de config.';
        form.appendChild(errBox);
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!PMOSupabase.isConfigValid()) {
            showNotification('Configure la URL y la clave anon en el config.', 'error');
            return;
        }
        const em = emailF.input.value.trim();
        if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
            showFieldError(emailF.input, 'Ingrese un correo válido.');
            return;
        }
        void (async () => {
            try {
                const { error } = await PMOSupabase.requestPasswordResetEmail(em);
                if (error) {
                    showNotification(formatAuthClientError(error), 'error');
                    return;
                }
                showNotification('Si el correo está registrado, le enviaremos un enlace para restablecer la contraseña.', 'info');
                navigateTo('login');
            } catch (e) {
                console.error(e);
                const msg = (e && e.message) ? String(e.message) : 'No se pudo enviar el correo.';
                showNotification(msg, 'error');
            }
        })();
    });

    card.appendChild(form);
    main.appendChild(card);
    root.appendChild(main);
}

function renderNuevaContrasena() {
    void (async () => {
        if (!PMOSupabase || !PMOSupabase.getSupabase) {
            return;
        }
        const { data: s } = await PMOSupabase.getSupabase().auth.getSession();
        if (!s.session) {
            showNotification('Sesión de recuperación no disponible. Solicite un nuevo enlace desde Iniciar sesión.', 'error');
            navigateTo('login');
            return;
        }
        doRenderNuevaContrasenaForm();
    })();
}

function doRenderNuevaContrasenaForm() {
    AppState.currentView = 'nueva_contrasena';
    const root = clearAppRoot();
    document.body.classList.add('has-fixed-footer');

    const main = document.createElement('main');
    main.className = 'login-view';
    const card = document.createElement('div');
    card.className = 'login-card';

    const header = document.createElement('div');
    header.className = 'login-card__header';
    const iconC = document.createElement('div');
    iconC.className = 'login-card__icon-container';
    iconC.appendChild(createIcon('passkey', 'login-card__icon'));
    header.appendChild(iconC);
    const title = document.createElement('h1');
    title.className = 'text-headline-md login-card__title';
    title.textContent = 'Nueva contraseña';
    header.appendChild(title);
    const sub = document.createElement('p');
    sub.className = 'text-body-sm login-card__subtitle';
    sub.textContent = 'Elija una contraseña segura (mínimo 6 caracteres) y no la comparta con terceros.';
    header.appendChild(sub);
    card.appendChild(header);

    const form = document.createElement('form');
    form.noValidate = true;
    const p1 = createFormField({ id: 'new-pw1', label: 'Nueva contraseña', type: 'password', required: true, placeholder: 'Nueva contraseña' });
    const p2 = createFormField({ id: 'new-pw2', label: 'Confirmar contraseña', type: 'password', required: true, placeholder: 'Repita la contraseña' });
    form.appendChild(p1.group);
    form.appendChild(p2.group);
    const btn = createButton('Guardar y continuar', 'primary', 'check', null, 'submit');
    btn.classList.add('button--block');
    form.appendChild(btn);

    const linkCancel = document.createElement('a');
    linkCancel.href = '#';
    linkCancel.className = 'login-card__link text-body-sm';
    linkCancel.textContent = 'Cancelar e iniciar sesión otra vez';
    linkCancel.addEventListener('click', (ev) => {
        ev.preventDefault();
        void (async () => {
            try {
                await PMOSupabase.getSupabase().auth.signOut();
            } catch (e) {
                console.warn(e);
            }
            if (typeof window !== 'undefined' && window.history && window.location) {
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
            navigateTo('login');
        })();
    });
    const pCan = document.createElement('p');
    pCan.className = 'login-card__register';
    pCan.appendChild(linkCancel);
    form.appendChild(pCan);

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const s1 = p1.input.value;
        const s2 = p2.input.value;
        if (s1.length < 6) {
            showFieldError(p1.input, 'Mínimo 6 caracteres.');
            return;
        }
        if (s1 !== s2) {
            showFieldError(p2.input, 'Las contraseñas no coinciden.');
            return;
        }
        void (async () => {
            const { error } = await PMOSupabase.getSupabase().auth.updateUser({ password: s1 });
            if (error) {
                showNotification(formatAuthClientError(error), 'error');
                return;
            }
            try {
                if (typeof window !== 'undefined' && window.history && window.location) {
                    window.history.replaceState(null, '', window.location.pathname + window.location.search);
                }
                const profile = await PMOSupabase.fetchCurrentProfile();
                const ok = await applyProfileAfterAuth(profile);
                if (!ok) {
                    return;
                }
                await refreshRequestsFromServer();
                showNotification('Contraseña actualizada. Bienvenido.', 'success');
                navigateToHome();
            } catch (e) {
                console.error(e);
                showNotification('Contraseña actualizada. Inicie sesión con la nueva clave.', 'info');
                navigateTo('login');
            }
        })();
    });

    card.appendChild(form);
    main.appendChild(card);
    root.appendChild(main);
}

/* -------------------------- Layout de Dashboard ------------------------- */

function createDashboardLayout(activeRoute) {
    document.body.classList.remove('has-fixed-footer');
    const root = clearAppRoot();

    const layout = document.createElement('div');
    layout.className = 'dashboard-layout';

    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';

    const sidebarHeader = document.createElement('div');
    sidebarHeader.className = 'sidebar__header';

    const sidebarTitle = document.createElement('h1');
    sidebarTitle.className = 'sidebar__title';
    sidebarTitle.textContent = 'PMO Bancaria';
    sidebarHeader.appendChild(sidebarTitle);

    const sidebarSubtitle = document.createElement('p');
    sidebarSubtitle.className = 'sidebar__subtitle';
    sidebarSubtitle.textContent = 'Gobierno y Riesgos';
    sidebarHeader.appendChild(sidebarSubtitle);

    sidebar.appendChild(sidebarHeader);

    const nav = document.createElement('nav');
    nav.className = 'sidebar__nav';

    const role = AppState.currentUser?.role;
    let menuItems = [];
    if (role === ROLE_ADMIN) {
        menuItems = [
            { id: 'dashboard_admin',  icon: 'dashboard',     text: 'Panel de Solicitudes' },
            { id: 'flujo_gobierno',   icon: 'account_tree',  text: 'Flujo de Gobierno'    },
            { type: 'divider', label: 'Etapas' },
            { id: 'etapa_pmo',         icon: 'engineering',   text: 'Revisión PMO'         },
            { id: 'etapa_tecnica',     icon: 'balance',       text: 'Evaluación Financiera'},
            { id: 'etapa_director',    icon: 'verified_user', text: 'Aprobación'           },
            { id: 'etapa_aprobado',    icon: 'verified',      text: 'Aprobadas'            },
            { type: 'divider', label: 'Reportes' },
            { id: 'metricas',          icon: 'analytics',     text: 'Métricas y Reportes'  },
            { id: 'admin_storage',     icon: 'hard_drive',    text: 'Storage'            },
            { type: 'divider', label: 'Administración de usuarios' },
            { id: 'admin_usuarios',   icon: 'group',         text: 'Usuarios y cuentas'   }
        ];
    } else if (role === ROLE_PM) {
        menuItems = [
            { id: 'dashboard_pm',  icon: 'view_kanban',  text: 'Kanban de Proyectos' },
            { type: 'divider', label: 'Reportes' },
            { id: 'metricas_pm',   icon: 'analytics',    text: 'Métricas de Implementación' }
        ];
    } else {
        menuItems = [
            { id: 'dashboard_solicitante', icon: 'dashboard',       text: 'Mis Solicitudes' },
            { id: 'nueva_solicitud',       icon: 'assignment_add',  text: 'Nueva Solicitud' }
        ];
    }

    menuItems.forEach((item) => {
        if (item.type === 'divider') {
            const label = document.createElement('p');
            label.className = 'nav-section-label';
            label.textContent = item.label;
            nav.appendChild(label);
            return;
        }
        const link = document.createElement('a');
        link.href = '#';
        link.className = 'nav-item';
        if (activeRoute === item.id) {
            link.classList.add('nav-item--active');
        }
        link.appendChild(createIcon(item.icon));
        const textEl = document.createElement('span');
        textEl.textContent = item.text;
        link.appendChild(textEl);
        link.addEventListener('click', (event) => {
            event.preventDefault();
            navigateTo(item.id);
        });
        nav.appendChild(link);
    });
    sidebar.appendChild(nav);

    const userBlock = createSidebarUserProfile(activeRoute);
    userBlock.classList.add('sidebar__user');
    sidebar.appendChild(userBlock);

    const sidebarFooter = document.createElement('div');
    sidebarFooter.className = 'sidebar__footer';

    const logoutBtn = document.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.className = 'sidebar__logout';
    logoutBtn.appendChild(createIcon('logout', 'button__icon'));
    const logoutLabel = document.createElement('span');
    logoutLabel.textContent = 'Cerrar Sesión';
    logoutBtn.appendChild(logoutLabel);
    logoutBtn.addEventListener('click', logout);
    sidebarFooter.appendChild(logoutBtn);

    sidebar.appendChild(sidebarFooter);
    layout.appendChild(sidebar);

    const mainArea = document.createElement('div');
    mainArea.className = 'main-area';

    const mobileHeader = document.createElement('header');
    mobileHeader.className = 'mobile-header';

    const mobileTitle = document.createElement('div');
    mobileTitle.className = 'mobile-header__title';
    mobileTitle.textContent = 'Portal PMO';
    mobileHeader.appendChild(mobileTitle);

    const mobileActions = document.createElement('div');
    mobileActions.className = 'mobile-header__actions';
    mobileActions.appendChild(createIconButton('person', 'Mi perfil', () => {
        navigateTo('mi_perfil');
    }));
    mobileActions.appendChild(createIconButton('logout', 'Cerrar sesión', logout));
    mobileHeader.appendChild(mobileActions);

    mainArea.appendChild(mobileHeader);

    const canvas = document.createElement('main');
    canvas.className = 'main-content';
    mainArea.appendChild(canvas);

    layout.appendChild(mainArea);
    root.appendChild(layout);

    return canvas;
}

function createPageHeader(title, subtitle, actionButton) {
    const pageHeader = document.createElement('div');
    pageHeader.className = 'page-header';

    const titles = document.createElement('div');

    const titleEl = document.createElement('h1');
    titleEl.className = 'page-header__title';
    titleEl.textContent = title;
    titles.appendChild(titleEl);

    if (subtitle) {
        const subtitleEl = document.createElement('p');
        subtitleEl.className = 'page-header__subtitle';
        subtitleEl.textContent = subtitle;
        titles.appendChild(subtitleEl);
    }

    pageHeader.appendChild(titles);

    if (actionButton) {
        const actions = document.createElement('div');
        actions.className = 'page-header__actions';
        actions.appendChild(actionButton);
        pageHeader.appendChild(actions);
    }

    return pageHeader;
}

/* ----------------------------- Summary Card ----------------------------- */

function createSummaryCard(title, value, iconName, trendIconName, trendText) {
    const card = document.createElement('div');
    card.className = 'summary-card';

    const header = document.createElement('div');
    header.className = 'summary-card__header';

    const titleEl = document.createElement('span');
    titleEl.className = 'summary-card__title';
    titleEl.textContent = title;
    header.appendChild(titleEl);

    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'summary-card__icon-wrapper';
    iconWrapper.appendChild(createIcon(iconName));
    header.appendChild(iconWrapper);

    card.appendChild(header);

    const valueEl = document.createElement('div');
    valueEl.className = 'summary-card__value';
    valueEl.textContent = String(value);
    card.appendChild(valueEl);

    if (trendText) {
        const trend = document.createElement('div');
        trend.className = 'summary-card__trend';
        if (trendIconName) {
            trend.appendChild(createIcon(trendIconName, 'trend-icon'));
        }
        const trendSpan = document.createElement('span');
        trendSpan.textContent = trendText;
        trend.appendChild(trendSpan);
        card.appendChild(trend);
    }

    return card;
}

/* ------------------------------- Tablas --------------------------------- */

function createEmptyState(iconName, message, colSpan) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = colSpan;

    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.appendChild(createIcon(iconName, 'empty-state__icon'));
    const text = document.createElement('div');
    text.className = 'empty-state__text';
    text.textContent = message;
    empty.appendChild(text);

    td.appendChild(empty);
    tr.appendChild(td);
    return tr;
}

function createTableHead(headers) {
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    headers.forEach((header) => {
        const th = document.createElement('th');
        if (typeof header === 'string') {
            th.textContent = header;
        } else {
            th.textContent = header.text;
            if (header.align === 'center') {
                th.classList.add('text-center');
            } else if (header.align === 'right') {
                th.classList.add('text-right');
            }
        }
        tr.appendChild(th);
    });
    thead.appendChild(tr);
    return thead;
}

function createRequestRow(req, includeApplicant) {
    const tr = document.createElement('tr');

    const tdId = document.createElement('td');
    tdId.className = 'text-subtle';
    tdId.textContent = formatRequestId(req.id);
    tr.appendChild(tdId);

    const tdTitle = document.createElement('td');
    tdTitle.className = 'text-primary-color text-bold';
    tdTitle.textContent = req.title;
    tr.appendChild(tdTitle);

    if (includeApplicant) {
        const tdApplicant = document.createElement('td');
        tdApplicant.className = 'text-subtle';
        tdApplicant.textContent = req.applicant;
        tr.appendChild(tdApplicant);
    }

    const tdStatus = document.createElement('td');
    tdStatus.appendChild(createBadge(req.status));
    tr.appendChild(tdStatus);

    const tdDate = document.createElement('td');
    tdDate.className = 'text-subtle';
    tdDate.textContent = formatDate(req.date);
    tr.appendChild(tdDate);

    const tdActions = document.createElement('td');
    tdActions.classList.add('text-center');
    if (req.status === STATUS.DRAFT) {
        tdActions.appendChild(createIconButton('edit', 'Editar borrador', () => {
            navigateTo('nueva_solicitud', req.id);
        }));
    } else if (req.status === STATUS.CHANGES) {
        tdActions.appendChild(createIconButton('rate_review', 'Realizar ajustes', () => {
            navigateTo('detalle_solicitud', req.id);
        }));
    } else {
        tdActions.appendChild(createIconButton('visibility', 'Ver detalle', () => {
            navigateTo('detalle_solicitud', req.id);
        }));
    }
    tr.appendChild(tdActions);

    return tr;
}

/* ----------------------------- Mi perfil ------------------------------- */

function renderMiPerfil() {
    if (!AppState.currentUser) {
        navigateTo('landing');
        return;
    }
    AppState.currentView = 'mi_perfil';
    const canvas = createDashboardLayout('mi_perfil');

    const loading = document.createElement('p');
    loading.className = 'text-body-md';
    loading.textContent = 'Cargando perfil...';
    canvas.appendChild(loading);

    void (async () => {
        let profile;
        try {
            profile = await PMOSupabase.fetchCurrentProfile();
        } catch (e) {
            console.error(e);
            while (canvas.firstChild) {
                canvas.removeChild(canvas.firstChild);
            }
            const errP = document.createElement('p');
            errP.className = 'form-error';
            errP.textContent = 'No se pudo cargar el perfil. Compruebe su conexión e intente de nuevo.';
            canvas.appendChild(errP);
            return;
        }
        if (!profile) {
            while (canvas.firstChild) {
                canvas.removeChild(canvas.firstChild);
            }
            const errP2 = document.createElement('p');
            errP2.className = 'form-error';
            errP2.textContent = 'No se encontró el perfil.';
            canvas.appendChild(errP2);
            return;
        }
        AppState.currentUser.fullName = profile.fullName || '';

        while (canvas.firstChild) {
            canvas.removeChild(canvas.firstChild);
        }

        canvas.appendChild(
            createPageHeader(
                'Mi perfil',
                'Resumen de su cuenta, datos de contacto y opciones de seguridad.'
            )
        );

        const roleLabel = DB_ROLE_LABELS[profile.appRole] || profile.appRole;
        const nameTrim = (profile.fullName && profile.fullName.trim()) ? profile.fullName.trim() : '';
        const nameKpiValue = nameTrim
            ? (nameTrim.length > 28 ? `${nameTrim.slice(0, 26)}…` : nameTrim)
            : 'Sin definir';
        const emailLocal = (profile.email && profile.email.includes('@'))
            ? profile.email.split('@')[0]
            : (profile.email || '—');
        const emailKpiValue = emailLocal.length > 22 ? `${emailLocal.slice(0, 20)}…` : emailLocal;

        const kpiGrid = document.createElement('div');
        kpiGrid.className = 'mi-perfil__kpi-grid';
        kpiGrid.appendChild(
            createMetricaKPICard({
                label: 'Rol en el portal',
                value: roleLabel,
                icon: 'badge',
                sub: 'Permisos de acceso actuales',
                color: '#6366f1'
            })
        );
        kpiGrid.appendChild(
            createMetricaKPICard({
                label: 'Nombre visible',
                value: nameKpiValue,
                icon: 'person',
                sub: 'Cómo se muestra en el portal',
                color: '#10b981'
            })
        );
        kpiGrid.appendChild(
            createMetricaKPICard({
                label: 'Correo (usuario)',
                value: emailKpiValue,
                icon: 'mail',
                sub: profile.email,
                color: '#0ea5e9'
            })
        );

        const mainCol = document.createElement('div');
        mainCol.className = 'mi-perfil';

        const cardCuenta = _chartCard(
            'Cuenta',
            'Identificación, rol y avisos sobre solicitudes de permisos adicionales.'
        );

        const emailF = createFormField({
            id: 'perfil-email',
            label: 'Correo electrónico',
            type: 'email',
            value: profile.email
        });
        emailF.input.readOnly = true;
        emailF.input.setAttribute('aria-readonly', 'true');
        cardCuenta.appendChild(emailF.group);

        const rolP = document.createElement('p');
        rolP.className = 'perfil-cuenta__line';
        const rolLabel = document.createElement('span');
        rolLabel.className = 'perfil-cuenta__line-label text-label-caps';
        rolLabel.textContent = 'Rol asignado';
        const rolVal = document.createElement('span');
        rolVal.className = 'perfil-cuenta__line-value';
        rolVal.textContent = roleLabel;
        rolP.appendChild(rolLabel);
        rolP.appendChild(rolVal);
        cardCuenta.appendChild(rolP);

        if (
            profile.requestedRole
            && (profile.requestedRole === 'admin' || profile.requestedRole === 'project_manager')
        ) {
            const pending = document.createElement('p');
            pending.className = 'perfil-cuenta__note';
            pending.textContent = 'Solicitud de rol de '
                + (DB_ROLE_LABELS[profile.requestedRole] || profile.requestedRole)
                + ' pendiente de aprobación por un administrador.';
            cardCuenta.appendChild(pending);
        }
        mainCol.appendChild(kpiGrid);
        mainCol.appendChild(cardCuenta);

        const cardNombre = _chartCard(
            'Nombre para mostrar',
            'Así se verá en comentarios, listas y al iniciar sesión (cuando el nombre esté guardado).'
        );

        const nameF = createFormField({
            id: 'perfil-fullname',
            label: 'Nombre y apellido (opcional)',
            type: 'text',
            placeholder: 'Cómo desea ser identificado en el portal',
            value: profile.fullName || ''
        });

        const nameForm = document.createElement('form');
        nameForm.className = 'perfil-cuenta__form';
        nameForm.appendChild(nameF.group);
        const nameActions = document.createElement('div');
        nameActions.className = 'perfil-cuenta__actions';
        const saveName = createButton('Guardar', 'primary', 'save', null, 'submit');
        nameActions.appendChild(saveName);
        nameForm.appendChild(nameActions);
        nameForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const v = nameF.input.value.trim();
            void (async () => {
                clearFieldError(nameF.input);
                const { error } = await PMOSupabase.updateMyFullName(v);
                if (error) {
                    showFieldError(nameF.input, error.message || 'No se pudo guardar el nombre.');
                    return;
                }
                AppState.currentUser.fullName = v;
                showNotification('Nombre actualizado correctamente.', 'success');
                navigateTo('mi_perfil');
            })();
        });
        cardNombre.appendChild(nameForm);
        mainCol.appendChild(cardNombre);

        const cardSeg = _chartCard(
            'Seguridad',
            'Cambie su contraseña de acceso al portal. Mínimo 6 caracteres.'
        );

        const p1 = createFormField({
            id: 'perfil-pw1',
            label: 'Nueva contraseña',
            type: 'password',
            required: true,
            placeholder: 'Nueva contraseña'
        });
        const p2 = createFormField({
            id: 'perfil-pw2',
            label: 'Confirmar contraseña',
            type: 'password',
            required: true,
            placeholder: 'Repita la contraseña'
        });
        const pwdForm = document.createElement('form');
        pwdForm.className = 'perfil-cuenta__form';
        pwdForm.appendChild(p1.group);
        pwdForm.appendChild(p2.group);
        const pwdActions = document.createElement('div');
        pwdActions.className = 'perfil-cuenta__actions';
        const savePwd = createButton('Actualizar contraseña', 'secondary', 'lock', null, 'submit');
        pwdActions.appendChild(savePwd);
        pwdForm.appendChild(pwdActions);
        pwdForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const s1 = p1.input.value;
            const s2 = p2.input.value;
            if (s1.length < 6) {
                showFieldError(p1.input, 'Mínimo 6 caracteres.');
                return;
            }
            if (s1 !== s2) {
                showFieldError(p2.input, 'Las contraseñas no coinciden.');
                return;
            }
            void (async () => {
                clearFieldError(p1.input);
                clearFieldError(p2.input);
                const { error } = await PMOSupabase.getSupabase().auth.updateUser({ password: s1 });
                if (error) {
                    showFieldError(p1.input, formatAuthClientError(error));
                    return;
                }
                p1.input.value = '';
                p2.input.value = '';
                showNotification('Contraseña actualizada correctamente.', 'success');
            })();
        });
        cardSeg.appendChild(pwdForm);
        mainCol.appendChild(cardSeg);

        canvas.appendChild(mainCol);
    })();
}

/* -------------------- Dashboard del Solicitante ------------------------- */

function renderDashboardSolicitante() {
    AppState.currentView = 'dashboard_solicitante';
    const canvas = createDashboardLayout('dashboard_solicitante');

    const displayName = getUserDisplayName(AppState.currentUser);

    const newReqBtn = createButton('Nueva Solicitud', 'primary', 'add_circle',
        () => navigateTo('nueva_solicitud'));

    canvas.appendChild(createPageHeader(
        `Hola, ${displayName}`,
        'Resumen de sus solicitudes de proyecto',
        newReqBtn
    ));

    const myRequests = AppState.requests.filter(
        (req) => req.applicant === AppState.currentUser?.email
    );

    const approvedCount = myRequests.filter((r) => r.status === STATUS.APPROVED).length;
    const pendingCount = myRequests.filter((r) => r.status === STATUS.PENDING).length;
    const changesCount = myRequests.filter((r) => r.status === STATUS.CHANGES).length;
    const draftCount = myRequests.filter((r) => r.status === STATUS.DRAFT).length;

    const cardsGrid = document.createElement('div');
    cardsGrid.className = 'cards-grid';
    cardsGrid.appendChild(createSummaryCard(
        'Mis Solicitudes', myRequests.length, 'folder_open',
        'trending_up', 'Total histórico'
    ));
    cardsGrid.appendChild(createSummaryCard(
        'Borradores', draftCount, 'edit_note',
        'save', 'Pendientes de envío'
    ));
    cardsGrid.appendChild(createSummaryCard(
        'En Revisión', pendingCount, 'pending_actions',
        'schedule', 'Pendientes del comité'
    ));
    cardsGrid.appendChild(createSummaryCard(
        'Aprobadas', approvedCount, 'verified',
        'check_circle', 'En ejecución'
    ));
    canvas.appendChild(cardsGrid);

    if (draftCount > 0) {
        const draftCard = document.createElement('div');
        draftCard.className = 'summary-card summary-card--alert';

        const draftTitle = document.createElement('div');
        draftTitle.className = 'summary-card__title';
        draftTitle.textContent = 'Borradores sin enviar';
        draftCard.appendChild(draftTitle);

        const draftText = document.createElement('p');
        draftText.className = 'text-body-md';
        draftText.textContent = `Tiene ${draftCount} borrador(es) guardado(s). Complételos y envíelos para iniciar el proceso de aprobación.`;
        draftCard.appendChild(draftText);

        canvas.appendChild(draftCard);
    }

    if (changesCount > 0) {
        const infoCard = document.createElement('div');
        infoCard.className = 'summary-card summary-card--alert';

        const infoTitle = document.createElement('div');
        infoTitle.className = 'summary-card__title';
        infoTitle.textContent = 'Solicitudes que requieren ajustes';
        infoCard.appendChild(infoTitle);

        const infoText = document.createElement('p');
        infoText.className = 'text-body-md';
        infoText.textContent = `Tiene ${changesCount} solicitud(es) con ajustes pendientes. Ábralas, realice los cambios solicitados por la PMO y envíelas nuevamente a revisión.`;
        infoCard.appendChild(infoText);

        canvas.appendChild(infoCard);
    }

    const tableCard = document.createElement('div');
    tableCard.className = 'table-card';

    const tableHeader = document.createElement('div');
    tableHeader.className = 'table-card__header';
    const tableTitle = document.createElement('h3');
    tableTitle.className = 'table-card__title';
    tableTitle.textContent = 'Mis Solicitudes Recientes';
    tableHeader.appendChild(tableTitle);
    tableCard.appendChild(tableHeader);

    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';

    const table = document.createElement('table');
    table.className = 'data-table';

    table.appendChild(createTableHead([
        'ID',
        'Título del Proyecto',
        'Estado',
        'Fecha de Creación',
        { text: 'Acciones', align: 'center' }
    ]));

    const tbody = document.createElement('tbody');

    if (myRequests.length === 0) {
        tbody.appendChild(createEmptyState(
            'folder_off',
            'Aún no ha creado solicitudes. Use el botón "Nueva Solicitud" para comenzar.',
            5
        ));
    } else {
        myRequests
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date))
            .forEach((req) => tbody.appendChild(createRequestRow(req, false)));
    }

    table.appendChild(tbody);
    tableContainer.appendChild(table);
    tableCard.appendChild(tableContainer);

    canvas.appendChild(tableCard);
}

/* ------------------------- Nueva Solicitud ------------------------------ */

function renderNuevaSolicitud(draftId) {
    const existingDraft = draftId
        ? AppState.requests.find((r) => r.id === parseInt(draftId, 10) && r.status === STATUS.DRAFT)
        : null;

    AppState.currentView = 'nueva_solicitud';
    const canvas = createDashboardLayout('nueva_solicitud');

    const pageTitle = existingDraft ? 'Editar Borrador' : 'Nueva Solicitud';
    const pageSubtitle = existingDraft
        ? `Editando ${formatRequestId(existingDraft.id)} — complete todos los campos y envíe cuando esté listo.`
        : 'Complete el formulario de intake para iniciar la evaluación del proyecto.';

    canvas.appendChild(createPageHeader(pageTitle, pageSubtitle));

    const formWrapper = document.createElement('div');
    formWrapper.className = 'form-wrapper';

    const form = document.createElement('form');
    form.noValidate = true;

    const section1 = document.createElement('section');
    section1.className = 'form-section';

    const section1Title = document.createElement('h2');
    section1Title.className = 'form-section__title';
    section1Title.textContent = '1. Información General';
    section1.appendChild(section1Title);

    const grid1 = document.createElement('div');
    grid1.className = 'form-section__grid form-section__grid--2cols';

    const fieldTitulo = createFormField({
        id: 'titulo',
        label: 'Título del Proyecto',
        type: 'text',
        required: true,
        placeholder: 'Ej. Actualización del CRM Central',
        value: existingDraft ? existingDraft.title : undefined
    });
    fieldTitulo.group.classList.add('form-section__full');
    grid1.appendChild(fieldTitulo.group);

    const fieldArea = createFormField({
        id: 'area',
        label: 'Área Solicitante',
        type: 'select',
        required: true,
        placeholder: 'Seleccione un área...',
        choices: AREAS,
        value: existingDraft ? existingDraft.area : undefined
    });
    grid1.appendChild(fieldArea.group);

    const fieldTipo = createFormField({
        id: 'tipoProyecto',
        label: 'Tipo de Proyecto',
        type: 'select',
        required: true,
        placeholder: 'Seleccione un tipo...',
        choices: TIPOS_PROYECTO,
        value: existingDraft ? existingDraft.tipoProyecto : undefined
    });
    grid1.appendChild(fieldTipo.group);

    const fieldPrioridad = createFormField({
        id: 'prioridad',
        label: 'Prioridad Sugerida',
        type: 'select',
        required: true,
        placeholder: 'Seleccione prioridad...',
        choices: PRIORIDADES,
        value: existingDraft ? existingDraft.prioridad : undefined
    });
    grid1.appendChild(fieldPrioridad.group);

    const fieldFecha = createFormField({
        id: 'fechaEstimadaInicio',
        label: 'Fecha Estimada de Inicio',
        type: 'date',
        required: true,
        value: existingDraft ? existingDraft.fechaEstimadaInicio : undefined
    });
    grid1.appendChild(fieldFecha.group);

    section1.appendChild(grid1);
    form.appendChild(section1);

    const section2 = document.createElement('section');
    section2.className = 'form-section';

    const section2Title = document.createElement('h2');
    section2Title.className = 'form-section__title';
    section2Title.textContent = '2. Justificación';
    section2.appendChild(section2Title);

    const grid2 = document.createElement('div');
    grid2.className = 'form-section__grid';

    const fieldNecesidad = createFormField({
        id: 'necesidad',
        label: 'Necesidad de Negocio',
        type: 'textarea',
        required: true,
        rows: 4,
        placeholder: 'Describa la necesidad u oportunidad que motiva este proyecto...',
        value: existingDraft ? existingDraft.necesidad : undefined
    });
    grid2.appendChild(fieldNecesidad.group);

    const fieldImpacto = createFormField({
        id: 'impacto',
        label: 'Impacto Esperado',
        type: 'textarea',
        required: true,
        rows: 3,
        placeholder: '¿Cómo beneficiará este proyecto al área y a la institución?',
        value: existingDraft ? existingDraft.impacto : undefined
    });
    grid2.appendChild(fieldImpacto.group);

    section2.appendChild(grid2);
    form.appendChild(section2);

    const section3 = document.createElement('section');
    section3.className = 'form-section';

    const section3Title = document.createElement('h2');
    section3Title.className = 'form-section__title';
    section3Title.textContent = '3. Presupuesto';
    section3.appendChild(section3Title);

    const grid3 = document.createElement('div');
    grid3.className = 'form-section__grid form-section__grid--2cols';

    const fieldPresupuesto = createFormField({
        id: 'presupuestoEstimado',
        label: 'Presupuesto Estimado (USD)',
        type: 'number',
        required: true,
        placeholder: 'Ej. 500000',
        value: existingDraft ? existingDraft.presupuestoEstimado : undefined
    });
    fieldPresupuesto.input.min = '0';
    fieldPresupuesto.input.step = '1000';
    grid3.appendChild(fieldPresupuesto.group);

    section3.appendChild(grid3);
    form.appendChild(section3);

    const actions = document.createElement('div');
    actions.className = 'form-actions';

    const btnCancel = createButton('Cancelar', 'secondary', null,
        () => navigateTo('dashboard_solicitante'));
    actions.appendChild(btnCancel);

    const btnDraft = createButton('Guardar Borrador', 'secondary', 'save', (event) => {
        event.preventDefault();
        void saveDraft();
    });
    actions.appendChild(btnDraft);

    const btnSubmit = createButton('Enviar Solicitud', 'primary', 'send', null, 'submit');
    actions.appendChild(btnSubmit);

    form.appendChild(actions);

    async function saveDraft() {
        const titleValue = fieldTitulo.input.value.trim();
        if (!titleValue || titleValue.length < 3) {
            showFieldError(fieldTitulo.input, 'Ingrese un título de al menos 3 caracteres para guardar el borrador.');
            showNotification('El título es obligatorio para guardar el borrador.', 'error');
            return;
        }

        const draftData = {
            title: titleValue,
            status: STATUS.DRAFT,
            stage: STAGE.PMO,
            applicant: AppState.currentUser.email,
            area: fieldArea.input.value || '',
            prioridad: fieldPrioridad.input.value || '',
            tipoProyecto: fieldTipo.input.value || '',
            necesidad: fieldNecesidad.input.value.trim(),
            impacto: fieldImpacto.input.value.trim(),
            presupuestoEstimado: fieldPresupuesto.input.value || '0',
            fechaEstimadaInicio: fieldFecha.input.value || '',
            comments: existingDraft && existingDraft.comments ? existingDraft.comments : []
        };

        try {
            if (existingDraft) {
                const index = AppState.requests.findIndex((r) => r.id === existingDraft.id);
                if (index !== -1) {
                    const updated = { ...AppState.requests[index], ...draftData, applicantId: AppState.currentUser.id };
                    AppState.requests[index] = updated;
                    await persistRequestUpdate(updated);
                }
                showNotification(`Borrador ${formatRequestId(existingDraft.id)} actualizado correctamente.`, 'success');
            } else {
                const newDraft = {
                    date: new Date().toISOString().split('T')[0],
                    comments: [],
                    ...draftData,
                    applicantId: AppState.currentUser.id
                };
                const created = await PMOData.insertRequest(newDraft, AppState.currentUser.id);
                showNotification(`Borrador ${formatRequestId(created.id)} guardado correctamente.`, 'success');
            }
            navigateTo('dashboard_solicitante');
        } catch (e) {
            /* persistRequestUpdate / insertRequest ya notifican */
        }
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const fields = [
            { field: fieldTitulo, message: 'Ingrese el título del proyecto.', validate: (v) => v.trim().length >= 3, minMessage: 'El título debe tener al menos 3 caracteres.' },
            { field: fieldArea, message: 'Seleccione el área solicitante.' },
            { field: fieldTipo, message: 'Seleccione el tipo de proyecto.' },
            { field: fieldPrioridad, message: 'Seleccione la prioridad.' },
            { field: fieldFecha, message: 'Seleccione una fecha estimada de inicio.' },
            { field: fieldNecesidad, message: 'Describa la necesidad de negocio.', validate: (v) => v.trim().length >= 10, minMessage: 'Describa con al menos 10 caracteres.' },
            { field: fieldImpacto, message: 'Describa el impacto esperado.', validate: (v) => v.trim().length >= 10, minMessage: 'Describa con al menos 10 caracteres.' },
            { field: fieldPresupuesto, message: 'Ingrese el presupuesto estimado.', validate: (v) => Number(v) > 0, minMessage: 'Ingrese un monto mayor a cero.' }
        ];

        let hasError = false;
        fields.forEach(({ field, message, validate, minMessage }) => {
            const value = field.input.value;
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                showFieldError(field.input, message);
                hasError = true;
                return;
            }
            if (typeof validate === 'function' && !validate(value)) {
                showFieldError(field.input, minMessage || message);
                hasError = true;
            }
        });

        if (hasError) {
            showNotification('Revise los campos resaltados del formulario.', 'error');
            return;
        }

        void (async () => {
            try {
                if (existingDraft) {
                    const index = AppState.requests.findIndex((r) => r.id === existingDraft.id);
                    if (index !== -1) {
                        const next = {
                            ...AppState.requests[index],
                            title: fieldTitulo.input.value.trim(),
                            status: STATUS.PENDING,
                            stage: STAGE.PMO,
                            area: fieldArea.input.value,
                            prioridad: fieldPrioridad.input.value,
                            tipoProyecto: fieldTipo.input.value,
                            necesidad: fieldNecesidad.input.value.trim(),
                            impacto: fieldImpacto.input.value.trim(),
                            presupuestoEstimado: fieldPresupuesto.input.value,
                            fechaEstimadaInicio: fieldFecha.input.value,
                            applicant: AppState.currentUser.email,
                            applicantId: AppState.currentUser.id
                        };
                        AppState.requests[index] = next;
                        await persistRequestUpdate(next);
                    }
                    showNotification(`Solicitud ${formatRequestId(existingDraft.id)} enviada correctamente.`, 'success');
                } else {
                    const newRequest = {
                        title: fieldTitulo.input.value.trim(),
                        status: STATUS.PENDING,
                        stage: STAGE.PMO,
                        date: new Date().toISOString().split('T')[0],
                        applicant: AppState.currentUser.email,
                        area: fieldArea.input.value,
                        prioridad: fieldPrioridad.input.value,
                        tipoProyecto: fieldTipo.input.value,
                        necesidad: fieldNecesidad.input.value.trim(),
                        impacto: fieldImpacto.input.value.trim(),
                        presupuestoEstimado: fieldPresupuesto.input.value,
                        fechaEstimadaInicio: fieldFecha.input.value,
                        comments: [],
                        applicantId: AppState.currentUser.id
                    };
                    const created = await PMOData.insertRequest(newRequest, AppState.currentUser.id);
                    showNotification(`Solicitud ${formatRequestId(created.id)} enviada correctamente.`, 'success');
                }
                navigateTo('dashboard_solicitante');
            } catch (e) {
                /* persistRequestUpdate / insertRequest ya notifican */
            }
        })();
    });

    formWrapper.appendChild(form);
    canvas.appendChild(formWrapper);
}

/* ----------------------- Detalle de Solicitud --------------------------- */

function renderDetalleSolicitud(id) {
    const req = AppState.requests.find((r) => r.id === parseInt(id, 10));
    if (!req) {
        showNotification('La solicitud solicitada no existe.', 'error');
        navigateToHome();
        return;
    }

    AppState.currentView = 'detalle_solicitud';

    if (AppState.currentUser?.role === ROLE_ADMIN) {
        renderDetalleSolicitudAdmin(req);
    } else {
        renderDetalleSolicitudSolicitante(req);
    }
}

function renderDetalleSolicitudSolicitante(req) {
    const canvas = createDashboardLayout('');

    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'back-button';
    backBtn.appendChild(createIcon('arrow_back'));
    const backLabel = document.createElement('span');
    backLabel.textContent = 'Volver al panel';
    backBtn.appendChild(backLabel);
    backBtn.addEventListener('click', navigateToHome);
    canvas.appendChild(backBtn);

    const titleRow = document.createElement('div');
    titleRow.className = 'detail-title-row';

    const titleCol = document.createElement('div');

    const titleEl = document.createElement('h1');
    titleEl.className = 'detail-title-row__title';
    titleEl.textContent = req.title;
    titleCol.appendChild(titleEl);

    const idEl = document.createElement('p');
    idEl.className = 'text-body-sm text-outline';
    idEl.textContent = formatRequestId(req.id);
    titleCol.appendChild(idEl);

    titleRow.appendChild(titleCol);

    const statusBadge = createBadge(req.status);
    statusBadge.classList.add('badge--lg');
    titleRow.appendChild(statusBadge);

    canvas.appendChild(titleRow);

    if (req.status === STATUS.CHANGES) {
        canvas.appendChild(createAjustesLayout(req));
    } else {
        const grid = document.createElement('div');
        grid.className = 'detail-grid';

        const leftCol = document.createElement('div');
        leftCol.className = 'detail-col';
        leftCol.appendChild(createDatosGeneralesCard(req));
        leftCol.appendChild(createJustificacionCard(req));
        grid.appendChild(leftCol);

        const rightCol = document.createElement('div');
        rightCol.className = 'detail-col';
        rightCol.appendChild(createComentariosCard(req));
        grid.appendChild(rightCol);

        canvas.appendChild(grid);
    }
}

function createAjustesLayout(req) {
    const wrapper = document.createElement('div');

    /* ---- Banner de alerta con el último comentario del admin ---- */
    const lastAdminComment = req.comments && req.comments.length > 0
        ? [...req.comments].sort((a, b) => b.date.localeCompare(a.date))[0]
        : null;

    const banner = document.createElement('div');
    banner.className = 'summary-card summary-card--alert';

    const bannerHeader = document.createElement('div');
    bannerHeader.className = 'summary-card__title';
    bannerHeader.textContent = 'Se solicitaron ajustes a esta solicitud';
    banner.appendChild(bannerHeader);

    if (lastAdminComment) {
        const bannerQuote = document.createElement('p');
        bannerQuote.className = 'text-body-md';
        bannerQuote.textContent = `"${lastAdminComment.text}"`;
        banner.appendChild(bannerQuote);

        const bannerMeta = document.createElement('p');
        bannerMeta.className = 'text-body-sm text-outline';
        bannerMeta.textContent = `${lastAdminComment.author} · ${formatDate(lastAdminComment.date)}`;
        banner.appendChild(bannerMeta);
    } else {
        const bannerText = document.createElement('p');
        bannerText.className = 'text-body-md';
        bannerText.textContent = 'Revise los comentarios, realice los ajustes necesarios y vuelva a enviar la solicitud.';
        banner.appendChild(bannerText);
    }

    wrapper.appendChild(banner);

    /* ---- Layout de dos columnas ---- */
    const grid = document.createElement('div');
    grid.className = 'detail-grid';

    /* Columna izquierda: formulario editable */
    const leftCol = document.createElement('div');
    leftCol.className = 'detail-col';

    const formCard = document.createElement('div');
    formCard.className = 'detail-card';

    const formCardTitle = document.createElement('h2');
    formCardTitle.className = 'detail-card__title';
    formCardTitle.textContent = 'Editar y reenviar solicitud';
    formCard.appendChild(formCardTitle);

    const form = document.createElement('form');
    form.noValidate = true;

    /* Sección 1 */
    const sec1 = document.createElement('div');
    const sec1Title = document.createElement('h3');
    sec1Title.className = 'form-section__title';
    sec1Title.textContent = '1. Información General';
    sec1.appendChild(sec1Title);

    const grid1 = document.createElement('div');
    grid1.className = 'form-section__grid form-section__grid--2cols';

    const fieldTitulo = createFormField({
        id: `ajuste-titulo-${req.id}`,
        label: 'Título del Proyecto',
        type: 'text',
        required: true,
        placeholder: 'Ej. Actualización del CRM Central',
        value: req.title
    });
    fieldTitulo.group.classList.add('form-section__full');
    grid1.appendChild(fieldTitulo.group);

    const fieldArea = createFormField({
        id: `ajuste-area-${req.id}`,
        label: 'Área Solicitante',
        type: 'select',
        required: true,
        placeholder: 'Seleccione un área...',
        choices: AREAS,
        value: req.area
    });
    grid1.appendChild(fieldArea.group);

    const fieldTipo = createFormField({
        id: `ajuste-tipo-${req.id}`,
        label: 'Tipo de Proyecto',
        type: 'select',
        required: true,
        placeholder: 'Seleccione un tipo...',
        choices: TIPOS_PROYECTO,
        value: req.tipoProyecto
    });
    grid1.appendChild(fieldTipo.group);

    const fieldPrioridad = createFormField({
        id: `ajuste-prioridad-${req.id}`,
        label: 'Prioridad Sugerida',
        type: 'select',
        required: true,
        placeholder: 'Seleccione prioridad...',
        choices: PRIORIDADES,
        value: req.prioridad
    });
    grid1.appendChild(fieldPrioridad.group);

    const fieldFecha = createFormField({
        id: `ajuste-fecha-${req.id}`,
        label: 'Fecha Estimada de Inicio',
        type: 'date',
        required: true,
        value: req.fechaEstimadaInicio
    });
    grid1.appendChild(fieldFecha.group);

    sec1.appendChild(grid1);
    form.appendChild(sec1);

    /* Sección 2 */
    const sec2 = document.createElement('div');
    const sec2Title = document.createElement('h3');
    sec2Title.className = 'form-section__title';
    sec2Title.textContent = '2. Justificación';
    sec2.appendChild(sec2Title);

    const grid2 = document.createElement('div');
    grid2.className = 'form-section__grid';

    const fieldNecesidad = createFormField({
        id: `ajuste-necesidad-${req.id}`,
        label: 'Necesidad de Negocio',
        type: 'textarea',
        required: true,
        rows: 4,
        placeholder: 'Describa la necesidad u oportunidad que motiva este proyecto...',
        value: req.necesidad
    });
    grid2.appendChild(fieldNecesidad.group);

    const fieldImpacto = createFormField({
        id: `ajuste-impacto-${req.id}`,
        label: 'Impacto Esperado',
        type: 'textarea',
        required: true,
        rows: 3,
        placeholder: '¿Cómo beneficiará este proyecto al área y a la institución?',
        value: req.impacto
    });
    grid2.appendChild(fieldImpacto.group);

    sec2.appendChild(grid2);
    form.appendChild(sec2);

    /* Sección 3 */
    const sec3 = document.createElement('div');
    const sec3Title = document.createElement('h3');
    sec3Title.className = 'form-section__title';
    sec3Title.textContent = '3. Presupuesto';
    sec3.appendChild(sec3Title);

    const grid3 = document.createElement('div');
    grid3.className = 'form-section__grid form-section__grid--2cols';

    const fieldPresupuesto = createFormField({
        id: `ajuste-presupuesto-${req.id}`,
        label: 'Presupuesto Estimado (USD)',
        type: 'number',
        required: true,
        placeholder: 'Ej. 500000',
        value: req.presupuestoEstimado
    });
    fieldPresupuesto.input.min = '0';
    fieldPresupuesto.input.step = '1000';
    grid3.appendChild(fieldPresupuesto.group);

    sec3.appendChild(grid3);
    form.appendChild(sec3);

    /* Acciones del formulario */
    const actions = document.createElement('div');
    actions.className = 'form-actions';

    const btnCancel = createButton('Cancelar', 'secondary', null, navigateToHome);
    actions.appendChild(btnCancel);

    const btnSubmit = createButton('Enviar a Revisión', 'primary', 'send', null, 'submit');
    actions.appendChild(btnSubmit);

    form.appendChild(actions);

    /* Validación y envío */
    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const validationFields = [
            { field: fieldTitulo, message: 'Ingrese el título del proyecto.', validate: (v) => v.trim().length >= 3, minMessage: 'El título debe tener al menos 3 caracteres.' },
            { field: fieldArea, message: 'Seleccione el área solicitante.' },
            { field: fieldTipo, message: 'Seleccione el tipo de proyecto.' },
            { field: fieldPrioridad, message: 'Seleccione la prioridad.' },
            { field: fieldFecha, message: 'Seleccione una fecha estimada de inicio.' },
            { field: fieldNecesidad, message: 'Describa la necesidad de negocio.', validate: (v) => v.trim().length >= 10, minMessage: 'Describa con al menos 10 caracteres.' },
            { field: fieldImpacto, message: 'Describa el impacto esperado.', validate: (v) => v.trim().length >= 10, minMessage: 'Describa con al menos 10 caracteres.' },
            { field: fieldPresupuesto, message: 'Ingrese el presupuesto estimado.', validate: (v) => Number(v) > 0, minMessage: 'Ingrese un monto mayor a cero.' }
        ];

        let hasError = false;
        validationFields.forEach(({ field, message, validate, minMessage }) => {
            const value = field.input.value;
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                showFieldError(field.input, message);
                hasError = true;
                return;
            }
            if (typeof validate === 'function' && !validate(value)) {
                showFieldError(field.input, minMessage || message);
                hasError = true;
            }
        });

        if (hasError) {
            showNotification('Revise los campos resaltados antes de enviar.', 'error');
            return;
        }

        const returnStage = req.stage || STAGE.PMO;
        const returnStageLabel = STAGE_LABELS[returnStage] || 'Revisión PMO';

        void (async () => {
            try {
                const index = AppState.requests.findIndex((r) => r.id === req.id);
                if (index === -1) {
                    return;
                }
                const next = {
                    ...AppState.requests[index],
                    title: fieldTitulo.input.value.trim(),
                    status: STATUS.PENDING,
                    stage: returnStage,
                    area: fieldArea.input.value,
                    prioridad: fieldPrioridad.input.value,
                    tipoProyecto: fieldTipo.input.value,
                    necesidad: fieldNecesidad.input.value.trim(),
                    impacto: fieldImpacto.input.value.trim(),
                    presupuestoEstimado: fieldPresupuesto.input.value,
                    fechaEstimadaInicio: fieldFecha.input.value
                };
                AppState.requests[index] = next;
                await addCommentToRequest(
                    next,
                    `Solicitud ajustada y reenviada a ${returnStageLabel} por el solicitante.`
                );
                await persistRequestUpdate(next);
                showNotification(`Solicitud reenviada a ${returnStageLabel}. El administrador podrá evaluarla nuevamente.`, 'success');
                navigateTo('dashboard_solicitante');
            } catch (e) {
                /* addCommentToRequest / persist ya notifican */
            }
        })();
    });

    formCard.appendChild(form);
    leftCol.appendChild(formCard);
    grid.appendChild(leftCol);

    /* Columna derecha: historial de comentarios (solo lectura) */
    const rightCol = document.createElement('div');
    rightCol.className = 'detail-col';
    rightCol.appendChild(createComentariosCard(req));
    grid.appendChild(rightCol);

    wrapper.appendChild(grid);
    return wrapper;
}

/* ---------------------- Detalle de Solicitud (Admin) --------------------- */

function renderDetalleSolicitudAdmin(req) {
    const canvas = createDashboardLayout('');
    canvas.classList.add('detail-admin');

    canvas.appendChild(createAdminContextHeader(req));
    canvas.appendChild(createWorkflowStepper(req));

    const grid = document.createElement('div');
    grid.className = 'detail-admin__grid';

    const main = document.createElement('div');
    main.className = 'detail-admin__main';
    main.appendChild(createResumenEjecutivoSection(req));

    const bentoRow = document.createElement('div');
    bentoRow.className = 'detail-admin__two-col';
    bentoRow.appendChild(createDatosGeneralesSection(req));
    bentoRow.appendChild(createImpactoFinanzasSection(req));
    main.appendChild(bentoRow);

    grid.appendChild(main);

    const aside = document.createElement('aside');
    aside.className = 'detail-admin__aside';
    aside.appendChild(createDecisionesPanel(req));
    grid.appendChild(aside);

    canvas.appendChild(grid);
}

function createAdminContextHeader(req) {
    const header = document.createElement('div');
    header.className = 'context-header';

    const backLink = document.createElement('button');
    backLink.type = 'button';
    backLink.className = 'context-header__back';
    backLink.appendChild(createIcon('arrow_back'));
    const backLabel = document.createElement('span');
    backLabel.textContent = 'Volver al Panel';
    backLink.appendChild(backLabel);
    backLink.addEventListener('click', () => {
        navigateTo('dashboard_admin');
    });
    header.appendChild(backLink);

    const titleRow = document.createElement('div');
    titleRow.className = 'context-header__title-row';

    const titleBlock = document.createElement('div');
    titleBlock.className = 'context-header__title-block';

    const idLabel = document.createElement('span');
    idLabel.className = 'context-header__id';
    idLabel.textContent = `ID: ${formatRequestId(req.id)}`;
    titleBlock.appendChild(idLabel);

    const title = document.createElement('h1');
    title.className = 'context-header__title';
    title.textContent = req.title;
    titleBlock.appendChild(title);

    titleRow.appendChild(titleBlock);

    const actions = document.createElement('div');
    actions.className = 'context-header__actions';

    actions.appendChild(createContextStatusBadge(req));

    const moreBtn = document.createElement('button');
    moreBtn.type = 'button';
    moreBtn.className = 'context-header__more';
    moreBtn.setAttribute('aria-label', 'Más acciones');
    moreBtn.title = 'Exportar al portafolio';
    moreBtn.appendChild(createIcon('more_vert'));
    moreBtn.addEventListener('click', () => {
        navigateTo('dashboard_admin');
    });
    actions.appendChild(moreBtn);

    titleRow.appendChild(actions);
    header.appendChild(titleRow);

    return header;
}

function createContextStatusBadge(req) {
    const badge = document.createElement('span');
    badge.className = 'context-badge';

    let icon = 'pending_actions';
    let text = req.status;
    let variant = 'info';

    if (req.status === STATUS.PENDING) {
        const stage = req.stage || STAGE.PMO;
        text = `En ${STAGE_LABELS[stage]}`;
        if (stage === STAGE.PMO) {
            icon = 'engineering';
            variant = 'info';
        } else if (stage === STAGE.TECNICA) {
            icon = 'balance';
            variant = 'info';
        } else if (stage === STAGE.DIRECTOR) {
            icon = 'verified_user';
            variant = 'warning';
        }
    } else if (req.status === STATUS.APPROVED) {
        icon = 'task_alt';
        variant = 'success';
    } else if (req.status === STATUS.REJECTED) {
        icon = 'block';
        variant = 'danger';
    } else if (req.status === STATUS.CHANGES) {
        icon = 'edit';
        variant = 'warning';
    } else if (req.status === STATUS.DRAFT) {
        icon = 'edit_note';
        variant = 'muted';
    }

    badge.classList.add(`context-badge--${variant}`);
    badge.appendChild(createIcon(icon));
    const textEl = document.createElement('span');
    textEl.textContent = text;
    badge.appendChild(textEl);

    return badge;
}

function createWorkflowStepper(req) {
    const card = document.createElement('div');
    card.className = 'workflow-stepper';

    const scroller = document.createElement('div');
    scroller.className = 'workflow-stepper__scroller';

    const steps = document.createElement('ol');
    steps.className = 'workflow-stepper__steps';

    const currentIndex = getLifecycleIndex(req);
    const totalSteps = LIFECYCLE_STEPS.length;
    const isTerminal = req.status === STATUS.REJECTED || req.status === STATUS.CHANGES;

    const progressWidth = totalSteps > 1
        ? Math.min(100, Math.max(0, (currentIndex / (totalSteps - 1)) * 100))
        : 0;

    const track = document.createElement('div');
    track.className = 'workflow-stepper__track';
    steps.appendChild(track);

    const progress = document.createElement('div');
    progress.className = 'workflow-stepper__progress';
    progress.style.width = `${progressWidth}%`;
    if (isTerminal) {
        progress.classList.add('workflow-stepper__progress--danger');
    }
    steps.appendChild(progress);

    LIFECYCLE_STEPS.forEach((step, index) => {
        const item = document.createElement('li');
        item.className = 'workflow-step';

        let stateClass = 'workflow-step--pending';
        if (index < currentIndex) {
            stateClass = 'workflow-step--done';
        } else if (index === currentIndex) {
            stateClass = isTerminal ? 'workflow-step--blocked' : 'workflow-step--active';
        }
        item.classList.add(stateClass);

        const dot = document.createElement('span');
        dot.className = 'workflow-step__dot';
        if (index < currentIndex) {
            dot.appendChild(createIcon('check'));
        } else if (index === currentIndex && isTerminal) {
            dot.appendChild(createIcon(req.status === STATUS.REJECTED ? 'close' : 'edit'));
        } else {
            dot.appendChild(createIcon(step.icon));
        }
        item.appendChild(dot);

        const label = document.createElement('span');
        label.className = 'workflow-step__label';
        label.textContent = step.label;
        item.appendChild(label);

        const caption = document.createElement('span');
        caption.className = 'workflow-step__caption';
        if (index === 0 && req.date) {
            caption.textContent = formatDate(req.date);
        } else if (index === currentIndex) {
            if (isTerminal) {
                caption.textContent = req.status === STATUS.REJECTED ? 'Solicitud rechazada' : 'Requiere ajustes';
                caption.classList.add('workflow-step__caption--danger');
            } else {
                caption.textContent = 'Actual';
                caption.classList.add('workflow-step__caption--active');
            }
        } else if (index < currentIndex) {
            caption.textContent = 'Completado';
        }
        if (caption.textContent) {
            item.appendChild(caption);
        }

        steps.appendChild(item);
    });

    scroller.appendChild(steps);
    card.appendChild(scroller);

    return card;
}

function createSectionCard(options) {
    const section = document.createElement('section');
    section.className = 'section-card';
    if (options.variant) {
        section.classList.add(`section-card--${options.variant}`);
    }

    const header = document.createElement('header');
    header.className = 'section-card__header';
    if (options.icon) {
        header.appendChild(createIcon(options.icon));
    }
    const title = document.createElement('h3');
    title.className = 'section-card__title';
    title.textContent = options.title;
    header.appendChild(title);

    section.appendChild(header);

    const body = document.createElement('div');
    body.className = 'section-card__body';
    section.appendChild(body);

    return { section, body };
}

function createResumenEjecutivoSection(req) {
    const { section, body } = createSectionCard({
        title: 'Resumen Ejecutivo',
        icon: 'description'
    });

    const summary = document.createElement('p');
    summary.className = 'section-card__paragraph';
    summary.textContent = req.necesidad || 'Sin resumen ejecutivo proporcionado.';
    body.appendChild(summary);

    if (req.impacto) {
        const impactLabel = document.createElement('span');
        impactLabel.className = 'section-card__sublabel';
        impactLabel.textContent = 'Impacto esperado';
        body.appendChild(impactLabel);

        const impactText = document.createElement('p');
        impactText.className = 'section-card__paragraph section-card__paragraph--muted';
        impactText.textContent = req.impacto;
        body.appendChild(impactText);
    }

    const tags = buildResumeTags(req);
    if (tags.length > 0) {
        const tagList = document.createElement('div');
        tagList.className = 'tag-list';
        tags.forEach((tag) => {
            const tagEl = document.createElement('span');
            tagEl.className = 'tag';
            tagEl.textContent = `#${tag}`;
            tagList.appendChild(tagEl);
        });
        body.appendChild(tagList);
    }

    return section;
}

function buildResumeTags(req) {
    const tags = [];
    const areaLabel = getLabelFromValue(AREAS, req.area);
    if (areaLabel) tags.push(slugifyTag(areaLabel));
    const tipoLabel = getLabelFromValue(TIPOS_PROYECTO, req.tipoProyecto);
    if (tipoLabel) tags.push(slugifyTag(tipoLabel));
    if (req.prioridad === 'alta') tags.push('AltaPrioridad');
    return tags;
}

function slugifyTag(text) {
    return text
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('')
        .replace(/[^A-Za-z0-9]/g, '');
}

function createDatosGeneralesSection(req) {
    const { section, body } = createSectionCard({
        title: 'Datos Generales',
        icon: 'info'
    });

    const sponsor = document.createElement('div');
    sponsor.className = 'info-field';
    const sponsorLabel = document.createElement('span');
    sponsorLabel.className = 'info-field__label';
    sponsorLabel.textContent = 'Solicitante';
    sponsor.appendChild(sponsorLabel);

    const sponsorValue = document.createElement('div');
    sponsorValue.className = 'info-field__sponsor';
    const avatar = document.createElement('span');
    avatar.className = `avatar avatar--${getAvatarVariant(req.applicant)}`;
    avatar.textContent = getInitials(req.applicant);
    sponsorValue.appendChild(avatar);
    const sponsorName = document.createElement('span');
    sponsorName.className = 'info-field__value';
    sponsorName.textContent = formatApplicantName(req.applicant);
    sponsorValue.appendChild(sponsorName);
    sponsor.appendChild(sponsorValue);

    body.appendChild(sponsor);
    body.appendChild(createDivider());

    body.appendChild(buildInfoField('Departamento Patrocinador',
        getLabelFromValue(AREAS, req.area) || 'No especificado'));
    body.appendChild(createDivider());

    const twoCol = document.createElement('div');
    twoCol.className = 'info-grid';
    twoCol.appendChild(buildInfoField('Fecha Inicio Propuesta',
        req.fechaEstimadaInicio ? formatDate(req.fechaEstimadaInicio) : '—'));
    twoCol.appendChild(buildInfoField('Tipo de Proyecto',
        getLabelFromValue(TIPOS_PROYECTO, req.tipoProyecto) || '—'));
    body.appendChild(twoCol);
    body.appendChild(createDivider());

    body.appendChild(buildInfoField('Fecha de Creación', formatDate(req.date)));

    return section;
}

function createImpactoFinanzasSection(req) {
    const { section, body } = createSectionCard({
        title: 'Impacto y Finanzas',
        icon: 'trending_up'
    });

    const budgetField = document.createElement('div');
    budgetField.className = 'info-field';
    const budgetLabel = document.createElement('span');
    budgetLabel.className = 'info-field__label';
    budgetLabel.textContent = 'Presupuesto Estimado (CAPEX/OPEX)';
    budgetField.appendChild(budgetLabel);
    const budgetValue = document.createElement('span');
    budgetValue.className = 'info-field__value info-field__value--hero';
    budgetValue.textContent = req.presupuestoEstimado ? formatCurrency(req.presupuestoEstimado) : 'No definido';
    budgetField.appendChild(budgetValue);
    body.appendChild(budgetField);
    body.appendChild(createDivider());

    const twoCol = document.createElement('div');
    twoCol.className = 'info-grid';

    const roiValue = computeProjectedRoi(req);
    const roiField = buildInfoField('ROI Proyectado', roiValue.label);
    if (roiValue.positive) {
        roiField.querySelector('.info-field__value').classList.add('info-field__value--positive');
    }
    twoCol.appendChild(roiField);

    twoCol.appendChild(buildInfoField('Prioridad', getLabelFromValue(PRIORIDADES, req.prioridad) || '—'));
    body.appendChild(twoCol);
    body.appendChild(createDivider());

    body.appendChild(buildInfoField('Alineación Estratégica OKR',
        buildOkrAlignment(req)));

    return section;
}

function computeProjectedRoi(req) {
    const budget = parseFloat(req.presupuestoEstimado);
    if (!budget || Number.isNaN(budget)) {
        return { label: 'No calculado', positive: false };
    }
    const baseRate = req.prioridad === 'alta' ? 0.22 : req.prioridad === 'media' ? 0.16 : 0.10;
    const percentage = (baseRate * 100).toFixed(1);
    return { label: `${percentage}% (Año 2)`, positive: true };
}

function buildOkrAlignment(req) {
    if (req.tipoProyecto === 'infraestructura') {
        return 'Obj 2: Modernización Tecnológica';
    }
    if (req.tipoProyecto === 'seguridad') {
        return 'Obj 1: Gobierno de Riesgo y Cumplimiento';
    }
    if (req.tipoProyecto === 'analitica') {
        return 'Obj 3: Decisiones basadas en datos';
    }
    if (req.tipoProyecto === 'desarrollo') {
        return 'Obj 4: Transformación Digital Eficiente';
    }
    return 'Alineado al plan estratégico anual';
}

function buildInfoField(label, value) {
    const field = document.createElement('div');
    field.className = 'info-field';

    const labelEl = document.createElement('span');
    labelEl.className = 'info-field__label';
    labelEl.textContent = label;
    field.appendChild(labelEl);

    const valueEl = document.createElement('span');
    valueEl.className = 'info-field__value';
    valueEl.textContent = value || '—';
    field.appendChild(valueEl);

    return field;
}

function createDivider() {
    const divider = document.createElement('span');
    divider.className = 'info-divider';
    return divider;
}

function createDecisionesPanel(req) {
    const panel = document.createElement('div');
    panel.className = 'decisions-panel';

    const header = document.createElement('header');
    header.className = 'decisions-panel__header';
    header.appendChild(createIcon('forum'));
    const title = document.createElement('h3');
    title.className = 'decisions-panel__title';
    title.textContent = 'Decisiones y Comentarios';
    header.appendChild(title);
    panel.appendChild(header);

    panel.appendChild(createDecisionesTimeline(req));

    if (req.status === STATUS.PENDING || req.status === STATUS.CHANGES) {
        panel.appendChild(createDecisionesActionArea(req));
    } else if (req.status === STATUS.REJECTED) {
        panel.appendChild(createReopenFooter(req));
    } else {
        panel.appendChild(createDecisionesReadOnlyFooter(req));
    }

    return panel;
}

function createDecisionesTimeline(req) {
    const list = document.createElement('ol');
    list.className = 'decisions-timeline';

    list.appendChild(createTimelineItem({
        icon: 'upload',
        variant: 'default',
        title: 'Solicitud Enviada',
        date: formatDate(req.date),
        subtitle: `Por ${formatApplicantName(req.applicant)}`
    }));

    const sortedComments = (req.comments || [])
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date));

    sortedComments.forEach((comment) => {
        const isStageTransition = /avanz[óo]|regres[oó]/i.test(comment.text);
        list.appendChild(createTimelineItem({
            icon: isStageTransition ? 'timeline' : 'edit_note',
            variant: isStageTransition ? 'neutral' : 'comment',
            title: isStageTransition
                ? 'Actualización de flujo'
                : `Nota de ${formatApplicantName(comment.author)}`,
            date: formatDate(comment.date),
            text: isStageTransition ? null : comment.text,
            subtitle: `Por ${formatApplicantName(comment.author)}`,
            highlight: isStageTransition ? comment.text : null
        }));
    });

    if (req.status === STATUS.PENDING) {
        list.appendChild(createTimelineItem({
            icon: 'hourglass_empty',
            variant: 'waiting',
            title: 'Esperando tu revisión',
            emphasized: true
        }));
    } else if (req.status === STATUS.APPROVED) {
        list.appendChild(createTimelineItem({
            icon: 'verified',
            variant: 'success',
            title: 'Solicitud aprobada',
            emphasized: true
        }));
    } else if (req.status === STATUS.REJECTED) {
        list.appendChild(createTimelineItem({
            icon: 'block',
            variant: 'danger',
            title: 'Solicitud rechazada',
            emphasized: true
        }));
    } else if (req.status === STATUS.CHANGES) {
        list.appendChild(createTimelineItem({
            icon: 'edit',
            variant: 'warning',
            title: 'Requiere ajustes del solicitante',
            emphasized: true
        }));
    }

    return list;
}

function createTimelineItem(options) {
    const item = document.createElement('li');
    item.className = `timeline-item timeline-item--${options.variant || 'default'}`;
    if (options.emphasized) {
        item.classList.add('timeline-item--emphasized');
    }

    const dot = document.createElement('span');
    dot.className = 'timeline-item__dot';
    if (options.icon) {
        dot.appendChild(createIcon(options.icon));
    }
    item.appendChild(dot);

    const body = document.createElement('div');
    body.className = 'timeline-item__body';

    const headerRow = document.createElement('div');
    headerRow.className = 'timeline-item__header';

    const title = document.createElement('span');
    title.className = 'timeline-item__title';
    title.textContent = options.title || '';
    headerRow.appendChild(title);

    if (options.date) {
        const date = document.createElement('span');
        date.className = 'timeline-item__date';
        date.textContent = options.date;
        headerRow.appendChild(date);
    }

    body.appendChild(headerRow);

    if (options.text) {
        const bubble = document.createElement('p');
        bubble.className = 'timeline-item__bubble';
        bubble.textContent = options.text;
        body.appendChild(bubble);
    }

    if (options.highlight) {
        const highlight = document.createElement('p');
        highlight.className = 'timeline-item__highlight';
        highlight.textContent = options.highlight;
        body.appendChild(highlight);
    }

    if (options.subtitle) {
        const subtitle = document.createElement('span');
        subtitle.className = 'timeline-item__subtitle';
        subtitle.textContent = options.subtitle;
        body.appendChild(subtitle);
    }

    item.appendChild(body);
    return item;
}

function createDecisionesActionArea(req) {
    const wrapper = document.createElement('div');
    wrapper.className = 'decisions-action';

    const commentField = createFormField({
        id: `decision-comment-${req.id}`,
        label: 'Añadir Comentario o Decisión',
        type: 'textarea',
        rows: 3,
        placeholder: 'Escribe tus observaciones aquí...'
    });
    wrapper.appendChild(commentField.group);

    const currentIndex = getLifecycleIndex(req);
    const currentStage = req.stage || STAGE.PMO;
    const isLastStage = currentStage === STAGE.DIRECTOR;

    const getComment = () => commentField.input.value.trim();

    const buttons = document.createElement('div');
    buttons.className = 'decisions-action__buttons';

    if (!isLastStage && req.status === STATUS.PENDING) {
        const nextStage = STAGE_ORDER[STAGE_ORDER.indexOf(currentStage) + 1];
        const advanceLabel = `Aprobar Fase ${STAGE_LABELS[currentStage]}`;
        const advanceBtn = createButton(advanceLabel, 'primary', 'thumb_up', () => {
            void (async () => {
                try {
                    const comment = getComment() || `La solicitud avanzó a la etapa "${STAGE_LABELS[nextStage]}".`;
                    await addCommentToRequest(req, comment);
                    req.stage = nextStage;
                    await persistRequestUpdate(req);
                    showNotification(`Solicitud avanzada a ${STAGE_LABELS[nextStage]}.`, 'success');
                    renderDetalleSolicitud(req.id);
                } catch (e) {
                    /* notificado */
                }
            })();
        });
        advanceBtn.classList.add('button--block');
        buttons.appendChild(advanceBtn);
    }

    if (isLastStage && req.status === STATUS.PENDING) {
        const finalApproveBtn = createButton('Aprobar Solicitud', 'primary', 'task_alt', () => {
            void (async () => {
                try {
                    const comment = getComment() || 'Solicitud aprobada por el director.';
                    await addCommentToRequest(req, comment);
                    req.status = STATUS.APPROVED;
                    await persistRequestUpdate(req);
                    showNotification('Solicitud aprobada correctamente.', 'success');
                    renderDetalleSolicitud(req.id);
                } catch (e) {
                    /* notificado */
                }
            })();
        });
        finalApproveBtn.classList.add('button--block');
        buttons.appendChild(finalApproveBtn);
    }

    const changesBtn = createButton('Solicitar Ajustes', 'secondary', 'edit', () => {
        const comment = getComment();
        if (!comment) {
            showFieldError(commentField.input, 'Agrega un comentario indicando los ajustes requeridos.');
            return;
        }
        void (async () => {
            try {
                await addCommentToRequest(req, comment);
                req.status = STATUS.CHANGES;
                await persistRequestUpdate(req);
                showNotification('Se solicitaron ajustes al solicitante.', 'info');
                renderDetalleSolicitud(req.id);
            } catch (e) {
                /* notificado */
            }
        })();
    });
    buttons.appendChild(changesBtn);

    const rejectBtn = createButton('Rechazar', 'danger', 'close', () => {
        const comment = getComment();
        if (!comment) {
            showFieldError(commentField.input, 'Agrega un comentario justificando el rechazo.');
            return;
        }
        void (async () => {
            try {
                await addCommentToRequest(req, comment);
                req.status = STATUS.REJECTED;
                await persistRequestUpdate(req);
                showNotification('La solicitud fue rechazada.', 'error');
                renderDetalleSolicitud(req.id);
            } catch (e) {
                /* notificado */
            }
        })();
    });
    buttons.appendChild(rejectBtn);

    wrapper.appendChild(buttons);

    if (req.status === STATUS.PENDING && STAGE_ORDER.indexOf(currentStage) > 0) {
        const backInfo = document.createElement('p');
        backInfo.className = 'decisions-action__hint';
        const prevStage = STAGE_ORDER[STAGE_ORDER.indexOf(currentStage) - 1];
        const backLink = document.createElement('button');
        backLink.type = 'button';
        backLink.className = 'decisions-action__link';
        backLink.textContent = `← Regresar a ${STAGE_LABELS[prevStage]}`;
        backLink.addEventListener('click', () => {
            void (async () => {
                try {
                    const comment = getComment() || `La solicitud fue regresada a la etapa "${STAGE_LABELS[prevStage]}".`;
                    await addCommentToRequest(req, comment);
                    req.stage = prevStage;
                    await persistRequestUpdate(req);
                    showNotification(`Solicitud regresada a ${STAGE_LABELS[prevStage]}.`, 'info');
                    renderDetalleSolicitud(req.id);
                } catch (e) {
                    /* notificado */
                }
            })();
        });
        backInfo.appendChild(backLink);
        wrapper.appendChild(backInfo);
    }

    if (currentIndex > 0 || !isLastStage) {
        /* keep layout */
    }

    return wrapper;
}

function createDecisionesReadOnlyFooter(req) {
    const footer = document.createElement('div');
    footer.className = 'decisions-action decisions-action--readonly';

    const text = document.createElement('p');
    text.className = 'text-body-sm text-on-surface-variant';
    if (req.status === STATUS.APPROVED) {
        text.textContent = 'La solicitud ya fue aprobada. No se pueden registrar nuevas decisiones.';
    } else if (req.status === STATUS.DRAFT) {
        text.textContent = 'Esta solicitud está en borrador. El solicitante aún no la ha enviado a revisión.';
    } else {
        text.textContent = 'La solicitud ya no está activa para decisiones.';
    }
    footer.appendChild(text);

    return footer;
}

function createReopenFooter(req) {
    const wrapper = document.createElement('div');
    wrapper.className = 'decisions-action';

    const banner = document.createElement('div');
    banner.className = 'summary-card summary-card--alert';
    banner.style.marginBottom = '1.6rem';

    const bannerIcon = createIcon('block');
    banner.appendChild(bannerIcon);

    const bannerText = document.createElement('div');
    const bannerTitle = document.createElement('p');
    bannerTitle.className = 'text-label-caps';
    bannerTitle.style.fontWeight = '700';
    bannerTitle.textContent = 'Solicitud rechazada';
    bannerText.appendChild(bannerTitle);
    const bannerDesc = document.createElement('p');
    bannerDesc.className = 'text-body-sm';
    bannerDesc.textContent = 'Esta solicitud fue rechazada. Puedes reabrirla y enviarla de regreso a la etapa que consideres pertinente.';
    bannerText.appendChild(bannerDesc);
    banner.appendChild(bannerText);

    wrapper.appendChild(banner);

    const stageField = createFormField({
        id: `reopen-stage-${req.id}`,
        label: 'Etapa de destino al reabrir',
        type: 'select',
        placeholder: 'Selecciona la etapa de destino...',
        choices: STAGE_ORDER.map((s) => ({ value: s, label: STAGE_LABELS[s] }))
    });
    wrapper.appendChild(stageField.group);

    const commentField = createFormField({
        id: `reopen-comment-${req.id}`,
        label: 'Justificación de la reapertura',
        type: 'textarea',
        rows: 3,
        placeholder: 'Indica el motivo por el que se reactiva la solicitud...'
    });
    wrapper.appendChild(commentField.group);

    const reopenBtn = createButton('Reabrir Solicitud', 'primary', 'restart_alt', () => {
        const targetStage = stageField.input.value;
        const comment = commentField.input.value.trim();

        if (!targetStage) {
            showFieldError(stageField.input, 'Debes seleccionar la etapa de destino.');
            showNotification('Selecciona la etapa antes de continuar.', 'error');
            return;
        }
        if (!comment) {
            showFieldError(commentField.input, 'Agrega una justificación para la reapertura.');
            showNotification('Agrega una justificación antes de continuar.', 'error');
            return;
        }

        void (async () => {
            try {
                const msg = `Solicitud reabierta y enviada a "${STAGE_LABELS[targetStage]}". Motivo: ${comment}`;
                await addCommentToRequest(req, msg);
                req.status = STATUS.PENDING;
                req.stage = targetStage;
                await persistRequestUpdate(req);
                showNotification(`Solicitud reabierta en etapa "${STAGE_LABELS[targetStage]}".`, 'success');
                renderDetalleSolicitud(req.id);
            } catch (e) {
                /* notificado */
            }
        })();
    });
    reopenBtn.classList.add('button--block');
    wrapper.appendChild(reopenBtn);

    return wrapper;
}

function createDetailField(label, value) {
    const field = document.createElement('div');

    const labelEl = document.createElement('span');
    labelEl.className = 'detail-field__label';
    labelEl.textContent = label;
    field.appendChild(labelEl);

    const valueEl = document.createElement('span');
    valueEl.className = 'detail-field__value';
    valueEl.textContent = value || '—';
    field.appendChild(valueEl);

    return field;
}

function createDatosGeneralesCard(req) {
    const card = document.createElement('div');
    card.className = 'detail-card';

    const title = document.createElement('h2');
    title.className = 'detail-card__title';
    title.textContent = 'Datos Generales';
    card.appendChild(title);

    const fields = document.createElement('div');
    fields.className = 'detail-fields detail-fields--2cols';

    fields.appendChild(createDetailField('Solicitante', req.applicant));
    fields.appendChild(createDetailField('Fecha de Creación', formatDate(req.date)));
    fields.appendChild(createDetailField('Área', getLabelFromValue(AREAS, req.area)));
    fields.appendChild(createDetailField('Tipo de Proyecto', getLabelFromValue(TIPOS_PROYECTO, req.tipoProyecto)));
    fields.appendChild(createDetailField('Prioridad', getLabelFromValue(PRIORIDADES, req.prioridad)));
    fields.appendChild(createDetailField('Fecha Estimada de Inicio', formatDate(req.fechaEstimadaInicio)));
    fields.appendChild(createDetailField('Presupuesto Estimado', formatCurrency(req.presupuestoEstimado)));

    card.appendChild(fields);
    return card;
}

function createJustificacionCard(req) {
    const card = document.createElement('div');
    card.className = 'detail-card';

    const title = document.createElement('h2');
    title.className = 'detail-card__title';
    title.textContent = 'Justificación';
    card.appendChild(title);

    const necesidadLabel = document.createElement('span');
    necesidadLabel.className = 'detail-field__label';
    necesidadLabel.textContent = 'Necesidad de Negocio';
    card.appendChild(necesidadLabel);

    const necesidadText = document.createElement('p');
    necesidadText.className = 'detail-field__text detail-field__text--spaced';
    necesidadText.textContent = req.necesidad || '—';
    card.appendChild(necesidadText);

    const impactoLabel = document.createElement('span');
    impactoLabel.className = 'detail-field__label';
    impactoLabel.textContent = 'Impacto Esperado';
    card.appendChild(impactoLabel);

    const impactoText = document.createElement('p');
    impactoText.className = 'detail-field__text';
    impactoText.textContent = req.impacto || '—';
    card.appendChild(impactoText);

    return card;
}

function createComentariosCard(req) {
    const card = document.createElement('div');
    card.className = 'detail-card';

    const title = document.createElement('h2');
    title.className = 'detail-card__title';
    title.textContent = 'Decisiones y Comentarios';
    card.appendChild(title);

    const commentsList = document.createElement('div');
    commentsList.className = 'comments';
    card.appendChild(commentsList);

    const renderComments = () => {
        while (commentsList.firstChild) {
            commentsList.removeChild(commentsList.firstChild);
        }
        if (!req.comments || req.comments.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'comments__empty';
            empty.textContent = 'Aún no hay comentarios registrados.';
            commentsList.appendChild(empty);
            return;
        }
        req.comments
            .slice()
            .sort((a, b) => a.date.localeCompare(b.date))
            .forEach((comment) => {
                const commentEl = document.createElement('div');
                commentEl.className = 'comment';

                const header = document.createElement('div');
                header.className = 'comment__header';

                const author = document.createElement('span');
                author.className = 'comment__author';
                author.textContent = comment.author;
                header.appendChild(author);

                const date = document.createElement('span');
                date.className = 'comment__date';
                date.textContent = formatDate(comment.date);
                header.appendChild(date);

                commentEl.appendChild(header);

                const text = document.createElement('p');
                text.className = 'comment__text';
                text.textContent = comment.text;
                commentEl.appendChild(text);

                commentsList.appendChild(commentEl);
            });
    };

    renderComments();

    const form = document.createElement('form');
    form.className = 'comment-form';
    form.noValidate = true;

    const textareaField = createFormField({
        id: `comment-${req.id}`,
        label: 'Agregar Comentario',
        type: 'textarea',
        required: true,
        rows: 3,
        placeholder: 'Escriba aquí un comentario para la solicitud...'
    });
    form.appendChild(textareaField.group);

    const submitBtn = createButton('Publicar Comentario', 'primary', 'send', null, 'submit');
    submitBtn.classList.add('button--block');
    form.appendChild(submitBtn);

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const text = textareaField.input.value.trim();
        if (!text) {
            showFieldError(textareaField.input, 'Escriba un comentario antes de publicar.');
            return;
        }
        if (text.length < 3) {
            showFieldError(textareaField.input, 'El comentario debe tener al menos 3 caracteres.');
            return;
        }

        void (async () => {
            try {
                await addCommentToRequest(req, text);
                textareaField.input.value = '';
                renderComments();
                showNotification('Comentario publicado correctamente.', 'success');
            } catch (e) {
                /* notificado */
            }
        })();
    });

    card.appendChild(form);
    return card;
}

/* ------------------------ Dashboard Administrador ----------------------- */
/* Portfolio Dashboard: KPIs + filtros + tabla + paginación                 */

function renderDashboardAdmin() {
    AppState.currentView = 'dashboard_admin';
    const canvas = createDashboardLayout('dashboard_admin');

    const exportBtn = createButton('Exportar Reporte', 'secondary', 'download',
        () => exportRequestsToCsv(getFilteredRequests()));

    canvas.appendChild(createPageHeader(
        'Portfolio Dashboard',
        'Visión ejecutiva de todas las solicitudes de proyecto de la organización.',
        exportBtn
    ));

    canvas.appendChild(createPortfolioKpis());
    canvas.appendChild(createPortfolioTable());
}

/* ------------------ Administración de usuarios (solo admin) ------------------ */

function renderAdminUsuarios() {
    if (AppState.currentUser?.role !== ROLE_ADMIN) {
        showNotification('Solo los administradores pueden acceder a esta sección.', 'error');
        navigateToHome();
        return;
    }

    AppState.currentView = 'admin_usuarios';
    const canvas = createDashboardLayout('admin_usuarios');

    canvas.appendChild(
        createPageHeader(
            'Usuarios y cuentas',
            'Desactive o reactive cuentas. Apruebe o rechace solicitudes de rol de administrador o project manager.'
        )
    );

    const kpiGrid = document.createElement('div');
    kpiGrid.className = 'admin-users__kpi-grid';
    const kpiValueByKey = {};
    [
        { key: 'total', label: 'Total de cuentas', value: '0', icon: 'group', sub: 'Usuarios en el directorio', color: '#6366f1' },
        { key: 'active', label: 'Cuentas activas', value: '0', icon: 'check_circle', sub: 'Con acceso al sistema', color: '#10b981' },
        { key: 'inactive', label: 'Cuentas inactivas', value: '0', icon: 'block', sub: 'Sin acceso', color: '#f59e0b' },
        { key: 'pending', label: 'Solicitudes de rol', value: '0', icon: 'pending_actions', sub: 'Pendiente de aprobación', color: '#8b5cf6' }
    ].forEach((c) => {
        const { key, ...kpi } = c;
        const card = createMetricaKPICard(kpi);
        kpiValueByKey[key] = card.querySelector('.metricas-kpi-card__value');
        kpiGrid.appendChild(card);
    });
    canvas.appendChild(kpiGrid);

    const accountsCard = _chartCard(
        'Cuentas registradas',
        'Listado alfabético por correo. Use las acciones de cada fila según la política de la organización.'
    );

    const tableWrap = document.createElement('div');
    tableWrap.className = 'table-container admin-users__scroll';
    const table = document.createElement('table');
    table.className = 'metricas-top-table admin-users__table';
    const thead = document.createElement('thead');
    const hr = document.createElement('tr');
    ['Correo', 'Rol actual', 'Solicitud pendiente', 'Activa', 'Acciones'].forEach((h) => {
        const th = document.createElement('th');
        th.textContent = h;
        hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    accountsCard.appendChild(tableWrap);
    canvas.appendChild(accountsCard);

    const myId = AppState.currentUser.id;

    async function loadRows() {
        tbody.replaceChildren();
        let list;
        try {
            list = await PMOData.fetchAllProfiles();
        } catch (e) {
            console.error(e);
            showNotification('No se pudo cargar el listado de usuarios. ¿Aplicó la migración 003 en Supabase?', 'error');
            return;
        }
        kpiValueByKey.total.textContent = String(list.length);
        kpiValueByKey.active.textContent = String(list.filter((r) => r.is_active).length);
        kpiValueByKey.inactive.textContent = String(list.filter((r) => !r.is_active).length);
        kpiValueByKey.pending.textContent = String(list.filter((r) => r.requested_role).length);
        list.forEach((row) => {
            const tr = document.createElement('tr');

            const tdEmail = document.createElement('td');
            tdEmail.className = 'admin-users__cell-email';
            tdEmail.textContent = row.email;
            tr.appendChild(tdEmail);

            const tdRol = document.createElement('td');
            const rolSpan = document.createElement('span');
            rolSpan.className = 'admin-users__role-pill text-body-sm';
            rolSpan.textContent = DB_ROLE_LABELS[row.role] || row.role;
            tdRol.appendChild(rolSpan);
            tr.appendChild(tdRol);

            const tdSol = document.createElement('td');
            if (row.requested_role) {
                const b = document.createElement('span');
                b.className = 'admin-users__badge-pending text-body-sm';
                b.textContent = DB_ROLE_LABELS[row.requested_role] || row.requested_role;
                tdSol.appendChild(b);
            } else {
                tdSol.textContent = '—';
            }
            tr.appendChild(tdSol);

            const tdAct = document.createElement('td');
            const activeLabel = document.createElement('span');
            activeLabel.className = row.is_active
                ? 'admin-users__status admin-users__status--on text-body-sm'
                : 'admin-users__status admin-users__status--off text-body-sm';
            activeLabel.textContent = row.is_active ? 'Activa' : 'Inactiva';
            tdAct.appendChild(activeLabel);
            tr.appendChild(tdAct);

            const tdActBtn = document.createElement('td');
            tdActBtn.className = 'admin-users__actions';

            if (row.id === myId) {
                const note = document.createElement('span');
                note.className = 'text-body-sm admin-users__self-note';
                note.textContent = 'Su propia cuenta (use otro admin para desactivarla)';
                tdActBtn.appendChild(note);
            } else {
                const tBtn = createButton(
                    row.is_active ? 'Desactivar' : 'Activar',
                    row.is_active ? 'secondary' : 'primary',
                    row.is_active ? 'block' : 'check_circle',
                    () => {
                        void (async () => {
                            try {
                                await PMOData.updateProfileAsAdmin(row.id, { is_active: !row.is_active });
                                showNotification('Usuario actualizado.', 'success');
                                await loadRows();
                            } catch (e) {
                                console.error(e);
                                showNotification('No se pudo actualizar el usuario.', 'error');
                            }
                        })();
                    }
                );
                tBtn.type = 'button';
                tBtn.classList.add('button--sm');
                tdActBtn.appendChild(tBtn);
            }

            if (row.requested_role) {
                const apBtn = createButton('Aprobar rol', 'primary', 'verified', () => {
                    void (async () => {
                        try {
                            await PMOData.updateProfileAsAdmin(row.id, {
                                role: row.requested_role,
                                requested_role: null
                            });
                            showNotification('Rol asignado correctamente.', 'success');
                            await loadRows();
                        } catch (e) {
                            console.error(e);
                            showNotification('No se pudo aprobar la solicitud.', 'error');
                        }
                    })();
                });
                apBtn.type = 'button';
                apBtn.classList.add('button--sm', 'admin-users__action-gap');
                tdActBtn.appendChild(apBtn);

                const rjBtn = createButton('Rechazar', 'secondary', 'close', () => {
                    void (async () => {
                        try {
                            await PMOData.updateProfileAsAdmin(row.id, { requested_role: null });
                            showNotification('Solicitud de rol rechazada.', 'info');
                            await loadRows();
                        } catch (e) {
                            console.error(e);
                            showNotification('No se pudo actualizar la solicitud.', 'error');
                        }
                    })();
                });
                rjBtn.type = 'button';
                rjBtn.classList.add('button--sm', 'admin-users__action-gap');
                tdActBtn.appendChild(rjBtn);
            }

            tr.appendChild(tdActBtn);
            tbody.appendChild(tr);
        });
    }

    void loadRows();
}

/* ============================================================ */
/* Flujo de Gobierno (Admin) — visión portafolio de las 5 etapas */
/* ============================================================ */

/* ---------------------- Vista de etapa (sidebar) ------------------------ */

function renderEtapaSolicitudes(stepKey) {
    if (AppState.currentUser?.role !== ROLE_ADMIN) {
        showNotification('Solo los administradores pueden acceder a esta sección.', 'error');
        navigateToHome();
        return;
    }

    const routeMap = {
        revision_pmo: 'etapa_pmo',
        evaluacion:   'etapa_tecnica',
        aprobacion:   'etapa_director',
        aprobado:     'etapa_aprobado'
    };

    AppState.currentView = routeMap[stepKey] || 'flujo_gobierno';
    const canvas = createDashboardLayout(routeMap[stepKey] || 'flujo_gobierno');

    const step = LIFECYCLE_STEPS.find((s) => s.key === stepKey);
    const meta = getGovStageMeta(stepKey);
    const bucket = getGovStageBucket(stepKey);

    const sorted = bucket.slice().sort((a, b) => {
        const rank = { alta: 0, media: 1, baja: 2 };
        const pa = rank[a.prioridad] ?? 3;
        const pb = rank[b.prioridad] ?? 3;
        if (pa !== pb) return pa - pb;
        return String(b.date || '').localeCompare(String(a.date || ''));
    });

    canvas.appendChild(createPageHeader(
        step ? step.label : stepKey,
        meta.description
    ));

    /* Tarjeta expandida reutilizando los estilos gov-stage-card */
    const card = document.createElement('article');
    card.className = `gov-stage-card gov-stage-card--${meta.accent}`;
    card.style.maxWidth = '100%';

    const header = document.createElement('header');
    header.className = 'gov-stage-card__header';

    const iconBox = document.createElement('span');
    iconBox.className = 'gov-stage-card__icon';
    iconBox.appendChild(createIcon(step ? step.icon : 'folder'));
    header.appendChild(iconBox);

    const headings = document.createElement('div');
    headings.className = 'gov-stage-card__headings';
    const orderEl = document.createElement('span');
    orderEl.className = 'gov-stage-card__order';
    orderEl.textContent = meta.sla;
    headings.appendChild(orderEl);
    const titleEl = document.createElement('h3');
    titleEl.className = 'gov-stage-card__title';
    titleEl.textContent = step ? step.label : stepKey;
    headings.appendChild(titleEl);
    header.appendChild(headings);

    const countEl = document.createElement('span');
    countEl.className = 'gov-stage-card__count';
    countEl.textContent = String(sorted.length);
    header.appendChild(countEl);

    card.appendChild(header);

    const list = document.createElement('ul');
    list.className = 'gov-stage-card__list gov-stage-card__list--full';

    if (sorted.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'gov-stage-card__empty';
        empty.appendChild(createIcon('inbox'));
        const emptyText = document.createElement('span');
        emptyText.textContent = 'Sin solicitudes en esta etapa.';
        empty.appendChild(emptyText);
        list.appendChild(empty);
    } else {
        sorted.forEach((req) => {
            list.appendChild(createGovStageListItem(req, stepKey));
        });
    }

    card.appendChild(list);
    canvas.appendChild(card);
}

/* ---------------------- Flujo de Gobierno ------------------------------- */

function renderFlujoGobierno() {
    if (AppState.currentUser?.role !== ROLE_ADMIN) {
        showNotification('Solo los administradores de la PMO pueden acceder al flujo de gobierno.', 'error');
        navigateToHome();
        return;
    }

    AppState.currentView = 'flujo_gobierno';
    const canvas = createDashboardLayout('flujo_gobierno');

    canvas.appendChild(createPageHeader(
        'Flujo de Gobierno',
        'Seguimiento visual de las 5 etapas que recorre cada solicitud de proyecto antes de ser aprobada.'
    ));

    canvas.appendChild(createGovPipelineSummary());
    canvas.appendChild(createGovHeroStepper());
    canvas.appendChild(createGovStagesGrid());
    canvas.appendChild(createGovTerminalStates());
}

function getGovStageBucket(stepKey) {
    const all = AppState.requests;
    switch (stepKey) {
        case 'borrador':
            return all.filter((r) => r.status === STATUS.DRAFT);
        case 'revision_pmo':
            return all.filter((r) => r.status === STATUS.PENDING && r.stage === STAGE.PMO);
        case 'evaluacion':
            return all.filter((r) => r.status === STATUS.PENDING && r.stage === STAGE.TECNICA);
        case 'aprobacion':
            return all.filter((r) => r.status === STATUS.PENDING && r.stage === STAGE.DIRECTOR);
        case 'aprobado':
            return all.filter((r) => r.status === STATUS.APPROVED);
        default:
            return [];
    }
}

function getGovStageMeta(stepKey) {
    switch (stepKey) {
        case 'borrador':
            return {
                description: 'Solicitudes que el solicitante está redactando y aún no envía a la PMO.',
                sla: 'Sin SLA — trabajo en curso',
                accent: 'draft'
            };
        case 'revision_pmo':
            return {
                description: 'La PMO valida alineación estratégica, completitud y criterios iniciales.',
                sla: 'SLA objetivo: 3 días hábiles',
                accent: 'info'
            };
        case 'evaluacion':
            return {
                description: 'El equipo de Finanzas valida presupuesto, ROI y viabilidad económica.',
                sla: 'SLA objetivo: 5 días hábiles',
                accent: 'warning'
            };
        case 'aprobacion':
            return {
                description: 'El Director o comité resuelve la autorización final del proyecto.',
                sla: 'SLA objetivo: 2 días hábiles',
                accent: 'primary'
            };
        case 'aprobado':
            return {
                description: 'Proyectos autorizados listos para ejecución y seguimiento en el portafolio.',
                sla: 'Estado final del flujo',
                accent: 'success'
            };
        default:
            return { description: '', sla: '', accent: 'muted' };
    }
}

function createGovPipelineSummary() {
    const all = AppState.requests;
    const inFlight = all.filter(
        (r) => r.status === STATUS.PENDING || r.status === STATUS.DRAFT
    ).length;
    const approved = all.filter((r) => r.status === STATUS.APPROVED).length;
    const changes = all.filter((r) => r.status === STATUS.CHANGES).length;
    const rejected = all.filter((r) => r.status === STATUS.REJECTED).length;

    const grid = document.createElement('div');
    grid.className = 'kpi-grid';

    grid.appendChild(createSummaryCard(
        'Solicitudes en Flujo', inFlight, 'hourglass_top',
        'trending_up', 'Activas en el proceso'
    ));
    grid.appendChild(createSummaryCard(
        'Aprobadas', approved, 'verified',
        'check_circle', 'Cerradas con autorización'
    ));
    grid.appendChild(createSummaryCard(
        'Requieren Ajustes', changes, 'edit_note',
        'priority_high', 'Regresadas al solicitante'
    ));
    grid.appendChild(createSummaryCard(
        'Rechazadas', rejected, 'block',
        'remove_circle', 'Detenidas por la PMO'
    ));

    return grid;
}

function createGovHeroStepper() {
    const card = document.createElement('section');
    card.className = 'gov-hero';

    const header = document.createElement('div');
    header.className = 'gov-hero__header';

    const title = document.createElement('h2');
    title.className = 'gov-hero__title';
    title.textContent = 'Ciclo de vida del proyecto';
    header.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'gov-hero__subtitle';
    subtitle.textContent = 'Cada solicitud recorre estas cinco etapas antes de ser liberada al portafolio.';
    header.appendChild(subtitle);

    card.appendChild(header);

    const scroller = document.createElement('div');
    scroller.className = 'gov-hero__scroller';

    const steps = document.createElement('ol');
    steps.className = 'gov-hero__steps';

    const track = document.createElement('div');
    track.className = 'gov-hero__track';
    steps.appendChild(track);

    LIFECYCLE_STEPS.forEach((step, index) => {
        const bucket = getGovStageBucket(step.key);
        const meta = getGovStageMeta(step.key);

        const item = document.createElement('li');
        item.className = 'gov-hero-step';
        item.classList.add(`gov-hero-step--${meta.accent}`);

        const dot = document.createElement('span');
        dot.className = 'gov-hero-step__dot';
        dot.appendChild(createIcon(step.icon));
        item.appendChild(dot);

        const label = document.createElement('span');
        label.className = 'gov-hero-step__label';
        label.textContent = `${index + 1}. ${step.label}`;
        item.appendChild(label);

        const count = document.createElement('span');
        count.className = 'gov-hero-step__count';
        count.textContent = String(bucket.length);
        item.appendChild(count);

        const caption = document.createElement('span');
        caption.className = 'gov-hero-step__caption';
        caption.textContent = bucket.length === 1 ? 'solicitud en esta etapa' : 'solicitudes en esta etapa';
        item.appendChild(caption);

        if (index < LIFECYCLE_STEPS.length - 1) {
            const connector = document.createElement('span');
            connector.className = 'gov-hero-step__connector';
            connector.setAttribute('aria-hidden', 'true');
            item.appendChild(connector);
        }

        steps.appendChild(item);
    });

    scroller.appendChild(steps);
    card.appendChild(scroller);

    return card;
}

function createGovStagesGrid() {
    const section = document.createElement('section');
    section.className = 'gov-stages';

    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'gov-stages__header';

    const sectionTitle = document.createElement('h2');
    sectionTitle.className = 'gov-stages__title';
    sectionTitle.textContent = 'Detalle por etapa';
    sectionHeader.appendChild(sectionTitle);

    const sectionSubtitle = document.createElement('p');
    sectionSubtitle.className = 'gov-stages__subtitle';
    sectionSubtitle.textContent = 'Consulta las solicitudes que se encuentran actualmente en cada fase del flujo.';
    sectionHeader.appendChild(sectionSubtitle);

    section.appendChild(sectionHeader);

    const grid = document.createElement('div');
    grid.className = 'gov-stages__grid';

    LIFECYCLE_STEPS.forEach((step, index) => {
        grid.appendChild(createGovStageCard(step, index));
    });

    section.appendChild(grid);
    return section;
}

function createGovStageCard(step, index) {
    const bucket = getGovStageBucket(step.key);
    const meta = getGovStageMeta(step.key);

    const card = document.createElement('article');
    card.className = 'gov-stage-card';
    card.classList.add(`gov-stage-card--${meta.accent}`);

    const header = document.createElement('header');
    header.className = 'gov-stage-card__header';

    const iconBox = document.createElement('span');
    iconBox.className = 'gov-stage-card__icon';
    iconBox.appendChild(createIcon(step.icon));
    header.appendChild(iconBox);

    const headings = document.createElement('div');
    headings.className = 'gov-stage-card__headings';

    const order = document.createElement('span');
    order.className = 'gov-stage-card__order';
    order.textContent = `Etapa ${index + 1} de ${LIFECYCLE_STEPS.length}`;
    headings.appendChild(order);

    const title = document.createElement('h3');
    title.className = 'gov-stage-card__title';
    title.textContent = step.label;
    headings.appendChild(title);

    header.appendChild(headings);

    const count = document.createElement('span');
    count.className = 'gov-stage-card__count';
    count.textContent = String(bucket.length);
    header.appendChild(count);

    card.appendChild(header);

    const description = document.createElement('p');
    description.className = 'gov-stage-card__description';
    description.textContent = meta.description;
    card.appendChild(description);

    const sla = document.createElement('div');
    sla.className = 'gov-stage-card__sla';
    sla.appendChild(createIcon('schedule'));
    const slaText = document.createElement('span');
    slaText.textContent = meta.sla;
    sla.appendChild(slaText);
    card.appendChild(sla);

    const list = document.createElement('ul');
    list.className = 'gov-stage-card__list';

    if (bucket.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'gov-stage-card__empty';
        empty.appendChild(createIcon('inbox'));
        const emptyText = document.createElement('span');
        emptyText.textContent = 'Sin solicitudes en esta etapa.';
        empty.appendChild(emptyText);
        list.appendChild(empty);
    } else {
        const sorted = bucket.slice().sort((a, b) => {
            const priorityRank = { alta: 0, media: 1, baja: 2 };
            const pa = priorityRank[a.prioridad] ?? 3;
            const pb = priorityRank[b.prioridad] ?? 3;
            if (pa !== pb) return pa - pb;
            return String(b.date || '').localeCompare(String(a.date || ''));
        });

        sorted.forEach((req) => {
            list.appendChild(createGovStageListItem(req, step.key));
        });
    }

    card.appendChild(list);
    return card;
}

function createGovStageListItem(req, stepKey) {
    const item = document.createElement('li');
    item.className = 'gov-stage-item';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gov-stage-item__button';

    const left = document.createElement('div');
    left.className = 'gov-stage-item__left';

    const idChip = document.createElement('span');
    idChip.className = 'gov-stage-item__id';
    idChip.textContent = formatRequestId(req.id);
    left.appendChild(idChip);

    const title = document.createElement('span');
    title.className = 'gov-stage-item__title';
    title.textContent = req.title;
    left.appendChild(title);

    btn.appendChild(left);

    const right = document.createElement('div');
    right.className = 'gov-stage-item__right';

    right.appendChild(getPriorityBadge(req.prioridad));

    const budget = document.createElement('span');
    budget.className = 'gov-stage-item__budget';
    budget.textContent = formatBudgetShort(req.presupuestoEstimado);
    right.appendChild(budget);

    btn.appendChild(right);

    btn.addEventListener('click', () => {
        navigateTo('detalle_solicitud', req.id);
    });

    item.appendChild(btn);
    return item;
}

function createGovTerminalStates() {
    const all = AppState.requests;
    const changes = all.filter((r) => r.status === STATUS.CHANGES);
    const rejected = all.filter((r) => r.status === STATUS.REJECTED);

    const section = document.createElement('section');
    section.className = 'gov-terminal';

    const header = document.createElement('div');
    header.className = 'gov-terminal__header';

    const title = document.createElement('h2');
    title.className = 'gov-terminal__title';
    title.textContent = 'Estados fuera de flujo';
    header.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'gov-terminal__subtitle';
    subtitle.textContent = 'Solicitudes regresadas al solicitante o descartadas por la PMO.';
    header.appendChild(subtitle);

    section.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'gov-terminal__grid';

    grid.appendChild(createGovTerminalCard(
        'Requieren Ajustes',
        'Fueron regresadas al solicitante con comentarios para que actualice la solicitud.',
        'edit_note',
        'warning',
        changes
    ));
    grid.appendChild(createGovTerminalCard(
        'Rechazadas',
        'No cumplieron criterios de la PMO o Finanzas; el flujo quedó cerrado.',
        'block',
        'danger',
        rejected
    ));

    section.appendChild(grid);
    return section;
}

function createGovTerminalCard(title, description, iconName, accent, bucket) {
    const card = document.createElement('article');
    card.className = 'gov-terminal-card';
    card.classList.add(`gov-terminal-card--${accent}`);

    const header = document.createElement('header');
    header.className = 'gov-terminal-card__header';

    const iconBox = document.createElement('span');
    iconBox.className = 'gov-terminal-card__icon';
    iconBox.appendChild(createIcon(iconName));
    header.appendChild(iconBox);

    const headings = document.createElement('div');
    headings.className = 'gov-terminal-card__headings';

    const titleEl = document.createElement('h3');
    titleEl.className = 'gov-terminal-card__title';
    titleEl.textContent = title;
    headings.appendChild(titleEl);

    const descEl = document.createElement('p');
    descEl.className = 'gov-terminal-card__description';
    descEl.textContent = description;
    headings.appendChild(descEl);

    header.appendChild(headings);

    const count = document.createElement('span');
    count.className = 'gov-terminal-card__count';
    count.textContent = String(bucket.length);
    header.appendChild(count);

    card.appendChild(header);

    const list = document.createElement('ul');
    list.className = 'gov-stage-card__list';

    if (bucket.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'gov-stage-card__empty';
        empty.appendChild(createIcon('inbox'));
        const emptyText = document.createElement('span');
        emptyText.textContent = 'Sin solicitudes en este estado.';
        empty.appendChild(emptyText);
        list.appendChild(empty);
    } else {
        bucket.slice(0, 4).forEach((req) => {
            list.appendChild(createGovStageListItem(req, 'terminal'));
        });
    }

    card.appendChild(list);
    return card;
}

function createPortfolioKpis() {
    const allRequests = AppState.requests;
    const totalCount = allRequests.length;

    const pmoCount = allRequests.filter(
        (r) => r.status === STATUS.PENDING && r.stage === STAGE.PMO
    ).length;
    const tecnicaCount = allRequests.filter(
        (r) => r.status === STATUS.PENDING && r.stage === STAGE.TECNICA
    ).length;
    const directorCount = allRequests.filter(
        (r) => r.status === STATUS.PENDING && r.stage === STAGE.DIRECTOR
    ).length;

    const highPriorityDirector = allRequests.filter(
        (r) => r.status === STATUS.PENDING && r.stage === STAGE.DIRECTOR && r.prioridad === 'alta'
    ).length;

    const approvedCount = allRequests.filter((r) => r.status === STATUS.APPROVED).length;

    const grid = document.createElement('div');
    grid.className = 'kpi-grid';

    grid.appendChild(createKpiCard({
        title: 'Total Solicitudes',
        value: totalCount,
        icon: 'folder_open',
        iconVariant: 'primary',
        trendIcon: 'trending_up',
        trendText: `${approvedCount} aprobada(s) a la fecha`,
        trendVariant: 'success'
    }));

    grid.appendChild(createKpiCard({
        title: 'Pendientes Revisión PMO',
        value: pmoCount,
        icon: 'pending_actions',
        iconVariant: 'danger',
        trendIcon: 'schedule',
        trendText: pmoCount === 1 ? 'Solicitud por clasificar' : 'Solicitudes por clasificar'
    }));

    grid.appendChild(createKpiCard({
        title: 'En Evaluación Financiera',
        value: tecnicaCount,
        icon: 'balance',
        iconVariant: 'info',
        trendIcon: 'rule',
        trendText: 'Análisis financiero y de riesgo'
    }));

    grid.appendChild(createKpiCard({
        title: 'Aprobación de Director',
        value: directorCount,
        icon: 'verified_user',
        iconVariant: 'warning',
        trendIcon: highPriorityDirector > 0 ? 'warning' : 'check_circle',
        trendText: highPriorityDirector > 0
            ? `${highPriorityDirector} de alta prioridad pendiente(s)`
            : 'Sin pendientes críticos',
        trendVariant: highPriorityDirector > 0 ? 'danger' : 'success'
    }));

    return grid;
}

function createKpiCard(options) {
    const card = document.createElement('div');
    card.className = 'kpi-card';

    const header = document.createElement('div');
    header.className = 'kpi-card__header';

    const titleEl = document.createElement('span');
    titleEl.className = 'kpi-card__title';
    titleEl.textContent = options.title;
    header.appendChild(titleEl);

    const iconWrap = document.createElement('div');
    iconWrap.className = `kpi-card__icon kpi-card__icon--${options.iconVariant || 'primary'}`;
    iconWrap.appendChild(createIcon(options.icon));
    header.appendChild(iconWrap);

    card.appendChild(header);

    const body = document.createElement('div');

    const value = document.createElement('div');
    value.className = 'kpi-card__value';
    value.textContent = String(options.value);
    body.appendChild(value);

    if (options.trendText) {
        const trend = document.createElement('div');
        trend.className = 'kpi-card__trend';
        if (options.trendVariant === 'success') {
            trend.classList.add('kpi-card__trend--success');
        } else if (options.trendVariant === 'danger') {
            trend.classList.add('kpi-card__trend--danger');
        }
        if (options.trendIcon) {
            trend.appendChild(createIcon(options.trendIcon));
        }
        const trendText = document.createElement('span');
        trendText.textContent = options.trendText;
        trend.appendChild(trendText);
        body.appendChild(trend);
    }

    card.appendChild(body);
    return card;
}

function createPortfolioTable() {
    const filtered = getFilteredRequests();
    const pageSize = AppState.pagination.pageSize;
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

    if (AppState.pagination.page > totalPages) {
        AppState.pagination.page = totalPages;
    }
    const currentPage = AppState.pagination.page;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filtered.length);
    const pageRequests = filtered.slice(startIndex, endIndex);

    const card = document.createElement('div');
    card.className = 'table-card';

    const header = document.createElement('div');
    header.className = 'table-card__header table-card__header--with-filters';

    const title = document.createElement('h3');
    title.className = 'table-card__title';
    title.textContent = 'Registro Activo de Portafolio';
    header.appendChild(title);

    header.appendChild(createPortfolioFilters());
    card.appendChild(header);

    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';

    const table = document.createElement('table');
    table.className = 'data-table';

    table.appendChild(createTableHead([
        'ID Solicitud',
        'Nombre del Proyecto',
        'Solicitante',
        'Área',
        'Prioridad',
        'Estado',
        'Enviada',
        { text: 'Acciones', align: 'right' }
    ]));

    const tbody = document.createElement('tbody');

    if (pageRequests.length === 0) {
        const hasFilters = AppState.filters.area || AppState.filters.prioridad || AppState.filters.estado;
        const message = hasFilters
            ? 'No se encontraron solicitudes con los filtros aplicados.'
            : 'No hay solicitudes registradas.';
        tbody.appendChild(createEmptyState('inbox', message, 8));
    } else {
        pageRequests.forEach((req) => {
            tbody.appendChild(createPortfolioRow(req));
        });
    }

    table.appendChild(tbody);
    tableContainer.appendChild(table);
    card.appendChild(tableContainer);

    card.appendChild(createPaginationFooter(filtered.length, startIndex, endIndex, totalPages, currentPage));

    return card;
}

function createPortfolioFilters() {
    const filters = document.createElement('div');
    filters.className = 'table-filters';

    const areaSelect = createFilterSelect(
        'Área (Todas)',
        AREAS,
        AppState.filters.area,
        (value) => {
            AppState.filters.area = value;
            AppState.pagination.page = 1;
            renderDashboardAdmin();
        }
    );
    filters.appendChild(areaSelect);

    const prioridadSelect = createFilterSelect(
        'Prioridad (Todas)',
        PRIORIDADES,
        AppState.filters.prioridad,
        (value) => {
            AppState.filters.prioridad = value;
            AppState.pagination.page = 1;
            renderDashboardAdmin();
        }
    );
    filters.appendChild(prioridadSelect);

    const estadoChoices = [
        { value: STATUS.DRAFT, label: STATUS.DRAFT },
        { value: 'pmo', label: 'Revisión PMO' },
        { value: 'tecnica', label: 'Evaluación Financiera' },
        { value: 'director', label: 'Aprobación' },
        { value: STATUS.APPROVED, label: STATUS.APPROVED },
        { value: STATUS.REJECTED, label: STATUS.REJECTED },
        { value: STATUS.CHANGES, label: STATUS.CHANGES }
    ];
    const estadoSelect = createFilterSelect(
        'Estado (Todos)',
        estadoChoices,
        AppState.filters.estado,
        (value) => {
            AppState.filters.estado = value;
            AppState.pagination.page = 1;
            renderDashboardAdmin();
        }
    );
    filters.appendChild(estadoSelect);

    const hasAny = AppState.filters.area || AppState.filters.prioridad || AppState.filters.estado;
    if (hasAny) {
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'table-filters__clear';
        clearBtn.title = 'Limpiar filtros';
        clearBtn.setAttribute('aria-label', 'Limpiar filtros');
        clearBtn.appendChild(createIcon('filter_alt_off'));
        clearBtn.addEventListener('click', () => {
            AppState.filters = { area: '', prioridad: '', estado: '' };
            AppState.pagination.page = 1;
            renderDashboardAdmin();
        });
        filters.appendChild(clearBtn);
    }

    return filters;
}

function createFilterSelect(placeholder, choices, currentValue, onChange) {
    const select = document.createElement('select');
    select.className = 'table-filters__select';

    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = placeholder;
    select.appendChild(placeholderOption);

    choices.forEach((choice) => {
        const option = document.createElement('option');
        option.value = choice.value;
        option.textContent = choice.label;
        if (choice.value === currentValue) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    if (!currentValue) {
        placeholderOption.selected = true;
    }

    select.addEventListener('change', (event) => {
        onChange(event.target.value);
    });

    return select;
}

function getFilteredRequests() {
    const { area, prioridad, estado } = AppState.filters;

    return AppState.requests
        .filter((req) => {
            if (area && req.area !== area) return false;
            if (prioridad && req.prioridad !== prioridad) return false;
            if (estado) {
                if (estado === 'pmo' || estado === 'tecnica' || estado === 'director') {
                    if (req.status !== STATUS.PENDING) return false;
                    if (req.stage !== estado) return false;
                } else if (req.status !== estado) {
                    return false;
                }
            }
            return true;
        })
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date));
}

function createPortfolioRow(req) {
    const tr = document.createElement('tr');
    tr.classList.add('row--clickable');

    const tdId = document.createElement('td');
    tdId.className = 'request-id-cell';
    tdId.textContent = formatRequestId(req.id);
    tr.appendChild(tdId);

    const tdName = document.createElement('td');
    tdName.className = 'text-primary-color text-bold';
    tdName.textContent = req.title;
    tr.appendChild(tdName);

    const tdSponsor = document.createElement('td');
    tdSponsor.className = 'data-table__sponsor-col';
    tdSponsor.appendChild(createSponsorCell(req.applicant));
    tr.appendChild(tdSponsor);

    const tdArea = document.createElement('td');
    tdArea.textContent = getLabelFromValue(AREAS, req.area);
    tr.appendChild(tdArea);

    const tdPriority = document.createElement('td');
    tdPriority.appendChild(createPriorityIndicator(req.prioridad));
    tr.appendChild(tdPriority);

    const tdStatus = document.createElement('td');
    tdStatus.appendChild(createStatusBadgeForPortfolio(req));
    tr.appendChild(tdStatus);

    const tdDate = document.createElement('td');
    tdDate.className = 'text-subtle';
    tdDate.textContent = formatDate(req.date);
    tr.appendChild(tdDate);

    const tdActions = document.createElement('td');
    tdActions.classList.add('text-right');
    tdActions.appendChild(createIconButton('open_in_new', 'Ver detalle', (event) => {
        event.stopPropagation();
        navigateTo('detalle_solicitud', req.id);
    }));
    tr.appendChild(tdActions);

    tr.addEventListener('click', () => {
        navigateTo('detalle_solicitud', req.id);
    });

    return tr;
}

function createSponsorCell(email) {
    const cell = document.createElement('span');
    cell.className = 'sponsor-cell';

    const avatar = document.createElement('span');
    const avatarVariant = getAvatarVariant(email);
    avatar.className = `avatar avatar--${avatarVariant}`;
    avatar.textContent = getInitials(email);
    cell.appendChild(avatar);

    const name = document.createElement('span');
    name.className = 'sponsor-cell__name';
    name.textContent = formatApplicantName(email);
    name.title = email;
    cell.appendChild(name);

    return cell;
}

function getInitials(email) {
    if (!email) return '?';
    const name = email.split('@')[0];
    const parts = name.split(/[._\-+\s]+/).filter(Boolean);
    if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
}

function formatApplicantName(email) {
    if (!email) return '—';
    const name = email.split('@')[0];
    const parts = name.split(/[._\-+\s]+/).filter(Boolean);
    if (parts.length === 0) return email;
    return parts
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function getAvatarVariant(email) {
    const variants = ['primary', 'secondary', 'tertiary', 'surface'];
    if (!email) return variants[0];
    let hash = 0;
    for (let i = 0; i < email.length; i += 1) {
        hash = (hash * 31 + email.charCodeAt(i)) & 0xffffffff;
    }
    return variants[Math.abs(hash) % variants.length];
}

function createPriorityIndicator(prioridad) {
    const wrap = document.createElement('span');
    wrap.className = 'priority-indicator';

    if (prioridad === 'alta') {
        wrap.classList.add('priority-indicator--high');
        wrap.appendChild(createIcon('keyboard_double_arrow_up'));
        const text = document.createElement('span');
        text.textContent = 'Alta';
        wrap.appendChild(text);
    } else if (prioridad === 'media') {
        wrap.classList.add('priority-indicator--medium');
        wrap.appendChild(createIcon('keyboard_arrow_up'));
        const text = document.createElement('span');
        text.textContent = 'Media';
        wrap.appendChild(text);
    } else if (prioridad === 'baja') {
        wrap.classList.add('priority-indicator--low');
        wrap.appendChild(createIcon('horizontal_rule'));
        const text = document.createElement('span');
        text.textContent = 'Baja';
        wrap.appendChild(text);
    } else {
        wrap.classList.add('priority-indicator--low');
        const text = document.createElement('span');
        text.textContent = '—';
        wrap.appendChild(text);
    }

    return wrap;
}

function createStatusBadgeForPortfolio(req) {
    if (req.status !== STATUS.PENDING) {
        return createBadge(req.status);
    }

    const badge = document.createElement('span');
    const stage = req.stage || STAGE.PMO;
    badge.className = `badge badge--stage-${stage}`;
    badge.textContent = STAGE_LABELS[stage] || req.status;
    return badge;
}

function createPaginationFooter(totalEntries, startIndex, endIndex, totalPages, currentPage) {
    const footer = document.createElement('div');
    footer.className = 'pagination';

    const info = document.createElement('div');
    if (totalEntries === 0) {
        info.textContent = 'Sin resultados para mostrar';
    } else {
        info.textContent = `Mostrando ${startIndex + 1} a ${endIndex} de ${totalEntries} solicitud(es)`;
    }
    footer.appendChild(info);

    if (totalPages > 1) {
        const controls = document.createElement('div');
        controls.className = 'pagination__controls';

        const prevBtn = createPaginationButton('chevron_left', null, currentPage === 1, () => {
            AppState.pagination.page = Math.max(1, currentPage - 1);
            renderDashboardAdmin();
        }, true);
        prevBtn.setAttribute('aria-label', 'Página anterior');
        controls.appendChild(prevBtn);

        const pageNumbers = buildPageNumbers(currentPage, totalPages);
        pageNumbers.forEach((item) => {
            if (item === '…') {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'pagination__ellipsis';
                ellipsis.textContent = '…';
                controls.appendChild(ellipsis);
            } else {
                const isActive = item === currentPage;
                const pageBtn = createPaginationButton(null, String(item), false, () => {
                    AppState.pagination.page = item;
                    renderDashboardAdmin();
                }, false);
                if (isActive) {
                    pageBtn.classList.add('pagination__button--active');
                }
                controls.appendChild(pageBtn);
            }
        });

        const nextBtn = createPaginationButton('chevron_right', null, currentPage === totalPages, () => {
            AppState.pagination.page = Math.min(totalPages, currentPage + 1);
            renderDashboardAdmin();
        }, true);
        nextBtn.setAttribute('aria-label', 'Página siguiente');
        controls.appendChild(nextBtn);

        footer.appendChild(controls);
    }

    return footer;
}

function createPaginationButton(iconName, label, disabled, onClick, isArrow) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pagination__button';
    if (isArrow) {
        button.classList.add('pagination__button--arrow');
    }
    if (disabled) {
        button.disabled = true;
    }
    if (iconName) {
        button.appendChild(createIcon(iconName));
    }
    if (label !== null && label !== undefined) {
        const text = document.createElement('span');
        text.textContent = label;
        button.appendChild(text);
    }
    if (typeof onClick === 'function') {
        button.addEventListener('click', onClick);
    }
    return button;
}

function buildPageNumbers(current, total) {
    if (total <= 7) {
        const list = [];
        for (let i = 1; i <= total; i += 1) list.push(i);
        return list;
    }

    const pages = new Set([1, total, current]);
    if (current - 1 >= 1) pages.add(current - 1);
    if (current + 1 <= total) pages.add(current + 1);

    const sorted = Array.from(pages).sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < sorted.length; i += 1) {
        if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
            result.push('…');
        }
        result.push(sorted[i]);
    }
    return result;
}

function exportRequestsToCsv(requests) {
    if (!Array.isArray(requests) || requests.length === 0) {
        showNotification('No hay solicitudes para exportar con los filtros actuales.', 'info');
        return;
    }

    const headers = [
        'ID',
        'Título',
        'Solicitante',
        'Área',
        'Tipo de Proyecto',
        'Prioridad',
        'Estado',
        'Etapa',
        'Presupuesto (USD)',
        'Fecha de Creación',
        'Fecha Estimada de Inicio'
    ];

    const escape = (value) => {
        const str = value === null || value === undefined ? '' : String(value);
        if (/[",\n;]/.test(str)) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const lines = [headers.map(escape).join(',')];

    requests.forEach((req) => {
        const isPending = req.status === STATUS.PENDING;
        const stageLabel = isPending ? STAGE_LABELS[req.stage] || '' : '';
        const row = [
            formatRequestId(req.id),
            req.title,
            req.applicant,
            getLabelFromValue(AREAS, req.area),
            getLabelFromValue(TIPOS_PROYECTO, req.tipoProyecto),
            getLabelFromValue(PRIORIDADES, req.prioridad),
            req.status,
            stageLabel,
            req.presupuestoEstimado || '',
            req.date || '',
            req.fechaEstimadaInicio || ''
        ];
        lines.push(row.map(escape).join(','));
    });

    const csv = '\ufeff' + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    const today = new Date().toISOString().split('T')[0];
    link.download = `portafolio-pmo-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification(`Se exportaron ${requests.length} solicitud(es) en formato CSV.`, 'success');
}

/* ---------------------- Helpers de listado de etapas -------------------- */

function formatRelativeDate(dateString) {
    if (!dateString) return '—';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffMs = today.getTime() - date.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Enviada hoy';
    if (diffDays === 1) return 'Enviada hace 1 día';
    if (diffDays > 1 && diffDays < 30) return `Enviada hace ${diffDays} días`;
    if (diffDays >= 30 && diffDays < 365) {
        const months = Math.round(diffDays / 30);
        return months === 1 ? 'Enviada hace 1 mes' : `Enviada hace ${months} meses`;
    }
    if (diffDays >= 365) {
        const years = Math.round(diffDays / 365);
        return years === 1 ? 'Enviada hace 1 año' : `Enviada hace ${years} años`;
    }
    return `Programada para ${formatDate(dateString)}`;
}

function getPriorityBadge(prioridad) {
    const badge = document.createElement('span');
    badge.className = 'badge';
    let label = 'Estándar';
    let modifier = 'badge--priority-medium';
    if (prioridad === 'alta') {
        label = 'Alta Prioridad';
        modifier = 'badge--priority-high';
    } else if (prioridad === 'media') {
        label = 'Prioridad Media';
        modifier = 'badge--priority-medium';
    } else if (prioridad === 'baja') {
        label = 'Prioridad Baja';
        modifier = 'badge--priority-low';
    }
    badge.classList.add(modifier);
    badge.textContent = label;
    return badge;
}

function formatBudgetShort(value) {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return '—';
    if (num >= 1000000) {
        return `$${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (num >= 1000) {
        return `$${(num / 1000).toFixed(0)}K`;
    }
    return formatCurrency(num);
}

/** Abre un adjunto de implementación almacenado en Supabase Storage (URL firmada). */
function openImplementationDocument(uploaded) {
    if (!uploaded || !uploaded.storagePath) {
        showNotification('Este documento no tiene archivo en almacenamiento.', 'info');
        return;
    }
    void (async () => {
        try {
            const url = await PMOData.getSignedFileUrl(uploaded.storagePath);
            window.open(url, '_blank', 'noopener,noreferrer');
        } catch (err) {
            console.error(err);
            showNotification(err.message || 'No se pudo abrir el documento.', 'error');
        }
    })();
}

/* ----------------------------- Métricas --------------------------------- */

const CHART_PALETTE = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#14b8a6','#ec4899'];
const STATUS_CHART_COLORS = { approved:'#10b981', pending:'#6366f1', changes:'#f59e0b', rejected:'#ef4444', draft:'#94a3b8' };

/* ---- SVG helpers ---- */
function _svgEl(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
    return el;
}
function _svgTxt(tag, attrs, text) { const el = _svgEl(tag, attrs); el.textContent = text; return el; }
function _polarXY(cx, cy, r, deg) {
    const rad = (deg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function _donutPath(cx, cy, R, r, a0, a1) {
    const f = n => n.toFixed(2);
    const o1 = _polarXY(cx, cy, R, a0), o2 = _polarXY(cx, cy, R, a1);
    const i1 = _polarXY(cx, cy, r, a1), i2 = _polarXY(cx, cy, r, a0);
    const lg = (a1 - a0) > 180 ? 1 : 0;
    return `M${f(o1.x)},${f(o1.y)} A${R},${R} 0 ${lg} 1 ${f(o2.x)},${f(o2.y)} L${f(i1.x)},${f(i1.y)} A${r},${r} 0 ${lg} 0 ${f(i2.x)},${f(i2.y)} Z`;
}

/* ---- Tooltip ---- */
let _chartTip = null;
function _getTip() {
    if (!_chartTip) {
        _chartTip = document.createElement('div');
        _chartTip.className = 'metricas-tooltip';
        document.body.appendChild(_chartTip);
    }
    return _chartTip;
}
function _showTip(e, lines) {
    const t = _getTip();
    while (t.firstChild) t.removeChild(t.firstChild);
    lines.forEach((line, i) => {
        const el = document.createElement(i === 0 ? 'strong' : 'span');
        el.textContent = line;
        t.appendChild(el);
    });
    t.style.display = 'flex';
    _moveTip(e);
}
function _moveTip(e) {
    const t = _getTip();
    t.style.left = (e.clientX + 14) + 'px';
    t.style.top = Math.max(8, e.clientY - 44) + 'px';
}
function _hideTip() { _getTip().style.display = 'none'; }

function _chartCard(title, subtitle) {
    const card = document.createElement('div');
    card.className = 'chart-card';
    const h3 = document.createElement('h3');
    h3.className = 'chart-card__title';
    h3.textContent = title;
    card.appendChild(h3);
    if (subtitle) {
        const p = document.createElement('p');
        p.className = 'chart-card__subtitle';
        p.textContent = subtitle;
        card.appendChild(p);
    }
    return card;
}

/**
 * Gráfico tipo “Compute and Disk” del panel: Database | WAL | Sistema/Disponible.
 * Los dos primeros tramos (pg_database_size, pg_ls_waldir) miden en bytes reales; el
 * tercer bloque no se puede obtener vía SQL en el nodo, solo referencia a Supabase.
 */
function createStorageComputeDiskPanel(databaseBytes, walBytes) {
    const db = Math.max(0, Number(databaseBytes) || 0);
    const wal = Math.max(0, Number(walBytes) || 0);
    const sum = db + wal;
    const card = document.createElement('div');
    card.className = 'chart-card storage-compute';

    const h3 = document.createElement('h3');
    h3.className = 'chart-card__title';
    h3.textContent = 'Compute y disco';
    card.appendChild(h3);
    const sub = document.createElement('p');
    sub.className = 'chart-card__subtitle';
    sub.textContent = 'Database, WAL, sistema (espacio en panel Supabase).';
    card.appendChild(sub);

    if (sum <= 0) {
        const empty = document.createElement('p');
        empty.className = 'comments__empty';
        empty.textContent = 'Sin datos de tamaño.';
        card.appendChild(empty);
        return card;
    }

    const barWrap = document.createElement('div');
    barWrap.className = 'storage-compute__bar';
    const mid = document.createElement('div');
    mid.className = 'storage-compute__bar-mid';
    mid.setAttribute('role', 'img');
    mid.setAttribute('aria-label', 'Reparto Database y WAL respecto a su suma');

    const segDb = document.createElement('div');
    segDb.className = 'storage-compute__seg storage-compute__seg--db';
    const segWal = document.createElement('div');
    segWal.className = 'storage-compute__seg storage-compute__seg--wal';
    segDb.style.flex = String(Math.max(1, db));
    segWal.style.flex = String(Math.max(1, wal));
    segDb.title = 'Database: ' + formatBytes(db);
    segWal.title = 'WAL: ' + formatBytes(wal);

    const dbPct = (db / sum) * 100;
    const walPct = (wal / sum) * 100;
    const dlab = document.createElement('span');
    dlab.className = 'storage-compute__seg-lbl';
    dlab.textContent = 'Database ' + dbPct.toFixed(1).replace('.', ',') + ' %';
    const wlab = document.createElement('span');
    wlab.className = 'storage-compute__seg-lbl';
    wlab.textContent = 'WAL ' + walPct.toFixed(1).replace('.', ',') + ' %';
    segDb.appendChild(dlab);
    segWal.appendChild(wlab);

    mid.appendChild(segDb);
    mid.appendChild(segWal);
    barWrap.appendChild(mid);

    const sys = document.createElement('div');
    sys.className = 'storage-compute__bar-sys';
    const st = document.createElement('span');
    st.className = 'storage-compute__bar-sys-t';
    st.textContent = 'Sistema / disponible';
    const ss = document.createElement('span');
    ss.className = 'storage-compute__bar-sys-s';
    ss.textContent = 'Solo en panel Supabase';
    sys.appendChild(st);
    sys.appendChild(ss);
    barWrap.appendChild(sys);
    card.appendChild(barWrap);

    const m = document.createElement('div');
    m.className = 'storage-compute__metrics';
    const addCol = (iconName, elLabel, valueText, micro, microClass) => {
        const c = document.createElement('div');
        c.className = 'storage-compute__metric';
        c.appendChild(createIcon(iconName, 'storage-compute__metric-ic'));
        const t = document.createElement('div');
        t.className = 'storage-compute__metric-txt';
        const lab = document.createElement('span');
        lab.className = 'storage-compute__metric-lbl';
        lab.textContent = elLabel;
        const v = document.createElement('span');
        v.className = 'storage-compute__metric-val';
        v.textContent = valueText;
        t.appendChild(lab);
        t.appendChild(v);
        if (micro) {
            const mu = document.createElement('span');
            mu.className = microClass || 'storage-compute__metric-mu';
            mu.textContent = micro;
            t.appendChild(mu);
        }
        c.appendChild(t);
        m.appendChild(c);
    };
    addCol('database', 'Database', formatBytes(db), null, null);
    addCol('sync_alt', 'WAL (write-ahead log)', formatBytes(wal), null, null);
    addCol('tune', 'Sistema / Disponible', '—', 'Uso: Supabase → Project Settings (Compute & disk / Usage).', 'storage-compute__metric-mu');
    card.appendChild(m);
    return card;
}

/* ---- Admin: almacenamiento (plan gratuito) ---- */
function renderAdminStorage() {
    if (AppState.currentUser?.role !== ROLE_ADMIN) {
        showNotification('Solo los administradores pueden acceder a esta sección.', 'error');
        navigateToHome();
        return;
    }
    AppState.currentView = 'admin_storage';
    const canvas = createDashboardLayout('admin_storage');

    canvas.appendChild(createPageHeader('Storage', 'Database · WAL · Sistema'));

    const loading = document.createElement('p');
    loading.className = 'text-body-md storage-usage__loading';
    loading.textContent = 'Cargando…';
    canvas.appendChild(loading);

    void (async () => {
        let stats;
        try {
            stats = await PMOSupabase.getAdminStorageStats();
        } catch (e) {
            console.error(e);
            while (canvas.firstChild) {
                canvas.removeChild(canvas.firstChild);
            }
            canvas.appendChild(createPageHeader('Storage', 'Database · WAL · Sistema'));
            const errP = document.createElement('p');
            errP.className = 'form-error';
            const msg = (e && e.message) ? String(e.message) : String(e);
            const isMissingRpc = msg.indexOf('get_admin_storage_stats') !== -1
                || msg.toLowerCase().indexOf('function public.get_admin') !== -1
                || (e && e.code === 'PGRST202');
            errP.textContent = isMissingRpc
                ? 'Falta o está desactualizada la función. En Supabase (SQL Editor), ejecute supabase/migrations/004_admin_storage_stats.sql y 005_storage_wal_and_compute_view.sql.'
                : ('No se pudieron cargar las métricas: ' + msg);
            canvas.appendChild(errP);
            return;
        }
        if (!stats || typeof stats !== 'object') {
            while (canvas.firstChild) {
                canvas.removeChild(canvas.firstChild);
            }
            canvas.appendChild(createPageHeader('Storage', 'Database · WAL · Sistema'));
            const errP2 = document.createElement('p');
            errP2.className = 'form-error';
            errP2.textContent = 'No se pudo leer el resultado. Revise conexión o RPC get_admin_storage_stats.';
            canvas.appendChild(errP2);
            return;
        }

        const dbTotal = Number(stats.database_total_bytes) || 0;
        const walBytes = Number(stats.wal_bytes) || 0;

        while (canvas.firstChild) {
            canvas.removeChild(canvas.firstChild);
        }
        canvas.appendChild(createPageHeader('Storage', 'Database · WAL · Sistema'));
        canvas.appendChild(createStorageComputeDiskPanel(dbTotal, walBytes));
    })();
}

/* ---- renderMetricas ---- */
function renderMetricas() {
    AppState.currentView = 'metricas';
    const canvas = createDashboardLayout('metricas');
    canvas.appendChild(createPageHeader(
        'Métricas y Reportes',
        'Indicadores clave de desempeño del portafolio de proyectos.'
    ));

    const all      = AppState.requests;
    const total    = all.length;
    const approved = all.filter((r) => r.status === STATUS.APPROVED);
    const pending  = all.filter((r) => r.status === STATUS.PENDING);
    const rejected = all.filter((r) => r.status === STATUS.REJECTED);
    const changes  = all.filter((r) => r.status === STATUS.CHANGES);
    const draft    = all.filter((r) => r.status === STATUS.DRAFT);

    const totalBudget    = all.reduce((s, r) => s + Number(r.presupuestoEstimado || 0), 0);
    const approvedBudget = approved.reduce((s, r) => s + Number(r.presupuestoEstimado || 0), 0);
    const pendingBudget  = pending.reduce((s, r) => s + Number(r.presupuestoEstimado || 0), 0);
    const approvalRate   = total > 0 ? Math.round((approved.length / total) * 100) : 0;

    /* ── KPI cards ─────────────────────────────────────────────── */
    const kpiGrid = document.createElement('div');
    kpiGrid.className = 'metricas-kpi-grid';
    [
        { label: 'Total Solicitudes',    value: String(total),                     icon: 'folder_copy',     sub: `${draft.length} en borrador`,   color: '#6366f1' },
        { label: 'Presupuesto Total',    value: formatBudgetShort(totalBudget),    icon: 'payments',        sub: 'Suma global del portafolio',    color: '#0ea5e9' },
        { label: 'Presupuesto Aprobado', value: formatBudgetShort(approvedBudget), icon: 'account_balance', sub: `${approved.length} proyecto(s)`, color: '#10b981' },
        { label: 'Tasa de Aprobación',   value: `${approvalRate}%`,               icon: 'percent',         sub: 'Sobre solicitudes totales',     color: '#f59e0b' },
        { label: 'En Revisión',          value: String(pending.length),            icon: 'hourglass_top',   sub: formatBudgetShort(pendingBudget), color: '#8b5cf6' },
        { label: 'Req. Cambios',         value: String(changes.length),            icon: 'edit_note',       sub: `${rejected.length} rechazada(s)`, color: '#ef4444' }
    ].forEach((kpi) => kpiGrid.appendChild(createMetricaKPICard(kpi)));
    canvas.appendChild(kpiGrid);

    /* ── Fila 2: Donut estado + Barras presupuesto por área ─────── */
    const row2 = document.createElement('div');
    row2.className = 'charts-grid';
    row2.appendChild(createMetricasDonut(
        'Distribución por Estado',
        'Proporción de solicitudes según su estado actual',
        [
            { label: 'Aprobadas',    value: approved.length, color: STATUS_CHART_COLORS.approved },
            { label: 'En Revisión',  value: pending.length,  color: STATUS_CHART_COLORS.pending  },
            { label: 'Req. Cambios', value: changes.length,  color: STATUS_CHART_COLORS.changes  },
            { label: 'Rechazadas',   value: rejected.length, color: STATUS_CHART_COLORS.rejected },
            { label: 'Borradores',   value: draft.length,    color: STATUS_CHART_COLORS.draft    }
        ].filter((d) => d.value > 0),
        total
    ));
    row2.appendChild(createMetricasHBars(
        'Presupuesto por Área',
        'Inversión total solicitada por unidad de negocio',
        AREAS.map((area, i) => ({
            label: area.label,
            value: all.filter((r) => r.area === area.value)
                      .reduce((s, r) => s + Number(r.presupuestoEstimado || 0), 0),
            color: CHART_PALETTE[i % CHART_PALETTE.length]
        })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value),
        formatBudgetShort,
        formatCurrency
    ));
    canvas.appendChild(row2);

    /* ── Fila 3: Barras verticales tipo proyecto + Donut prioridad ── */
    const row3 = document.createElement('div');
    row3.className = 'charts-grid';
    row3.appendChild(createMetricasVBars(
        'Solicitudes por Tipo de Proyecto',
        'Número de iniciativas clasificadas por categoría',
        TIPOS_PROYECTO.map((t, i) => ({
            label:     t.label.split(' ')[0],
            fullLabel: t.label,
            value:     all.filter((r) => r.tipoProyecto === t.value).length,
            color:     CHART_PALETTE[i % CHART_PALETTE.length]
        })).filter((d) => d.value > 0)
    ));
    row3.appendChild(createMetricasDonut(
        'Distribución por Prioridad',
        'Clasificación de iniciativas según nivel de urgencia',
        [
            { label: 'Alta',  value: all.filter((r) => r.prioridad === 'alta').length,  color: '#ef4444' },
            { label: 'Media', value: all.filter((r) => r.prioridad === 'media').length, color: '#f59e0b' },
            { label: 'Baja',  value: all.filter((r) => r.prioridad === 'baja').length,  color: '#10b981' }
        ].filter((d) => d.value > 0),
        total
    ));
    canvas.appendChild(row3);

    /* ── Fila 4: Ranking de mayor presupuesto ────────────────────── */
    canvas.appendChild(createMetricasTopTable(all));
}

/* ---- KPI card ---- */
function createMetricaKPICard({ label, value, icon, sub, color }) {
    const card = document.createElement('div');
    card.className = 'chart-card metricas-kpi-card';
    card.style.color = color;
    card.style.borderTopColor = color;

    const iconWrap = document.createElement('div');
    iconWrap.className = 'metricas-kpi-card__icon';
    iconWrap.appendChild(createIcon(icon));
    card.appendChild(iconWrap);

    const valueEl = document.createElement('div');
    valueEl.className = 'metricas-kpi-card__value';
    valueEl.style.color = 'var(--color-on-surface)';
    valueEl.textContent = value;
    card.appendChild(valueEl);

    const labelEl = document.createElement('div');
    labelEl.className = 'metricas-kpi-card__label';
    card.appendChild(labelEl);
    labelEl.textContent = label;

    const subEl = document.createElement('div');
    subEl.className = 'metricas-kpi-card__sub';
    subEl.textContent = sub;
    card.appendChild(subEl);

    return card;
}

/* ---- Donut SVG chart ---- */
function createMetricasDonut(title, subtitle, data, total) {
    const card = _chartCard(title, subtitle);
    if (!data.length || !total) {
        const empty = document.createElement('p');
        empty.className = 'comments__empty';
        empty.textContent = 'Sin datos suficientes.';
        card.appendChild(empty);
        return card;
    }

    const cx = 100, cy = 100, R = 84, r = 56;
    const svg = _svgEl('svg', { viewBox: '0 0 200 200', width: '100%', height: '200' });

    let startAngle = 0;
    data.forEach((item) => {
        const sweep = Math.max(2, (item.value / total) * 354);
        const endAngle = startAngle + sweep;
        const path = _svgEl('path', {
            d: _donutPath(cx, cy, R, r, startAngle, endAngle),
            fill: item.color,
            style: 'cursor:pointer; transition: opacity 0.2s;'
        });
        path.addEventListener('mouseenter', (e) => {
            path.style.opacity = '0.78';
            const pct = Math.round((item.value / total) * 100);
            _showTip(e, [item.label, `${item.value} solicitudes · ${pct}%`]);
        });
        path.addEventListener('mousemove', _moveTip);
        path.addEventListener('mouseleave', () => { path.style.opacity = '1'; _hideTip(); });
        svg.appendChild(path);
        startAngle = endAngle + 2;
    });

    svg.appendChild(_svgTxt('text', {
        x: cx, y: cx - 6,
        'text-anchor': 'middle', 'dominant-baseline': 'auto',
        'font-size': '28', 'font-weight': '800', fill: '#1e1b4b'
    }, String(total)));
    svg.appendChild(_svgTxt('text', {
        x: cx, y: cy + 16,
        'text-anchor': 'middle',
        'font-size': '10', fill: '#6b7280'
    }, 'solicitudes'));
    card.appendChild(svg);

    const legend = document.createElement('div');
    legend.className = 'metricas-legend';
    data.forEach((item) => {
        const li = document.createElement('div');
        li.className = 'metricas-legend__item';
        const dot = document.createElement('span');
        dot.className = 'metricas-legend__dot';
        dot.style.backgroundColor = item.color;
        li.appendChild(dot);
        const txt = document.createElement('span');
        const pct = Math.round((item.value / total) * 100);
        txt.textContent = `${item.label}: ${item.value} (${pct}%)`;
        li.appendChild(txt);
        legend.appendChild(li);
    });
    card.appendChild(legend);
    return card;
}

/* ---- Horizontal animated bars ---- */
function createMetricasHBars(title, subtitle, data, formatShort, formatFull) {
    const card = _chartCard(title, subtitle);
    if (!data.length) {
        const empty = document.createElement('p');
        empty.className = 'comments__empty';
        empty.textContent = 'Sin datos suficientes.';
        card.appendChild(empty);
        return card;
    }

    const maxVal = data[0].value;
    const wrap = document.createElement('div');
    wrap.className = 'metricas-hbars';

    data.forEach((item, i) => {
        const row = document.createElement('div');
        row.className = 'metricas-hbar__row';

        const labelEl = document.createElement('span');
        labelEl.className = 'metricas-hbar__label';
        const words = item.label.split(' ');
        labelEl.textContent = words.length > 2 ? words.slice(0, 2).join(' ') + '.' : item.label;
        labelEl.title = item.label;
        row.appendChild(labelEl);

        const track = document.createElement('div');
        track.className = 'metricas-hbar__track';
        const fill = document.createElement('div');
        fill.className = 'metricas-hbar__fill';
        fill.style.backgroundColor = item.color;
        track.appendChild(fill);
        row.appendChild(track);

        const valEl = document.createElement('span');
        valEl.className = 'metricas-hbar__value';
        valEl.textContent = formatShort ? formatShort(item.value) : String(item.value);
        row.appendChild(valEl);

        [fill, track].forEach((el) => {
            el.addEventListener('mouseenter', (e) => _showTip(e, [item.label, formatFull ? formatFull(item.value) : String(item.value)]));
            el.addEventListener('mousemove', _moveTip);
            el.addEventListener('mouseleave', _hideTip);
        });

        wrap.appendChild(row);
        setTimeout(() => {
            fill.style.width = `${maxVal > 0 ? (item.value / maxVal) * 100 : 0}%`;
        }, 60 + i * 70);
    });

    card.appendChild(wrap);
    return card;
}

/* ---- Vertical SVG bar chart ---- */
function createMetricasVBars(title, subtitle, data) {
    const card = _chartCard(title, subtitle);
    if (!data.length) {
        const empty = document.createElement('p');
        empty.className = 'comments__empty';
        empty.textContent = 'Sin datos suficientes.';
        card.appendChild(empty);
        return card;
    }

    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const chartH = 200, padB = 28, padT = 20, padL = 28;
    const drawH  = chartH - padB - padT;
    const barW   = 38, gap = 16;
    const totalW = padL + data.length * (barW + gap) + gap;

    const svg = _svgEl('svg', {
        viewBox: `0 0 ${totalW} ${chartH}`,
        width: '100%', height: String(chartH),
        style: 'overflow:visible;'
    });

    /* gridlines */
    [0.25, 0.5, 0.75, 1].forEach((frac) => {
        const y = padT + drawH * (1 - frac);
        svg.appendChild(_svgEl('line', {
            x1: padL, y1: y, x2: totalW, y2: y,
            stroke: '#e2e8f0', 'stroke-width': '1', 'stroke-dasharray': '4,3'
        }));
        svg.appendChild(_svgTxt('text', {
            x: padL - 4, y: y + 4,
            'text-anchor': 'end', 'font-size': '9', fill: '#94a3b8'
        }, String(Math.round(maxVal * frac))));
    });

    data.forEach((item, i) => {
        const x   = padL + gap + i * (barW + gap);
        const barH = Math.max(4, (item.value / maxVal) * drawH);
        const baseY = padT + drawH;
        const topY  = baseY - barH;

        /* shadow rect */
        svg.appendChild(_svgEl('rect', {
            x: x + 2, y: baseY,
            width: barW, height: 0,
            rx: '5', fill: item.color, opacity: '0.18'
        }));

        const bar = _svgEl('rect', {
            x, y: baseY,
            width: barW, height: 0,
            rx: '5', fill: item.color,
            style: 'cursor:pointer; transition: opacity 0.2s;'
        });

        bar.addEventListener('mouseenter', (e) => {
            bar.style.opacity = '0.8';
            _showTip(e, [item.fullLabel || item.label, `${item.value} solicitud(es)`]);
        });
        bar.addEventListener('mousemove', _moveTip);
        bar.addEventListener('mouseleave', () => { bar.style.opacity = '1'; _hideTip(); });
        svg.appendChild(bar);

        /* value label */
        const valTxt = _svgTxt('text', {
            x: x + barW / 2, y: topY - 4,
            'text-anchor': 'middle',
            'font-size': '12', 'font-weight': '700', fill: item.color
        }, String(item.value));
        svg.appendChild(valTxt);

        /* x-axis label */
        svg.appendChild(_svgTxt('text', {
            x: x + barW / 2, y: baseY + 16,
            'text-anchor': 'middle',
            'font-size': '10', fill: '#6b7280'
        }, item.label));

        /* animate growth */
        setTimeout(() => {
            bar.setAttribute('y', String(topY));
            bar.setAttribute('height', String(barH));
            bar.style.transition = 'y 0.6s ease, height 0.6s ease';
            svg.querySelectorAll('rect')[i * 2].setAttribute('y', String(topY + 2));
            svg.querySelectorAll('rect')[i * 2].setAttribute('height', String(barH));
            valTxt.setAttribute('y', String(topY - 4));
        }, 80 + i * 90);
    });

    card.appendChild(svg);
    return card;
}

/* ---- Top 5 table ---- */
function createMetricasTopTable(requests) {
    const card = _chartCard(
        'Top 5 por Presupuesto',
        'Iniciativas de mayor inversión del portafolio — click en una fila para ver el detalle'
    );

    const sorted = requests
        .filter((r) => Number(r.presupuestoEstimado) > 0)
        .slice()
        .sort((a, b) => Number(b.presupuestoEstimado) - Number(a.presupuestoEstimado))
        .slice(0, 5);

    if (!sorted.length) {
        const empty = document.createElement('p');
        empty.className = 'comments__empty';
        empty.textContent = 'Sin datos suficientes.';
        card.appendChild(empty);
        return card;
    }

    const table = document.createElement('table');
    table.className = 'metricas-top-table';

    const thead = document.createElement('thead');
    const hrow = document.createElement('tr');
    ['#', 'Solicitud', 'Área', 'Estado', 'Etapa', 'Presupuesto'].forEach((col) => {
        const th = document.createElement('th');
        th.textContent = col;
        hrow.appendChild(th);
    });
    thead.appendChild(hrow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    sorted.forEach((req, i) => {
        const tr = document.createElement('tr');
        tr.addEventListener('click', () => navigateTo('detalle_solicitud', req.id));

        /* rank */
        const tdRank = document.createElement('td');
        tdRank.className = 'metricas-rank';
        tdRank.textContent = `#${i + 1}`;
        tr.appendChild(tdRank);

        /* title */
        const tdTitle = document.createElement('td');
        const strong = document.createElement('div');
        strong.className = 'metricas-req-title';
        strong.textContent = req.title;
        tdTitle.appendChild(strong);
        const idDiv = document.createElement('div');
        idDiv.className = 'metricas-req-id';
        idDiv.textContent = formatRequestId(req.id);
        tdTitle.appendChild(idDiv);
        tr.appendChild(tdTitle);

        /* area */
        const tdArea = document.createElement('td');
        tdArea.textContent = getLabelFromValue(AREAS, req.area);
        tr.appendChild(tdArea);

        /* status badge */
        const tdStatus = document.createElement('td');
        tdStatus.appendChild(createBadge(req.status));
        tr.appendChild(tdStatus);

        /* stage */
        const tdStage = document.createElement('td');
        tdStage.textContent = req.status === STATUS.PENDING
            ? (STAGE_LABELS[req.stage] || '—') : '—';
        tr.appendChild(tdStage);

        /* budget */
        const tdBudget = document.createElement('td');
        tdBudget.className = 'metricas-budget-cell';
        tdBudget.textContent = formatCurrency(Number(req.presupuestoEstimado));
        tr.appendChild(tdBudget);

        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    card.appendChild(table);
    return card;
}

/* ========================= Project Manager ============================== */

function getImplStageConfig(key) {
    return IMPL_STAGES_CONFIG.find(s => s.key === key) || IMPL_STAGES_CONFIG[0];
}

function getImplRequiredProgress(implementation, stageKey) {
    const config = getImplStageConfig(stageKey);
    const requiredDocs = config.docs.filter(d => d.required);
    if (requiredDocs.length === 0) return { count: 0, total: 0, ready: true };
    const uploaded = implementation?.documents?.[stageKey] || [];
    const count = requiredDocs.filter(rd => uploaded.some(ud => ud.tag === rd.tag)).length;
    return { count, total: requiredDocs.length, ready: count >= requiredDocs.length };
}

function ensureImplementation(req) {
    if (!req.implementation) {
        const today = new Date().toISOString().split('T')[0];
        req.implementation = {
            stage: IMPL_STAGE.INICIACION,
            startedAt: today,
            assignedPM: AppState.currentUser?.email || 'pm@banco.com',
            stageHistory: [{ stage: IMPL_STAGE.INICIACION, movedAt: today, movedBy: AppState.currentUser?.email || 'pm@banco.com' }],
            documents: Object.fromEntries(IMPL_STAGE_ORDER.map(k => [k, []])),
            comments: []
        };
    }
    return req.implementation;
}

/* ---- Kanban Dashboard ---- */

function renderDashboardPM(activeFilter) {
    AppState.currentView = 'dashboard_pm';
    const canvas = createDashboardLayout('dashboard_pm');

    const toPersist = [];
    AppState.requests.forEach((r) => {
        if ((r.status === STATUS.APPROVED || r.status === STATUS.CLOSED) && !r.implementation) {
            ensureImplementation(r);
            toPersist.push(r);
        }
    });
    if (toPersist.length) {
        void (async () => {
            try {
                for (const r of toPersist) {
                    await persistRequestUpdate(r);
                }
            } catch (e) {
                /* notificado */
            }
        })();
    }

    const allProjects = AppState.requests.filter(
        r => r.status === STATUS.APPROVED || r.status === STATUS.CLOSED
    );

    const currentFilter = activeFilter || 'all';

    const filteredProjects = currentFilter === 'all'
        ? allProjects
        : allProjects.filter(r => r.tipoProyecto === currentFilter);

    /* ── Page header ── */
    canvas.appendChild(createPageHeader(
        'Kanban de Implementación',
        `${filteredProjects.length} de ${allProjects.length} proyecto(s) en el portafolio — haz clic en una tarjeta para gestionar documentos y avanzar etapas`
    ));

    if (allProjects.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'review-preview__empty';
        empty.appendChild(createIcon('inbox'));
        const emptyTitle = document.createElement('p');
        emptyTitle.className = 'review-preview__empty-title';
        emptyTitle.textContent = 'Sin proyectos en el portafolio';
        empty.appendChild(emptyTitle);
        const emptyText = document.createElement('p');
        emptyText.className = 'text-body-sm';
        emptyText.textContent = 'Los proyectos aprobados por la PMO aparecerán aquí.';
        empty.appendChild(emptyText);
        canvas.appendChild(empty);
        return;
    }

    /* ── Barra de filtros por tipo de proyecto ── */
    const filterBar = document.createElement('div');
    filterBar.className = 'kanban-filter-bar';

    const filterLabel = document.createElement('span');
    filterLabel.className = 'kanban-filter-bar__label';
    filterLabel.appendChild(createIcon('filter_list'));
    const labelTxt = document.createElement('span');
    labelTxt.textContent = 'Tipo de proyecto:';
    filterLabel.appendChild(labelTxt);
    filterBar.appendChild(filterLabel);

    const chipsWrapper = document.createElement('div');
    chipsWrapper.className = 'kanban-filter-chips';

    /* chip "Todos" */
    const allCount = allProjects.length;
    const allChip = createKanbanFilterChip('Todos', 'all', allCount, currentFilter === 'all', (val) => {
        renderDashboardPM(val === 'all' ? null : val);
    });
    chipsWrapper.appendChild(allChip);

    /* chips por tipo */
    TIPOS_PROYECTO.forEach(tipo => {
        const count = allProjects.filter(r => r.tipoProyecto === tipo.value).length;
        if (count === 0) return;
        const chip = createKanbanFilterChip(tipo.label, tipo.value, count, currentFilter === tipo.value, (val) => {
            renderDashboardPM(val);
        });
        chipsWrapper.appendChild(chip);
    });

    filterBar.appendChild(chipsWrapper);
    canvas.appendChild(filterBar);

    /* ── Tablero Kanban ── */
    const wrapper = document.createElement('div');
    wrapper.className = 'kanban-wrapper';

    const board = document.createElement('div');
    board.className = 'kanban-board';

    IMPL_STAGES_CONFIG.forEach(config => {
        const colProjects = filteredProjects.filter(r => {
            const stage = r.implementation?.stage || IMPL_STAGE.INICIACION;
            return stage === config.key;
        });
        board.appendChild(createKanbanColumn(config, colProjects));
    });

    /* mensaje si el filtro no tiene resultados */
    if (filteredProjects.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'kanban-no-results';
        noResults.appendChild(createIcon('search_off'));
        const noTxt = document.createElement('p');
        noTxt.textContent = `No hay proyectos de tipo "${TIPOS_PROYECTO.find(t => t.value === currentFilter)?.label || currentFilter}" en el portafolio.`;
        noResults.appendChild(noTxt);
        wrapper.appendChild(noResults);
    } else {
        wrapper.appendChild(board);
    }

    canvas.appendChild(wrapper);
}

function createKanbanFilterChip(label, value, count, isActive, onClick) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `kanban-chip${isActive ? ' kanban-chip--active' : ''}`;
    chip.setAttribute('aria-pressed', String(isActive));

    const chipLabel = document.createElement('span');
    chipLabel.className = 'kanban-chip__label';
    chipLabel.textContent = label;
    chip.appendChild(chipLabel);

    const chipCount = document.createElement('span');
    chipCount.className = 'kanban-chip__count';
    chipCount.textContent = String(count);
    chip.appendChild(chipCount);

    chip.addEventListener('click', () => onClick(value));
    return chip;
}

function createKanbanColumn(config, projects) {
    const col = document.createElement('div');
    col.className = 'kanban-col';

    const header = document.createElement('div');
    header.className = 'kanban-col__header';

    const stripe = document.createElement('div');
    stripe.className = 'kanban-col__header-stripe';
    stripe.style.backgroundColor = config.color;
    header.appendChild(stripe);

    header.appendChild(createIcon(config.icon, 'kanban-col__icon'));

    const title = document.createElement('span');
    title.className = 'kanban-col__title';
    title.textContent = config.label;
    header.appendChild(title);

    const countBadge = document.createElement('span');
    countBadge.className = 'kanban-col__count';
    countBadge.textContent = String(projects.length);
    header.appendChild(countBadge);

    col.appendChild(header);

    const body = document.createElement('div');
    body.className = 'kanban-col__body';

    if (projects.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'kanban-col__empty';
        empty.appendChild(createIcon('inbox'));
        const emptyTxt = document.createElement('span');
        emptyTxt.textContent = 'Sin proyectos';
        empty.appendChild(emptyTxt);
        body.appendChild(empty);
    } else {
        projects.forEach(r => body.appendChild(createKanbanCard(r, config)));
    }

    col.appendChild(body);
    return col;
}

function createKanbanCard(req, stageConfig) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    if (req.status === STATUS.CLOSED) card.classList.add('kanban-card--closed');

    const cardHeader = document.createElement('div');
    cardHeader.className = 'kanban-card__header';

    const idEl = document.createElement('span');
    idEl.className = 'kanban-card__id';
    idEl.textContent = formatRequestId(req.id);
    cardHeader.appendChild(idEl);

    cardHeader.appendChild(getPriorityBadge(req.prioridad));
    card.appendChild(cardHeader);

    const titleEl = document.createElement('h3');
    titleEl.className = 'kanban-card__title';
    titleEl.textContent = req.title;
    card.appendChild(titleEl);

    const meta = document.createElement('div');
    meta.className = 'kanban-card__meta';

    const areaTag = document.createElement('span');
    areaTag.className = 'kanban-card__tag';
    areaTag.textContent = getLabelFromValue(AREAS, req.area);
    meta.appendChild(areaTag);

    const typeTag = document.createElement('span');
    typeTag.className = 'kanban-card__tag';
    typeTag.textContent = getLabelFromValue(TIPOS_PROYECTO, req.tipoProyecto);
    meta.appendChild(typeTag);

    card.appendChild(meta);

    const progress = getImplRequiredProgress(req.implementation, stageConfig.key);
    const docProgress = document.createElement('div');
    docProgress.className = 'kanban-card__doc-progress';

    const bar = document.createElement('div');
    bar.className = 'kanban-card__doc-bar';
    const fill = document.createElement('div');
    fill.className = 'kanban-card__doc-fill';
    const pct = progress.total > 0 ? (progress.count / progress.total) * 100 : 100;
    fill.style.width = `${pct}%`;
    fill.style.backgroundColor = progress.ready ? '#10b981' : stageConfig.color;
    bar.appendChild(fill);
    docProgress.appendChild(bar);

    const docLabel = document.createElement('span');
    docLabel.className = 'kanban-card__doc-label';
    if (req.status === STATUS.CLOSED) {
        docLabel.textContent = 'Proyecto cerrado';
    } else if (progress.total === 0) {
        docLabel.textContent = 'Sin documentos requeridos';
    } else {
        docLabel.textContent = `${progress.count}/${progress.total} docs requeridos`;
    }
    docProgress.appendChild(docLabel);
    card.appendChild(docProgress);

    const footer = document.createElement('div');
    footer.className = 'kanban-card__footer';

    const budget = document.createElement('span');
    budget.className = 'kanban-card__budget';
    budget.textContent = formatBudgetShort(req.presupuestoEstimado);
    footer.appendChild(budget);

    if (req.status === STATUS.CLOSED) {
        const closedBadge = document.createElement('span');
        closedBadge.className = 'badge badge--closed';
        closedBadge.textContent = 'Cerrado';
        footer.appendChild(closedBadge);
    } else {
        const viewBtn = createButton('Ver detalle', 'text', 'open_in_new', (e) => {
            e.stopPropagation();
            navigateTo('detalle_pm', req.id);
        });
        viewBtn.style.fontSize = '1.2rem';
        viewBtn.style.padding = '0.2rem 0.8rem';
        footer.appendChild(viewBtn);
    }

    card.appendChild(footer);
    card.addEventListener('click', () => navigateTo('detalle_pm', req.id));

    return card;
}

/* ---- Detail View ---- */

function renderDetallePM(reqId) {
    const req = AppState.requests.find(r => r.id === parseInt(reqId, 10));
    if (!req || (req.status !== STATUS.APPROVED && req.status !== STATUS.CLOSED)) {
        showNotification('Proyecto no encontrado en el portafolio.', 'error');
        navigateTo('dashboard_pm');
        return;
    }

    ensureImplementation(req);
    const impl = req.implementation;

    AppState.currentView = 'detalle_pm';
    const canvas = createDashboardLayout('dashboard_pm');

    const contextHeader = document.createElement('div');
    contextHeader.className = 'context-header';

    const backLink = document.createElement('button');
    backLink.type = 'button';
    backLink.className = 'context-header__back';
    backLink.appendChild(createIcon('arrow_back'));
    const backLabel = document.createElement('span');
    backLabel.textContent = 'Volver al Kanban';
    backLink.appendChild(backLabel);
    backLink.addEventListener('click', () => navigateTo('dashboard_pm'));
    contextHeader.appendChild(backLink);

    const titleRow = document.createElement('div');
    titleRow.className = 'context-header__title-row';

    const titleBlock = document.createElement('div');
    const reqTitle = document.createElement('h2');
    reqTitle.className = 'context-header__title';
    reqTitle.textContent = req.title;
    titleBlock.appendChild(reqTitle);

    const reqMeta = document.createElement('p');
    reqMeta.className = 'context-header__subtitle';
    reqMeta.textContent = `${formatRequestId(req.id)} · ${getLabelFromValue(AREAS, req.area)} · ${formatCurrency(req.presupuestoEstimado)}`;
    titleBlock.appendChild(reqMeta);
    titleRow.appendChild(titleBlock);

    const statusBadge = createBadge(req.status);
    statusBadge.classList.add('badge--lg');
    titleRow.appendChild(statusBadge);

    const docsBtn = createButton('Documentación por Etapa', 'secondary', 'folder_open',
        () => navigateTo('docs_pm', req.id));
    titleRow.appendChild(docsBtn);

    contextHeader.appendChild(titleRow);
    canvas.appendChild(contextHeader);

    const detail = document.createElement('div');
    detail.className = 'impl-detail';

    detail.appendChild(createImplStepper(impl));

    const grid = document.createElement('div');
    grid.className = 'impl-content-grid';

    grid.appendChild(createImplProjectSummary(req));

    const implPanel = document.createElement('div');
    implPanel.style.cssText = 'display:flex;flex-direction:column;gap:1.6rem;';
    implPanel.appendChild(createImplDocSection(req));
    implPanel.appendChild(createImplCommentsSection(req));
    grid.appendChild(implPanel);

    detail.appendChild(grid);
    canvas.appendChild(detail);

    if (req.status !== STATUS.CLOSED) {
        canvas.appendChild(createImplActionFooter(req));
    }
}

function createImplStepper(impl) {
    const container = document.createElement('div');
    container.className = 'impl-stepper';

    const currentIdx = IMPL_STAGE_ORDER.indexOf(impl.stage);

    IMPL_STAGES_CONFIG.forEach((cfg, idx) => {
        const step = document.createElement('div');
        step.className = 'impl-step';
        if (idx < currentIdx) step.classList.add('impl-step--done');
        if (idx === currentIdx) step.classList.add('impl-step--active');

        const dot = document.createElement('div');
        dot.className = 'impl-step__dot';
        dot.appendChild(createIcon(idx < currentIdx ? 'check' : cfg.icon));
        step.appendChild(dot);

        const label = document.createElement('span');
        label.className = 'impl-step__label';
        label.textContent = cfg.label;
        step.appendChild(label);

        if (idx < IMPL_STAGES_CONFIG.length - 1) {
            const track = document.createElement('div');
            track.className = 'impl-step__track';
            step.appendChild(track);
        }

        container.appendChild(step);
    });

    return container;
}

function createImplProjectSummary(req) {
    const card = document.createElement('div');
    card.className = 'impl-card';

    const cardTitle = document.createElement('h3');
    cardTitle.className = 'impl-card__title';
    cardTitle.appendChild(createIcon('info'));
    const ts = document.createElement('span');
    ts.textContent = 'Resumen del Proyecto';
    cardTitle.appendChild(ts);
    card.appendChild(cardTitle);

    const rows = [
        { label: 'Área',                  value: getLabelFromValue(AREAS, req.area) },
        { label: 'Tipo de Proyecto',       value: getLabelFromValue(TIPOS_PROYECTO, req.tipoProyecto) },
        { label: 'Prioridad',              value: getLabelFromValue(PRIORIDADES, req.prioridad) },
        { label: 'Presupuesto Aprobado',   value: formatCurrency(req.presupuestoEstimado) },
        { label: 'Inicio Estimado',        value: formatDate(req.fechaEstimadaInicio) },
        { label: 'PM Asignado',            value: req.implementation?.assignedPM || '—' },
        { label: 'Inicio Implementación',  value: formatDate(req.implementation?.startedAt) }
    ];

    rows.forEach(({ label, value }) => {
        const row = document.createElement('div');
        row.className = 'impl-info-row';
        const lbl = document.createElement('span');
        lbl.className = 'impl-info-row__label';
        lbl.textContent = label;
        row.appendChild(lbl);
        const val = document.createElement('span');
        val.className = 'impl-info-row__value';
        val.textContent = value || '—';
        row.appendChild(val);
        card.appendChild(row);
    });

    const descRow = document.createElement('div');
    descRow.className = 'impl-info-row';
    const descLbl = document.createElement('span');
    descLbl.className = 'impl-info-row__label';
    descLbl.textContent = 'Descripción';
    descRow.appendChild(descLbl);
    const descVal = document.createElement('p');
    descVal.className = 'impl-info-row__value';
    descVal.style.fontSize = 'var(--font-size-body-sm)';
    descVal.style.lineHeight = '1.5';
    descVal.textContent = req.necesidad || '—';
    descRow.appendChild(descVal);
    card.appendChild(descRow);

    return card;
}

function createImplDocSection(req) {
    const impl = req.implementation;
    const stageKey = impl.stage;
    const config = getImplStageConfig(stageKey);
    const uploadedDocs = impl.documents[stageKey] || [];

    const card = document.createElement('div');
    card.className = 'impl-card';

    const cardTitle = document.createElement('h3');
    cardTitle.className = 'impl-card__title';
    cardTitle.appendChild(createIcon(config.icon));
    const ts = document.createElement('span');
    ts.textContent = `Documentos — ${config.label}`;
    cardTitle.appendChild(ts);
    card.appendChild(cardTitle);

    const docList = document.createElement('div');
    docList.className = 'impl-doc-list';

    config.docs.forEach(docDef => {
        const uploaded = uploadedDocs.find(ud => ud.tag === docDef.tag);
        const item = document.createElement('div');
        item.className = 'impl-doc-item';
        if (!uploaded) item.classList.add('impl-doc-item--missing');

        const iconBox = document.createElement('div');
        iconBox.className = 'impl-doc-item__icon';
        iconBox.appendChild(createIcon(uploaded ? 'description' : (docDef.required ? 'error_outline' : 'add_circle_outline')));
        item.appendChild(iconBox);

        const info = document.createElement('div');
        info.className = 'impl-doc-item__info';

        const name = document.createElement('div');
        name.className = 'impl-doc-item__name';
        name.textContent = uploaded ? uploaded.name : docDef.label;
        info.appendChild(name);

        const meta = document.createElement('div');
        meta.className = 'impl-doc-item__meta';
        if (uploaded) {
            meta.textContent = `${uploaded.format?.toUpperCase() || 'DOC'} · ${formatDate(uploaded.uploadedAt)} · ${uploaded.uploadedBy}`;
        } else {
            meta.textContent = docDef.required ? 'Pendiente (requerido)' : 'Pendiente (opcional)';
        }
        info.appendChild(meta);
        item.appendChild(info);

        const badge = document.createElement('span');
        badge.className = `impl-doc-item__badge ${docDef.required ? 'impl-doc-item__badge--required' : 'impl-doc-item__badge--optional'}`;
        badge.textContent = docDef.required ? 'Requerido' : 'Opcional';
        item.appendChild(badge);

        if (uploaded && uploaded.storagePath) {
            const openBtn = createIconButton('open_in_new', 'Abrir archivo', () => {
                openImplementationDocument(uploaded);
            });
            openBtn.classList.add('impl-doc-item__open');
            item.appendChild(openBtn);
        }

        docList.appendChild(item);
    });

    card.appendChild(docList);

    if (req.status !== STATUS.CLOSED) {
        const addWrapper = document.createElement('div');
        let formVisible = false;
        let formEl = null;

        const addBtn = createButton('Agregar Documento', 'secondary', 'attach_file', () => {
            formVisible = !formVisible;
            if (formVisible) {
                formEl = createAddDocForm(req, stageKey, config, () => renderDetallePM(req.id));
                addWrapper.appendChild(formEl);
                addBtn.querySelector('span:last-child').textContent = 'Cancelar';
            } else {
                if (formEl) { addWrapper.removeChild(formEl); formEl = null; }
                addBtn.querySelector('span:last-child').textContent = 'Agregar Documento';
            }
        });

        addWrapper.appendChild(addBtn);
        card.appendChild(addWrapper);
    }

    return card;
}

function createAddDocForm(req, stageKey, stageConfig, onSuccess) {
    const form = document.createElement('div');
    form.className = 'impl-add-doc-form';

    const docTypeField = createFormField({
        id: `doc-type-${req.id}-${Date.now()}`,
        label: 'Tipo de Documento',
        type: 'select',
        required: true,
        choices: stageConfig.docs.map(d => ({
            value: d.tag,
            label: `${d.label}${d.required ? ' *' : ''}`
        }))
    });
    form.appendChild(docTypeField.group);

    const fileGroup = document.createElement('div');
    fileGroup.className = 'form-group';
    const fileLabel = document.createElement('label');
    fileLabel.className = 'form-label';
    fileLabel.setAttribute('for', `doc-file-${req.id}-${Date.now()}`);
    fileLabel.textContent = 'Archivo';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = `doc-file-${req.id}`;
    fileInput.className = 'form-input';
    fileInput.setAttribute('aria-required', 'true');
    fileGroup.appendChild(fileLabel);
    fileGroup.appendChild(fileInput);
    form.appendChild(fileGroup);

    const saveBtn = createButton('Subir documento', 'primary', 'upload', () => {
        const tag = docTypeField.input.value;
        let hasError = false;
        if (!tag) {
            showFieldError(docTypeField.input, 'Seleccione el tipo de documento.');
            hasError = true;
        }
        if (!fileInput.files || !fileInput.files[0]) {
            showFieldError(fileInput, 'Seleccione un archivo.');
            hasError = true;
        }
        if (hasError) {
            return;
        }
        void (async () => {
            try {
                if (!req.implementation.documents[stageKey]) {
                    req.implementation.documents[stageKey] = [];
                }
                const name = fileInput.files[0].name;
                await PMOData.uploadImplementationFile(req, stageKey, fileInput, tag);
                showNotification(`Documento \"${name}\" agregado correctamente.`, 'success');
                onSuccess();
            } catch (err) {
                showNotification(err.message || 'Error al subir el archivo.', 'error');
            }
        })();
    });

    form.appendChild(saveBtn);
    return form;
}

function createImplCommentsSection(req) {
    const impl = req.implementation;
    const card = document.createElement('div');
    card.className = 'impl-card';

    const cardTitle = document.createElement('h3');
    cardTitle.className = 'impl-card__title';
    cardTitle.appendChild(createIcon('forum'));
    const ts = document.createElement('span');
    ts.textContent = `Bitácora del PM (${impl.comments.length})`;
    cardTitle.appendChild(ts);
    card.appendChild(cardTitle);

    if (impl.comments.length > 0) {
        const commentsEl = document.createElement('div');
        commentsEl.className = 'comments';
        impl.comments
            .slice()
            .sort((a, b) => a.date.localeCompare(b.date))
            .forEach(c => {
                const el = document.createElement('div');
                el.className = 'comment';
                const hdr = document.createElement('div');
                hdr.className = 'comment__header';
                const auth = document.createElement('span');
                auth.className = 'comment__author';
                auth.textContent = c.author;
                hdr.appendChild(auth);
                const dt = document.createElement('span');
                dt.className = 'comment__date';
                dt.textContent = formatDate(c.date);
                hdr.appendChild(dt);
                el.appendChild(hdr);
                const txt = document.createElement('p');
                txt.className = 'comment__text';
                txt.textContent = c.text;
                el.appendChild(txt);
                commentsEl.appendChild(el);
            });
        card.appendChild(commentsEl);
    }

    if (req.status !== STATUS.CLOSED) {
        const commentField = createFormField({
            id: `pm-comment-${req.id}`,
            label: 'Agregar nota a la bitácora',
            type: 'textarea',
            rows: 2,
            placeholder: 'Registre avances, decisiones o bloqueos del proyecto...'
        });
        card.appendChild(commentField.group);

        const saveBtn = createButton('Guardar Nota', 'secondary', 'save', () => {
            const text = commentField.input.value.trim();
            if (text.length < 3) {
                showFieldError(commentField.input, 'Ingrese al menos 3 caracteres.');
                return;
            }
            void (async () => {
                try {
                    impl.comments.push({
                        author: AppState.currentUser.email,
                        date: new Date().toISOString().split('T')[0],
                        text: text
                    });
                    await persistRequestUpdate(req);
                    showNotification('Nota registrada en la bitácora.', 'success');
                    renderDetallePM(req.id);
                } catch (e) {
                    /* notificado */
                }
            })();
        });
        card.appendChild(saveBtn);
    }

    return card;
}

function createImplActionFooter(req) {
    const impl = req.implementation;
    const stageKey = impl.stage;
    const stageIdx = IMPL_STAGE_ORDER.indexOf(stageKey);
    const isLast = stageIdx === IMPL_STAGE_ORDER.length - 1;
    const nextKey = isLast ? null : IMPL_STAGE_ORDER[stageIdx + 1];
    const nextConfig = nextKey ? getImplStageConfig(nextKey) : null;
    const currentConfig = getImplStageConfig(stageKey);
    const progress = getImplRequiredProgress(impl, stageKey);

    const footer = document.createElement('div');
    footer.className = 'impl-actions';

    const statusMsg = document.createElement('div');
    statusMsg.className = `impl-advance-status${progress.ready ? ' impl-advance-status--ok' : ''}`;
    statusMsg.appendChild(createIcon(progress.ready ? 'check_circle' : 'pending'));
    const statusTxt = document.createElement('span');
    statusTxt.textContent = progress.ready
        ? `Documentación de "${currentConfig.label}" completa.`
        : `Faltan ${progress.total - progress.count} doc(s) requerido(s) en "${currentConfig.label}".`;
    statusMsg.appendChild(statusTxt);
    footer.appendChild(statusMsg);

    const actionBtn = createButton(
        isLast ? 'Cerrar Proyecto' : `Avanzar a ${nextConfig.label}`,
        'primary',
        isLast ? 'task_alt' : 'arrow_forward',
        () => {
            if (!progress.ready) {
                showNotification('Complete los documentos requeridos antes de continuar.', 'error');
                return;
            }
            const today = new Date().toISOString().split('T')[0];
            void (async () => {
                try {
                    if (isLast) {
                        impl.comments.push({
                            author: AppState.currentUser.email,
                            date: today,
                            text: 'Proyecto cerrado exitosamente. Todos los entregables de Cierre registrados.'
                        });
                        req.status = STATUS.CLOSED;
                        await persistRequestUpdate(req);
                        showNotification(`Proyecto ${formatRequestId(req.id)} cerrado exitosamente.`, 'success');
                    } else {
                        impl.stage = nextKey;
                        impl.stageHistory.push({
                            stage: nextKey,
                            movedAt: today,
                            movedBy: AppState.currentUser.email
                        });
                        impl.comments.push({
                            author: AppState.currentUser.email,
                            date: today,
                            text: `Proyecto avanzado de "${currentConfig.label}" a "${nextConfig.label}".`
                        });
                        await persistRequestUpdate(req);
                        showNotification(`Proyecto avanzado a "${nextConfig.label}".`, 'success');
                    }
                    renderDetallePM(req.id);
                } catch (e) {
                    /* notificado */
                }
            })();
        }
    );

    footer.appendChild(actionBtn);
    return footer;
}

/* ---- PM Metrics ---- */

function renderMetricasPM() {
    AppState.currentView = 'metricas_pm';
    const canvas = createDashboardLayout('metricas_pm');

    canvas.appendChild(createPageHeader(
        'Métricas de Implementación',
        'Seguimiento del portafolio de proyectos en ejecución.'
    ));

    const projects = AppState.requests.filter(
        r => r.status === STATUS.APPROVED || r.status === STATUS.CLOSED
    );

    const closed     = projects.filter(r => r.status === STATUS.CLOSED);
    const inProgress = projects.filter(r => r.status === STATUS.APPROVED);
    const blocked    = inProgress.filter(r => {
        if (!r.implementation) return false;
        return !getImplRequiredProgress(r.implementation, r.implementation.stage).ready;
    });
    const totalBudget = projects.reduce((s, r) => s + (Number(r.presupuestoEstimado) || 0), 0);

    const kpis = [
        { label: 'Total Portafolio',    value: String(projects.length),      icon: 'folder_open',   color: '#6366f1', sub: 'proyectos aprobados'          },
        { label: 'En Implementación',   value: String(inProgress.length),    icon: 'construction',  color: '#0ea5e9', sub: 'proyectos activos'             },
        { label: 'Proyectos Cerrados',  value: String(closed.length),        icon: 'task_alt',      color: '#10b981', sub: 'completados exitosamente'      },
        { label: 'Bloqueados',          value: String(blocked.length),       icon: 'block',         color: '#ef4444', sub: 'requieren documentación'       },
        { label: 'Presupuesto Total',   value: formatBudgetShort(totalBudget),icon: 'payments',     color: '#f59e0b', sub: 'en portafolio'                 },
        {
            label: 'Tasa de Cierre',
            value: projects.length ? `${Math.round((closed.length / projects.length) * 100)}%` : '0%',
            icon: 'percent', color: '#8b5cf6', sub: 'proyectos completados'
        }
    ];

    const kpiGrid = document.createElement('div');
    kpiGrid.className = 'metricas-kpi-grid';
    kpis.forEach(k => kpiGrid.appendChild(createMetricaKPICard(k)));
    canvas.appendChild(kpiGrid);

    const chartsRow = document.createElement('div');
    chartsRow.className = 'charts-grid';

    /* — Proyectos por etapa (barras horizontales) — */
    const stageChartCard = _chartCard('Proyectos por Etapa', 'Distribución del portafolio en el flujo de implementación');
    const stageBar = document.createElement('div');
    stageBar.className = 'pm-stage-bar';
    stageBar.style.marginTop = '1.6rem';

    const maxCount = Math.max(1, ...IMPL_STAGES_CONFIG.map(cfg =>
        projects.filter(r => (r.implementation?.stage || IMPL_STAGE.INICIACION) === cfg.key).length
    ));

    IMPL_STAGES_CONFIG.forEach(cfg => {
        const count = projects.filter(r =>
            (r.implementation?.stage || IMPL_STAGE.INICIACION) === cfg.key
        ).length;

        const row = document.createElement('div');
        row.className = 'pm-stage-bar__row';

        const lbl = document.createElement('span');
        lbl.className = 'pm-stage-bar__label';
        lbl.textContent = cfg.label;
        row.appendChild(lbl);

        const track = document.createElement('div');
        track.className = 'pm-stage-bar__track';
        const fill = document.createElement('div');
        fill.className = 'pm-stage-bar__fill';
        fill.style.backgroundColor = cfg.color;
        fill.style.width = '0%';
        track.appendChild(fill);
        row.appendChild(track);

        const cnt = document.createElement('span');
        cnt.className = 'pm-stage-bar__count';
        cnt.textContent = String(count);
        row.appendChild(cnt);

        stageBar.appendChild(row);
        setTimeout(() => { fill.style.width = `${(count / maxCount) * 100}%`; }, 120);
    });

    stageChartCard.appendChild(stageBar);
    chartsRow.appendChild(stageChartCard);

    /* — Distribución por área (donut) — */
    const areaData = AREAS.map(a => ({
        label: a.label,
        value: projects.filter(r => r.area === a.value).length
    })).filter(d => d.value > 0);

    if (areaData.length > 0) {
        chartsRow.appendChild(createMetricasDonut(
            'Distribución por Área',
            'Proyectos del portafolio por área solicitante',
            areaData
        ));
    }

    canvas.appendChild(chartsRow);

    /* — Tabla de proyectos — */
    if (projects.length > 0) {
        const tableCard = _chartCard('Portafolio Completo', 'Todos los proyectos con su estado de implementación actual');
        tableCard.appendChild(createPMProjectsTable(projects));
        canvas.appendChild(tableCard);
    }
}

function createPMProjectsTable(projects) {
    const table = document.createElement('table');
    table.className = 'metricas-top-table';
    table.style.marginTop = '1.2rem';

    const thead = document.createElement('thead');
    const hr = document.createElement('tr');
    ['ID', 'Proyecto', 'Área', 'Etapa Implementación', 'Docs Req.', 'Presupuesto', 'Estado'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    projects
        .slice()
        .sort((a, b) => Number(b.presupuestoEstimado) - Number(a.presupuestoEstimado))
        .forEach(req => {
            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            tr.addEventListener('click', () => navigateTo('detalle_pm', req.id));

            const tdId = document.createElement('td');
            tdId.textContent = formatRequestId(req.id);
            tr.appendChild(tdId);

            const tdTitle = document.createElement('td');
            tdTitle.className = 'metricas-req-title';
            tdTitle.textContent = req.title;
            tr.appendChild(tdTitle);

            const tdArea = document.createElement('td');
            tdArea.textContent = getLabelFromValue(AREAS, req.area);
            tr.appendChild(tdArea);

            const stageKey = req.implementation?.stage || IMPL_STAGE.INICIACION;
            const stageCfg = getImplStageConfig(stageKey);
            const tdStage = document.createElement('td');
            tdStage.textContent = req.status === STATUS.CLOSED ? 'Proyecto Cerrado' : stageCfg.label;
            tdStage.style.color   = req.status === STATUS.CLOSED ? '#10b981' : stageCfg.color;
            tdStage.style.fontWeight = '600';
            tr.appendChild(tdStage);

            const tdDocs = document.createElement('td');
            if (req.status === STATUS.CLOSED) {
                tdDocs.textContent = '✓ Completo';
                tdDocs.style.color = '#10b981';
            } else {
                const prog = getImplRequiredProgress(req.implementation, stageKey);
                tdDocs.textContent = `${prog.count}/${prog.total}`;
                tdDocs.style.color = prog.ready ? '#10b981' : '#ef4444';
            }
            tr.appendChild(tdDocs);

            const tdBudget = document.createElement('td');
            tdBudget.className = 'metricas-budget-cell';
            tdBudget.textContent = formatBudgetShort(req.presupuestoEstimado);
            tr.appendChild(tdBudget);

            const tdStatus = document.createElement('td');
            tdStatus.appendChild(createBadge(req.status));
            tr.appendChild(tdStatus);

            tbody.appendChild(tr);
        });

    table.appendChild(tbody);
    return table;
}

/* ---- Documentación por Etapa ---- */

function renderDocsPM(reqId) {
    const req = AppState.requests.find(r => r.id === parseInt(reqId, 10));
    if (!req || (req.status !== STATUS.APPROVED && req.status !== STATUS.CLOSED)) {
        showNotification('Proyecto no encontrado.', 'error');
        navigateTo('dashboard_pm');
        return;
    }

    ensureImplementation(req);
    const impl = req.implementation;
    const currentStageIdx = IMPL_STAGE_ORDER.indexOf(impl.stage);

    AppState.currentView = 'docs_pm';
    const canvas = createDashboardLayout('dashboard_pm');

    /* ── Context header ── */
    const contextHeader = document.createElement('div');
    contextHeader.className = 'context-header';

    const backLink = document.createElement('button');
    backLink.type = 'button';
    backLink.className = 'context-header__back';
    backLink.appendChild(createIcon('arrow_back'));
    const backLabel = document.createElement('span');
    backLabel.textContent = 'Volver al Proyecto';
    backLink.appendChild(backLabel);
    backLink.addEventListener('click', () => navigateTo('detalle_pm', req.id));
    contextHeader.appendChild(backLink);

    const titleRow = document.createElement('div');
    titleRow.className = 'context-header__title-row';

    const titleBlock = document.createElement('div');
    const reqTitle = document.createElement('h2');
    reqTitle.className = 'context-header__title';
    reqTitle.textContent = 'Documentación por Etapa';
    titleBlock.appendChild(reqTitle);

    const reqMeta = document.createElement('p');
    reqMeta.className = 'context-header__subtitle';
    reqMeta.textContent = `${formatRequestId(req.id)} · ${req.title}`;
    titleBlock.appendChild(reqMeta);
    titleRow.appendChild(titleBlock);

    const stageBadge = document.createElement('span');
    stageBadge.className = 'badge badge--lg';
    const currentCfg = getImplStageConfig(impl.stage);
    stageBadge.textContent = req.status === STATUS.CLOSED ? 'Proyecto Cerrado' : `Etapa actual: ${currentCfg.label}`;
    stageBadge.style.backgroundColor = req.status === STATUS.CLOSED ? '#10b981' : currentCfg.color;
    stageBadge.style.color = '#fff';
    titleRow.appendChild(stageBadge);

    contextHeader.appendChild(titleRow);
    canvas.appendChild(contextHeader);

    /* ── Contenido ── */
    const wrapper = document.createElement('div');
    wrapper.className = 'impl-detail';

    /* Resumen de documentación */
    const totalUploaded = IMPL_STAGE_ORDER.reduce((sum, key) => {
        return sum + (impl.documents[key]?.length || 0);
    }, 0);
    const totalRequired = IMPL_STAGES_CONFIG.reduce((sum, cfg) => {
        return sum + cfg.docs.filter(d => d.required).length;
    }, 0);
    const completedRequired = IMPL_STAGES_CONFIG.reduce((sum, cfg) => {
        const uploaded = impl.documents[cfg.key] || [];
        return sum + cfg.docs.filter(d => d.required && uploaded.some(u => u.tag === d.tag)).length;
    }, 0);

    const summaryCard = document.createElement('div');
    summaryCard.className = 'docs-summary-bar';

    const summaryItems = [
        { icon: 'description',  label: 'Documentos adjuntos',    value: String(totalUploaded)                              },
        { icon: 'task_alt',     label: 'Requeridos completados',  value: `${completedRequired} / ${totalRequired}`         },
        { icon: 'engineering',  label: 'Etapa actual',            value: req.status === STATUS.CLOSED ? 'Cerrado' : currentCfg.label },
        { icon: 'flag',         label: 'Estado del proyecto',     value: req.status                                        }
    ];

    summaryItems.forEach(({ icon, label, value }) => {
        const item = document.createElement('div');
        item.className = 'docs-summary-item';
        item.appendChild(createIcon(icon));
        const texts = document.createElement('div');
        const lbl = document.createElement('span');
        lbl.className = 'docs-summary-item__label';
        lbl.textContent = label;
        texts.appendChild(lbl);
        const val = document.createElement('span');
        val.className = 'docs-summary-item__value';
        val.textContent = value;
        texts.appendChild(val);
        item.appendChild(texts);
        summaryCard.appendChild(item);
    });

    wrapper.appendChild(summaryCard);

    /* Etapas y sus documentos */
    const stagesGrid = document.createElement('div');
    stagesGrid.className = 'docs-stages-grid';

    IMPL_STAGES_CONFIG.forEach((cfg, idx) => {
        const uploadedDocs = impl.documents[cfg.key] || [];
        const requiredDocs = cfg.docs.filter(d => d.required);
        const completedReq  = requiredDocs.filter(rd => uploadedDocs.some(u => u.tag === rd.tag)).length;

        const stageState = idx < currentStageIdx ? 'done'
            : idx === currentStageIdx ? 'active'
            : 'pending';

        const stageCard = document.createElement('div');
        stageCard.className = `docs-stage-card docs-stage-card--${stageState}`;

        /* — Header de etapa — */
        const stageHeader = document.createElement('div');
        stageHeader.className = 'docs-stage-card__header';
        stageHeader.style.borderLeftColor = cfg.color;

        const stageLeft = document.createElement('div');
        stageLeft.className = 'docs-stage-card__header-left';

        const stageIcon = document.createElement('div');
        stageIcon.className = 'docs-stage-card__icon';
        stageIcon.style.backgroundColor = `${cfg.color}22`;
        stageIcon.style.color = cfg.color;
        stageIcon.appendChild(createIcon(stageState === 'done' ? 'check_circle' : cfg.icon));
        stageLeft.appendChild(stageIcon);

        const stageTitles = document.createElement('div');
        const stageName = document.createElement('h3');
        stageName.className = 'docs-stage-card__name';
        stageName.textContent = cfg.label;
        stageTitles.appendChild(stageName);

        const stageSub = document.createElement('p');
        stageSub.className = 'docs-stage-card__sub';
        if (stageState === 'pending') {
            stageSub.textContent = 'Etapa no iniciada';
        } else {
            stageSub.textContent = `${uploadedDocs.length} adjunto(s) · ${completedReq}/${requiredDocs.length} requeridos`;
        }
        stageTitles.appendChild(stageSub);
        stageLeft.appendChild(stageTitles);
        stageHeader.appendChild(stageLeft);

        const stateChip = document.createElement('span');
        stateChip.className = 'docs-stage-state-chip';
        stateChip.style.backgroundColor = stageState === 'done'   ? '#10b98120'
            : stageState === 'active'  ? `${cfg.color}20`
            : 'var(--color-surface-container)';
        stateChip.style.color = stageState === 'done'   ? '#10b981'
            : stageState === 'active'  ? cfg.color
            : 'var(--color-on-surface-variant)';
        stateChip.textContent = stageState === 'done' ? 'Completada' : stageState === 'active' ? 'En curso' : 'Pendiente';
        stageHeader.appendChild(stateChip);

        stageCard.appendChild(stageHeader);

        /* — Cuerpo: documentos — */
        const stageBody = document.createElement('div');
        stageBody.className = 'docs-stage-card__body';

        if (uploadedDocs.length === 0 && stageState === 'pending') {
            const emptyMsg = document.createElement('p');
            emptyMsg.className = 'docs-stage-empty';
            emptyMsg.textContent = 'Esta etapa aún no ha sido iniciada. Los documentos aparecerán aquí cuando el proyecto avance.';
            stageBody.appendChild(emptyMsg);
        } else {
            /* Documentos adjuntados */
            if (uploadedDocs.length > 0) {
                cfg.docs.forEach(docDef => {
                    const uploaded = uploadedDocs.find(u => u.tag === docDef.tag);
                    if (!uploaded) return;
                    stageBody.appendChild(createDocsViewItem(uploaded, docDef, true));
                });

                /* Documentos del def que no tienen adjunto pero están definidos */
                cfg.docs.forEach(docDef => {
                    const uploaded = uploadedDocs.find(u => u.tag === docDef.tag);
                    if (uploaded) return;
                    stageBody.appendChild(createDocsViewItem(null, docDef, false));
                });
            } else {
                /* Etapa activa o pasada sin ningún documento */
                cfg.docs.forEach(docDef => {
                    stageBody.appendChild(createDocsViewItem(null, docDef, false));
                });
            }
        }

        stageCard.appendChild(stageBody);

        /* — Footer: enlace ir al detalle si es etapa activa — */
        if (stageState === 'active' && req.status !== STATUS.CLOSED) {
            const footerLink = document.createElement('div');
            footerLink.className = 'docs-stage-card__footer';
            const addDocBtn = createButton('Agregar documentos en esta etapa', 'text', 'attach_file',
                () => navigateTo('detalle_pm', req.id));
            footerLink.appendChild(addDocBtn);
            stageCard.appendChild(footerLink);
        }

        stagesGrid.appendChild(stageCard);
    });

    wrapper.appendChild(stagesGrid);
    canvas.appendChild(wrapper);
}

function createDocsViewItem(uploaded, docDef, hasDoc) {
    const item = document.createElement('div');
    item.className = `docs-view-item${hasDoc ? '' : ' docs-view-item--missing'}`;

    const iconBox = document.createElement('div');
    iconBox.className = 'docs-view-item__icon';

    const formatIcons = { pdf: 'picture_as_pdf', word: 'article', excel: 'table_chart', ppt: 'slideshow', otro: 'insert_drive_file' };
    const iconName = hasDoc ? (formatIcons[uploaded.format] || 'description') : (docDef.required ? 'error_outline' : 'radio_button_unchecked');
    iconBox.appendChild(createIcon(iconName));
    item.appendChild(iconBox);

    const info = document.createElement('div');
    info.className = 'docs-view-item__info';

    const name = document.createElement('span');
    name.className = 'docs-view-item__name';
    name.textContent = hasDoc ? uploaded.name : docDef.label;
    info.appendChild(name);

    const meta = document.createElement('div');
    meta.className = 'docs-view-item__meta';

    if (hasDoc) {
        const formatChip = document.createElement('span');
        formatChip.className = 'docs-view-item__format';
        formatChip.textContent = (uploaded.format || 'doc').toUpperCase();
        meta.appendChild(formatChip);

        const separator = document.createTextNode(' · ');
        meta.appendChild(separator);

        const dateTxt = document.createTextNode(`${formatDate(uploaded.uploadedAt)} · ${uploaded.uploadedBy}`);
        meta.appendChild(dateTxt);
    } else {
        meta.textContent = docDef.required ? 'Pendiente — requerido para avanzar' : 'Pendiente — opcional';
    }

    info.appendChild(meta);
    item.appendChild(info);

    const badge = document.createElement('span');
    badge.className = `docs-view-item__badge ${docDef.required ? 'docs-view-item__badge--req' : 'docs-view-item__badge--opt'}`;
    badge.textContent = docDef.required ? 'Requerido' : 'Opcional';
    item.appendChild(badge);

    if (hasDoc && uploaded.storagePath) {
        const openBtn = createIconButton('open_in_new', 'Abrir archivo', () => {
            openImplementationDocument(uploaded);
        });
        openBtn.classList.add('docs-view-item__open');
        item.appendChild(openBtn);
    }

    return item;
}

/* --------------------------- Inicialización ----------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    ensureNotificationsContainer();
    void initApp();
});

async function initApp() {
    if (typeof PMOSupabase === 'undefined' || typeof PMOData === 'undefined') {
        showNotification('Falta cargar supabaseClient.js o pmoData.js.', 'error');
        navigateTo('landing');
        return;
    }
    if (!PMOSupabase.isConfigValid()) {
        showNotification('Falta URL de Supabase y clave anon (eyJ…) en el archivo de config.', 'error');
        navigateTo('landing');
        return;
    }
    const initialHash = (typeof window !== 'undefined' && window.location.hash) ? window.location.hash : '';
    const likelyRecovery = /type=recovery|type%3Drecovery/i.test(initialHash);

    const sb = PMOSupabase.getSupabase();
    sb.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') {
            AppState.currentUser = null;
            AppState.requests = [];
        } else if (event === 'PASSWORD_RECOVERY') {
            ensureNotificationsContainer();
            doRenderNuevaContrasenaForm();
        }
    });

    let sessionData = (await sb.auth.getSession()).data;
    if (!sessionData.session && likelyRecovery) {
        await new Promise((r) => setTimeout(r, 500));
        sessionData = (await sb.auth.getSession()).data;
    }
    if (sessionData.session && likelyRecovery) {
        ensureNotificationsContainer();
        doRenderNuevaContrasenaForm();
        return;
    }
    if (!sessionData.session) {
        if (likelyRecovery) {
            showNotification('El enlace de recuperación expiró o no es válido. Solicite uno nuevo (¿Olvidó su contraseña?).', 'error');
        }
        navigateTo('landing');
        return;
    }
    try {
        const profile = await PMOSupabase.fetchCurrentProfile();
        const ok = await applyProfileAfterAuth(profile);
        if (!ok) {
            navigateTo('login');
            return;
        }
        await refreshRequestsFromServer();
        navigateToHome();
    } catch (e) {
        console.error(e);
        showNotification('No se pudo restaurar la sesión. Inicie sesión de nuevo.', 'error');
        navigateTo('login');
    }
}
