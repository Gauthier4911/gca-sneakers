import { forwardRef, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';

/** Champ de formulaire accessible : label, aide, erreur traduite, aria-invalid. */
const FormField = forwardRef(function FormField({ label, error, hint, type = 'text', as = 'input', className = '', ...props }, ref) {
  const { t } = useTranslation();
  const id = useId();
  const [show, setShow] = useState(false);
  const isPwd = type === 'password';
  const Tag = as;
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-forest">{label}</label>
      <div className="relative">
        <Tag id={id} ref={ref} type={isPwd && show ? 'text' : type} aria-invalid={!!error} aria-describedby={describedBy}
          className={`w-full rounded-2xl border-2 bg-white px-4 py-3 text-forest placeholder:text-ink-soft/60 transition focus:outline-none
            ${error ? 'border-red-600 focus:border-red-700' : 'border-forest/15 focus:border-emerald'} ${isPwd ? 'pr-12' : ''} ${as === 'textarea' ? 'min-h-24 resize-y' : ''}`}
          {...props} />
        {isPwd && (
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={t(show ? 'auth.hidePassword' : 'auth.showPassword')}
            className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-forest/60 hover:bg-forest/5 hover:text-forest">
            {show ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
          </button>
        )}
      </div>
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-soft">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm font-medium text-red-700">{t(error)}</p>}
    </div>
  );
});

export default FormField;
