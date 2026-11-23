// src/ErrorBoundary.jsx
// Rete di sicurezza: se una schermata si rompe, invece della pagina bianca compare un messaggio
// chiaro con "Riprova" e "Ricarica l'app". L'errore viene segnalato in automatico (vedi
// errorReporting.js) e i dati dell'utente restano dove sono, sul telefono.

import React from 'react';
import { ArrowClockwise, Warning } from '@phosphor-icons/react';
import { reportError } from './errorReporting.js';

const BRICOLAGE = "'Bricolage Grotesque Variable', 'Bricolage Grotesque', sans-serif";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, retries: 0 };
    this.retry = this.retry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    reportError(error, { kind: 'react', componentStack: info && info.componentStack });
  }

  retry() {
    this.setState((s) => ({ error: null, retries: s.retries + 1 }));
  }

  render() {
    if (!this.state.error) return this.props.children;
    const en = typeof document !== 'undefined' && document.documentElement.lang === 'en';
    const canRetry = this.state.retries < 2;
    return (
      <div
        role="alert"
        className="min-h-[100dvh] w-full flex items-center justify-center px-6"
        style={{ background: 'radial-gradient(120% 60% at 50% -10%, #0B2318 0%, #050E0A 55%, #020604 100%)', color: '#ECF5EF', paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="w-full max-w-[380px]">
          <span
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: 'rgba(255,178,92,0.12)', border: '1px solid rgba(255,178,92,0.35)' }}
          >
            <Warning size={26} color="#FFB25C" weight="fill" />
          </span>
          <h1 style={{ fontFamily: BRICOLAGE, letterSpacing: '-0.02em' }} className="text-[28px] font-bold leading-[1.08] mb-3">
            {en ? 'Something got stuck' : 'Qualcosa si è inceppato'}
          </h1>
          <p className="text-[15px] leading-relaxed mb-2" style={{ color: '#C9D8CF' }}>
            {en
              ? 'This screen ran into a problem. Your data is safe on this phone: nothing has been lost.'
              : 'Questa schermata ha avuto un problema. I tuoi dati sono al sicuro su questo telefono: non si è perso niente.'}
          </p>
          <p className="text-[13px] leading-relaxed mb-8" style={{ color: '#9DB3A7' }}>
            {en
              ? 'The error is reported to us automatically, without any personal data.'
              : 'L\'errore ci viene segnalato in automatico, senza dati personali.'}
          </p>
          {canRetry && (
            <button type="button" onClick={this.retry} className="os-focus os-btn os-btn-primary w-full py-4 text-[14px] uppercase tracking-wide mb-3">
              {en ? 'Try again' : 'Riprova'}
            </button>
          )}
          <button
            type="button"
            onClick={() => { try { window.location.replace(window.location.pathname); } catch (err) { window.location.reload(); } }}
            className={`os-focus os-btn ${canRetry ? 'os-btn-ghost' : 'os-btn-primary'} w-full py-4 text-[14px] uppercase tracking-wide`}
          >
            <ArrowClockwise size={17} weight="bold" />{en ? 'Reload the app' : 'Ricarica l\'app'}
          </button>
        </div>
      </div>
    );
  }
}
