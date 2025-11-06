import React from 'react';
import { CadariLogo } from './CadariLogo';

export function Header() {
  return (
    <header className="bg-primary text-primary-foreground px-8 py-6 border-b border-sidebar-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <CadariLogo />
          <div className="hidden sm:block h-10 w-px bg-primary-foreground/20"></div>
          <div className="flex flex-col">
            <h1 className="text-2xl tracking-tight">Sistema de Gestão de Benefícios</h1>
            <p className="text-sm opacity-75 mt-0.5">Flash • Vale Transporte • Unimed • Empréstimos</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
            <span>RH</span>
          </div>
        </div>
      </div>
    </header>
  );
}