import { useCallback, useEffect, useState } from 'react';
import { fetchCatalog } from '../lib/catalog';

export function useCatalog() {
  const [state, setState] = useState({ products: [], loading: true, error: null });
  const load = useCallback((force = false) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchCatalog({ force })
      .then((products) => setState({ products, loading: false, error: null }))
      .catch((error) => setState({ products: [], loading: false, error }));
  }, []);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: () => load(true) };
}
