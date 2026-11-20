import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Card, Field, PageTitle } from './ui';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { slugify } from './ProductForm';

const EMPTY = { slug: '', name_fr: '', name_en: '', position: 0 };

export default function Categories() {
  const { t, i18n } = useTranslation();
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null); // id | 'new'
  const [form, setForm] = useState(EMPTY);
  const lang = i18n.language === 'en' ? 'en' : 'fr';

  const load = useCallback(async () => {
    const { data } = await supabase.from('categories').select('id, slug, name_fr, name_en, position, products(count)').order('position');
    setRows(data ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const start = (row) => { setEditing(row?.id ?? 'new'); setForm(row ? { slug: row.slug, name_fr: row.name_fr, name_en: row.name_en, position: row.position } : { ...EMPTY, position: (rows?.length ?? 0) + 1 }); };
  const save = async () => {
    const values = { ...form, slug: slugify(form.slug || form.name_fr), position: Number(form.position) || 0 };
    if (!values.name_fr.trim() || !values.name_en.trim() || !values.slug) { toast.error(t('admin.products.errors.required')); return; }
    const { error } = editing === 'new' ? await supabase.from('categories').insert(values) : await supabase.from('categories').update(values).eq('id', editing);
    if (error) { toast.error(error.code === '23505' ? t('admin.products.errors.slugTaken') : t('admin.common.error', { message: error.message })); return; }
    toast.success(t('admin.common.saved')); setEditing(null); load();
  };
  const remove = async (row) => {
    if (!window.confirm(t('admin.common.confirmDelete', { name: row[`name_${lang}`] }))) return;
    const { error } = await supabase.from('categories').delete().eq('id', row.id);
    if (error) toast.error(t('admin.common.error', { message: error.message })); else { toast.success(t('admin.categories.deleted')); load(); }
  };

  const formRow = (
    <div className="grid gap-3 rounded-2xl bg-cream p-4 md:grid-cols-[1fr_1fr_1fr_90px_auto] md:items-end">
      <Field label={t('admin.categories.name_fr')} value={form.name_fr} onChange={(e) => setForm((f) => ({ ...f, name_fr: e.target.value, ...(editing === 'new' ? { slug: slugify(e.target.value) } : {}) }))} />
      <Field label={t('admin.categories.name_en')} value={form.name_en} onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))} />
      <Field label={t('admin.categories.slug')} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))} />
      <Field label={t('admin.categories.position')} type="number" value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} />
      <div className="flex gap-2">
        <button type="button" onClick={save} aria-label={t('admin.common.save')} className="grid h-11 w-11 place-items-center rounded-full bg-emerald text-white"><Check className="h-5 w-5" aria-hidden /></button>
        <button type="button" onClick={() => setEditing(null)} aria-label={t('admin.common.cancel')} className="grid h-11 w-11 place-items-center rounded-full bg-white text-forest"><X className="h-5 w-5" aria-hidden /></button>
      </div>
    </div>
  );

  return (
    <>
      <PageTitle actions={<Button size="sm" onClick={() => start(null)}><Plus className="h-4 w-4" aria-hidden /> {t('admin.categories.new')}</Button>}>{t('admin.categories.title')}</PageTitle>
      <Card>
        {editing === 'new' && <div className="mb-4">{formRow}</div>}
        {!rows ? <div className="h-32 animate-pulse rounded-2xl bg-cream" /> : (
          <ul className="divide-y divide-forest/10">
            {rows.map((r) => (
              <li key={r.id} className="py-3">
                {editing === r.id ? formRow : (
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest text-sm font-bold text-gold">{r.position}</span>
                    <span className="flex-1">
                      <span className="block font-semibold text-forest">{r[`name_${lang}`]}</span>
                      <span className="text-xs text-ink-soft">/{r.slug} · {t('admin.categories.products', { count: r.products?.[0]?.count ?? 0 })}</span>
                    </span>
                    <button type="button" onClick={() => start(r)} aria-label={`${t('admin.common.edit')} ${r[`name_${lang}`]}`} className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream"><Pencil className="h-4 w-4" aria-hidden /></button>
                    <button type="button" onClick={() => remove(r)} aria-label={`${t('admin.common.delete')} ${r[`name_${lang}`]}`} className="grid h-9 w-9 place-items-center rounded-full text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" aria-hidden /></button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
