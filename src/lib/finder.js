import { applyFilters, BUDGETS, parseFilters } from './catalog';

// Réponses du questionnaire → filtres de la boutique (même logique partout).
export const EMPTY_ANSWERS = { gender: null, type: null, size: null, usages: [], budget: null, colors: [], materials: [] };

export function answersToFilters(a) {
  const b = BUDGETS.find((x) => x.id === a.budget);
  return {
    ...parseFilters(new URLSearchParams()),
    gender: a.gender,
    types: a.type ? [a.type] : [],
    sizes: a.size != null ? [a.size] : [],
    usages: a.usages,
    colors: a.colors,
    materials: a.materials,
    min: b?.min ?? null,
    max: b?.max ?? null,
    available: true,
  };
}

export function answersToSearch(a) {
  const f = answersToFilters(a);
  const sp = new URLSearchParams();
  if (f.gender) sp.set('gender', f.gender);
  if (f.types.length) sp.set('types', f.types.join(','));
  if (f.sizes.length) sp.set('sizes', f.sizes.join(','));
  if (f.usages.length) sp.set('usages', f.usages.join(','));
  if (f.colors.length) sp.set('colors', f.colors.join(','));
  if (f.materials.length) sp.set('materials', f.materials.join(','));
  if (f.min != null) sp.set('min', String(f.min));
  if (f.max != null) sp.set('max', String(f.max));
  sp.set('available', '1');
  sp.set('from', 'finder');
  return `?${sp.toString()}`;
}

export const countMatches = (products, a) => applyFilters(products, answersToFilters(a)).length;
