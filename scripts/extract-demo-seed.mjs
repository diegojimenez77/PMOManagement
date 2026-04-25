/**
 * Genera `data/pmo-demo-seed.json` desde el `app.js` de un commit con el dataset embebido.
 * Uso: node scripts/extract-demo-seed.mjs [rev]
 *   rev por defecto: HEAD (última versión en git con el IIFE de solicitudes)
 */
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const rev = process.argv[2] || 'HEAD';
const appJs = execSync(`git show ${rev}:assets/js/app.js`, {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    cwd: root
});

const start = appJs.indexOf('    requests: (() => {');
if (start === -1) {
    throw new Error('No se encontró requests: (() => { en app.js de ' + rev);
}
const bodyStart = appJs.indexOf('const A =', start);
if (bodyStart === -1) {
    throw new Error('Cuerpo del IIFE no encontrado');
}
const endMarker = '\n    })(),';
const end = appJs.indexOf(endMarker, start);
if (end === -1) {
    throw new Error('No se encontró cierre })(), del IIFE');
}
const iifeBody = appJs.slice(bodyStart, end);

const statusStart = appJs.indexOf('const STATUS = {');
if (statusStart === -1) {
    throw new Error('const STATUS no encontrado');
}
const m = /const STATUS = \{[\s\S]*?\n\};\n\nconst STAGE = \{[\s\S]*?\n\};/;
const prem = m.exec(appJs);
if (!prem) {
    throw new Error('No se pudo extraer STATUS y STAGE con regex');
}
const prelude = prem[0];

const pre2 = [
    "const STAGE_ORDER = [ 'pmo', 'tecnica', 'director' ];",
    'const LIFECYCLE_STEPS = [];',
    'const IMPL_STAGES_CONFIG = [];',
    "const IMPL_STAGE = { INICIACION: 'iniciacion', ANALISIS: 'analisis', CONSTRUCCION: 'construccion', PRUEBAS: 'pruebas', GO_LIVE: 'go_live', CIERRE: 'cierre' };",
    "const IMPL_STAGE_ORDER = ['iniciacion','analisis','construccion','pruebas','go_live','cierre'];"
].join('\n');

const code = `${prelude}\n${pre2}\n${iifeBody}`;
const requests = new Function(code)();
if (!Array.isArray(requests)) {
    throw new Error('Resultado no es un array');
}
mkdirSync(join(root, 'data'), { recursive: true });
const out = join(root, 'data', 'pmo-demo-seed.json');
writeFileSync(
    out,
    JSON.stringify({ version: 1, rev, count: requests.length, requests }, null, 0),
    'utf8'
);
console.log('Escrito', out, 'solicitudes:', requests.length);
