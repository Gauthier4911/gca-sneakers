import { AnimatePresence } from 'framer-motion';
import ProductCard, { ProductCardSkeleton } from './ProductCard';

export default function ProductGrid({ products, loading, skeletons = 8, className = 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' }) {
  return (
    <div className={`grid gap-x-4 gap-y-8 md:gap-x-6 ${className}`}>
      {loading
        ? Array.from({ length: skeletons }, (_, i) => <ProductCardSkeleton key={i} />)
        : (
          <AnimatePresence mode="popLayout">
            {products.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
          </AnimatePresence>
        )}
    </div>
  );
}
