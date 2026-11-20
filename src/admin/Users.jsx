import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { Ban, Search, ShieldCheck, ShieldOff, Trash2, Unlock, UserRound, X } from 'lucide-react';
import { Card, PageTitle } from './ui';
import StatusBadge from '../components/ui/StatusBadge';
import { WhatsAppIcon } from '../components/ui/SocialIcons';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const FILTERS = ['all', 'client', 'admin', 'banned'];
const ERR = ['CANNOT_CHANGE_SELF', 'USER_NOT_FOUND', 'FORBIDDEN'];

export default function Users() {
  const { t, i18n } = useTranslation();
  const { user: me } = useAuth();
  const { settings } = useSettings();
  const [rows, setRows] = useState(null);
  const [blocked, setBlocked] = useState([]);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(null);
  const [orders, setOrders] = useState(null);
  const [busy, setBusy] = useState(false);
  const lang = i18n.language;
  const fmt = (v) => formatPrice(v, lang, settings.currency);
  const date = (d) => (d ? new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(d)) : t('admin.users.never'));

  const load = useCallback(async () => {
    const [{ data, error }, { data: b }] = await Promise.all([supabase.rpc('admin_list_users'), supabase.rpc('admin_list_blocked_emails')]);
    if (error) toast.error(t('admin.common.error', { message: error.message })); else setRows(data);
    setBlocked(b ?? []);
  }, [t]);
  useEffect(() => { load(); }, [load]);

  // Commandes de l'utilisateur ouvert dans la fiche
  useEffect(() => {
    if (!open) return;
    setOrders(null);
    supabase.from('orders').select('id, order_number, status, total, created_at').eq('user_id', open.id).order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data ?? []));
  }, [open]);

  const filtered = useMemo(() => (rows ?? []).filter((u) => {
    if (filter === 'banned' && !u.banned) return false;
    if ((filter === 'client' || filter === 'admin') && (u.role !== filter || u.banned)) return false;
    return `${u.full_name ?? ''} ${u.email} ${u.whatsapp ?? ''}`.toLowerCase().includes(q.toLowerCase());
  }), [rows, filter, q]);

  const run = async (fn, args, doneKey) => {
    setBusy(true);
    const { error } = await supabase.rpc(fn, args);
    setBusy(false);
    if (error) {
      const code = ERR.find((c) => error.message.includes(c));
      toast.error(code ? t(`admin.users.errors.${code}`) : t('admin.common.error', { message: error.message }));
      return false;
    }
    toast.success(t(`admin.users.done.${doneKey}`));
    await load();
    return true;
  };

  const name = (u) => u.full_name || u.email;
  const setRole = (u, role) => {
    if (!window.confirm(t(role === 'admin' ? 'admin.users.confirmAdmin' : 'admin.users.confirmClient', { name: name(u) }))) return;
    run('admin_set_role', { p_user: u.id, p_role: role }, 'role').then((ok) => ok && setOpen((o) => (o ? { ...o, role } : o)));
  };
  const ban = (u) => {
    const reason = window.prompt(t('admin.users.banReason'), '');
    if (reason === null) return; // annulé
    run('admin_set_banned', { p_user: u.id, p_banned: true, p_reason: reason.slice(0, 300) }, 'ban').then((ok) => ok && setOpen((o) => (o ? { ...o, banned: true, role: 'client' } : o)));
  };
  const unban = (u) => {
    if (!window.confirm(t('admin.users.confirmUnban', { name: name(u) }))) return;
    run('admin_set_banned', { p_user: u.id, p_banned: false }, 'unban').then((ok) => ok && setOpen((o) => (o ? { ...o, banned: false } : o)));
  };
  const remove = (u) => {
    if (!window.confirm(t('admin.users.confirmDelete', { name: name(u) }))) return;
    const block = window.confirm(t('admin.users.alsoBlock'));
    run('admin_delete_user', { p_user: u.id, p_block_email: block }, 'delete').then((ok) => ok && setOpen(null));
  };

  const Actions = ({ u, compact }) => {
    if (u.id === me?.id) return <span className="text-xs font-semibold text-emerald">{t('admin.users.you')}</span>;
    const btn = `inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${compact ? '' : 'text-sm'}`;
    return (
      <div className="flex flex-wrap gap-1.5">
        {!u.banned && (u.role === 'admin'
          ? <button type="button" disabled={busy} onClick={() => setRole(u, 'client')} className={`${btn} bg-cream text-forest hover:bg-gold/20`}><ShieldOff className="h-3.5 w-3.5" aria-hidden />{t('admin.users.makeClient')}</button>
          : <button type="button" disabled={busy} onClick={() => setRole(u, 'admin')} className={`${btn} bg-mint-light text-forest hover:bg-mint/40`}><ShieldCheck className="h-3.5 w-3.5" aria-hidden />{t('admin.users.makeAdmin')}</button>)}
        {u.banned
          ? <button type="button" disabled={busy} onClick={() => unban(u)} className={`${btn} bg-emerald text-white hover:bg-emerald-800`}><Unlock className="h-3.5 w-3.5" aria-hidden />{t('admin.users.unban')}</button>
          : <button type="button" disabled={busy} onClick={() => ban(u)} className={`${btn} bg-gold/20 text-forest hover:bg-gold/40`}><Ban className="h-3.5 w-3.5" aria-hidden />{t('admin.users.ban')}</button>}
        <button type="button" disabled={busy} onClick={() => remove(u)} className={`${btn} bg-red-50 text-red-800 hover:bg-red-100`}><Trash2 className="h-3.5 w-3.5" aria-hidden />{t('admin.users.delete')}</button>
      </div>
    );
  };

  return (
    <>
      <PageTitle>{t('admin.users.title')}</PageTitle>
      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${filter === f ? 'bg-forest text-white' : 'bg-cream text-forest hover:bg-gold/20'}`}>
              {t(`admin.users.filters.${f}`)}
            </button>
          ))}
          <label className="relative ml-auto w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden />
            <span className="sr-only">{t('admin.users.search')}</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('admin.users.search')}
              className="w-full rounded-xl border-2 border-forest/15 py-2 pl-9 pr-3 focus:border-emerald focus:outline-none" />
          </label>
        </div>
        {rows && <p className="mb-3 text-sm text-ink-soft">{t('admin.users.count', { count: filtered.length })}</p>}
        {!rows ? <div className="h-40 animate-pulse rounded-2xl bg-cream" /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-ink-soft">
                <tr><th className="py-2">{t('admin.users.cols.user')}</th><th>{t('admin.users.cols.contact')}</th><th>{t('admin.users.cols.role')}</th>
                  <th>{t('admin.users.cols.orders')}</th><th>{t('admin.users.cols.created')}</th><th>{t('admin.users.cols.lastLogin')}</th><th>{t('admin.common.actions')}</th></tr>
              </thead>
              <tbody className="divide-y divide-forest/10">
                {filtered.map((u) => (
                  <tr key={u.id} className={u.banned ? 'bg-red-50/40' : ''}>
                    <td className="py-3 pr-3">
                      <button type="button" onClick={() => setOpen(u)} className="text-left font-semibold text-forest hover:text-emerald">{u.full_name || '—'}</button>
                      <span className="block text-xs text-ink-soft">{u.email}</span>
                    </td>
                    <td>{u.whatsapp || '—'}</td>
                    <td>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${u.banned ? 'bg-red-100 text-red-800' : u.role === 'admin' ? 'bg-forest text-white' : 'bg-mint-light text-forest'}`}>
                        {u.banned ? t('admin.users.banned') : t(`admin.users.roles.${u.role ?? 'client'}`)}
                      </span>
                    </td>
                    <td>{u.orders_count} · <span className="text-ink-soft">{fmt(u.total_spent)}</span></td>
                    <td className="text-xs">{date(u.created_at)}</td>
                    <td className="text-xs">{date(u.last_sign_in_at)}</td>
                    <td><Actions u={u} compact /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title={t('admin.users.blocked')} className="mt-6">
        <p className="mb-3 text-sm text-ink-soft">{t('admin.users.blockedHint')}</p>
        {blocked.length === 0 ? <p className="text-sm text-ink-soft">{t('admin.users.noBlocked')}</p> : (
          <ul className="divide-y divide-forest/10 text-sm">
            {blocked.map((b) => (
              <li key={b.email} className="flex items-center justify-between gap-3 py-2">
                <span><strong className="text-forest">{b.email}</strong>{b.reason && <span className="text-ink-soft"> · {b.reason}</span>}</span>
                <button type="button" onClick={async () => { await supabase.rpc('admin_unblock_email', { p_email: b.email }); load(); }}
                  className="rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-forest hover:bg-gold/20">{t('admin.users.unblock')}</button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-forest/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)} />
            <motion.aside role="dialog" aria-modal="true" aria-label={t('admin.users.detailTitle')}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest text-gold"><UserRound className="h-6 w-6" aria-hidden /></span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{t('admin.users.detailTitle')}</p>
                    <h2 className="font-display text-xl font-bold text-forest">{open.full_name || open.email}</h2>
                  </div>
                </div>
                <button type="button" onClick={() => setOpen(null)} aria-label={t('admin.orders.close')} className="grid h-10 w-10 place-items-center rounded-full hover:bg-cream"><X className="h-5 w-5" aria-hidden /></button>
              </div>
              <dl className="mt-6 space-y-3 rounded-2xl bg-cream p-4 text-sm">
                {[
                  [t('auth.email'), open.email], ['WhatsApp', open.whatsapp || '—'], [t('admin.users.address'), open.address || '—'],
                  [t('admin.users.cols.role'), open.banned ? t('admin.users.banned') : t(`admin.users.roles.${open.role ?? 'client'}`)],
                  [t('admin.users.cols.created'), date(open.created_at)], [t('admin.users.cols.lastLogin'), date(open.last_sign_in_at)],
                  [t('admin.users.cols.orders'), open.orders_count], [t('admin.users.spent'), fmt(open.total_spent)],
                ].map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[140px_1fr] gap-2"><dt className="text-ink-soft">{k}</dt><dd className="whitespace-pre-line break-words font-medium text-forest">{v}</dd></div>
                ))}
              </dl>
              {open.whatsapp && (
                <a href={`https://wa.me/${String(open.whatsapp).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-forest">
                  <WhatsAppIcon className="h-4 w-4" /> {t('admin.users.contact')}
                </a>
              )}
              <div className="mt-6"><Actions u={open} /></div>
              <h3 className="mt-8 font-display font-semibold text-forest">{t('admin.users.ordersList')}</h3>
              {!orders ? <div className="mt-2 h-16 animate-pulse rounded-2xl bg-cream" /> : orders.length === 0 ? <p className="mt-2 text-sm text-ink-soft">{t('admin.users.noOrders')}</p> : (
                <ul className="mt-2 divide-y divide-forest/10 text-sm">
                  {orders.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-3 py-2">
                      <span><strong className="text-forest">{o.order_number}</strong><span className="block text-xs text-ink-soft">{date(o.created_at)}</span></span>
                      <span className="flex items-center gap-2"><StatusBadge status={o.status} /><span className="font-semibold">{fmt(o.total)}</span></span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
