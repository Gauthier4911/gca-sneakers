import { motion, useReducedMotion } from 'framer-motion';

/**
 * Texte révélé mot par mot (chaque mot « monte » derrière un masque).
 * as : balise ; inView : se déclenche à l'apparition au scroll.
 */
export default function SplitText({ text, className = '', wordClassName = '', delay = 0, stagger = 0.06, inView = false }) {
  const reduce = useReducedMotion();
  const words = String(text ?? '').split(' ');
  if (reduce) return <span className={className}>{text}</span>;
  const trigger = inView
    ? { initial: 'hidden', whileInView: 'show', viewport: { once: true, margin: '-40px' } }
    : { initial: 'hidden', animate: 'show' };
  return (
    <motion.span className={className} {...trigger} transition={{ staggerChildren: stagger, delayChildren: delay }} aria-label={text}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} aria-hidden className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span className={`inline-block ${wordClassName}`}
            variants={{ hidden: { y: '110%', rotate: 6 }, show: { y: '0%', rotate: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } } }}>
            {w}
          </motion.span>
          {i < words.length - 1 && ' '}
        </span>
      ))}
    </motion.span>
  );
}
