import { invoke } from '@tauri-apps/api/core';
import { normalizeCatalogProduct } from '../utils/catalogImport';
import {
  LabelTemplate,
  ProductRecord,
  PrintJob,
  TemplateSummary,
  UpsertResult,
  AuditRecord,
} from '../types';

export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

// In-memory fallback for browser preview mode (zero localStorage usage)
const inMemoryStore = {
  templates: new Map<string, LabelTemplate>(),
  templateRevisions: new Map<string, LabelTemplate>(),
  products: new Map<string, ProductRecord>(),
  jobs: new Map<string, PrintJob>(),
  audit: [] as AuditRecord[],
  kv: new Map<string, string>(),
  importBatches: [] as any[],
};

let auditIdCounter = 0;

export const api = {
  async templateList(): Promise<TemplateSummary[]> {
    if (isTauriEnvironment()) {
      return await invoke<TemplateSummary[]>('template_list');
    }
    return Array.from(inMemoryStore.templates.values()).map((t) => ({
      id: t.id,
      name: t.name,
      width_mm: t.width_mm,
      height_mm: t.height_mm,
      revision: t.revision,
      updated_at: t.updated_at,
    }));
  },

  async templateGet(id: string): Promise<LabelTemplate> {
    if (isTauriEnvironment()) {
      return await invoke<LabelTemplate>('template_get', { id });
    }
    const t = inMemoryStore.templates.get(id);
    if (!t) throw new Error(`Template not found: ${id}`);
    return t;
  },

  async templateGetRevision(id: string, revision: number): Promise<LabelTemplate> {
    if (isTauriEnvironment()) {
      return await invoke<LabelTemplate>('template_get_revision', { id, revision });
    }
    const revKey = `${id}_v${revision}`;
    const t = inMemoryStore.templateRevisions.get(revKey) || inMemoryStore.templates.get(id);
    if (!t) throw new Error(`Template not found: ${id} (rev ${revision})`);
    return t;
  },

  async templateSave(doc: LabelTemplate): Promise<LabelTemplate> {
    if (isTauriEnvironment()) {
      return await invoke<LabelTemplate>('template_save', { doc });
    }
    const existing = inMemoryStore.templates.get(doc.id);
    const revision = existing ? existing.revision + 1 : 1;
    const now = new Date().toISOString();
    const saved: LabelTemplate = {
      ...doc,
      revision,
      updated_at: now,
      created_at: doc.created_at || now,
    };
    inMemoryStore.templates.set(doc.id, saved);
    inMemoryStore.templateRevisions.set(`${saved.id}_v${saved.revision}`, saved);
    return saved;
  },

  async templateDelete(id: string): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('template_delete', { id });
      return;
    }
    inMemoryStore.templates.delete(id);
  },

  async catalogSearch(q: string, limit?: number): Promise<ProductRecord[]> {
    if (isTauriEnvironment()) {
      return await invoke<ProductRecord[]>('catalog_search', { q, limit });
    }
    const lower = q.toLowerCase();
    const all = Array.from(inMemoryStore.products.values()).filter((p) => {
      if (!lower) return true;
      const name = (p.ITEMNAME || '').toLowerCase();
      const scan = (p.PRODUCT_SCAN || p.scan || '').toLowerCase();
      const partno = (p.PARTNO || p.partno || '').toLowerCase();
      return name.includes(lower) || scan.includes(lower) || partno.includes(lower);
    });
    return limit ? all.slice(0, limit) : all;
  },

  async catalogUpsert(rows: ProductRecord[]): Promise<UpsertResult> {
    if (isTauriEnvironment()) {
      return await invoke<UpsertResult>('catalog_upsert', { rows });
    }
    let inserted = 0;
    let updated = 0;
    let rejected = 0;
    const rejections: { index: number; reason: 'not_an_object' | 'missing_id' | 'invalid_price' }[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r || typeof r !== 'object') {
        rejected++;
        rejections.push({ index: i, reason: 'not_an_object' });
        continue;
      }
      const id = String(r.id || r.PARTNO || r.PRODUCT_SCAN || '').trim();
      if (!id) {
        rejected++;
        rejections.push({ index: i, reason: 'missing_id' });
        continue;
      }
      if (r.SELLING_PRICE !== undefined && r.SELLING_PRICE !== null && (r.SELLING_PRICE as any) !== '') {
        const raw: unknown = r.SELLING_PRICE;
        let isValid = false;
        if (typeof raw === 'number') {
          isValid = !isNaN(raw) && isFinite(raw);
        } else if (typeof raw === 'string') {
          const clean = raw.replace(/[€$]/g, '').replace('FCFA', '').replace(/\s+/g, '').replace(',', '.');
          const num = parseFloat(clean);
          isValid = !isNaN(num) && isFinite(num);
        }
        if (!isValid) {
          rejected++;
          rejections.push({ index: i, reason: 'invalid_price' });
          continue;
        }
      }
      if (inMemoryStore.products.has(id)) {
        updated++;
      } else {
        inserted++;
      }
      inMemoryStore.products.set(id, { ...r, id });
    }
    return { inserted, updated, rejected, rejections };
  },

  async catalogReplaceAll(rows: ProductRecord[]): Promise<number> {
    if (isTauriEnvironment()) {
      return await invoke<number>('catalog_replace_all', { rows });
    }
    inMemoryStore.products.clear();
    let count = 0;
    for (const r of rows) {
      const id = String(r.id || r.PARTNO || r.PRODUCT_SCAN || '').trim();
      if (!id) continue;
      inMemoryStore.products.set(id, { ...r, id });
      count++;
    }
    return count;
  },

  async jobInsert(job: PrintJob): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('job_insert', { job });
      return;
    }
    inMemoryStore.jobs.set(job.id, job);
  },

  async jobList(limit?: number): Promise<PrintJob[]> {
    if (isTauriEnvironment()) {
      return await invoke<PrintJob[]>('job_list', { limit: limit ?? null });
    }
    const jobs = Array.from(inMemoryStore.jobs.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return limit ? jobs.slice(0, limit) : jobs.slice(0, 100);
  },

  async jobSetStatus(id: string, status: string, error?: string | null): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('job_set_status', { id, status, error: error ?? null });
      return;
    }
    const job = inMemoryStore.jobs.get(id);
    if (job) {
      job.status = status as any;
      job.error = error ?? null;
    }
  },

  async auditAppend(action: string, entityId: string | undefined, details: string): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('audit_append', {
        action,
        entityId: entityId ?? null,
        entity_id: entityId ?? null,
        details,
      });
      return;
    }
    auditIdCounter++;
    inMemoryStore.audit.unshift({
      id: `aud_${Date.now()}_${auditIdCounter}`,
      at: new Date().toISOString(),
      os_user: 'system',
      action,
      entity_id: entityId ?? null,
      details,
    });
  },

  async auditList(limit?: number): Promise<AuditRecord[]> {
    if (isTauriEnvironment()) {
      return await invoke<AuditRecord[]>('audit_list', { limit });
    }
    return inMemoryStore.audit.slice(0, limit || 200);
  },

  async prefsGet(key: string): Promise<string | null> {
    if (isTauriEnvironment()) {
      return await invoke<string | null>('prefs_get', { key });
    }
    return inMemoryStore.kv.get(key) ?? null;
  },

  async prefsSet(key: string, value: string): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('prefs_set', { key, value });
      return;
    }
    inMemoryStore.kv.set(key, value);
  },

  async prefsList(): Promise<Record<string, string>> {
    if (isTauriEnvironment()) {
      const entries = await invoke<[string, string][]>('prefs_list');
      return Object.fromEntries(entries);
    }
    return Object.fromEntries(inMemoryStore.kv);
  },

  async batchImportRecord(id: string, filename: string, reportJson: string): Promise<void> {
    if (isTauriEnvironment()) {
      await invoke('batch_import_record', {
        id,
        filename,
        reportJson,
        report_json: reportJson,
      });
      return;
    }
    try {
      const parsed = JSON.parse(reportJson);
      inMemoryStore.importBatches.unshift({
        id,
        filename,
        report_json: reportJson,
        created_at: new Date().toISOString(),
        ...parsed,
      });
    } catch {
      inMemoryStore.importBatches.unshift({
        id,
        filename,
        report_json: reportJson,
        created_at: new Date().toISOString(),
      });
    }
  },

  async batchImportList(limit?: number): Promise<any[]> {
    if (isTauriEnvironment()) {
      return await invoke<any[]>('batch_import_list', { limit: limit ?? null });
    }
    return limit ? inMemoryStore.importBatches.slice(0, limit) : inMemoryStore.importBatches.slice(0, 100);
  },

  async exportDatabase(): Promise<string> {
    const summaries = await api.templateList();
    const fullTemplates = await Promise.all(
      summaries.map(async (s) => {
        try {
          return await api.templateGet(s.id);
        } catch {
          return null;
        }
      })
    );
    const validTemplates = fullTemplates.filter((t): t is LabelTemplate => t !== null);
    const allRows = Number.MAX_SAFE_INTEGER;
    const products = await api.catalogSearch('', allRows);
    const jobs = await api.jobList(allRows);
    const audit = await api.auditList(allRows);
    const importBatches = await api.batchImportList(allRows);
    const preferences = await api.prefsList();
    const dump = {
      version: 1,
      exported_at: new Date().toISOString(),
      templates: validTemplates,
      products,
      jobs,
      audit,
      import_batches: importBatches,
      preferences,
    };
    return JSON.stringify(dump, null, 2);
  },

  async importDatabase(jsonStr: string): Promise<{
    templates: number;
    products: number;
    jobs: number;
    audit: number;
    import_batches: number;
    preferences: number;
  }> {
    const data = JSON.parse(jsonStr);
    if (!data || data.version !== 1 || typeof data !== 'object') {
      throw new Error('Unsupported database backup format.');
    }

    const current = JSON.parse(await api.exportDatabase());
    const backup = {
      ...current,
      ...data,
      templates: Array.isArray(data.templates) ? data.templates : current.templates,
      products: Array.isArray(data.products) ? data.products : current.products,
      jobs: Array.isArray(data.jobs) ? data.jobs : current.jobs,
      audit: Array.isArray(data.audit) ? data.audit : current.audit,
      import_batches: Array.isArray(data.import_batches) ? data.import_batches : current.import_batches,
      preferences: data.preferences && typeof data.preferences === 'object' ? data.preferences : current.preferences,
    };

    const templates = backup.templates.map((template: any) => {
      if (!template || typeof template !== 'object' || !template.id || !template.name) {
        throw new Error('Backup contains a template without an id or name.');
      }
      return template as LabelTemplate;
    });
    const products = backup.products.map((product: any) => {
      if (!product || typeof product !== 'object') throw new Error('Backup contains an invalid product.');
      return normalizeCatalogProduct(product as ProductRecord);
    });
    const jobs = backup.jobs as PrintJob[];
    const audit = backup.audit as AuditRecord[];
    const importBatches = backup.import_batches as any[];
    const preferences = backup.preferences as Record<string, string>;
    if (jobs.some((job: PrintJob) => !job?.id) || audit.some((record: AuditRecord) => !record?.id) || importBatches.some((batch: any) => !batch?.id)) {
      throw new Error('Backup contains a history entry without an id.');
    }
    if (!preferences || Object.values(preferences).some((value) => typeof value !== 'string')) {
      throw new Error('Backup contains invalid preferences.');
    }

    if (isTauriEnvironment()) {
      return await invoke<{
        templates: number;
        products: number;
        jobs: number;
        audit: number;
        import_batches: number;
        preferences: number;
      }>('database_restore', {
        backup: { ...backup, templates, products, jobs, audit, import_batches: importBatches },
      });
    }

    const uniqueTemplates = new Map<string, LabelTemplate>();
    templates.forEach((template) => {
      if (uniqueTemplates.has(template.id)) throw new Error(`Duplicate template id: ${template.id}`);
      uniqueTemplates.set(template.id, template);
    });
    const uniqueProducts = new Map<string, ProductRecord>();
    products.forEach((product) => {
      if (uniqueProducts.has(product.id)) throw new Error(`Duplicate product id: ${product.id}`);
      uniqueProducts.set(product.id, product);
    });

    inMemoryStore.templates.clear();
    inMemoryStore.templateRevisions.clear();
    uniqueTemplates.forEach((template) => {
      inMemoryStore.templates.set(template.id, template);
      inMemoryStore.templateRevisions.set(`${template.id}_v${template.revision}`, template);
    });
    inMemoryStore.products.clear();
    uniqueProducts.forEach((product) => inMemoryStore.products.set(product.id, product));
    inMemoryStore.jobs.clear();
    jobs.forEach((job) => inMemoryStore.jobs.set(job.id, job));
    inMemoryStore.audit = audit;
    inMemoryStore.importBatches = importBatches;
    inMemoryStore.kv.clear();
    Object.entries(preferences).forEach(([key, value]) => inMemoryStore.kv.set(key, value));

    return {
      templates: templates.length,
      products: products.length,
      jobs: jobs.length,
      audit: audit.length,
      import_batches: importBatches.length,
      preferences: Object.keys(preferences).length,
    };
  },

  async backupDb(destPath: string): Promise<string> {
    if (isTauriEnvironment()) {
      return await invoke<string>('backup_db', { destPath });
    }
    return destPath;
  },

  async restoreDb(sourcePath: string): Promise<string> {
    if (isTauriEnvironment()) {
      return await invoke<string>('restore_db', { sourcePath });
    }
    return 'Base locale restaurée';
  },
};


