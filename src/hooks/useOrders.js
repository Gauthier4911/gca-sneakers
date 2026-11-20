import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const ORDER_FIELDS = `id, order_number, status, fulfillment, subtotal, discount, delivery_fee, total,
  customer_snapshot, locale, created_at, order_items(id, product_id, product_name, size, quantity, unit_price)`;

/** Commandes du client connecté (la RLS ne renvoie que les siennes). */
export function useMyOrders(userId) {
  const [state, setState] = useState({ orders: [], loading: true });
  const load = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from('orders').select(ORDER_FIELDS).eq('user_id', userId).order('created_at', { ascending: false });
    setState({ orders: data ?? [], loading: false });
  }, [userId]);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}
