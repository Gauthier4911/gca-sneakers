import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { BUDGETS, tr } from '../../lib/catalog';
import { useLang } from '../../hooks/useLang';
import { formatSize } from '../../lib/format';

const SWATCH = {
  black: '#111827', white: '#FFFFFF', grey: '#9CA3AF', beige: '#E7D7B8', brown: '#8B4513', blue: '#1D4ED8',
  red: '#DC2626', pink: '#F472B6', green: '#16A34A', yellow: '#FACC15', orange: '#F97316', purple: '#9333EA',
  multi: 'conic-gradient(#FFB800, #FF7A00, #DC2626, #1D4ED8, #16A34A, #FFB800)',
};

function Group({ title, children }) {
  return (
    <fieldset className="border-b border-forest/10 py-5 first:pt-0">
      <legend className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-forest">{title}</legend>
      {children}
    </fieldset>
  );
}

function Chip({ active, onClick, children, label }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} aria-label={label}
      className={`rounded-full border-2 px-3.5 py-1.5 text-sm font-medium transition
        ${active ? 'border-forest bg-forest text-white' : 'border-forest/15 bg-white text-forest hover:border-emerald'}`}>
      {children}
    </button>
  );
}

/** Panneau de filtres (barre latérale ordinateur + tiroir mobile). */
export default function Filters({ facets, filters, actions, hide = [] }) {
  const { t } = useTranslation();
  const { lang } = useLang();
  const { set, toggle, setBudget } = actions;
  const budgetActive = (b) => filters.min === b.min && filters.max === b.max;

  return (
    <div>
      {!hide.includes('gender') && (
        <Group title={t('filters.gender')}>
          <div className="flex flex-wrap gap-2">
            <Chip active={!filters.gender} onClick={() => set('gender', null)}>{t('filters.all')}</Chip>
            {['men', 'women', 'kids'].map((g) => (
              <Chip key={g} active={filters.gender === g} onClick={() => set('gender', filters.gender === g ? null : g)}>{t(`enums.gender.${g}`)}</Chip>
            ))}
          </div>
        </Group>
      )}

      {!hide.includes('category') && facets.categories.length > 0 && (
        <Group title={t('filters.category')}>
          <div className="flex flex-wrap gap-2">
            {facets.categories.map((c) => (
              <Chip key={c.slug} active={filters.category === c.slug}
                onClick={() => set('category', filters.category === c.slug ? null : c.slug)}>
                {tr(c, 'name', lang)}
              </Chip>
            ))}
          </div>
        </Group>
      )}

      {facets.types.length > 1 && (
        <Group title={t('filters.type')}>
          <div className="flex flex-wrap gap-2">
            {facets.types.map((v) => (
              <Chip key={v} active={filters.types.includes(v)} onClick={() => toggle('types', v)}>{t(`enums.shoeType.${v}`)}</Chip>
            ))}
          </div>
        </Group>
      )}

      {facets.sizes.length > 0 && (
        <Group title={t('filters.size')}>
          <div className="grid grid-cols-5 gap-2">
            {facets.sizes.map((s) => {
              const active = filters.sizes.includes(s);
              return (
                <button key={s} type="button" onClick={() => toggle('sizes', s)} aria-pressed={active}
                  aria-label={t('filters.sizeChip', { size: formatSize(s) })}
                  className={`h-11 rounded-xl border-2 text-sm font-semibold transition
                    ${active ? 'border-forest bg-forest text-white' : 'border-forest/15 bg-white text-forest hover:border-emerald'}`}>
                  {formatSize(s)}
                </button>
              );
            })}
          </div>
        </Group>
      )}

      <Group title={t('filters.budget')}>
        <div className="flex flex-col gap-2">
          {BUDGETS.map((b) => (
            <Chip key={b.id} active={budgetActive(b)} onClick={() => (budgetActive(b) ? setBudget(null, null) : setBudget(b.min, b.max))}>
              <span className="flex items-center justify-between gap-2">{t(`enums.budget.${b.id}`)}{budgetActive(b) && <Check className="h-4 w-4" aria-hidden />}</span>
            </Chip>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {['min', 'max'].map((k) => (
            <label key={k} className="text-xs font-medium text-ink-soft">
              {t(`filters.${k}`)}
              <input type="number" inputMode="numeric" min="0" step="1000" value={filters[k] ?? ''}
                onChange={(e) => set(k, e.target.value === '' ? null : Math.max(0, Number(e.target.value)))}
                className="mt-1 w-full rounded-xl border-2 border-forest/15 px-3 py-2 text-sm text-forest focus:border-emerald focus:outline-none" />
            </label>
          ))}
        </div>
      </Group>

      <Group title={t('filters.availability')}>
        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span className="text-sm font-medium text-forest">{t('filters.inStock')}</span>
          <button type="button" role="switch" aria-checked={filters.available} onClick={() => set('available', !filters.available)}
            className={`relative h-7 w-12 rounded-full transition ${filters.available ? 'bg-emerald' : 'bg-forest/20'}`}>
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${filters.available ? 'left-6' : 'left-1'}`} />
            <span className="sr-only">{t('filters.inStock')}</span>
          </button>
        </label>
      </Group>

      {facets.colors.length > 1 && (
        <Group title={t('filters.color')}>
          <div className="flex flex-wrap gap-2.5">
            {facets.colors.map((c) => {
              const active = filters.colors.includes(c);
              return (
                <button key={c} type="button" onClick={() => toggle('colors', c)} aria-pressed={active} title={t(`enums.color.${c}`)}
                  aria-label={t(`enums.color.${c}`)}
                  className={`grid h-9 w-9 place-items-center rounded-full ring-2 ring-offset-2 transition ${active ? 'ring-forest' : 'ring-transparent hover:ring-emerald/50'}`}
                  style={{ background: SWATCH[c], boxShadow: 'inset 0 0 0 1px rgba(5,59,44,.15)' }}>
                  {active && <Check className={`h-4 w-4 ${['white', 'yellow', 'beige'].includes(c) ? 'text-forest' : 'text-white'}`} aria-hidden />}
                </button>
              );
            })}
          </div>
        </Group>
      )}

      {facets.usages.length > 1 && (
        <Group title={t('filters.usage')}>
          <div className="flex flex-wrap gap-2">
            {facets.usages.map((u) => (
              <Chip key={u} active={filters.usages.includes(u)} onClick={() => toggle('usages', u)}>{t(`enums.usage.${u}`)}</Chip>
            ))}
          </div>
        </Group>
      )}
    </div>
  );
}
