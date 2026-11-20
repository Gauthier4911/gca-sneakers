import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Stock des pointures en temps réel : abonnement Supabase Realtime sur
 * product_variants de ce produit + relecture quand l'onglet redevient actif.
 */
export function useLiveStock(productId, initial) {
  const [variants, setVariants] = useState(initial ?? []);
  useEffect(() => { setVariants(initial ?? []); }, [initial]);

  useEffect(() => {
    if (!productId) return undefined;
    const refresh = async () => {
      const { data } = await supabase.from('product_variants').select('id, size, stock').eq('product_id', productId);
      if (data) setVariants(data.map((v) => ({ ...v, size: Number(v.size) })).sort((a, b) => a.size - b.size));
    };
    const channel = supabase.channel(`stock-${productId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants', filter: `product_id=eq.${productId}` }, refresh)
      .subscribe();
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => { supabase.removeChannel(channel); document.removeEventListener('visibilitychange', onVisible); };
  }, [productId]);

  return variants;
}
