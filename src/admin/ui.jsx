// Petits composants partagés de l'espace admin.
import { forwardRef, useId } from 'react';

export function Card({ title, children, className = '', actions }) {
  return (
    <section className={`rounded-3xl bg-white p-5 shadow-card ring-1 ring-forest/5 md:p-6 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="font-display text-lg font-bold text-forest">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

const base = 'w-full rounded-xl border-2 bg-white px-3 py-2.5 text-forest focus:outline-none transition';
const cls = (error) => `${base} ${error ? 'border-red-600' : 'border-forest/15 focus:border-emerald'}`;

export const Field = forwardRef(function Field({ label, hint, error, as = 'input', children, className = '', ...props }, ref) {
  const id = useId();
  const Tag = as;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-forest">{label}</label>
      <Tag id={id} ref={ref} aria-invalid={!!error} aria-describedby={error || hint ? `${id}-d` : undefined}
        className={`${cls(error)} ${as === 'textarea' ? 'min-h-28' : ''}`} {...props}>{children}</Tag>
      {(error || hint) && <p id={`${id}-d`} className={`mt-1 text-xs ${error ? 'font-medium text-red-700' : 'text-ink-soft'}`}>{error || hint}</p>}
    </div>
  );
});

export function Toggle({ checked, onChange, label, hint, disabled }) {
  return (
    <label className={`flex items-start justify-between gap-4 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
      <span>
        <span className="block text-sm font-semibold text-forest">{label}</span>
        {hint && <span className="block text-xs text-ink-soft">{hint}</span>}
      </span>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-emerald' : 'bg-forest/20'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`} />
      </button>
    </label>
  );
}

export function PageTitle({ children, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="font-display text-3xl font-bold text-forest">{children}</h1>
      {actions}
    </div>
  );
}
