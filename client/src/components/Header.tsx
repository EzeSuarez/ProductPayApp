import React from 'react';
import { useTranslation } from '../i18n/useTranslation';

interface HeaderProps {
  currentStep: number;
}

export const Header: React.FC<HeaderProps> = ({ currentStep }) => {
  const { t, language, setLanguage } = useTranslation();

  return (
    <header className="sticky top-0 z-30 bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-950 font-bold text-sm tracking-tighter shadow-sm">
            PP
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wider uppercase text-zinc-100">
              {t.appName}
            </h1>
            <p className="text-[10px] text-zinc-400 font-mono tracking-tight uppercase">
              {t.sandboxCheckout}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Language Selector (ES / EN) */}
          <div
            role="group"
            aria-label="Language Selector"
            className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-[11px] font-mono"
          >
            <button
              type="button"
              id="lang-es-btn"
              onClick={() => setLanguage('es')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                language === 'es'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ES
            </button>
            <button
              type="button"
              id="lang-en-btn"
              onClick={() => setLanguage('en')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                language === 'en'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              EN
            </button>
          </div>

          <span className="hidden xs:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
            {t.uatSandbox}
          </span>

          {currentStep > 1 && (
            <span className="text-[11px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
              {t.stepCounter(currentStep, 4)}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
