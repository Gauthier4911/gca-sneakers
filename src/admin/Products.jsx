import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import { Card, PageTitle, Toggle } from './ui';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/format';
import { removeByUrl } from './storage';
import { useSettings } from '../context/SettingsContext';

export function adminError(t, e) {
  const msg = e?.message ?? '';
  const code = ['PRODUCT_NEEDS_4_IMAGES'].find((c) => msg.includes(c));
  return code ? t(`admin.products.errors.${code}`) : t('admin.common.error', { message: msg });
}

export default function Products() {
  const { t, i18n } = useTranslation();
  const { settings } = useSettings();
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const lang = i18n.language === 'en' ? 'en' : 'fr';

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('products')
      .select('id, slug, name_fr, name_en, gender, price, promo_price, is_active, is_featured, images:product_images(url, position), variants:product_variants(stock)')
      .order('created_at', { ascending: false });
    if (error) toast.error(adminError(t, error)); else setRows(data);
  }, [t]);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => (rows ?? []).filter((r) => `${r.name_fr} ${r.name_en} ${r.slug}`.toLowerCase().includes(q.toLowerCase())), [rows, q]);

  const patch = async (row, values) => {
    const { error } = await supabase.from('products').update(values).eq('id', row.id);
    if (error) toast.error(adminError(t, error)); else { toast.success(t('admin.common.saved')); load(); }
  };
  const remove = async (row) => {
    if (!window.confirm(t('admin.common.confirmDelete', { name: row[`name_${lang}`] }))) return;
    const { error } = await supabase.from('products').delete().eq('id', row.id);
    if (error) { toast.error(adminError(t, error)); return; }
    await Promise.all(row.images.map((i) => removeByUrl(i.url)));
    toast.success(t('admin.products.deleted')); load();
  };

  return (
    <>
      <PageTitle actions={<Button to="/admin/produits/nouveau" size="sm"><Plus className="h-4 w-4" aria-hidden /> {t('admin.products.new')}</Button>}>
        {t('admin.products.title')}
      </PageTitle>
      <Card>
        <label className="relative mb-4 block max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden />
          <span className="sr-only">{t('admin.common.search')}</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('admin.common.search')}
            className="w-full rounded-xl border-2 border-forest/15 py-2 pl-9 pr-3 focus:border-emerald focus:outline-none" />
        </label>
        {!rows ? <div className="h-40 animate-pulse rounded-2xl bg-cream" /> : filtered.length === 0 ? <p className="text-ink-soft">{t('admin.products.empty')}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-ink-soft">
                <tr><th className="py-2" colSpan={2}>{t('admin.products.title')}</th><th>{t('admin.products.price')}</th><th>{t('admin.products.stock')}</th>
                  <th>{t('admin.products.active')}</th><th><Star className="h-4 w-4" aria-label={t('admin.products.featured')} /></th><th className="text-right">{t('admin.common.actions')}</th></tr>
              </thead>
              <tbody className="divide-y divide-forest/10">
                {filtered.map((r) => {
                  const img = [...r.images].sort((a, b) => a.position - b.position)[0];
                  const stock = r.variants.reduce((n, v) => n + v.stock, 0);
                  return (
                    <tr key={r.id}>
                      <td className="w-16 py-3">{img ? <img src={img.url} alt="" className="h-12 w-12 rounded-xl bg-cream object-cover" /> : <span className="block h-12 w-12 rounded-xl bg-cream" />}</td>
                      <td className="pr-3"><Link to={`/admin/produits/${r.id}`} className="font-semibold text-forest hover:text-emerald">{r[`name_${lang}`]}</Link>
                        <span className="block text-xs text-ink-soft">{t(`enums.gender.${r.gender}`)} · {t('admin.products.images')} {r.images.length}/4</span></td>
                      <td>{formatPrice(r.promo_price ?? r.price, lang, settings.currency)}</td>
                      <td><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${stock === 0 ? 'bg-red-100 text-red-800' : stock <= 5 ? 'bg-gold/20' : 'bg-mint-light'}`}>{stock}</span></td>
                      <td><Toggle checked={r.is_active} label={r.is_active ? t("admin.products.active") : t("admin.products.inactive")} onChange={(v) => patch(r, { is_active: v })} /></td>
                      <td><Toggle checked={r.is_featured} label={t('admin.products.featured')} onChange={(v) => patch(r, { is_featured: v })} /></td>
                      <td className="text-right">
                        <Link to={`/admin/produits/${r.id}`} aria-label={`${t('admin.common.edit')} ${r[`name_${lang}`]}`} className="inline-grid h-9 w-9 place-items-center rounded-full hover:bg-cream"><Pencil className="h-4 w-4" aria-hidden /></Link>
                        <button type="button" onClick={() => remove(r)} aria-label={`${t('admin.common.delete')} ${r[`name_${lang}`]}`} className="inline-grid h-9 w-9 place-items-center rounded-full text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" aria-hidden /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
