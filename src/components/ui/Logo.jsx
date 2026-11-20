import { motion, useReducedMotion } from 'framer-motion';
import { useId } from 'react';
import paths from './logo-paths.json';
import { useSettings } from '../../context/SettingsContext';

/**
 * Logo GCA sneakers en SVG, animé : la sneaker se dessine, puis la semelle
 * et le texte apparaissent. variant="light" pour les fonds vert forêt.
 */
export default function Logo({ variant = 'color', animate = true, className = 'h-10 w-auto', title = 'GCA sneakers' }) {
  const reduce = useReducedMotion();
  const { settings } = useSettings();
  // Logo personnalisé envoyé depuis l'admin (sinon : logo animé d'origine)
  const custom = variant === 'light' ? (settings.logo_light_url || settings.logo_url) : settings.logo_url;
  const gid = useId().replace(/:/g, '');
  const shoe = variant === 'light' ? '#FFFFFF' : '#047857';
  const word = variant === 'light' ? '#FFFFFF' : '#053B2C';
  const gold = `url(#g${gid})`;
  const play = animate && !reduce;

  const draw = (delay) => (play
    ? { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { duration: 1, delay, ease: 'easeInOut' } }
    : {});
  const fade = (delay) => (play
    ? { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay } }
    : {});
  const stroke = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };

  if (custom && /^https:\/\//.test(custom)) {
    return <img src={custom} alt={title} className={`${className} object-contain`} decoding="async" />;
  }
  return (
    <svg viewBox={paths.viewBox} className={className} role="img" aria-label={title}>
      <title>{title}</title>
      <defs>
        <linearGradient id={`g${gid}`} gradientUnits="userSpaceOnUse" x1="84" y1="0" x2="520" y2="0">
          <stop offset="0" stopColor="#FFB800" />
          <stop offset="1" stopColor="#FF7A00" />
        </linearGradient>
      </defs>
      <motion.path d={paths.upper} stroke={shoe} strokeWidth="16" {...stroke} {...draw(0)} />
      <motion.path d={paths.loop} stroke={shoe} strokeWidth="13" {...stroke} {...draw(0.6)} />
      <motion.path d={paths.laces} stroke={shoe} strokeWidth="13" {...stroke} {...draw(0.8)} />
      <motion.path d={paths.sole} stroke={gold} strokeWidth="16" {...stroke} {...draw(0.9)} />
      <motion.path d={paths.pathA} fill={gold} {...fade(1.1)} />
      <motion.path d={paths.pathB} fill={word} {...fade(1.25)} />
    </svg>
  );
}
