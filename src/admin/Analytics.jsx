import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Eye, Globe, Monitor, Radio, Smartphone, Tablet, Users } from 'lucide-react';
import { Card } from './ui';
import { supabase } from '../lib/supabase';

/** Statistiques de visite (anonymes) pour la période choisie dans le tableau de bord. */
export default function Analytics({ days }) {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState(null);
  const nf = new Intl.NumberFormat(i18n.language === 'en' ? 'en-US' : 'fr-FR');

  useEffect(() => {
    setData(null);
    supabase.rpc('admin_analytics', { p_from: new Date(Date.now() - days * 86400000).toISOString(), p_to: new Date().toISOString() })
      .then(({ data: d }) => setData(d ?? { visitors: 0, views: 0, by_day: [], top_pages: [], referrers: [], devices: {}, langs: {} }));
  }, [days]);

  if (!data) return <div className="h-40 animate-pulse rounded-3xl bg-white" />;

  const series = [];
  const byDay = Object.fromEntries((data.by_day ?? []).map((d) => [d.day, d]));
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    series.push({ day: d, visitors: Number(byDay[d]?.visitors ?? 0), views: Number(byDay[d]?.views ?? 0) });
  }
  const max = Math.max(1, ...series.map((s) => s.visitors));
  const totalDevices = Math.max(1, Object.values(data.devices ?? {}).reduce((a, b) => a + Number(b), 0));
  const kpis = [
    { label: t('admin.analytics.visitors'), value: data.visitors, Icon: Users, cls: 'bg-emerald text-white' },
    { label: t('admin.analytics.views'), value: data.views, Icon: Eye, cls: 'bg-white text-forest' },
    { label: t('admin.analytics.today'), value: data.visitors_today, Icon: Globe, cls: 'bg-white text-forest' },
    { label: t('admin.analytics.online'), value: data.online_now, Icon: Radio, cls: 'bg-white text-forest', live: true },
  ];
  const DEV = { mobile: Smartphone, tablet: Tablet, desktop: Monitor };

  return (
    <section aria-labelledby="analytics-title" className="space-y-6">
      <h2 id="analytics-title" className="font-display text-2xl font-bold text-forest">{t('admin.analytics.title')}</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, Icon, cls, live }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`rounded-3xl p-5 shadow-card ${cls}`}>
            <div className="flex items-center gap-2">
              <Icon className="h-6 w-6 opacity-80" aria-hidden />
              {live && <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald" /></span>}
            </div>
            <p className="mt-3 text-sm font-medium opacity-80">{label}</p>
            <p className="mt-1 font-display text-2xl font-bold">{nf.format(value ?? 0)}</p>
          </motion.div>
        ))}
      </div>

      <Card title={t('admin.analytics.chart')}>
        {data.views > 0 ? (
          <div className="flex h-40 items-end gap-[2px]" role="img" aria-label={t('admin.analytics.chart')}>
            {series.map((s) => (
              <div key={s.day} className="group relative flex-1">
                <motion.div initial={{ height: 0 }} animate={{ height: `${(s.visitors / max) * 100}%` }} transition={{ duration: 0.5 }}
                  className={`w-full rounded-t ${s.visitors ? 'bg-emerald' : 'bg-forest/5'}`} style={{ minHeight: 2 }} />
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-forest px-2 py-1 text-xs text-white group-hover:block">
                  {s.day} · {s.visitors} {t('admin.analytics.visitors').toLowerCase()} · {s.views} {t('admin.analytics.views').toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        ) : <p className="text-ink-soft">{t('admin.analytics.none')}</p>}
        <p className="mt-3 text-xs text-ink-soft">{t('admin.analytics.note')}</p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title={t('admin.analytics.topPages')}>
          {data.top_pages.length ? (
            <ol className="space-y-2 text-sm">
              {data.top_pages.map((p) => (
                <li key={p.path} className="flex items-center justify-between gap-3">
                  <a href={p.path} target="_blank" rel="noopener noreferrer" className="truncate font-medium text-forest hover:text-emerald">{p.path}</a>
                  <span className="shrink-0 rounded-full bg-mint-light px-2 py-0.5 text-xs font-bold text-forest">{nf.format(p.views)}</span>
                </li>
              ))}
            </ol>
          ) : <p className="text-ink-soft">{t('admin.analytics.none')}</p>}
        </Card>
        <Card title={t('admin.analytics.sources')}>
          {data.referrers.length ? (
            <ul className="space-y-2 text-sm">
              {data.referrers.map((r) => (
                <li key={r.source || 'direct'} className="flex items-center justify-between gap-3">
                  <span className="truncate text-forest">{r.source || t('admin.analytics.direct')}</span>
                  <span className="shrink-0 rounded-full bg-gold/20 px-2 py-0.5 text-xs font-bold text-forest">{nf.format(r.visitors)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-ink-soft">{t('admin.analytics.none')}</p>}
        </Card>
        <Card title={`${t('admin.analytics.devices')} · ${t('admin.analytics.langs')}`}>
          <ul className="space-y-3">
            {['mobile', 'tablet', 'desktop'].map((d) => {
              const n = Number(data.devices?.[d] ?? 0); const Icon = DEV[d];
              return (
                <li key={d}>
                  <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-forest"><Icon className="h-4 w-4" aria-hidden />{t(`admin.analytics.device.${d}`)}</span><span className="font-semibold">{Math.round((n / totalDevices) * 100)} %</span></div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-cream"><div className="h-full rounded-full bg-signature" style={{ width: `${(n / totalDevices) * 100}%` }} /></div>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-sm text-forest">FR : <strong>{nf.format(data.langs?.fr ?? 0)}</strong> · EN : <strong>{nf.format(data.langs?.en ?? 0)}</strong></p>
        </Card>
      </div>
    </section>
  );
}
