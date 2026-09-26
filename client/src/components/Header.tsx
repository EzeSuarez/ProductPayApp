import React from 'react';

interface HeaderProps {
  currentStep: number;
}

export const Header: React.FC<HeaderProps> = ({ currentStep }) => {
  return (
    <header className="sticky top-0 z-30 bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3.5 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-950 font-bold text-sm tracking-tighter shadow-sm">
            PP
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wider uppercase text-zinc-100">
              ProductPay
            </h1>
            <p className="text-[10px] text-zinc-400 font-mono tracking-tight uppercase">
              Sandbox Checkout
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
            UAT SANDBOX
          </span>
          {currentStep > 1 && (
            <span className="text-[11px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
              Step {currentStep}/4
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
