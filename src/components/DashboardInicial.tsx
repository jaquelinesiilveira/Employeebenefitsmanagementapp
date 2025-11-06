import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Users, Building2, Calendar, TrendingUp } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

export function DashboardInicial() {
  const [stats, setStats] = useState({
    funcionarios: 0,
    setores: 0,
    feriados: 0,
  });
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [funcRes, setoresRes, feriadosRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/funcionarios`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/setores`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/feriados`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        })
      ]);

      const funcData = await funcRes.json();
      const setoresData = await setoresRes.json();
      const feriadosData = await feriadosRes.json();

      setStats({
        funcionarios: funcData.length,
        setores: setoresData.length,
        feriados: feriadosData.length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
    setLoading(false);
  };

  const inicializarDadosExemplo = async () => {
    setInitializing(true);
    try {
      // Criar setores de exemplo
      const setoresExemplo = [
        { nome: 'Técnico', valorFlashDiario: 38.26 },
        { nome: 'Estagiário', valorFlashDiario: 19.13 },
        { nome: 'Administrativo', valorFlashDiario: 35.00 }
      ];

      for (const setor of setoresExemplo) {
        await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/setores`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify(setor)
        });
      }

      // Buscar setores criados para obter IDs
      const setoresRes = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/setores`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const setores = await setoresRes.json();

      // Criar funcionários de exemplo
      const funcionariosExemplo = [
        {
          nome: 'João Silva',
          setor: setores.find((s: any) => s.nome === 'Técnico')?.id,
          ativo: true,
          recebeValeTransportePeloFlash: true,
          usaBhBus: true,
          valorPassagemBhBus: 4.50,
          diasTrabalhadosNoMes: 22,
          diasHomeOfficeNoMes: 0,
          aniversario: '1990-03-15'
        },
        {
          nome: 'Maria Santos',
          setor: setores.find((s: any) => s.nome === 'Administrativo')?.id,
          ativo: true,
          recebeValeTransportePeloFlash: false,
          usaBhBus: true,
          valorPassagemBhBus: 4.50,
          diasTrabalhadosNoMes: 22,
          diasHomeOfficeNoMes: 2,
          aniversario: '1985-07-20'
        },
        {
          nome: 'Pedro Costa',
          setor: setores.find((s: any) => s.nome === 'Estagiário')?.id,
          ativo: true,
          recebeValeTransportePeloFlash: true,
          usaBhBus: true,
          valorPassagemBhBus: 4.50,
          diasTrabalhadosNoMes: 22,
          diasHomeOfficeNoMes: 0,
          aniversario: '2000-11-10'
        }
      ];

      for (const func of funcionariosExemplo) {
        await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/funcionarios`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify(func)
        });
      }

      // Criar feriados de exemplo para 2025
      const feriadosExemplo = [
        { data: '2025-01-01', tipo: 'feriado', descricao: 'Ano Novo' },
        { data: '2025-02-17', tipo: 'feriado', descricao: 'Carnaval' },
        { data: '2025-02-18', tipo: 'feriado', descricao: 'Carnaval' },
        { data: '2025-04-18', tipo: 'feriado', descricao: 'Sexta-feira Santa' },
        { data: '2025-04-21', tipo: 'feriado', descricao: 'Tiradentes' },
        { data: '2025-05-01', tipo: 'feriado', descricao: 'Dia do Trabalho' },
        { data: '2025-06-19', tipo: 'feriado', descricao: 'Corpus Christi' },
        { data: '2025-06-20', tipo: 'emenda', descricao: 'Emenda Corpus Christi' },
        { data: '2025-09-07', tipo: 'feriado', descricao: 'Independência' },
        { data: '2025-10-12', tipo: 'feriado', descricao: 'Nossa Senhora Aparecida' },
        { data: '2025-11-02', tipo: 'feriado', descricao: 'Finados' },
        { data: '2025-11-15', tipo: 'feriado', descricao: 'Proclamação da República' },
        { data: '2025-12-25', tipo: 'feriado', descricao: 'Natal' }
      ];

      for (const feriado of feriadosExemplo) {
        await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/feriados`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify(feriado)
        });
      }

      toast.success('Dados de exemplo criados com sucesso!');
      loadStats();
    } catch (error) {
      console.error('Error initializing data:', error);
      toast.error('Erro ao criar dados de exemplo');
    }
    setInitializing(false);
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="h-20 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="h-20 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="h-20 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const temDados = stats.funcionarios > 0 || stats.setores > 0;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Funcionários Ativos</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{stats.funcionarios}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Setores Cadastrados</CardTitle>
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{stats.setores}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Feriados no Calendário</CardTitle>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{stats.feriados}</div>
          </CardContent>
        </Card>
      </div>

      {!temDados && (
        <Card className="border-2 border-dashed">
          <CardHeader>
            <CardTitle>Bem-vindo ao Sistema de Gestão de Benefícios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Parece que você está começando. Você pode criar dados manualmente ou usar nossos dados de exemplo para testar o sistema.
            </p>
            <Button 
              onClick={inicializarDadosExemplo} 
              disabled={initializing}
              className="gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              {initializing ? 'Criando dados...' : 'Criar Dados de Exemplo'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle>Como usar o sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="bg-secondary text-secondary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              1
            </div>
            <div>
              <h4>Cadastre os Setores</h4>
              <p className="text-sm opacity-90">Configure os valores de Flash diário para cada setor (Ex: Técnico, Estagiário)</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-secondary text-secondary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              2
            </div>
            <div>
              <h4>Cadastre os Funcionários</h4>
              <p className="text-sm opacity-90">Adicione funcionários com seus setores, vale transporte e dias trabalhados</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-secondary text-secondary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              3
            </div>
            <div>
              <h4>Configure o Calendário</h4>
              <p className="text-sm opacity-90">Adicione feriados e emendas que serão descontados automaticamente</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-secondary text-secondary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
              4
            </div>
            <div>
              <h4>Calcule os Benefícios</h4>
              <p className="text-sm opacity-90">Na aba "Cálculos", selecione o mês e gere o relatório completo para exportar ao Flash</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
