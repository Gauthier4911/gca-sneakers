import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { Info, Search, X } from 'lucide-react';
import { Card, PageTitle } from './ui';
import StatusBadge from '../components/ui/StatusBadge';
import { WhatsAppIcon } from '../components/ui/SocialIcons';
import { supabase } from '../lib/supabase';
import { formatPrice, formatSize } from '../lib/format';
import { ORDER_FIELDS } from '../hooks/useOrders';
import { useSettings } from '../context/SettingsContext';

const STATUSES = ['pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled'];
// Transitions autorisées (identiques à la fonction SQL admin_set_order_status)
const NEXT = {
  pending: ['confirmed', 'paid', 'cancelled'], confirmed: ['paid', 'cancelled'], paid: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'], delivered: [], cancelled: [],
};

export default function Orders() {
  const { t, i18n } = useTranslation();
  const { settings } = useSettings();
  const [sp, setSp] = useSearchParams();
  const status = STATUSES.includes(sp.get('status')) ? sp.get('status') : null;
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false);
  const lang = i18n.language;
  const fmt = (v) => formatPrice(v, lang, settings.currency);
  const date = (d) => new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d));

  const load = useCallback(async () => {
    let query = supabase.from('orders').select(ORDER_FIELDS).order('created_at', { ascending: false }).limit(300);
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) toast.error(t('admin.common.error', { message: error.message })); else setRows(data);
  }, [status, t]);
  useEffect(() => { setRows(null); load(); }, [load]);

  const filtered = useMemo(() => (rows ?? []).filter((o) => {
    const s = `${o.order_number} ${o.customer_snapshot?.full_name ?? ''} ${o.customer_snapshot?.whatsapp ?? ''}`.toLowerCase();
    return s.includes(q.toLowerCase());
  }), [rows, q]);

  const changeStatus = async (order, next) => {
    setBusy(true);
    const { data, error } = await supabase.rpc('admin_set_order_status', { p_order_id: order.id, p_status: next });
    setBusy(false);
    if (error) {
      const code = ['INVALID_TRANSITION', 'INSUFFICIENT_STOCK', 'VARIANT_NOT_FOUND', 'FORBIDDEN'].find((c) => error.message.includes(c));
      toast.error(code ? t(`admin.orders.errors.${code}`, { detail: error.details ?? '' }) : t('admin.common.error', { message: error.message }));
      return;
    }
    toast.success(t('admin.orders.statusChanged', { status: t(`orderStatus.${next}`) }));
    setOpen((o) => (o ? { ...o, status: data.status } : o));
    load();
  };

  return (
    <>
      <PageTitle>{t('admin.orders.title')}</PageTitle>
      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {[null, ...STATUSES].map((s) => (
            <button key={s ?? 'all'} type="button" aria-pressed={status === s} onClick={() => setSp(s ? { status: s } : {})}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${status === s ? 'bg-forest text-white' : 'bg-cream text-forest hover:bg-gold/20'}`}>
              {s ? t(`orderStatus.${s}`) : t('admin.common.all')}
            </button>
          ))}
          <label className="relative ml-auto w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden />
            <span className="sr-only">{t('admin.common.search')}</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('admin.common.search')}
              className="w-full rounded-xl border-2 border-forest/15 py-2 pl-9 pr-3 focus:border-emerald focus:outline-none" />
          </label>
        </div>
        {!rows ? <div className="h-40 animate-pulse rounded-2xl bg-cream" /> : filtered.length === 0 ? <p className="text-ink-soft">{t('admin.orders.empty')}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-ink-soft">
                <tr><th className="py-2">{t('admin.orders.number')}</th><th>{t('admin.orders.date')}</th><th>{t('admin.orders.customer')}</th>
                  <th>{t('admin.orders.fulfillment')}</th><th>{t('admin.orders.total')}</th><th>{t('admin.orders.status')}</th></tr>
              </thead>
              <tbody className="divide-y divide-forest/10">
                {filtered.map((o) => (
                  <tr key={o.id} className="cursor-pointer hover:bg-cream/60" onClick={() => setOpen(o)}>
                    <td className="py-3"><button type="button" className="font-semibold text-emerald hover:underline" onClick={(e) => { e.stopPropagation(); setOpen(o); }}>{o.order_number}</button></td>
                    <td>{date(o.created_at)}</td>
                    <td>{o.customer_snapshot?.full_name}<span className="block text-xs text-ink-soft">{o.customer_snapshot?.whatsapp}</span></td>
                    <td>{t(o.fulfillment === 'pickup' ? 'account.pickup' : 'account.delivery')}</td>
                    <td className="font-semibold">{fmt(o.total)}</td>
                    <td><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-forest/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)} />
            <motion.aside role="dialog" aria-modal="true" aria-label={t('admin.orders.detail')}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{t('admin.orders.detail')}</p>
                  <h2 className="font-display text-2xl font-bold text-forest">{open.order_number}</h2>
                  <p className="text-sm text-ink-soft">{date(open.created_at)}</p>
                </div>
                <button type="button" onClick={() => setOpen(null)} aria-label={t('admin.orders.close')} className="grid h-10 w-10 place-items-center rounded-full hover:bg-cream"><X className="h-5 w-5" aria-hidden /></button>
              </div>
              <div className="mt-4"><StatusBadge status={open.status} /></div>

              <section className="mt-6 rounded-2xl bg-cream p-4 text-sm text-forest">
                <p className="font-display text-base font-semibold">{open.customer_snapshot?.full_name}</p>
                <p>WhatsApp : {open.customer_snapshot?.whatsapp}</p>
                {open.customer_snapshot?.email && <p>{t('admin.orders.email')} : {open.customer_snapshot.email}</p>}
                <p className="mt-2"><strong>{open.fulfillment === 'pickup' ? t('admin.orders.pickupAt') : t('admin.orders.address')} :</strong>{' '}
                  {open.fulfillment === 'pickup' ? open.customer_snapshot?.pickup_address : open.customer_snapshot?.address}</p>
                {open.customer_snapshot?.whatsapp && (
                  <a href={`https://wa.me/${String(open.customer_snapshot.whatsapp).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 font-semibold text-forest">
                    <WhatsAppIcon className="h-4 w-4" /> {t('admin.orders.contact')}
                  </a>
                )}
              </section>

              <section className="mt-6">
                <h3 className="font-display font-semibold text-forest">{t('admin.orders.items')}</h3>
                <ul className="mt-2 divide-y divide-forest/10 text-sm">
                  {open.order_items.map((i) => (
                    <li key={i.id} className="flex justify-between gap-3 py-2">
                      <span>{i.product_name} · {formatSize(i.size)} × {i.quantity}</span><span className="font-semibold">{fmt(i.unit_price * i.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-3 space-y-1 border-t border-forest/10 pt-3 text-sm">
                  <div className="flex justify-between"><dt className="text-ink-soft">{t('cart.subtotal')}</dt><dd>{fmt(open.subtotal)}</dd></div>
                  {open.discount > 0 && <div className="flex justify-between text-emerald"><dt>{t('cart.discount', { count: settings.promo_threshold, percent: settings.promo_percent })}</dt><dd>-{fmt(open.discount)}</dd></div>}
                  <div className="flex justify-between"><dt className="text-ink-soft">{t('cart.delivery')}</dt><dd>{fmt(open.delivery_fee)}</dd></div>
                  <div className="flex justify-between font-display text-lg font-bold text-forest"><dt>{t('cart.total')}</dt><dd>{fmt(open.total)}</dd></div>
                </dl>
              </section>

              {NEXT[open.status].length > 0 && (
                <section className="mt-6">
                  <h3 className="font-display font-semibold text-forest">{t('admin.orders.changeStatus')}</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {NEXT[open.status].map((s) => (
                      <button key={s} type="button" disabled={busy} onClick={() => changeStatus(open, s)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-50
                          ${s === 'cancelled' ? 'bg-red-50 text-red-800 hover:bg-red-100' : 'bg-signature text-forest hover:brightness-105'}`}>
                        {t('admin.orders.to', { status: t(`orderStatus.${s}`) })}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 flex gap-2 text-xs text-ink-soft"><Info className="h-4 w-4 shrink-0" aria-hidden />{t('admin.orders.stockNote')}</p>
                </section>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
