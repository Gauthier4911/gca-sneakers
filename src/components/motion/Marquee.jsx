/**
 * Bandeau qui défile en continu (style streetwear). Le contenu est dupliqué
 * pour une boucle parfaite ; l'animation s'arrête si l'utilisateur réduit les animations.
 */
export default function Marquee({ items, className = '', itemClassName = '', speed = 30, reverse = false, separator = '✦' }) {
  const row = (
    <div className="flex shrink-0 items-center gap-8 pr-8" aria-hidden>
      {items.map((it, i) => (
        <span key={i} className={`flex items-center gap-8 whitespace-nowrap ${itemClassName}`}>
          {it}<span className="opacity-70">{separator}</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className={`group relative flex overflow-hidden ${className}`}>
      <span className="sr-only">{items.join(' · ')}</span>
      <div className="marquee-track flex" style={{ animationDuration: `${speed}s`, animationDirection: reverse ? 'reverse' : 'normal' }}>
        {row}{row}
      </div>
    </div>
  );
}
