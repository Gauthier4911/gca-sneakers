import i18n from './i18n';
import { formatPrice, formatSize } from './format';

/**
 * Message WhatsApp pré-rempli (dans la langue du client) à partir de la commande
 * ENREGISTRÉE en base : les montants affichés sont ceux calculés par le serveur.
 */
export function buildOrderMessage(order, { lang = 'fr', settings }) {
  const t = i18n.getFixedT(lang);
  const cur = settings.currency || 'FCFA';
  const fmt = (v) => formatPrice(v, lang, cur);
  const c = order.customer_snapshot ?? {};
  const pct = order.subtotal > 0 && order.discount > 0 ? `-${Math.round((order.discount / order.subtotal) * 100)} %` : '';
  const lines = [
    t('whatsapp.greeting', { store: settings.store_name || 'GCA sneakers' }),
    t('whatsapp.newOrder', { number: order.order_number }),
    '',
    t('whatsapp.items'),
    ...(order.order_items ?? []).map((i) => t('whatsapp.line', {
      name: i.product_name, size: formatSize(i.size), qty: i.quantity, amount: fmt(i.unit_price * i.quantity),
    })),
    '',
    t('whatsapp.subtotal', { amount: fmt(order.subtotal) }),
    ...(order.discount > 0 ? [t('whatsapp.discount', { percent: pct, amount: fmt(order.discount) })] : []),
    order.fulfillment === 'delivery' ? t('whatsapp.deliveryFee', { amount: fmt(order.delivery_fee) }) : t('whatsapp.pickupFree'),
    t('whatsapp.total', { amount: fmt(order.total) }),
    '',
    order.fulfillment === 'delivery' ? t('whatsapp.modeDelivery') : t('whatsapp.modePickup'),
    order.fulfillment === 'delivery'
      ? t('whatsapp.address', { address: c.address ?? '' })
      : t('whatsapp.warehouse', { address: c.pickup_address || settings.warehouse_address || '' }),
    t('whatsapp.customer', { name: c.full_name ?? '', whatsapp: c.whatsapp ?? '' }),
    '',
    t('whatsapp.closing'),
  ];
  return lines.join('\n');
}

/** Lien wa.me vers le numéro de la boutique (chiffres uniquement, format international). */
export function whatsappLink(number, message) {
  const digits = String(number || '').replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
