// Calculs du panier (purs, testables). Les montants définitifs sont
// recalculés par le serveur dans create_order() : ceci sert à l'affichage.
export function computeTotals(items, { promoThreshold = 5, promoPercent = 0, deliveryFee = 0, fulfillment = null } = {}) {
  const quantity = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((n, i) => n + i.unitPrice * i.quantity, 0);
  const promoActive = promoPercent > 0 && quantity >= promoThreshold;
  const discount = promoActive ? Math.round((subtotal * Math.min(promoPercent, 90)) / 100) : 0;
  const fee = fulfillment === 'delivery' ? Number(deliveryFee) || 0 : 0;
  return {
    quantity,
    subtotal,
    discount,
    deliveryFee: fee,
    total: subtotal - discount + fee,
    promoActive,
    missingForPromo: promoPercent > 0 ? Math.max(0, promoThreshold - quantity) : null,
  };
}

export const lineKey = (productId, size) => `${productId}__${Number(size)}`;
