import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** Grande option cliquable du questionnaire, avec le nombre de paires correspondantes. */
export default function OptionCard({ label, count, selected, onClick, Icon, multi = false, compact = false }) {
  const { t } = useTranslation();
  const disabled = count === 0;
  return (
    <motion.button type="button" onClick={onClick} disabled={disabled}
      role={multi ? 'checkbox' : 'radio'} aria-checked={selected}
      whileHover={disabled ? undefined : { y: -3 }} whileTap={disabled ? undefined : { scale: 0.97 }}
      className={`relative flex w-full items-center gap-4 rounded-2xl border-2 text-left transition
        ${compact ? 'justify-center px-3 py-4' : 'px-5 py-4'}
        ${selected ? 'border-forest bg-forest text-white shadow-card' : 'border-forest/10 bg-white text-forest hover:border-emerald'}
        ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}>
      {Icon && (
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${selected ? 'bg-signature text-forest' : 'bg-mint-light text-emerald'}`}>
          <Icon className="h-6 w-6" aria-hidden />
        </span>
      )}
      <span className={`flex flex-col ${compact ? 'items-center' : ''}`}>
        <span className={`font-display font-semibold ${compact ? 'text-xl' : 'text-lg'}`}>{label}</span>
        {count != null && (
          <span className={`text-xs ${selected ? 'text-mint' : 'text-ink-soft'}`}>{t('finder.pairs', { count })}</span>
        )}
      </span>
      {selected && (
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-signature text-forest">
          <Check className="h-4 w-4" aria-hidden />
        </motion.span>
      )}
    </motion.button>
  );
}
