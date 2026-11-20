import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, ShoppingCart, TrendingUp, Wallet } from 'lucide-react';
import { Card, PageTitle } from './ui';
import StatusBadge from '../components/ui/StatusBadge';
import { supabase } from '../lib/supabase';
import { formatPrice, formatSize } from '../lib/format';
import { useSettings } from '../context/SettingsContext';

const PERIODS = [7, 30, 90];

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { settings } = useSettings();
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const lang = i18n.language;
  const fmt = (v) => formatPrice(v, lang, settings.currency);

  useEffect(() => {
    setStats(null);
    const from = new Date(Date.now() - days * 86400000).toISOString();
    supabase.rpc('admin_dashboard_stats', { p_from: from, p_to: new Date().toISOString(), p_low_stock: Number(settings.low_stock_threshold) || 3 })
      .then(({ data, error: e }) => (e ? setError(e.message) : setStats(data)));
  }, [days, settings.low_stock_threshold]);

  if (error) return <p role="alert" className="text-red-700">{t('admin.common.error', { message: error })}</p>;

  // Série jour par jour (les jours sans vente valent 0)
  const series = [];
  if (stats) {
    const byDay = Object.fromEntries((stats.sales_by_day ?? []).map((d) => [d.day, d]));
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      series.push({ day: d, revenue: Number(byDay[d]?.revenue ?? 0), orders: Number(byDay[d]?.orders ?? 0) });
    }
  }
  const max = Math.max(1, ...series.map((s) => s.revenue));
  const kpis = stats ? [
    { label: t('admin.dashboard.revenueTotal'), value: fmt(stats.revenue_total), Icon: Wallet, cls: 'bg-forest text-white' },
    { label: t('admin.dashboard.revenuePeriod'), value: fmt(stats.revenue_period), Icon: TrendingUp, cls: 'bg-signature text-forest' },
    { label: t('admin.dashboard.ordersPeriod'), value: stats.orders_period, Icon: ShoppingCart, cls: 'bg-white text-forest' },
    { label: t('admin.dashboard.pending'), value: stats.orders_by_status?.pending ?? 0, Icon: Clock, cls: 'bg-white text-forest' },
  ] : [];

  return (
    <>
      <PageTitle actions={(
        <div role="group" aria-label={t('admin.dashboard.period')} className="flex rounded-full bg-white p-1 shadow-card">
          {PERIODS.map((d) => (
            <button key={d} type="button" onClick={() => setDays(d)} aria-pressed={days === d}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${days === d ? 'bg-forest text-white' : 'text-forest'}`}>
              {t('admin.dashboard.days', { count: d })}
            </button>
          ))}
        </div>
      )}>{t('admin.nav.dashboard')}</PageTitle>

      {!stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-3xl bg-white" />)}</div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map(({ label, value, Icon, cls }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className={`rounded-3xl p-5 shadow-card ${cls}`}>
                <Icon className="h-6 w-6 opacity-80" aria-hidden />
                <p className="mt-3 text-sm font-medium opacity-80">{label}</p>
                <p className="mt-1 font-display text-2xl font-bold">{value}</p>
              </motion.div>
            ))}
          </div>
          <p className="text-xs text-ink-soft">{t('admin.dashboard.revenueNote')}</p>

          <Card title={t('admin.dashboard.salesByDay')}>
            {stats.revenue_period > 0 ? (
              <div className="flex h-48 items-end gap-[2px]" role="img" aria-label={t('admin.dashboard.salesByDay')}>
                {series.map((s) => (
                  <div key={s.day} className="group relative flex-1">
                    <motion.div initial={{ height: 0 }} animate={{ height: `${(s.revenue / max) * 100}%` }} transition={{ duration: 0.5 }}
                      className={`w-full rounded-t ${s.revenue ? 'bg-signature' : 'bg-forest/5'}`} style={{ minHeight: 2 }} />
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-forest px-2 py-1 text-xs text-white group-hover:block">
                      {s.day} · {fmt(s.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            ) : <p className="text-ink-soft">{t('admin.dashboard.noSales')}</p>}
          </Card>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card title={t('admin.dashboard.topProducts')}>
              {stats.top_products.length ? (
                <ol className="space-y-3">
                  {stats.top_products.map((p, i) => (
                    <li key={p.product_id ?? i} className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-signature font-bold text-forest">{i + 1}</span>
                      <span className="flex-1 font-medium text-forest">{p.name}</span>
                      <span className="text-sm text-ink-soft">{t('admin.dashboard.sold', { count: p.qty })}</span>
                    </li>
                  ))}
                </ol>
              ) : <p className="text-ink-soft">{t('admin.dashboard.noSales')}</p>}
            </Card>
            <Card title={t('admin.dashboard.lowStock')}>
              {stats.low_stock.length ? (
                <ul className="space-y-2">
                  {stats.low_stock.map((l) => (
                    <li key={`${l.product_id}-${l.size}`}>
                      <Link to={`/admin/produits/${l.product_id}`} className="flex items-center gap-2 rounded-xl p-2 hover:bg-cream">
                        <AlertTriangle className={`h-4 w-4 ${l.stock === 0 ? 'text-red-600' : 'text-amber'}`} aria-hidden />
                        <span className="flex-1 text-sm text-forest">{l.name} · {formatSize(l.size)}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${l.stock === 0 ? 'bg-red-100 text-red-800' : 'bg-gold/20 text-forest'}`}>{l.stock}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-ink-soft">{t('admin.dashboard.lowStockEmpty')}</p>}
            </Card>
            <Card title={t('admin.dashboard.byStatus')}>
              <ul className="space-y-2">
                {['pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled'].map((s) => (
                  <li key={s}>
                    <Link to={`/admin/commandes?status=${s}`} className="flex items-center justify-between rounded-xl p-2 hover:bg-cream">
                      <StatusBadge status={s} /><span className="font-display font-bold text-forest">{stats.orders_by_status?.[s] ?? 0}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
