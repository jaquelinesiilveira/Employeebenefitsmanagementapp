import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Plus, HeartPulse, DollarSign } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Funcionario {
  id: string;
  nome: string;
  setor: string;
  ativo: boolean;
}

interface CoparticipacaoSaude {
  id: string;
  funcionarioId: string;
  mes: string;
  valor: number;
}

interface Emprestimo {
  id: string;
  funcionarioId: string;
  valor: number;
  parcelasTotal: number;
  parcelasPagas: number;
  dataSolicitacao: string;
}

export function BeneficiosTab() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [coparticipacoes, setCoparticipacoes] = useState<CoparticipacaoSaude[]>([]);
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogCopartOpen, setDialogCopartOpen] = useState(false);
  const [dialogEmprestimoOpen, setDialogEmprestimoOpen] = useState(false);

  const [formCopart, setFormCopart] = useState({
    funcionarioId: '',
    mes: '',
    valor: ''
  });

  const [formEmprestimo, setFormEmprestimo] = useState({
    funcionarioId: '',
    valor: '',
    parcelasTotal: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [funcRes, copartRes, emprestimosRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/funcionarios`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/coparticipacao`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/emprestimos`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        })
      ]);

      const funcData = await funcRes.json();
      const copartData = await copartRes.json();
      const emprestimosData = await emprestimosRes.json();

      setFuncionarios(funcData.filter((f: Funcionario) => f.ativo));
      setCoparticipacoes(copartData);
      setEmprestimos(emprestimosData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    }
    setLoading(false);
  };

  const handleSaveCopart = async () => {
    try {
      const copart = {
        funcionarioId: formCopart.funcionarioId,
        mes: formCopart.mes,
        valor: parseFloat(formCopart.valor)
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/coparticipacao`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify(copart)
        }
      );

      if (response.ok) {
        toast.success('Coparticipação registrada!');
        setDialogCopartOpen(false);
        resetFormCopart();
        loadData();
      } else {
        const error = await response.json();
        toast.error('Erro ao salvar: ' + error.error);
      }
    } catch (error) {
      console.error('Error saving coparticipacao:', error);
      toast.error('Erro ao salvar coparticipação');
    }
  };

  const handleSaveEmprestimo = async () => {
    try {
      const emprestimo = {
        funcionarioId: formEmprestimo.funcionarioId,
        valor: parseFloat(formEmprestimo.valor),
        parcelasTotal: parseInt(formEmprestimo.parcelasTotal)
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/emprestimos`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify(emprestimo)
        }
      );

      if (response.ok) {
        toast.success('Empréstimo cadastrado!');
        setDialogEmprestimoOpen(false);
        resetFormEmprestimo();
        loadData();
      } else {
        const error = await response.json();
        toast.error('Erro ao salvar: ' + error.error);
      }
    } catch (error) {
      console.error('Error saving emprestimo:', error);
      toast.error('Erro ao salvar empréstimo');
    }
  };

  const resetFormCopart = () => {
    setFormCopart({ funcionarioId: '', mes: '', valor: '' });
  };

  const resetFormEmprestimo = () => {
    setFormEmprestimo({ funcionarioId: '', valor: '', parcelasTotal: '' });
  };

  const getFuncionarioNome = (id: string) => {
    return funcionarios.find(f => f.id === id)?.nome || '-';
  };

  const formatMes = (mes: string) => {
    const [ano, mesNum] = mes.split('-');
    const date = new Date(parseInt(ano), parseInt(mesNum) - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Coparticipação Saúde */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-primary" />
            <CardTitle>Coparticipação Saúde Unimed</CardTitle>
          </div>
          <Dialog open={dialogCopartOpen} onOpenChange={(open) => {
            setDialogCopartOpen(open);
            if (!open) resetFormCopart();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Coparticipação</DialogTitle>
                <DialogDescription>Adicione uma nova coparticipação de saúde para um funcionário.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="funcCopart">Funcionário</Label>
                  <Select value={formCopart.funcionarioId} onValueChange={(value) => setFormCopart({ ...formCopart, funcionarioId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      {funcionarios.map(func => (
                        <SelectItem key={func.id} value={func.id}>
                          {func.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="mesCopart">Mês de Referência</Label>
                  <Input
                    id="mesCopart"
                    type="month"
                    value={formCopart.mes}
                    onChange={(e) => setFormCopart({ ...formCopart, mes: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="valorCopart">Valor (R$)</Label>
                  <Input
                    id="valorCopart"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formCopart.valor}
                    onChange={(e) => setFormCopart({ ...formCopart, valor: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Este valor será descontado do funcionário no mês selecionado
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveCopart} className="flex-1">Salvar</Button>
                  <Button variant="outline" onClick={() => setDialogCopartOpen(false)} className="flex-1">Cancelar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : coparticipacoes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum registro</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {coparticipacoes.map((copart) => (
                <div key={copart.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p>{getFuncionarioNome(copart.funcionarioId)}</p>
                      <p className="text-sm text-muted-foreground capitalize">{formatMes(copart.mes)}</p>
                    </div>
                    <p className="text-destructive">- R$ {copart.valor.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empréstimos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <CardTitle>Empréstimos</CardTitle>
          </div>
          <Dialog open={dialogEmprestimoOpen} onOpenChange={(open) => {
            setDialogEmprestimoOpen(open);
            if (!open) resetFormEmprestimo();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar Empréstimo</DialogTitle>
                <DialogDescription>Adicione um novo empréstimo para um funcionário.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="funcEmprestimo">Funcionário</Label>
                  <Select value={formEmprestimo.funcionarioId} onValueChange={(value) => setFormEmprestimo({ ...formEmprestimo, funcionarioId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      {funcionarios.map(func => (
                        <SelectItem key={func.id} value={func.id}>
                          {func.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="valorEmprestimo">Valor Total (R$)</Label>
                  <Input
                    id="valorEmprestimo"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formEmprestimo.valor}
                    onChange={(e) => setFormEmprestimo({ ...formEmprestimo, valor: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="parcelas">Número de Parcelas</Label>
                  <Input
                    id="parcelas"
                    type="number"
                    placeholder="Ex: 12"
                    value={formEmprestimo.parcelasTotal}
                    onChange={(e) => setFormEmprestimo({ ...formEmprestimo, parcelasTotal: e.target.value })}
                  />
                  {formEmprestimo.valor && formEmprestimo.parcelasTotal && (
                    <p className="text-sm text-muted-foreground">
                      Valor da parcela: R$ {(parseFloat(formEmprestimo.valor) / parseInt(formEmprestimo.parcelasTotal)).toFixed(2)}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveEmprestimo} className="flex-1">Salvar</Button>
                  <Button variant="outline" onClick={() => setDialogEmprestimoOpen(false)} className="flex-1">Cancelar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : emprestimos.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum empréstimo ativo</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {emprestimos.map((emp) => {
                const parcelaRestante = emp.parcelasTotal - emp.parcelasPagas;
                const valorParcela = emp.valor / emp.parcelasTotal;
                const valorRestante = valorParcela * parcelaRestante;
                
                return (
                  <div key={emp.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p>{getFuncionarioNome(emp.funcionarioId)}</p>
                        <p className="text-sm text-muted-foreground">
                          {emp.parcelasPagas}/{emp.parcelasTotal} parcelas pagas
                        </p>
                      </div>
                      <div className="text-right">
                        <p>R$ {valorParcela.toFixed(2)}/mês</p>
                        <p className="text-sm text-muted-foreground">
                          Restante: R$ {valorRestante.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-secondary h-2 rounded-full transition-all"
                        style={{ width: `${(emp.parcelasPagas / emp.parcelasTotal) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}