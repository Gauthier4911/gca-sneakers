import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { computeTotals, lineKey } from '../lib/cart';
import { useSettings } from './SettingsContext';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'gca-cart-v1';
const MAX_QTY_PER_LINE = 20;
const CartContext = createContext(null);

function readStorage() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    // On ne garde que des lignes bien formées (le stockage local n'est pas fiable).
    return Array.isArray(raw)
      ? raw.filter((i) => i && typeof i.productId === 'string' && Number(i.quantity) > 0).slice(0, 50)
      : [];
  } catch {
    return [];
  }
}

/**
 * Panier sans compte (localStorage). Ne contient que des infos produit, jamais
 * de données personnelles. Une fois connecté, il est aussi enregistré sur le
 * compte (table carts) pour être retrouvé sur un autre appareil.
 */
export function CartProvider({ children }) {
  const { settings } = useSettings();
  const [items, setItems] = useState(readStorage);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* quota / mode privé */ }
  }, [items]);

  // ---- Synchronisation avec le compte (table carts, protégée par RLS) ----
  const { user } = useAuth();
  const syncedFor = useRef(null);
  useEffect(() => {
    if (!user) {
      // Déconnexion : on vide le panier local (appareil partagé)
      if (syncedFor.current) { setItems([]); syncedFor.current = null; }
      return;
    }
    if (syncedFor.current === user.id) return;
    (async () => {
      const { data } = await supabase.from('carts').select('items').eq('user_id', user.id).maybeSingle();
      const remote = Array.isArray(data?.items) ? data.items : [];
      setItems((local) => {
        // Fusion : pour une même pointure on garde la plus grande quantité (pas de doublon)
        const map = new Map(remote.map((i) => [lineKey(i.productId, i.size), i]));
        local.forEach((i) => {
          const k = lineKey(i.productId, i.size);
          const r = map.get(k);
          map.set(k, r ? { ...r, ...i, quantity: Math.max(r.quantity, i.quantity) } : i);
        });
        return [...map.values()].slice(0, 50);
      });
      syncedFor.current = user.id;
    })();
  }, [user]);

  useEffect(() => {
    if (!user || syncedFor.current !== user.id) return undefined;
    const id = setTimeout(() => {
      supabase.from('carts').upsert({ user_id: user.id, items }).then(() => {});
    }, 600);
    return () => clearTimeout(id);
  }, [items, user]);

  const addItem = useCallback((item, qty = 1) => {
    setItems((prev) => {
      const key = lineKey(item.productId, item.size);
      const existing = prev.find((i) => lineKey(i.productId, i.size) === key);
      const max = Math.min(MAX_QTY_PER_LINE, item.maxStock ?? MAX_QTY_PER_LINE);
      if (existing) {
        return prev.map((i) => (lineKey(i.productId, i.size) === key
          ? { ...i, ...item, quantity: Math.min(max, i.quantity + qty) } : i));
      }
      return [...prev, { ...item, quantity: Math.min(max, qty) }];
    });
  }, []);

  const updateQuantity = useCallback((productId, size, quantity) => {
    setItems((prev) => prev
      .map((i) => (lineKey(i.productId, i.size) === lineKey(productId, size)
        ? { ...i, quantity: Math.max(0, Math.min(quantity, i.maxStock ?? MAX_QTY_PER_LINE, MAX_QTY_PER_LINE)) } : i))
      .filter((i) => i.quantity > 0));
  }, []);

  const removeItem = useCallback((productId, size) => {
    setItems((prev) => prev.filter((i) => lineKey(i.productId, i.size) !== lineKey(productId, size)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totals = useMemo(() => computeTotals(items, {
    promoThreshold: Number(settings.promo_threshold),
    promoPercent: Number(settings.promo_percent),
    deliveryFee: Number(settings.delivery_fee),
  }), [items, settings]);

  const value = useMemo(() => ({
    items, totals, count: totals.quantity, isOpen, setOpen,
    addItem, updateQuantity, removeItem, clear, setItems,
  }), [items, totals, isOpen, addItem, updateQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
