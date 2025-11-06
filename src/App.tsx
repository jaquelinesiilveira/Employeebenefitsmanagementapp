import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Toaster } from './components/ui/sonner';
import { Header } from './components/Header';
import { DashboardInicial } from './components/DashboardInicial';
import { FuncionariosTab } from './components/FuncionariosTab';
import { SetoresTab } from './components/SetoresTab';
import { CalendarioTab } from './components/CalendarioTab';
import { BeneficiosTab } from './components/BeneficiosTab';
import { CalculoMensalTab } from './components/CalculoMensalTab';
import { Users, Building2, Calendar, Calculator, HeartPulse, LayoutDashboard } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Início</span>
            </TabsTrigger>
            <TabsTrigger value="calculos" className="gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Cálculos</span>
            </TabsTrigger>
            <TabsTrigger value="funcionarios" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Funcionários</span>
            </TabsTrigger>
            <TabsTrigger value="setores" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Setores</span>
            </TabsTrigger>
            <TabsTrigger value="calendario" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendário</span>
            </TabsTrigger>
            <TabsTrigger value="beneficios" className="gap-2">
              <HeartPulse className="h-4 w-4" />
              <span className="hidden sm:inline">Outros</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardInicial />
          </TabsContent>

          <TabsContent value="calculos">
            <CalculoMensalTab />
          </TabsContent>

          <TabsContent value="funcionarios">
            <FuncionariosTab />
          </TabsContent>

          <TabsContent value="setores">
            <SetoresTab />
          </TabsContent>

          <TabsContent value="calendario">
            <CalendarioTab />
          </TabsContent>

          <TabsContent value="beneficios">
            <BeneficiosTab />
          </TabsContent>
        </Tabs>

        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>Sistema de Gestão de Benefícios - Cadari Engenharia</p>
          <p className="mt-2">
            Flash • Vale Transporte • Unimed • Empréstimos
          </p>
        </div>
      </main>

      <Toaster position="top-right" />
    </div>
  );
}