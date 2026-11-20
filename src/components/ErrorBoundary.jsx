import { Component } from 'react';
import i18n from '../lib/i18n';

/**
 * Filet de sécurité : si un composant plante, on affiche un message traduit
 * avec un bouton « Réessayer » au lieu d'une page blanche.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[GCA sneakers]', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const t = i18n.t.bind(i18n);
    return (
      <div role="alert" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#053B2C', color: '#fff', padding: 24, fontFamily: 'Inter, system-ui, sans-serif', textAlign: 'center' }}>
        <div style={{ maxWidth: 440 }}>
          <img src="/logo/gca-logo-white.svg" alt="GCA sneakers" width="180" style={{ margin: '0 auto 24px', height: 'auto' }} />
          <p style={{ fontSize: 20, fontWeight: 600 }}>{t('common.error')}</p>
          <button type="button" onClick={() => window.location.reload()}
            style={{ marginTop: 20, background: 'linear-gradient(90deg,#FFB800,#FF7A00)', color: '#053B2C', border: 0, borderRadius: 999, padding: '12px 28px', fontWeight: 700, cursor: 'pointer' }}>
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }
}
