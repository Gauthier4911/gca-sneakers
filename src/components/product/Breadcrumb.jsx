import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

/** Fil d'Ariane accessible. items: [{ label, to? }] — le dernier est la page courante. */
export default function Breadcrumb({ items }) {
  const { t } = useTranslation();
  return (
    <nav aria-label={t('product.breadcrumb')} className="text-sm">
      <ol className="flex flex-wrap items-center gap-1 text-ink-soft">
        {items.map((it, i) => (
          <li key={it.label} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-4 w-4 opacity-50" aria-hidden />}
            {it.to && i < items.length - 1
              ? <Link to={it.to} className="hover:text-emerald hover:underline">{it.label}</Link>
              : <span aria-current="page" className="font-medium text-forest">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
