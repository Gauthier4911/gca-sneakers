import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Baby, Briefcase, Dumbbell, Footprints, GraduationCap, Mountain, PartyPopper,
  RotateCcw, Shirt, Sparkles, Sun, Trophy, User, UserRound, Wallet,
} from 'lucide-react';
import Seo from '../components/seo/Seo';
import OptionCard from '../components/finder/OptionCard';
import Button from '../components/ui/Button';
import PageLoader from '../components/ui/PageLoader';
import { useCatalog } from '../hooks/useCatalog';
import { useLang } from '../hooks/useLang';
import { useSettings } from '../context/SettingsContext';
import { BUDGETS } from '../lib/catalog';
import { answersToSearch, countMatches, EMPTY_ANSWERS } from '../lib/finder';
import { formatSize } from '../lib/format';

const STEPS = ['gender', 'type', 'size', 'usage', 'budget', 'style'];
const GENDER_ICONS = { men: User, women: UserRound, kids: Baby };
const TYPE_ICONS = { sneakers: Footprints, city: Shirt, sport: Trophy, boots: Mountain, sandals: Sun, formal: Briefcase, school: GraduationCap, slippers: Sun };
const USAGE_ICONS = { daily: Footprints, work: Briefcase, sport: Dumbbell, ceremony: PartyPopper, hiking: Mountain };
const STORAGE = 'gca-finder';

/**
 * Questionnaire « Trouvez votre paire » : une question par écran, chaque
 * option affiche combien de paires EN STOCK y correspondent (calcul sur le
 * catalogue réel), donc on ne propose jamais une impasse.
 */
export default function Finder() {
  const { t } = useTranslation();
  const { to } = useLang();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { products, loading } = useCatalog();
  const [answers, setAnswers] = useState(() => {
    try { return { ...EMPTY_ANSWERS, ...JSON.parse(sessionStorage.getItem(STORAGE) || '{}') }; } catch { return EMPTY_ANSWERS; }
  });
  const [step, setStep] = useState(0); // 0..5 questions, 6 = résumé
  const [dir, setDir] = useState(1);
  const headingRef = useRef(null);

  useEffect(() => { try { sessionStorage.setItem(STORAGE, JSON.stringify(answers)); } catch { /* ignore */ } }, [answers]);
  useEffect(() => { headingRef.current?.focus(); }, [step]);

  const goTo = (s) => { setDir(s > step ? 1 : -1); setStep(s); };
  const next = () => goTo(step + 1);
  const back = () => goTo(Math.max(0, step - 1));

  // Réponse à une étape : on efface les réponses suivantes devenues incohérentes
  const answer = (patch, advance = true) => {
    setAnswers((a) => {
      const n = { ...a, ...patch };
      if ('gender' in patch && patch.gender !== a.gender) Object.assign(n, { type: null, size: null, usages: [], colors: [], materials: [] });
      if ('type' in patch && patch.type !== a.type) Object.assign(n, { size: null, colors: [], materials: [] });
      return n;
    });
    if (advance) setTimeout(next, 180);
  };
  const toggleIn = (key, v) => setAnswers((a) => ({ ...a, [key]: a[key].includes(v) ? a[key].filter((x) => x !== v) : [...a[key], v] }));

  // Comptes en direct
  const count = (patch) => countMatches(products, { ...answers, ...patch });
  const scoped = useMemo(() => products.filter((p) => (!answers.gender || p.gender === answers.gender)
    && (!answers.type || p.shoe_type === answers.type)), [products, answers.gender, answers.type]);
  const uniq = (arr) => [...new Set(arr.filter((x) => x != null))];
  const types = uniq(products.filter((p) => p.gender === answers.gender && p.variants.some((v) => v.stock > 0)).map((p) => p.shoe_type));
  const sizes = uniq(scoped.flatMap((p) => p.variants.filter((v) => v.stock > 0).map((v) => v.size))).sort((a, b) => a - b);
  const usages = uniq(scoped.flatMap((p) => p.usages ?? []));
  const colors = uniq(scoped.map((p) => p.color));
  const materials = uniq(scoped.map((p) => p.material));

  if (loading) return <PageLoader />;

  const stepId = STEPS[step];
  const total = STEPS.length;
  const progress = Math.min(step, total) / total;
  const canNext = { gender: !!answers.gender, size: answers.size != null }[stepId] ?? true;

  const title = step < total ? t(`finder.steps.${stepId}.title`) : t('finder.summary.title');
  const hint = step < total
    ? (stepId === 'size' && answers.gender === 'kids' ? t('finder.steps.size.kidsHint') : t(`finder.steps.${stepId}.hint`, { currency: settings.currency }))
    : t('finder.summary.hint');

  const any = t('finder.summary.any');
  const summary = [
    ['gender', 0, answers.gender ? t(`enums.gender.${answers.gender}`) : any],
    ['type', 1, answers.type ? t(`enums.shoeType.${answers.type}`) : any],
    ['size', 2, answers.size != null ? formatSize(answers.size) : any],
    ['usage', 3, answers.usages.length ? answers.usages.map((u) => t(`enums.usage.${u}`)).join(', ') : any],
    ['budget', 4, answers.budget ? `${t(`enums.budget.${answers.budget}`)} ${settings.currency}` : any],
    ['color', 5, answers.colors.length ? answers.colors.map((c) => t(`enums.color.${c}`)).join(', ') : any],
    ['material', 5, answers.materials.length ? answers.materials.map((m) => t(`enums.material.${m}`)).join(', ') : any],
  ];
  const matches = countMatches(products, answers);

  return (
    <div className="relative overflow-hidden">
      <Seo title={t('finder.seoTitle')} description={t('finder.seoDescription')} />
      <div aria-hidden className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gold/15 blur-3xl" />
      <div aria-hidden className="absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-mint/20 blur-3xl" />

      <div className="relative mx-auto max-w-3xl px-4 py-10 md:py-14">
        {/* Barre de progression */}
        <div className="flex items-center gap-4">
          <button type="button" onClick={back} disabled={step === 0}
            className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-forest transition hover:bg-forest/5 disabled:invisible">
            <ArrowLeft className="h-4 w-4" aria-hidden /> {t('finder.back')}
          </button>
          <div className="flex-1">
            <div className="h-2.5 overflow-hidden rounded-full bg-forest/10" role="progressbar" aria-valuemin={0} aria-valuemax={total}
              aria-valuenow={Math.min(step + 1, total)} aria-label={t('finder.progress', { current: Math.min(step + 1, total), total })}>
              <motion.div className="h-full rounded-full bg-signature" animate={{ width: `${Math.max(progress, 0.04) * 100}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
            </div>
          </div>
          <span className="w-16 text-right text-sm font-semibold text-ink-soft">{Math.min(step + 1, total)}/{total}</span>
        </div>

        <AnimatePresence mode="wait" custom={dir}>
          <motion.section key={step} custom={dir}
            initial={(d) => ({ opacity: 0, x: d * 60 })} animate={{ opacity: 1, x: 0 }} exit={(d) => ({ opacity: 0, x: d * -60 })}
            transition={{ duration: 0.3, ease: 'easeOut' }} className="mt-10" aria-labelledby="finder-title">
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald">
              <Sparkles className="mr-1 inline h-4 w-4 text-gold" aria-hidden />
              {step < total ? t('finder.progress', { current: step + 1, total }) : t('nav.finder')}
            </p>
            <h1 id="finder-title" ref={headingRef} tabIndex={-1} className="mt-2 font-display text-3xl font-bold text-forest outline-none md:text-4xl">{title}</h1>
            <p className="mt-2 text-ink-soft">{hint}</p>

            <div className="mt-8">
              {stepId === 'gender' && (
                <div role="radiogroup" aria-labelledby="finder-title" className="grid gap-3 sm:grid-cols-3">
                  {['men', 'women', 'kids'].map((g) => (
                    <OptionCard key={g} label={t(`enums.gender.${g}`)} Icon={GENDER_ICONS[g]} selected={answers.gender === g}
                      count={countMatches(products, { ...EMPTY_ANSWERS, gender: g })} onClick={() => answer({ gender: g })} />
                  ))}
                </div>
              )}

              {stepId === 'type' && (
                <div role="radiogroup" aria-labelledby="finder-title" className="grid gap-3 sm:grid-cols-2">
                  {types.map((v) => (
                    <OptionCard key={v} label={t(`enums.shoeType.${v}`)} Icon={TYPE_ICONS[v]} selected={answers.type === v}
                      count={count({ type: v, size: null, usages: [], budget: null, colors: [], materials: [] })} onClick={() => answer({ type: v })} />
                  ))}
                  <OptionCard label={t('finder.skip')} Icon={Sparkles} selected={false}
                    count={count({ type: null, size: null, usages: [], budget: null, colors: [], materials: [] })} onClick={() => answer({ type: null })} />
                </div>
              )}

              {stepId === 'size' && (
                <div role="radiogroup" aria-labelledby="finder-title" className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {sizes.map((s) => (
                    <OptionCard key={s} compact label={formatSize(s)} selected={answers.size === s}
                      count={count({ size: s, usages: [], budget: null, colors: [], materials: [] })} onClick={() => answer({ size: s })} />
                  ))}
                </div>
              )}

              {stepId === 'usage' && (
                <div className="grid gap-3 sm:grid-cols-2" role="group" aria-labelledby="finder-title">
                  {usages.map((u) => (
                    <OptionCard key={u} multi label={t(`enums.usage.${u}`)} Icon={USAGE_ICONS[u]} selected={answers.usages.includes(u)}
                      count={count({ usages: [u], budget: null, colors: [], materials: [] })} onClick={() => toggleIn('usages', u)} />
                  ))}
                </div>
              )}

              {stepId === 'budget' && (
                <div role="radiogroup" aria-labelledby="finder-title" className="grid gap-3 sm:grid-cols-2">
                  {BUDGETS.map((b) => (
                    <OptionCard key={b.id} label={`${t(`enums.budget.${b.id}`)} ${settings.currency}`} Icon={Wallet}
                      selected={answers.budget === b.id} count={count({ budget: b.id, colors: [], materials: [] })}
                      onClick={() => answer({ budget: b.id })} />
                  ))}
                  <OptionCard label={t('finder.skip')} Icon={Sparkles} selected={false}
                    count={count({ budget: null, colors: [], materials: [] })} onClick={() => answer({ budget: null })} />
                </div>
              )}

              {stepId === 'style' && (
                <div className="space-y-6">
                  {colors.length > 0 && (
                    <div role="group" aria-label={t('finder.steps.style.color')}>
                      <h2 className="mb-3 font-display font-semibold text-forest">{t('finder.steps.style.color')}</h2>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {colors.map((c) => (
                          <OptionCard key={c} multi label={t(`enums.color.${c}`)} selected={answers.colors.includes(c)}
                            count={count({ colors: [c], materials: [] })} onClick={() => toggleIn('colors', c)} />
                        ))}
                      </div>
                    </div>
                  )}
                  {materials.length > 0 && (
                    <div role="group" aria-label={t('finder.steps.style.material')}>
                      <h2 className="mb-3 font-display font-semibold text-forest">{t('finder.steps.style.material')}</h2>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {materials.map((m) => (
                          <OptionCard key={m} multi label={t(`enums.material.${m}`)} selected={answers.materials.includes(m)}
                            count={count({ materials: [m] })} onClick={() => toggleIn('materials', m)} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === total && (
                <div>
                  <dl className="divide-y divide-forest/10 overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-forest/5">
                    {summary.map(([key, s, value]) => (
                      <div key={key} className="flex items-center justify-between gap-4 px-5 py-4">
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{t(`finder.summary.labels.${key}`)}</dt>
                          <dd className="mt-0.5 font-display font-semibold text-forest">{value}</dd>
                        </div>
                        <button type="button" onClick={() => goTo(s)}
                          className="rounded-full px-3 py-1.5 text-sm font-semibold text-amber hover:bg-gold/10">
                          {t('finder.summary.edit')}<span className="sr-only"> : {t(`finder.summary.labels.${key}`)}</span>
                        </button>
                      </div>
                    ))}
                  </dl>
                  <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`mt-6 rounded-2xl px-5 py-4 font-semibold ${matches ? 'bg-mint-light text-forest' : 'bg-gold/15 text-forest'}`}>
                    {t('finder.summary.matches', { count: matches })}
                  </motion.p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Button size="lg" onClick={() => navigate(to('shop', {}, answersToSearch(answers)))}>
                      <Sparkles className="h-5 w-5" aria-hidden /> {t('finder.summary.cta')}
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => { setAnswers(EMPTY_ANSWERS); goTo(0); }}>
                      <RotateCcw className="h-5 w-5" aria-hidden /> {t('finder.restart')}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation des étapes à choix multiples / facultatives */}
            {step < total && (
              <div className="mt-10 flex flex-wrap items-center justify-end gap-3">
                {['usage', 'style'].includes(stepId) && (
                  <Button variant="outline" onClick={() => {
                    setAnswers((a) => (stepId === 'usage' ? { ...a, usages: [] } : { ...a, colors: [], materials: [] })); next();
                  }}>{t('finder.skip')}</Button>
                )}
                <Button onClick={next} disabled={!canNext}>{t('finder.next')} <ArrowRight className="h-5 w-5" aria-hidden /></Button>
              </div>
            )}
          </motion.section>
        </AnimatePresence>
      </div>
    </div>
  );
}
