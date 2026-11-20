import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageLoader from '../ui/PageLoader';

/**
 * Accès /admin seulement si profiles.role === 'admin'. C'est un confort
 * d'affichage : même en contournant ce composant, la RLS et les fonctions SQL
 * refusent toute écriture à un non-admin.
 */
export default function AdminRoute({ children }) {
  const { user, isAdmin, loading, profile } = useAuth();
  if (loading || (user && !profile)) return <PageLoader />;
  if (!user) return <Navigate to="/fr/connexion?next=%2Fadmin" replace />;
  if (!isAdmin) return <Navigate to="/fr" replace />;
  return children;
}
