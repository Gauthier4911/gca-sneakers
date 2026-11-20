import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowLeft, Box, ImagePlus, Plus, Trash2, X } from 'lucide-react';
import { Card, Field, PageTitle, Toggle } from './ui';
import Button from '../components/ui/Button';
import PageLoader from '../components/ui/PageLoader';
import { supabase } from '../lib/supabase';
import { formatSize } from '../lib/format';
import { IMAGE_MAX, IMAGE_TYPES, MODEL_MAX, removeByUrl, uploadModel, uploadProductImage } from './storage';
import { adminError } from './Products';
import { useSettings } from '../context/SettingsContext';

const GENDERS = ['men', 'women', 'kids'];
const TYPES = ['sneakers', 'city', 'sport', 'boots', 'sandals', 'formal', 'school', 'slippers'];
const USAGES = ['daily', 'work', 'sport', 'ceremony', 'hiking'];
const COLORS = ['black', 'white', 'grey', 'beige', 'brown', 'blue', 'red', 'pink', 'green', 'yellow', 'orange', 'purple', 'multi'];
const MATERIALS = ['leather', 'synthetic', 'canvas', 'suede', 'mesh', 'textile', 'rubber'];
const EMPTY = {
  name_fr: '', name_en: '', slug: '', description_fr: '', description_en: '', category_id: '', gender: 'men', shoe_type: 'sneakers',
  usages: [], color: '', material: '', price: '', promo_price: '', is_featured: false, is_active: false, model_3d_url: null,
};

export const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

export default function ProductForm() {
  const { id } = useParams();
  const isNew = !id;
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const lang = i18n.language === 'en' ? 'en' : 'fr';
  const [form, setForm] = useState(EMPTY);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [images, setImages] = useState([null, null, null, null]); // { url } existant ou { file, preview } à envoyer
  const [model, setModel] = useState(null); // { file } à envoyer | 'remove'
  const [variants, setVariants] = useState([{ size: '', stock: 0 }]);
  const [range, setRange] = useState({ from: '', to: '' });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    supabase.from('categories').select('id, name_fr, name_en').order('position').then(({ data }) => setCategories(data ?? []));
    if (isNew) return;
    supabase.from('products').select('*, images:product_images(url, position), variants:product_variants(size, stock)').eq('id', id).maybeSingle()
      .then(({ data }) => {
        if (!data) { navigate('/admin/produits'); return; }
        const { images: imgs, variants: vars, ...p } = data;
        setForm({ ...EMPTY, ...p, category_id: p.category_id ?? '', color: p.color ?? '', material: p.material ?? '', promo_price: p.promo_price ?? '' });
        const slots = [null, null, null, null];
        imgs.forEach((i) => { slots[i.position - 1] = { url: i.url }; });
        setImages(slots);
        setVariants(vars.map((v) => ({ size: String(Number(v.size)), stock: v.stock })).sort((a, b) => a.size - b.size));
        setLoading(false);
      });
  }, [id, isNew, navigate]);

  // Libère les aperçus locaux
  useEffect(() => () => images.forEach((i) => i?.preview && URL.revokeObjectURL(i.preview)), [images]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v, ...(k === 'name_fr' && !slugTouched ? { slug: slugify(v) } : {}) }));
  const imageCount = images.filter(Boolean).length;
  const dupSize = useMemo(() => {
    const seen = new Set();
    return variants.map((v) => Number(v.size)).find((s) => s && (seen.has(s) || !seen.add(s)));
  }, [variants]);

  const pickImage = (slot, file) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) { toast.error(t('admin.products.image.badType')); return; }
    if (file.size > IMAGE_MAX) { toast.error(t('admin.products.image.tooBig')); return; }
    setImages((arr) => arr.map((x, i) => (i === slot ? { file, preview: URL.createObjectURL(file), old: x?.url ?? x?.old } : x)));
  };
  const pickModel = (file) => {
    if (!file) return;
    if (!/\.glb$/i.test(file.name)) { toast.error(t('admin.products.model.badType')); return; }
    if (file.size > MODEL_MAX) { toast.error(t('admin.products.model.tooBig')); return; }
    setModel({ file });
  };
  const addRange = () => {
    const from = Number(range.from); const to = Number(range.to);
    if (!from || !to || to < from || to - from > 30) return;
    const existing = new Set(variants.map((v) => Number(v.size)));
    const added = [];
    for (let s = from; s <= to; s += 1) if (!existing.has(s)) added.push({ size: String(s), stock: 0 });
    setVariants((v) => [...v.filter((x) => x.size !== ''), ...added].sort((a, b) => a.size - b.size));
    setRange({ from: '', to: '' });
  };

  const validate = () => {
    const e = {};
    ['name_fr', 'name_en', 'slug', 'price'].forEach((k) => { if (!String(form[k]).trim()) e[k] = t('admin.products.errors.required'); });
    if (form.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) e.slug = t('admin.products.fields.slugHint');
    if (form.promo_price !== '' && Number(form.promo_price) >= Number(form.price)) e.promo_price = t('admin.products.errors.promo');
    if (!variants.some((v) => v.size !== '')) e.variants = t('admin.products.variants.empty');
    if (dupSize) e.variants = t('admin.products.variants.duplicate', { size: dupSize });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = async () => {
    if (!validate()) { toast.error(t('admin.products.errors.required')); return; }
    setSaving(true);
    try {
      const productId = isNew ? crypto.randomUUID() : id;
      const wantActive = form.is_active;
      const payload = {
        id: productId, name_fr: form.name_fr.trim(), name_en: form.name_en.trim(), slug: form.slug, description_fr: form.description_fr, description_en: form.description_en,
        category_id: form.category_id || null, gender: form.gender, shoe_type: form.shoe_type, usages: form.usages,
        color: form.color || null, material: form.material || null, price: Number(form.price), promo_price: form.promo_price === '' ? null : Number(form.promo_price),
        is_featured: form.is_featured,
      };
      // 1) Produit (créé masqué : il sera activé à la fin, une fois les 4 photos en place)
      const q = isNew ? supabase.from('products').insert({ ...payload, is_active: false }) : supabase.from('products').update(payload).eq('id', productId);
      const { error: pErr } = await q;
      if (pErr) throw pErr;

      // 2) Photos
      const toDelete = [];
      for (let i = 0; i < 4; i += 1) {
        const img = images[i];
        if (img?.file) {
          const url = await uploadProductImage(img.file, productId, i + 1);
          const { error } = await supabase.from('product_images').upsert(
            { product_id: productId, position: i + 1, url, alt_fr: `${payload.name_fr} — vue ${i + 1}`, alt_en: `${payload.name_en} — view ${i + 1}` },
            { onConflict: 'product_id,position' },
          );
          if (error) throw error;
          if (img.old) toDelete.push(img.old);
        }
      }
      // 3) Modèle 3D
      if (model?.file) {
        const url = await uploadModel(model.file, productId);
        if (form.model_3d_url) toDelete.push(form.model_3d_url);
        await supabase.from('products').update({ model_3d_url: url }).eq('id', productId);
      } else if (model === 'remove' && form.model_3d_url) {
        toDelete.push(form.model_3d_url);
        await supabase.from('products').update({ model_3d_url: null }).eq('id', productId);
      }
      // 4) Pointures : mise à jour + suppression de celles retirées
      const rows = variants.filter((v) => v.size !== '').map((v) => ({ product_id: productId, size: Number(v.size), stock: Math.max(0, Number(v.stock) || 0) }));
      const { error: vErr } = await supabase.from('product_variants').upsert(rows, { onConflict: 'product_id,size' });
      if (vErr) throw vErr;
      const keep = rows.map((r) => r.size);
      const { data: existing } = await supabase.from('product_variants').select('id, size').eq('product_id', productId);
      const stale = (existing ?? []).filter((v) => !keep.includes(Number(v.size))).map((v) => v.id);
      if (stale.length) await supabase.from('product_variants').delete().in('id', stale);
      // 5) Visibilité (le trigger SQL refuse si les 4 photos ne sont pas là)
      const { error: aErr } = await supabase.from('products').update({ is_active: wantActive }).eq('id', productId);
      await Promise.all(toDelete.map(removeByUrl));
      if (aErr) throw aErr;

      toast.success(t('admin.common.saved'));
      navigate('/admin/produits');
    } catch (e) {
      if (e?.code === '23505') { setErrors((x) => ({ ...x, slug: t('admin.products.errors.slugTaken') })); toast.error(t('admin.products.errors.slugTaken')); }
      else if (e?.message === 'badType' || e?.message === 'tooBig') toast.error(t(`admin.products.image.${e.message}`));
      else toast.error(adminError(t, e));
    } finally { setSaving(false); }
  };

  if (loading) return <PageLoader />;
  const cur = settings.currency;

  return (
    <>
      <PageTitle actions={(
        <div className="flex gap-2">
          <Button variant="outline" size="sm" to="/admin/produits"><ArrowLeft className="h-4 w-4" aria-hidden /> {t('admin.common.back')}</Button>
          <Button size="sm" onClick={onSave} disabled={saving}>{saving ? t('admin.common.saving') : t('admin.common.save')}</Button>
        </div>
      )}>{isNew ? t('admin.products.newTitle') : t('admin.products.editTitle')}</PageTitle>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card title={t('admin.products.sections.info')}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t('admin.products.fields.name_fr')} value={form.name_fr} error={errors.name_fr} maxLength={150} onChange={(e) => set('name_fr', e.target.value)} />
              <Field label={t('admin.products.fields.name_en')} value={form.name_en} error={errors.name_en} maxLength={150} onChange={(e) => set('name_en', e.target.value)} />
              <Field className="md:col-span-2" label={t('admin.products.fields.slug')} hint={t('admin.products.fields.slugHint')} error={errors.slug} value={form.slug}
                onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} />
              <Field as="textarea" label={t('admin.products.fields.description_fr')} value={form.description_fr} maxLength={5000} onChange={(e) => set('description_fr', e.target.value)} />
              <Field as="textarea" label={t('admin.products.fields.description_en')} value={form.description_en} maxLength={5000} onChange={(e) => set('description_en', e.target.value)} />
            </div>
          </Card>

          <Card title={t('admin.products.sections.images')}>
            <p className="mb-4 text-sm text-ink-soft">{t('admin.products.image.hint')}</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {images.map((img, i) => (
                <label key={i} className="group relative block aspect-square cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-forest/20 bg-cream transition hover:border-emerald">
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => pickImage(i, e.target.files?.[0])} />
                  {img ? <img src={img.preview ?? img.url} alt={t('admin.products.image.slot', { n: i + 1 })} className="h-full w-full object-cover" /> : (
                    <span className="flex h-full flex-col items-center justify-center gap-2 p-2 text-center text-sm text-ink-soft">
                      <ImagePlus className="h-7 w-7 text-emerald" aria-hidden />{t('admin.products.image.upload')}
                    </span>
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-forest px-2 py-0.5 text-xs font-bold text-white">{i + 1}</span>
                  {img && <span className="absolute inset-x-2 bottom-2 rounded-full bg-white/90 py-1 text-center text-xs font-semibold text-forest opacity-0 transition group-hover:opacity-100">{t('admin.products.image.replace')}</span>}
                </label>
              ))}
            </div>
            {imageCount < 4 && <p className="mt-3 text-sm font-medium text-amber">{t('admin.products.image.missing', { count: 4 - imageCount })}</p>}
          </Card>

          <Card title={t('admin.products.sections.variants')}>
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="flex items-end gap-3">
                  <Field className="w-28" label={i === 0 ? t('admin.products.variants.size') : ''} type="number" step="0.5" min="10" max="60" value={v.size}
                    aria-label={t('admin.products.variants.size')}
                    onChange={(e) => setVariants((arr) => arr.map((x, j) => (j === i ? { ...x, size: e.target.value } : x)))} />
                  <Field className="w-36" label={i === 0 ? t('admin.products.variants.stock') : ''} type="number" min="0" value={v.stock}
                    aria-label={`${t('admin.products.variants.stock')} ${v.size}`}
                    onChange={(e) => setVariants((arr) => arr.map((x, j) => (j === i ? { ...x, stock: e.target.value } : x)))} />
                  <button type="button" onClick={() => setVariants((arr) => arr.filter((_, j) => j !== i))}
                    aria-label={t('admin.products.variants.remove', { size: v.size ? formatSize(v.size) : '' })}
                    className="mb-1 grid h-10 w-10 place-items-center rounded-full text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" aria-hidden /></button>
                </div>
              ))}
            </div>
            {errors.variants && <p role="alert" className="mt-2 text-sm font-medium text-red-700">{errors.variants}</p>}
            <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-forest/10 pt-4">
              <Button variant="outline" size="sm" onClick={() => setVariants((v) => [...v, { size: '', stock: 0 }])}><Plus className="h-4 w-4" aria-hidden /> {t('admin.products.variants.add')}</Button>
              <span className="text-sm font-semibold text-forest">{t('admin.products.variants.range')} :</span>
              <Field className="w-24" label={t('admin.products.variants.from')} type="number" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
              <Field className="w-24" label={t('admin.products.variants.to')} type="number" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
              <Button variant="secondary" size="sm" onClick={addRange}>{t('admin.products.variants.addRange')}</Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title={t('admin.products.sections.visibility')}>
            <div className="space-y-4">
              <Toggle checked={form.is_active} onChange={(v) => set('is_active', v)} label={t('admin.products.fields.is_active')} hint={t('admin.products.fields.activeHint')} />
              <Toggle checked={form.is_featured} onChange={(v) => set('is_featured', v)} label={t('admin.products.fields.is_featured')} />
            </div>
          </Card>
          <Card title={t('admin.products.sections.pricing')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('admin.products.fields.price', { currency: cur })} type="number" min="1" step="500" value={form.price} error={errors.price} onChange={(e) => set('price', e.target.value)} />
              <Field label={t('admin.products.fields.promo_price', { currency: cur })} type="number" min="1" step="500" value={form.promo_price} error={errors.promo_price}
                hint={t('admin.products.fields.promoHint')} onChange={(e) => set('promo_price', e.target.value)} />
            </div>
          </Card>
          <Card title={t('admin.products.sections.attributes')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field as="select" label={t('admin.products.fields.category')} value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
                <option value="">{t('admin.products.fields.none')}</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c[`name_${lang}`]}</option>)}
              </Field>
              <Field as="select" label={t('admin.products.fields.gender')} value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                {GENDERS.map((g) => <option key={g} value={g}>{t(`enums.gender.${g}`)}</option>)}
              </Field>
              <Field as="select" label={t('admin.products.fields.shoe_type')} value={form.shoe_type} onChange={(e) => set('shoe_type', e.target.value)}>
                {TYPES.map((g) => <option key={g} value={g}>{t(`enums.shoeType.${g}`)}</option>)}
              </Field>
              <Field as="select" label={t('admin.products.fields.color')} value={form.color} onChange={(e) => set('color', e.target.value)}>
                <option value="">{t('admin.products.fields.none')}</option>
                {COLORS.map((g) => <option key={g} value={g}>{t(`enums.color.${g}`)}</option>)}
              </Field>
              <Field as="select" label={t('admin.products.fields.material')} value={form.material} onChange={(e) => set('material', e.target.value)}>
                <option value="">{t('admin.products.fields.none')}</option>
                {MATERIALS.map((g) => <option key={g} value={g}>{t(`enums.material.${g}`)}</option>)}
              </Field>
            </div>
            <fieldset className="mt-4">
              <legend className="mb-2 text-sm font-semibold text-forest">{t('admin.products.fields.usages')}</legend>
              <div className="flex flex-wrap gap-2">
                {USAGES.map((u) => {
                  const on = form.usages.includes(u);
                  return (
                    <button key={u} type="button" aria-pressed={on} onClick={() => set('usages', on ? form.usages.filter((x) => x !== u) : [...form.usages, u])}
                      className={`rounded-full border-2 px-3 py-1.5 text-sm font-medium ${on ? 'border-forest bg-forest text-white' : 'border-forest/15 text-forest'}`}>
                      {t(`enums.usage.${u}`)}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </Card>
          <Card title={t('admin.products.sections.model')}>
            <p className="mb-3 text-sm text-ink-soft">{t('admin.products.model.hint')}</p>
            {(form.model_3d_url && model !== 'remove') || model?.file ? (
              <div className="flex items-center gap-3 rounded-2xl bg-mint-light p-3 text-sm text-forest">
                <Box className="h-5 w-5 text-emerald" aria-hidden />
                <span className="flex-1 truncate">{model?.file?.name ?? t('admin.products.model.current')}</span>
                <button type="button" onClick={() => setModel(form.model_3d_url ? 'remove' : null)} aria-label={t('admin.products.model.remove')}
                  className="grid h-8 w-8 place-items-center rounded-full hover:bg-white"><X className="h-4 w-4" aria-hidden /></button>
              </div>
            ) : (
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-forest/15 px-4 py-2 text-sm font-semibold text-forest hover:border-emerald">
                <Box className="h-4 w-4" aria-hidden /> {t('admin.products.model.upload')}
                <input type="file" accept=".glb,model/gltf-binary" className="sr-only" onChange={(e) => pickModel(e.target.files?.[0])} />
              </label>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
