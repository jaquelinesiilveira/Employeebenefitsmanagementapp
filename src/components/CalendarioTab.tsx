import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Plus, Trash2, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface FeriadoOuEmenda {
  id: string;
  data: string;
  tipo: 'feriado' | 'emenda';
  descricao: string;
}

// Função para calcular feriados fixos e móveis
const calcularFeriadosAutomaticos = (ano: number): Omit<FeriadoOuEmenda, 'id'>[] => {
  const feriados: Omit<FeriadoOuEmenda, 'id'>[] = [];

  // Feriados Fixos Nacionais
  feriados.push({ data: `${ano}-01-01`, tipo: 'feriado', descricao: 'Ano Novo' });
  feriados.push({ data: `${ano}-04-21`, tipo: 'feriado', descricao: 'Tiradentes' });
  feriados.push({ data: `${ano}-05-01`, tipo: 'feriado', descricao: 'Dia do Trabalho' });
  feriados.push({ data: `${ano}-09-07`, tipo: 'feriado', descricao: 'Independência do Brasil' });
  feriados.push({ data: `${ano}-10-12`, tipo: 'feriado', descricao: 'Nossa Senhora Aparecida' });
  feriados.push({ data: `${ano}-11-02`, tipo: 'feriado', descricao: 'Finados' });
  feriados.push({ data: `${ano}-11-15`, tipo: 'feriado', descricao: 'Proclamação da República' });
  feriados.push({ data: `${ano}-11-20`, tipo: 'feriado', descricao: 'Consciência Negra' });
  feriados.push({ data: `${ano}-12-25`, tipo: 'feriado', descricao: 'Natal' });

  // Calcular Páscoa (Algoritmo de Meeus/Jones/Butcher)
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;

  const pascoa = new Date(ano, mes - 1, dia);

  // Carnaval (47 dias antes da Páscoa)
  const carnaval = new Date(pascoa);
  carnaval.setDate(pascoa.getDate() - 47);
  feriados.push({
    data: carnaval.toISOString().split('T')[0],
    tipo: 'feriado',
    descricao: 'Carnaval'
  });

  // Sexta-feira Santa (2 dias antes da Páscoa)
  const sextaFeira = new Date(pascoa);
  sextaFeira.setDate(pascoa.getDate() - 2);
  feriados.push({
    data: sextaFeira.toISOString().split('T')[0],
    tipo: 'feriado',
    descricao: 'Sexta-feira Santa'
  });

  // Corpus Christi (60 dias após a Páscoa)
  const corpusChristi = new Date(pascoa);
  corpusChristi.setDate(pascoa.getDate() + 60);
  feriados.push({
    data: corpusChristi.toISOString().split('T')[0],
    tipo: 'feriado',
    descricao: 'Corpus Christi'
  });

  // Calcular Emendas (Quinta-feira e Terça-feira)
  const feriadosComEmendas = [...feriados];
  feriados.forEach((feriado) => {
    const dataFeriado = new Date(feriado.data + 'T00:00:00');
    const diaSemana = dataFeriado.getDay();

    // Se feriado cai na Quinta (4), sexta vira emenda
    if (diaSemana === 4) {
      const emenda = new Date(dataFeriado);
      emenda.setDate(dataFeriado.getDate() + 1);
      feriadosComEmendas.push({
        data: emenda.toISOString().split('T')[0],
        tipo: 'emenda',
        descricao: `Emenda ${feriado.descricao}`
      });
    }

    // Se feriado cai na Terça (2), segunda vira emenda
    if (diaSemana === 2) {
      const emenda = new Date(dataFeriado);
      emenda.setDate(dataFeriado.getDate() - 1);
      feriadosComEmendas.push({
        data: emenda.toISOString().split('T')[0],
        tipo: 'emenda',
        descricao: `Emenda ${feriado.descricao}`
      });
    }
  });

  return feriadosComEmendas;
};

export function CalendarioTab() {
  const [feriados, setFeriados] = useState<FeriadoOuEmenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [anoGerar, setAnoGerar] = useState(new Date().getFullYear());

  const [formData, setFormData] = useState({
    data: '',
    tipo: 'feriado' as 'feriado' | 'emenda',
    descricao: ''
  });

  useEffect(() => {
    loadFeriados();
  }, []);

  const loadFeriados = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/feriados`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );
      const data = await response.json();
      setFeriados(data.sort((a: FeriadoOuEmenda, b: FeriadoOuEmenda) => 
        new Date(a.data).getTime() - new Date(b.data).getTime()
      ));
    } catch (error) {
      console.error('Error loading feriados:', error);
      toast.error('Erro ao carregar calendário');
    }
    setLoading(false);
  };

  const handleGerarAutomatico = async () => {
    try {
      const feriadosAutomaticos = calcularFeriadosAutomaticos(anoGerar);
      
      let adicionados = 0;
      for (const feriado of feriadosAutomaticos) {
        // Verificar se já existe
        const jaExiste = feriados.some(f => f.data === feriado.data);
        if (!jaExiste) {
          await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/feriados`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(feriado)
            }
          );
          adicionados++;
        }
      }

      toast.success(`${adicionados} feriados e emendas adicionados para ${anoGerar}!`);
      loadFeriados();
    } catch (error) {
      console.error('Error generating feriados:', error);
      toast.error('Erro ao gerar feriados automáticos');
    }
  };

  const handleSave = async () => {
    if (!formData.data || !formData.descricao) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/feriados`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        }
      );

      if (response.ok) {
        toast.success('Data adicionada!');
        setDialogOpen(false);
        setFormData({ data: '', tipo: 'feriado', descricao: '' });
        loadFeriados();
      } else {
        toast.error('Erro ao salvar');
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Erro ao salvar data');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/feriados/${id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );

      if (response.ok) {
        toast.success('Removido!');
        loadFeriados();
      } else {
        toast.error('Erro ao deletar');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Erro ao deletar');
    }
  };

  const feriadosPorAno = feriados.reduce((acc, f) => {
    const ano = new Date(f.data + 'T00:00:00').getFullYear();
    if (!acc[ano]) acc[ano] = [];
    acc[ano].push(f);
    return acc;
  }, {} as { [key: number]: FeriadoOuEmenda[] });

  const anos = Object.keys(feriadosPorAno).sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Calendário de Feriados e Emendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex gap-2 items-end">
              <div className="space-y-2">
                <Label>Gerar Automático</Label>
                <Input
                  type="number"
                  value={anoGerar}
                  onChange={(e) => setAnoGerar(parseInt(e.target.value))}
                  className="w-32"
                />
              </div>
              <Button onClick={handleGerarAutomatico} variant="secondary" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Gerar Feriados
              </Button>
            </div>

            <div className="flex-1"></div>

            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Manualmente
            </Button>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Cálculo Automático:</strong> Inclui feriados nacionais, feriados móveis (Carnaval, Páscoa, Corpus Christi) 
              e emendas automáticas (pontes de quinta-feira e terça-feira). Município: Belo Horizonte - MG.
            </p>
          </div>
        </CardContent>
      </Card>

      {anos.map((ano) => (
        <Card key={ano}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5" />
              {ano}
              <Badge variant="secondary">
                {feriadosPorAno[parseInt(ano)].length} dias
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Dia da Semana</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feriadosPorAno[parseInt(ano)].map((feriado) => {
                    const data = new Date(feriado.data + 'T00:00:00');
                    const diaSemana = data.toLocaleDateString('pt-BR', { weekday: 'long' });
                    
                    return (
                      <TableRow key={feriado.id}>
                        <TableCell>
                          {data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="capitalize">{diaSemana}</TableCell>
                        <TableCell>
                          <Badge variant={feriado.tipo === 'feriado' ? 'default' : 'secondary'}>
                            {feriado.tipo === 'feriado' ? 'Feriado' : 'Emenda'}
                          </Badge>
                        </TableCell>
                        <TableCell>{feriado.descricao}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(feriado.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Dialog de Formulário */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Data Manualmente</DialogTitle>
            <DialogDescription>
              Para pontos facultativos, recessos ou feriados municipais específicos
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feriado">Feriado</SelectItem>
                  <SelectItem value="emenda">Emenda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Ex: Ponto Facultativo"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
