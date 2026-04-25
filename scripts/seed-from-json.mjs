/**
 * Carga `data/pmo-demo-seed.json` con la clave de servicio (bypasses RLS).
 * Requisitos: usuarios en Auth con los correos de `applicant` (p. ej. solicitante, admin, pm) y
 * perfiles; el trigger crea perfiles al dar de alta usuarios.
 *
 *   set SUPABASE_URL=https://....supabase.co
 *   set SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *   npm run seed
 *   npm run seed:extra   (carga data/pmo-additional-50.json, ids 51–100)
 *   node scripts/seed-from-json.mjs ruta/relativa/desde/raiz.json
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, isAbsolute } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const argData = process.argv[2];
const dataPath = argData && isAbsolute(argData)
    ? argData
    : join(root, argData || join('data', 'pmo-demo-seed.json'));
const aliasPath = join(root, 'data', 'seed-email-aliases.json');

function loadDotEnv() {
    const p = join(root, '.env');
    if (!existsSync(p)) {
        return;
    }
    for (const line of readFileSync(p, 'utf8').split('\n')) {
        const t = line.trim();
        if (!t || t.startsWith('#')) {
            continue;
        }
        const i = t.indexOf('=');
        if (i === -1) {
            continue;
        }
        const k = t.slice(0, i).trim();
        let v = t.slice(i + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.slice(1, -1);
        }
        if (process.env[k] === undefined) {
            process.env[k] = v;
        }
    }
}
loadDotEnv();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
    console.error('Defina SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}
if (!existsSync(dataPath)) {
    console.error('No existe', dataPath, '— ejecute: npm run extract-seed');
    process.exit(1);
}

const raw = readFileSync(dataPath, 'utf8');
const { requests } = JSON.parse(raw);

let emailAliases = {};
if (existsSync(aliasPath)) {
    emailAliases = JSON.parse(readFileSync(aliasPath, 'utf8'));
}
function mapDemoEmail(demo) {
    if (!demo) {
        return demo;
    }
    const t = String(demo).trim();
    return emailAliases[t] || t;
}
if (!Array.isArray(requests) || !requests.length) {
    console.log('Nada que importar (requests vacío).');
    process.exit(0);
}

const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
});

const { data: profiles, error: pe } = await supabase
    .from('profiles')
    .select('id, email');
if (pe) {
    throw pe;
}
const emailToId = Object.fromEntries(
    (profiles || []).map((p) => [String(p.email).toLowerCase(), p.id])
);
const needEmails = new Set();
requests.forEach((r) => {
    if (r.applicant) {
        needEmails.add(mapDemoEmail(r.applicant));
    }
    (r.comments || []).forEach((c) => {
        if (c.author) {
            needEmails.add(mapDemoEmail(c.author));
        }
    });
});
for (const e of needEmails) {
    if (!e) {
        continue;
    }
    const k = String(e).toLowerCase();
    if (!emailToId[k]) {
        console.error('Falta el usuario (Auth + perfil) para el correo resuelto:', e);
        console.error('Ajuste data/seed-email-aliases.json para mapear correos de demo a correos reales del proyecto.');
        process.exit(1);
    }
}
function uidForDemoEmail(demo) {
    const resolved = String(mapDemoEmail(demo) || '').toLowerCase();
    return emailToId[resolved] || null;
}

const requestRows = requests.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    stage: r.stage,
    request_date: r.date,
    applicant_id: uidForDemoEmail(r.applicant),
    area: r.area,
    prioridad: r.prioridad,
    tipo_proyecto: r.tipoProyecto,
    necesidad: r.necesidad,
    impacto: r.impacto,
    presupuesto_estimado: r.presupuestoEstimado != null ? String(r.presupuestoEstimado) : null,
    fecha_estimada_inicio: r.fechaEstimadaInicio,
    implementation: r.implementation
}));

const seedIds = requests.map((r) => r.id);
const { error: delC } = await supabase
    .from('request_comments')
    .delete()
    .in('request_id', seedIds);
if (delC) {
    throw delC;
}

const { error: re } = await supabase
    .from('requests')
    .upsert(requestRows, { onConflict: 'id' });
if (re) {
    throw re;
}
console.log('Solicitudes insertadas/actualizadas:', requestRows.length);

const commentInserts = [];
for (const r of requests) {
    if (!r.comments || !r.comments.length) {
        continue;
    }
    for (const c of r.comments) {
        const authorId = c.author && uidForDemoEmail(c.author) ? uidForDemoEmail(c.author) : null;
        commentInserts.push({
            request_id: r.id,
            author_id: authorId,
            author_email: c.author,
            comment_date: c.date,
            text: c.text
        });
    }
}
if (commentInserts.length) {
    const { error: ce } = await supabase.from('request_comments').insert(commentInserts);
    if (ce) {
        throw ce;
    }
    console.log('Comentarios insertados:', commentInserts.length);
}

console.log(
    'Opcional en SQL Editor: select setval(\'requests_id_seq\', (select coalesce(max(id),1) from public.requests));'
);
console.log('Listo.');
