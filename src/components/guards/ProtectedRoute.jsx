import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../hooks/useLang';
import PageLoader from '../ui/PageLoader';

/** Page réservée aux clients connectés → sinon redirection vers la connexion (avec retour). */
export default function ProtectedRoute({ children, reason }) {
  const { user, loading } = useAuth();
  const { to } = useLang();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={to('login', {}, `?next=${next}${reason ? `&reason=${reason}` : ''}`)} replace />;
  }
  return children;
}
