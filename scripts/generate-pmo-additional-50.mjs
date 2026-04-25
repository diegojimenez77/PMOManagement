/**
 * Genera data/pmo-additional-50.json: 50 solicitudes con id 51–100
 * (no solapan con pmo-demo-seed id 1–50). Estatus variados.
 * Uso: node scripts/generate-pmo-additional-50.mjs
 */
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outPath = join(root, 'data', 'pmo-additional-50.json');

const TITLES = [
    'Ciberseguridad Zero Trust en sucursales',
    'Repositorio de datos gobernado (Data Lakehouse)',
    'App móvil de inversiones con perfil de riesgo',
    'Sistema de scoring ESG para crédito corporativo',
    'Plataforma de nómina multinacional (LatAm)',
    'Monitoreo de transacciones en tiempo real (RTGS)',
    'Portal de provisión de caja para corresponsales',
    'Herramienta de simulación de estrés (CCAR local)',
    'Integración core–intercambio de información tributaria',
    'Digitalización de expedientes de crédito hipotecario',
    'Motor de ofertas personalizadas en banca móvil',
    'Herramienta de gobierno de APIs internas',
    'Actualización de firma digital y OTP para PYME',
    'Data quality para reportes de lavado de activos',
    'Sistema de gestión de límite de canje intradía',
    'Nueva pasarela de recaudo de impuestos regionales',
    'Observabilidad APM para apps críticas del banco',
    'Renovación de certificados PKI y HSM',
    'Hub de notificaciones omnicanal (push/SMS/email)',
    'Herramienta de modelado de escenarios de liquidez',
    'Modernización de depósito a plazo digital',
    'Sistema de prevención de fraude en canal telefónico',
    'Cálculo de provisión bajo NIIF 9 (IFRS 9)',
    'Billetera móvil white-label para alianzas',
    'Sistema de inventario y custodia de valores',
    'Evaluación de riesgo climático en cartera',
    'Renovación de red SD-WAN para 40 sucursales',
    'Backoffice de tarjetas prepago con monedero',
    'Plataforma de colaboración segura (M365 hardening)',
    'Catálogo de productos y pricing para banca comercial',
    'Sistema de workflow para órdenes de compra (CAPEX)',
    'Integración con buró de crédito alternativo (open data)',
    'Herramienta de cálculo de reservas técnicas (seguros)',
    'Mesa de ayuda con CMDB y ITIL',
    'Optimización de arqueo y transporte de efectivo',
    'Sondeo de opinión de clientes (VoC) post-transacción',
    'Diseño de arquitectura de recuperación DRP actualizada',
    'Libro de órdenes y matching para bonos internacionales',
    'Renovación de anti-malware y EDR en endpoints',
    'Data lineage para reportes de supervisión bancaria',
    'Herramienta de cierre contable bajo NIIF (consolidación)',
    'Experiencia unificada en cajeros con biometría',
    'Sistema de licitación inversa de servicios TI',
    'Portal de vinculación de proveedores (Know Your Supplier)',
    'Cálculo y reporting de GAR (Garantías adecuadas)',
    'Herramienta de análisis de cartera bursátil in-house',
    'Renovación de acuerdos con procesadores de tarjetas',
    'Módulo de reportes Pillar 3 (disciplina de mercado)',
    'Gobernanza de datos y catálogo de términos (Data Mesh)',
    'Programa de continuidad del negocio (BCP) digitalizado',
    'Sistema de tracking de requerimientos regulatorios 2026'
];

const statusPlan = [
    ...Array(8).fill(null).map(() => ({ status: 'Borrador', stage: 'pmo' })),
    ...Array(7).fill(null).map(() => ({ status: 'En Revisión', stage: 'pmo' })),
    ...Array(8).fill(null).map(() => ({ status: 'En Revisión', stage: 'tecnica' })),
    ...Array(7).fill(null).map(() => ({ status: 'En Revisión', stage: 'director' })),
    ...Array(8).fill(null).map(() => ({ status: 'Aprobado', stage: 'director' })),
    ...Array(4).fill(null).map(() => ({ status: 'Rechazado', stage: 'pmo' })),
    ...Array(4).fill(null).map(() => ({ status: 'Requiere Cambios', stage: 'pmo' })),
    ...Array(4).fill(null).map(() => ({ status: 'Cerrado', stage: 'director' }))
];

const AREAS = ['ti', 'finanzas', 'operaciones', 'riesgos', 'recursos_humanos', 'marketing'];
const PRIOR = ['alta', 'media', 'baja'];
const TIPOS = ['infraestructura', 'desarrollo', 'integracion', 'seguridad', 'analitica', 'transformacion'];

function ymd(d) {
    return d.toISOString().split('T')[0];
}

const start = new Date('2025-10-15T00:00:00.000Z');
const requests = [];
for (let i = 0; i < 50; i++) {
    const id = 51 + i;
    const d = new Date(start);
    d.setDate(d.getDate() - i);
    const { status, stage } = statusPlan[i];
    const hasComment = i % 3 === 0;
    const comments = [];
    if (hasComment) {
        comments.push({
            author: 'solicitantepmomanagement@gmail.com',
            date: ymd(d),
            text: 'Solicitud registrada en el portafolio de iniciativas 2025–2026 para evaluación de la PMO.'
        });
    }
    if (i % 5 === 1) {
        comments.push({
            author: 'admin@banco.com',
            date: ymd(d),
            text: 'Comentario de seguimiento de la PMO: documentar hitos y dependencias técnicas.'
        });
    }
    requests.push({
        id,
        title: TITLES[i],
        status,
        stage,
        date: ymd(d),
        applicant: 'solicitantepmomanagement@gmail.com',
        area: AREAS[i % AREAS.length],
        prioridad: PRIOR[i % PRIOR.length],
        tipoProyecto: TIPOS[i % TIPOS.length],
        necesidad:
            'La iniciativa atiende una brecha operativa o regulatoria identificada en el mapa de riesgos y en el comité de arquitectura. Se requiere inversión acotada y plan de despliegue faseado.',
        impacto:
            'Se espera mejora medible en eficiencia, control o experiencia, alineada a los OKRs de la transformación bancaria y a exigencias de la SFC.',
        presupuestoEstimado: String(120000 + (i * 17341) % 4800000),
        fechaEstimadaInicio: ymd(new Date(2026, (i % 8), 1 + (i % 20))),
        comments,
        implementation: null
    });
}

const out = {
    version: 1,
    label: '50 solicitudes adicionales (id 51–100), estatus variados',
    count: 50,
    requests
};

writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
console.log('Escrito', outPath);
