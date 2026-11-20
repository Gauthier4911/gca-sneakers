import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ExternalLink, ImagePlus, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Card, PageTitle } from './ui';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';
import { supabase } from '../lib/supabase';
import { CONTENT_GROUPS, defaultText, TESTIMONIALS_KEY } from '../lib/content';
import { removeByUrl, uploadLogo } from './storage';
import { useSettings } from '../context/SettingsContext';
import { LANGS } from '../lib/routes';

const GROUP_IDS = ['logo', ...CONTENT_GROUPS.map((g) => g.id)];

/** Champ bilingue : FR et EN côte à côte, texte d'origine en gris (placeholder). */
function BilingualField({ id, k, multiline, values, onChange }) {
  const { t } = useTranslation();
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <fieldset className="rounded-2xl border border-forest/10 p-4">
      <legend className="px-1 text-sm font-semibold text-forest">{t(`admin.content.labels.${id}`)}</legend>
      <div className="grid gap-3 md:grid-cols-2">
        {LANGS.map((l) => (
          <label key={l} className="block">
            <span className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-ink-soft">
              {t(`admin.content.${l}`)}
              {values[l]?.[k] && (
                <button type="button" onClick={() => onChange(l, k, '')} className="inline-flex items-center gap-1 normal-case text-amber hover:underline">
                  <RotateCcw className="h-3 w-3" aria-hidden />{t('admin.content.reset')}
                </button>
              )}
            </span>
            <Tag value={values[l]?.[k] ?? ''} onChange={(e) => onChange(l, k, e.target.value)} placeholder={String(defaultText(l, k) ?? '')}
              maxLength={1000} rows={multiline ? 3 : undefined} lang={l}
              className="w-full rounded-xl border-2 border-forest/15 bg-white px-3 py-2 text-sm text-forest placeholder:text-ink-soft/50 focus:border-emerald focus:outline-none" />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function Content() {
  const { t } = useTranslation();
  const { settings, reload } = useSettings();
  const [group, setGroup] = useState('logo');
  const [values, setValues] = useState(null);
  const [logos, setLogos] = useState({ logo_url: '', logo_light_url: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);

  useEffect(() => {
    supabase.from('settings').select('key, value').in('key', ['content', 'logo_url', 'logo_light_url']).then(({ data }) => {
      const m = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
      const c = m.content && typeof m.content === 'object' ? m.content : {};
      setValues({ fr: { ...(c.fr ?? {}) }, en: { ...(c.en ?? {}) } });
      setLogos({ logo_url: m.logo_url || '', logo_light_url: m.logo_light_url || '' });
    });
  }, []);

  const current = useMemo(() => CONTENT_GROUPS.find((g) => g.id === group), [group]);
  if (!values) return <div className="h-64 animate-pulse rounded-3xl bg-white" />;

  const onChange = (lang, key, v) => setValues((s) => ({ ...s, [lang]: { ...s[lang], [key]: v } }));
  const testimonials = (lang) => (Array.isArray(values[lang][TESTIMONIALS_KEY]) ? values[lang][TESTIMONIALS_KEY] : []);
  const setTestimonials = (lang, arr) => onChange(lang, TESTIMONIALS_KEY, arr);

  const save = async () => {
    setSaving(true);
    // On n'enregistre que les champs remplis (vide = texte d'origine)
    const clean = Object.fromEntries(LANGS.map((l) => [l, Object.fromEntries(Object.entries(values[l]).filter(([k, v]) => (
      k === TESTIMONIALS_KEY ? Array.isArray(v) && v.some((x) => x.text?.trim()) : typeof v === 'string' && v.trim()
    )).map(([k, v]) => [k, k === TESTIMONIALS_KEY ? v.filter((x) => x.text?.trim()).map((x) => ({ name: x.name.trim(), text: x.text.trim() })) : v.trim()]))]));
    const { error } = await supabase.from('settings').upsert([
      { key: 'content', value: clean, is_public: true },
      { key: 'logo_url', value: logos.logo_url, is_public: true },
      { key: 'logo_light_url', value: logos.logo_light_url, is_public: true },
    ], { onConflict: 'key' });
    setSaving(false);
    if (error) { toast.error(t('admin.common.error', { message: error.message })); return; }
    await reload();
    toast.success(t('admin.content.saved'));
  };

  const pickLogo = async (field, file) => {
    if (!file) return;
    setUploading(field);
    try {
      const url = await uploadLogo(file);
      if (logos[field]) removeByUrl(logos[field]);
      setLogos((l) => ({ ...l, [field]: url }));
    } catch (e) {
      toast.error(['badType', 'tooBig'].includes(e.message) ? t(`admin.products.image.${e.message}`) : t('admin.common.error', { message: e.message }));
    } finally { setUploading(null); }
  };

  return (
    <>
      <PageTitle actions={(
        <div className="flex gap-2">
          <Button variant="outline" size="sm" href="/fr" target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" aria-hidden /> {t('admin.content.preview')}</Button>
          <Button size="sm" onClick={save} disabled={saving}>{saving ? t('admin.common.saving') : t('admin.common.save')}</Button>
        </div>
      )}>{t('admin.content.title')}</PageTitle>
      <p className="-mt-3 mb-6 max-w-3xl text-sm text-ink-soft">{t('admin.content.intro')}</p>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav aria-label={t('admin.content.title')} className="flex gap-2 overflow-x-auto lg:flex-col">
          {GROUP_IDS.map((g) => (
            <button key={g} type="button" onClick={() => setGroup(g)} aria-current={group === g ? 'page' : undefined}
              className={`whitespace-nowrap rounded-2xl px-4 py-2.5 text-left text-sm font-semibold transition ${group === g ? 'bg-forest text-white' : 'bg-white text-forest hover:bg-gold/15'}`}>
              {t(`admin.content.groups.${g}`)}
            </button>
          ))}
        </nav>

        <Card title={t(`admin.content.groups.${group}`)}>
          {group === 'logo' && (
            <div className="grid gap-6 md:grid-cols-2">
              {[['logo_url', 'color', 'bg-white ring-1 ring-forest/10', 'color'], ['logo_light_url', 'light', 'bg-forest', 'light']].map(([field, label, bg, variant]) => (
                <div key={field}>
                  <p className="text-sm font-semibold text-forest">{t(`admin.content.logo.${label}`)}</p>
                  <div className={`mt-2 grid h-36 place-items-center rounded-2xl p-4 ${bg}`}>
                    {logos[field] ? <img src={logos[field]} alt={t('admin.content.logo.current')} className="max-h-24 w-auto object-contain" />
                      : <Logo variant={variant} animate={false} className="h-20 w-auto" />}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-forest/15 px-4 py-2 text-sm font-semibold text-forest hover:border-emerald">
                      <ImagePlus className="h-4 w-4" aria-hidden /> {uploading === field ? t('admin.settings.fields.uploading') : t('admin.content.logo.upload')}
                      <input type="file" accept="image/png,image/webp,image/jpeg" className="sr-only" onChange={(e) => pickLogo(field, e.target.files?.[0])} />
                    </label>
                    {logos[field] && (
                      <button type="button" onClick={() => setLogos((l) => ({ ...l, [field]: '' }))} className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-amber hover:bg-gold/10">
                        <RotateCcw className="h-4 w-4" aria-hidden /> {t('admin.content.logo.remove')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <p className="text-xs text-ink-soft md:col-span-2">{t('admin.content.logo.hint')}</p>
            </div>
          )}

          {current && (
            <div className="space-y-4">
              {current.fields.map(([id, k, multiline]) => <BilingualField key={id} id={id} k={k} multiline={multiline} values={values} onChange={onChange} />)}
            </div>
          )}

          {group === 'testimonials' && (
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {LANGS.map((l) => (
                <div key={l}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{t(`admin.content.${l}`)}</p>
                  {testimonials(l).length === 0 && <p className="mt-2 text-xs text-ink-soft">{t('admin.content.testimonials.defaultHint')}</p>}
                  <ul className="mt-2 space-y-3">
                    {testimonials(l).map((x, i) => (
                      <li key={i} className="space-y-2 rounded-2xl bg-cream p-3">
                        <div className="flex gap-2">
                          <input value={x.name} maxLength={80} onChange={(e) => setTestimonials(l, testimonials(l).map((y, j) => (j === i ? { ...y, name: e.target.value } : y)))}
                            placeholder={t('admin.content.testimonials.name')} aria-label={t('admin.content.testimonials.name')}
                            className="flex-1 rounded-xl border-2 border-forest/15 px-3 py-2 text-sm focus:border-emerald focus:outline-none" />
                          <button type="button" onClick={() => setTestimonials(l, testimonials(l).filter((_, j) => j !== i))}
                            aria-label={t('admin.content.testimonials.remove', { name: x.name || i + 1 })} className="grid h-10 w-10 place-items-center rounded-full text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                        <textarea value={x.text} maxLength={500} rows={3} onChange={(e) => setTestimonials(l, testimonials(l).map((y, j) => (j === i ? { ...y, text: e.target.value } : y)))}
                          placeholder={t('admin.content.testimonials.text')} aria-label={t('admin.content.testimonials.text')}
                          className="w-full rounded-xl border-2 border-forest/15 px-3 py-2 text-sm focus:border-emerald focus:outline-none" />
                      </li>
                    ))}
                  </ul>
                  {testimonials(l).length < 12 && (
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setTestimonials(l, [...testimonials(l), { name: '', text: '' }])}>
                      <Plus className="h-4 w-4" aria-hidden /> {t('admin.content.testimonials.add')}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
