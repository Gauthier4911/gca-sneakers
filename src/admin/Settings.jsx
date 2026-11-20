import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Card, Field, PageTitle } from './ui';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { useSettings } from '../context/SettingsContext';

const isHttps = (v) => v === '' || /^https:\/\/[^\s]+$/i.test(v);

export default function Settings() {
  const { t } = useTranslation();
  const { settings, reload } = useSettings();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Lecture directe (l'admin voit aussi les paramètres non publics)
    supabase.from('settings').select('key, value').then(({ data }) => {
      const s = { ...settings, ...Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) };
      setForm({
        store_name: s.store_name ?? '', whatsapp_number: s.whatsapp_number ?? '', contact_email: s.contact_email ?? '',
        warehouse_address: s.warehouse_address ?? '', delivery_fee: s.delivery_fee ?? 0, currency: s.currency ?? 'FCFA',
        promo_threshold: s.promo_threshold ?? 5, promo_percent: s.promo_percent ?? 0, video_url: s.video_url ?? '',
        low_stock_threshold: s.low_stock_threshold ?? 3,
        tiktok: s.social_links?.tiktok ?? '', facebook: s.social_links?.facebook ?? '', instagram: s.social_links?.instagram ?? '', whatsapp: s.social_links?.whatsapp ?? '',
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!form) return <div className="h-64 animate-pulse rounded-3xl bg-white" />;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSave = async () => {
    const e = {};
    const wa = String(form.whatsapp_number).replace(/\D/g, '');
    if (wa && (wa.length < 8 || wa.length > 15)) e.whatsapp_number = t('admin.settings.errors.whatsapp');
    ['video_url', 'tiktok', 'facebook', 'instagram', 'whatsapp'].forEach((k) => { if (!isHttps(form[k].trim())) e[k] = t('admin.settings.errors.url'); });
    ['delivery_fee', 'promo_threshold', 'low_stock_threshold'].forEach((k) => { if (!(Number(form[k]) >= 0)) e[k] = t('admin.settings.errors.number'); });
    if (!(Number(form.promo_percent) >= 0 && Number(form.promo_percent) <= 90)) e.promo_percent = t('admin.settings.errors.percent');
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    const rows = [
      ['store_name', form.store_name.trim() || 'GCA sneakers'], ['whatsapp_number', wa], ['contact_email', form.contact_email.trim()],
      ['warehouse_address', form.warehouse_address.trim()], ['delivery_fee', Number(form.delivery_fee)], ['currency', form.currency.trim() || 'FCFA'],
      ['promo_threshold', Number(form.promo_threshold)], ['promo_percent', Number(form.promo_percent)], ['video_url', form.video_url.trim()],
      ['social_links', { tiktok: form.tiktok.trim(), facebook: form.facebook.trim(), instagram: form.instagram.trim(), whatsapp: form.whatsapp.trim() }],
    ].map(([key, value]) => ({ key, value, is_public: true }));
    rows.push({ key: 'low_stock_threshold', value: Number(form.low_stock_threshold), is_public: false });
    const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' });
    setSaving(false);
    if (error) { toast.error(t('admin.common.error', { message: error.message })); return; }
    await reload();
    toast.success(t('admin.settings.saved'));
  };

  const F = (k, props = {}) => <Field label={t(`admin.settings.fields.${k}`)} value={form[k]} onChange={set(k)} error={errors[k]} {...props} />;

  return (
    <>
      <PageTitle actions={<Button size="sm" onClick={onSave} disabled={saving}>{saving ? t('admin.common.saving') : t('admin.common.save')}</Button>}>
        {t('admin.settings.title')}
      </PageTitle>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title={t('admin.settings.groups.contact')}>
          <div className="space-y-4">
            {F('store_name')}
            {F('whatsapp_number', { inputMode: 'numeric', hint: t('admin.settings.fields.whatsappHint') })}
            {F('contact_email', { type: 'email' })}
          </div>
        </Card>
        <Card title={t('admin.settings.groups.delivery')}>
          <div className="space-y-4">
            {F('warehouse_address', { as: 'textarea' })}
            <div className="grid gap-4 sm:grid-cols-2">{F('delivery_fee', { type: 'number', min: 0, step: 100 })}{F('currency')}</div>
          </div>
        </Card>
        <Card title={t('admin.settings.groups.promo')}>
          <div className="grid gap-4 sm:grid-cols-2">
            {F('promo_threshold', { type: 'number', min: 1 })}
            {F('promo_percent', { type: 'number', min: 0, max: 90, hint: t('admin.settings.fields.promoHint') })}
            <Field label={t('admin.dashboard.lowStock')} type="number" min="0" value={form.low_stock_threshold} onChange={set('low_stock_threshold')} error={errors.low_stock_threshold} />
          </div>
        </Card>
        <Card title={t('admin.settings.groups.media')}>
          <div className="space-y-4">
            {F('video_url', { type: 'url', hint: t('admin.settings.fields.videoHint') })}
            {['tiktok', 'instagram', 'facebook', 'whatsapp'].map((k) => <div key={k}>{F(k, { type: 'url', placeholder: 'https://', hint: t('admin.settings.fields.httpsHint') })}</div>)}
          </div>
        </Card>
      </div>
    </>
  );
}
