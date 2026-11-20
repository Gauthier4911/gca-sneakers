import { motion } from 'framer-motion';
import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

const VARIANTS = {
  // Dégradé signature : texte vert forêt (contraste 7:1)
  primary: 'btn-shine bg-signature text-forest shadow-glow hover:brightness-105',
  secondary: 'bg-emerald text-white hover:bg-emerald-800',
  outline: 'border-2 border-current text-forest hover:bg-forest hover:text-white',
  ghostLight: 'border-2 border-white/70 text-white hover:bg-white hover:text-forest',
};
const SIZES = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-3 text-base', lg: 'px-8 py-4 text-lg' };

/** Bouton réutilisable (button, lien interne `to` ou externe `href`) avec micro-interactions. */
const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', to, href, className = '', children, ...props }, ref,
) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-full font-display font-semibold
    transition-[background,color,filter] duration-200 focus-visible:outline focus-visible:outline-4
    focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-50 disabled:pointer-events-none
    ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
  const motionProps = { whileHover: { y: -2 }, whileTap: { scale: 0.96 } };

  if (to) return <motion.div {...motionProps} className="inline-flex"><Link ref={ref} to={to} className={cls} {...props}>{children}</Link></motion.div>;
  if (href) return <motion.a ref={ref} href={href} className={cls} {...motionProps} {...props}>{children}</motion.a>;
  return <motion.button ref={ref} className={cls} {...motionProps} {...props}>{children}</motion.button>;
});

export default Button;
