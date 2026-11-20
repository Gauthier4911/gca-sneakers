import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parseFilters } from '../lib/catalog';

const LIST_KEYS = ['types', 'sizes', 'usages', 'colors', 'materials'];

/** Filtres de la boutique stockés dans l'URL (partageables, bouton retour OK). */
export function useFilters(fixed = {}) {
  const [sp, setSp] = useSearchParams();
  const filters = useMemo(() => ({ ...parseFilters(sp), ...fixed }), [sp, fixed]);

  const update = useCallback((mutate) => {
    setSp((prev) => {
      const next = new URLSearchParams(prev);
      mutate(next);
      next.delete('from'); // dès qu'on modifie, ce n'est plus le résultat brut du questionnaire
      return next;
    }, { replace: true });
  }, [setSp]);

  const set = useCallback((key, value) => update((n) => {
    if (value === null || value === undefined || value === '' || value === false) n.delete(key);
    else n.set(key, value === true ? '1' : String(value));
  }), [update]);

  const toggle = useCallback((key, value) => update((n) => {
    const cur = (n.get(key) || '').split(',').filter(Boolean);
    const v = String(value);
    const nextList = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
    if (nextList.length) n.set(key, nextList.join(',')); else n.delete(key);
  }), [update]);

  const setBudget = useCallback((min, max) => update((n) => {
    if (min == null) n.delete('min'); else n.set('min', String(min));
    if (max == null) n.delete('max'); else n.set('max', String(max));
  }), [update]);

  const clear = useCallback(() => update((n) => {
    ['gender', 'category', 'min', 'max', 'available', ...LIST_KEYS].forEach((k) => n.delete(k));
  }), [update]);

  return { filters, set, toggle, setBudget, clear, searchParams: sp };
}
