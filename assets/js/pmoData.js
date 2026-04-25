/* global supabase */
/**
 * Capa de datos: solicitudes, comentarios, documentos (Storage + request_document_files).
 * Depende de PMOSupabase. Usa `window.IMPL_STAGE` / `window.IMPL_STAGE_ORDER` (definidos en
 * app.js antes de cargar este script) al fusionar metadatos de `request_document_files`.
 */
(function (global) {
    'use strict';

    const BUCKET = 'documents';

    function getSb() {
        return global.PMOSupabase.getSupabase();
    }

    async function fetchProfileMap(ids) {
        if (!ids || !ids.length) {
            return {};
        }
        const sb = getSb();
        const { data, error } = await sb
            .from('profiles')
            .select('id, email')
            .in('id', ids);
        if (error) {
            throw error;
        }
        const m = {};
        (data || []).forEach((p) => {
            m[p.id] = p.email;
        });
        return m;
    }

    function mergeStorageFilesIntoRequest(req, fileRows) {
        if (!fileRows || !fileRows.length) {
            return;
        }
        const stageOrder = global.IMPL_STAGE_ORDER || [
            'iniciacion', 'analisis', 'construccion', 'pruebas', 'go_live', 'cierre'
        ];
        if (!req.implementation) {
            const today = new Date().toISOString().split('T')[0];
            const emptyDocs = Object.fromEntries(
                stageOrder.map((k) => [k, []])
            );
            const ini = global.IMPL_STAGE ? global.IMPL_STAGE.INICIACION : 'iniciacion';
            req.implementation = {
                stage: ini,
                startedAt: today,
                assignedPM: req.assignedPM || 'pm@banco.com',
                stageHistory: [],
                documents: emptyDocs,
                comments: []
            };
        }
        if (!req.implementation.documents) {
            req.implementation.documents = Object.fromEntries(
                stageOrder.map((k) => [k, []])
            );
        }
        fileRows
            .filter((f) => f.kind === 'implementation' && f.impl_stage)
            .forEach((f) => {
                const stage = f.impl_stage;
                if (!req.implementation.documents[stage]) {
                    req.implementation.documents[stage] = [];
                }
                const already = req.implementation.documents[stage].some(
                    (d) => d.storagePath && d.storagePath === f.storage_path
                );
                if (already) {
                    return;
                }
                const uploader = f._uploaderEmail || f.author_email || '';
                req.implementation.documents[stage].push({
                    id: f.id,
                    tag: f.tag,
                    name: f.file_name,
                    format: mimeToFormat(f.mime_type),
                    uploadedBy: uploader,
                    uploadedAt: f.created_at ? f.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
                    fromStorage: true,
                    storagePath: f.storage_path
                });
            });
    }

    function mimeToFormat(mime) {
        if (!mime) {
            return 'otro';
        }
        if (mime.indexOf('pdf') !== -1) {
            return 'pdf';
        }
        if (mime.indexOf('word') !== -1 || mime.indexOf('msword') !== -1) {
            return 'word';
        }
        if (mime.indexOf('excel') !== -1 || mime.indexOf('spreadsheet') !== -1) {
            return 'excel';
        }
        if (mime.indexOf('presentation') !== -1 || mime.indexOf('powerpoint') !== -1) {
            return 'ppt';
        }
        return 'otro';
    }

    function mapRowToRequest(row, profileById, comments, fileRows) {
        const app = {
            id: row.id,
            title: row.title,
            status: row.status,
            stage: row.stage,
            date: row.request_date,
            applicant: profileById[row.applicant_id] || '',
            applicantId: row.applicant_id,
            area: row.area,
            prioridad: row.prioridad,
            tipoProyecto: row.tipo_proyecto,
            necesidad: row.necesidad,
            impacto: row.impacto,
            presupuestoEstimado: row.presupuesto_estimado != null ? String(row.presupuesto_estimado) : '0',
            fechaEstimadaInicio: row.fecha_estimada_inicio,
            implementation: row.implementation ? JSON.parse(JSON.stringify(row.implementation)) : null,
            comments: (comments || []).map((c) => ({
                author: c.author_email || '—',
                date: c.comment_date,
                text: c.text,
                _commentId: c.id
            }))
        };
        mergeStorageFilesIntoRequest(app, fileRows);
        return app;
    }

    function requestToColumns(req, applicantUuid) {
        return {
            title: req.title,
            status: req.status,
            stage: req.stage,
            request_date: req.date || null,
            applicant_id: applicantUuid,
            area: req.area,
            prioridad: req.prioridad,
            tipo_proyecto: req.tipoProyecto,
            necesidad: req.necesidad,
            impacto: req.impacto,
            presupuesto_estimado: req.presupuestoEstimado != null ? String(req.presupuestoEstimado) : null,
            fecha_estimada_inicio: req.fechaEstimadaInicio || null,
            implementation: req.implementation || null
        };
    }

    async function fetchAllRequests() {
        const sb = getSb();
        const { data: rows, error } = await sb
            .from('requests')
            .select('*')
            .order('id', { ascending: true });
        if (error) {
            throw error;
        }
        if (!rows || !rows.length) {
            return [];
        }
        const applicantIds = [...new Set(rows.map((r) => r.applicant_id))];
        const profMap = await fetchProfileMap(applicantIds);
        const requestIds = rows.map((r) => r.id);
        const { data: comRows } = await sb
            .from('request_comments')
            .select('id, request_id, author_id, author_email, comment_date, text, created_at')
            .in('request_id', requestIds);
        const { data: fileRows } = await sb
            .from('request_document_files')
            .select('*')
            .in('request_id', requestIds);
        const uploaderIds = [...new Set((fileRows || []).map((f) => f.uploaded_by))];
        const uploaderMap = await fetchProfileMap(uploaderIds);
        (fileRows || []).forEach((f) => {
            f._uploaderEmail = uploaderMap[f.uploaded_by] || '';
        });
        const commentsByRid = {};
        (comRows || []).forEach((c) => {
            if (!commentsByRid[c.request_id]) {
                commentsByRid[c.request_id] = [];
            }
            commentsByRid[c.request_id].push(c);
        });
        (Object.keys(commentsByRid)).forEach((k) => {
            commentsByRid[k].sort((a, b) => (a.id || 0) - (b.id || 0));
        });
        const filesByRid = {};
        (fileRows || []).forEach((f) => {
            if (!filesByRid[f.request_id]) {
                filesByRid[f.request_id] = [];
            }
            filesByRid[f.request_id].push(f);
        });
        return rows.map((row) => mapRowToRequest(
            row,
            profMap,
            commentsByRid[row.id] || [],
            filesByRid[row.id] || []
        ));
    }

    function syncRequestInArray(updated) {
        const idx = global.AppState.requests.findIndex((r) => r.id === updated.id);
        if (idx !== -1) {
            global.AppState.requests[idx] = updated;
        } else {
            global.AppState.requests.push(updated);
        }
    }

    async function insertRequest(req, applicantUuid) {
        const sb = getSb();
        const row = requestToColumns(req, applicantUuid);
        const { data, error } = await sb
            .from('requests')
            .insert([row])
            .select()
            .single();
        if (error) {
            throw error;
        }
        const prof = await fetchProfileMap([applicantUuid]);
        const app = mapRowToRequest(data, prof, [], []);
        syncRequestInArray(app);
        return app;
    }

    async function updateRequest(req) {
        const sb = getSb();
        if (!req.id) {
            throw new Error('Solicitud sin id no actualizable');
        }
        const applicantId = req.applicantId
            || (global.AppState.currentUser && global.AppState.currentUser.id);
        const rest = requestToColumns(req, applicantId);
        const { data, error } = await sb
            .from('requests')
            .update(rest)
            .eq('id', req.id)
            .select()
            .single();
        if (error) {
            throw error;
        }
        const { data: comRows } = await sb
            .from('request_comments')
            .select('id, request_id, author_id, author_email, comment_date, text, created_at')
            .eq('request_id', data.id);
        const { data: fileRows } = await sb
            .from('request_document_files')
            .select('*')
            .eq('request_id', data.id);
        const profMap = await fetchProfileMap([data.applicant_id]);
        const app = mapRowToRequest(
            data,
            profMap,
            comRows || [],
            fileRows || []
        );
        syncRequestInArray(app);
        return app;
    }

    async function insertRequestComment(requestId, text, dateStr) {
        const profile = await global.PMOSupabase.fetchCurrentProfile();
        if (!profile) {
            throw new Error('Sin perfil de usuario');
        }
        const d = dateStr || new Date().toISOString().split('T')[0];
        const sb = getSb();
        const { data, error } = await sb
            .from('request_comments')
            .insert([{
                request_id: requestId,
                author_id: profile.id,
                author_email: profile.email,
                comment_date: d,
                text: text
            }])
            .select()
            .single();
        if (error) {
            throw error;
        }
        return data;
    }

    async function uploadImplementationFile(req, stageKey, fileInput, tag) {
        const file = fileInput && fileInput.files && fileInput.files[0];
        if (!file) {
            throw new Error('Seleccione un archivo.');
        }
        const maxBytes = 52428800;
        if (file.size > maxBytes) {
            throw new Error('El archivo supera el límite de 50 MiB.');
        }
        const profile = await global.PMOSupabase.fetchCurrentProfile();
        if (!profile) {
            throw new Error('Sin perfil de usuario');
        }
        const sb = getSb();
        const uuid = (global.crypto && global.crypto.randomUUID)
            ? global.crypto.randomUUID()
            : 'id-' + String(Date.now());
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_');
        const path = req.id + '/' + uuid + '_' + safeName;
        const { error: upError } = await sb.storage
            .from(BUCKET)
            .upload(path, file, { upsert: false, contentType: file.type || null });
        if (upError) {
            throw upError;
        }
        const { data: fileRow, error: insError } = await sb
            .from('request_document_files')
            .insert([{
                request_id: req.id,
                kind: 'implementation',
                impl_stage: stageKey,
                tag: tag,
                storage_path: path,
                file_name: file.name,
                mime_type: file.type || null,
                size_bytes: file.size,
                uploaded_by: profile.id
            }])
            .select()
            .single();
        if (insError) {
            throw insError;
        }
        fileRow.author_email = profile.email;
        if (!req.implementation) {
            const today = new Date().toISOString().split('T')[0];
            const emptyDocs = Object.fromEntries(
                global.IMPL_STAGE_ORDER.map((k) => [k, []])
            );
            req.implementation = {
                stage: global.IMPL_STAGE.INICIACION,
                startedAt: today,
                assignedPM: global.AppState.currentUser.email,
                stageHistory: [{ stage: global.IMPL_STAGE.INICIACION, movedAt: today, movedBy: global.AppState.currentUser.email }],
                documents: emptyDocs,
                comments: []
            };
        }
        if (!req.implementation.documents[stageKey]) {
            req.implementation.documents[stageKey] = [];
        }
        const doc = {
            id: fileRow.id,
            tag: tag,
            name: file.name,
            format: mimeToFormat(file.type),
            uploadedBy: profile.email,
            uploadedAt: new Date().toISOString().split('T')[0],
            fromStorage: true,
            storagePath: path
        };
        req.implementation.documents[stageKey].push(doc);
        await updateRequest(req);
        return { path, fileRow, doc };
    }

    async function getSignedFileUrl(storagePath) {
        const sb = getSb();
        const { data, error } = await sb.storage
            .from(BUCKET)
            .createSignedUrl(storagePath, 3600);
        if (error) {
            throw error;
        }
        return data.signedUrl;
    }

    async function fetchAllProfiles() {
        const sb = getSb();
        const { data, error } = await sb
            .from('profiles')
            .select('id, email, full_name, role, is_active, requested_role, created_at')
            .order('email', { ascending: true });
        if (error) {
            throw error;
        }
        return data || [];
    }

    async function updateProfileAsAdmin(id, fields) {
        const sb = getSb();
        const { data, error } = await sb
            .from('profiles')
            .update(fields)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            throw error;
        }
        return data;
    }

    global.PMOData = {
        fetchAllRequests,
        insertRequest,
        updateRequest,
        insertRequestComment,
        uploadImplementationFile,
        getSignedFileUrl,
        fetchAllProfiles,
        updateProfileAsAdmin
    };
}(typeof window !== 'undefined' ? window : globalThis));
