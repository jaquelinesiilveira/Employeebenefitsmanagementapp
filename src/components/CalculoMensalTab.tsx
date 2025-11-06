import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Calculator, Download, Bus, CreditCard, Heart, FileText } from 'lucide-react';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface FuncionarioCalculo {
  id: string;
  nome: string;
  cpf: string;
  setor: string;
  salarioBase: number;
  tipoTransporte: string;
  idFlash?: string;
  diasTrabalhadosNoMes: number;
  diasPresenciais: number;
  diasHomeOffice: number;
  faltas: number;
  valorFlash: number;
  valorValeTransporte: number;
  recargaFlashTotal: number;
  valorCoparticipacao: number;
  salarioFinal: number;
}

interface ResultadoCalculo {
  mes: string;
  feriadosEEmendasDoMes: any[];
  calculos: FuncionarioCalculo[];
}

export function CalculoMensalTab() {
  const [mes, setMes] = useState('');
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
  const [loading, setLoading] = useState(false);
  const [faltasEditando, setFaltasEditando] = useState<{ [key: string]: number }>({});
  const [copartEditando, setCopartEditando] = useState<{ [key: string]: number }>({});

  const handleCalcular = async () => {
    if (!mes) {
      toast.error('Selecione um mês');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/calcular-beneficios/${mes}`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResultado(data);
        
        // Inicializar valores de faltas e copart
        const faltas: { [key: string]: number } = {};
        const copart: { [key: string]: number } = {};
        data.calculos.forEach((c: FuncionarioCalculo) => {
          faltas[c.id] = c.faltas || 0;
          copart[c.id] = c.valorCoparticipacao || 0;
        });
        setFaltasEditando(faltas);
        setCopartEditando(copart);
        
        toast.success('Cálculo realizado com sucesso!');
      } else {
        const error = await response.json();
        toast.error('Erro ao calcular: ' + error.error);
      }
    } catch (error) {
      console.error('Error calculating:', error);
      toast.error('Erro ao calcular benefícios');
    }
    setLoading(false);
  };

  const handleSalvarFalta = async (funcionarioId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/lancamentos/faltas`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            funcionarioId,
            mes,
            faltas: faltasEditando[funcionarioId] || 0
          })
        }
      );

      if (response.ok) {
        toast.success('Faltas atualizadas!');
        handleCalcular();
      } else {
        toast.error('Erro ao salvar faltas');
      }
    } catch (error) {
      console.error('Error saving faltas:', error);
      toast.error('Erro ao salvar faltas');
    }
  };

  const handleSalvarCopart = async (funcionarioId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/lancamentos/coparticipacao`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            funcionarioId,
            mes,
            valor: copartEditando[funcionarioId] || 0
          })
        }
      );

      if (response.ok) {
        toast.success('Coparticipação atualizada!');
        handleCalcular();
      } else {
        toast.error('Erro ao salvar coparticipação');
      }
    } catch (error) {
      console.error('Error saving copart:', error);
      toast.error('Erro ao salvar coparticipação');
    }
  };

  const handleExportarFlash = () => {
    if (!resultado) return;

    const dadosFlash = resultado.calculos.filter(c => c.tipoTransporte === 'Flash' && c.recargaFlashTotal > 0);

    if (dadosFlash.length === 0) {
      toast.error('Nenhum dado Flash para exportar');
      return;
    }

    const csv = [
      'ID Flash,Nome,CPF,Setor,Total Recarga',
      ...dadosFlash.map(c => 
        `${c.idFlash || ''},${c.nome},${c.cpf},${c.setor},${c.recargaFlashTotal.toFixed(2)}`
      )
    ].join('\n');

    downloadCSV(csv, `flash-remessa-${mes}.csv`);
    toast.success(`Exportados ${dadosFlash.length} registros para Flash`);
  };

  const handleExportarBhBus = () => {
    if (!resultado) return;

    const dadosBhBus = resultado.calculos.filter(c => c.valorValeTransporte > 0);

    if (dadosBhBus.length === 0) {
      toast.error('Nenhum dado BhBus para exportar');
      return;
    }

    const csv = [
      'Nome,CPF,Setor,Dias Presenciais,Valor VT',
      ...dadosBhBus.map(c => 
        `${c.nome},${c.cpf},${c.setor},${c.diasPresenciais},${c.valorValeTransporte.toFixed(2)}`
      )
    ].join('\n');

    downloadCSV(csv, `bhtrans-solicitacao-${mes}.csv`);
    toast.success(`Exportados ${dadosBhBus.length} registros para BhBus`);
  };

  const handleExportarFolha = () => {
    if (!resultado) return;

    const csv = [
      'CPF,Salário Base,Salário Final',
      ...resultado.calculos.map(c => 
        `${c.cpf},${c.salarioBase.toFixed(2)},${c.salarioFinal.toFixed(2)}`
      )
    ].join('\n');

    downloadCSV(csv, `folha-pagamento-${mes}.csv`);
    toast.success('Relatório de folha exportado!');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatMesAno = (mesStr: string) => {
    const [ano, mes] = mesStr.split('-');
    const date = new Date(parseInt(ano), parseInt(mes) - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cálculo Mensal de Benefícios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 max-w-xs">
              <Label htmlFor="mes">Selecione o Mês/Competência</Label>
              <Input
                id="mes"
                type="month"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
              />
            </div>
            <Button onClick={handleCalcular} disabled={loading} className="gap-2">
              <Calculator className="h-4 w-4" />
              {loading ? 'Calculando...' : 'Calcular'}
            </Button>
          </div>

          {resultado && resultado.feriadosEEmendasDoMes.length > 0 && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="mb-2">Feriados e Emendas ({resultado.feriadosEEmendasDoMes.length})</h4>
              <div className="flex flex-wrap gap-2">
                {resultado.feriadosEEmendasDoMes.map((f: any) => (
                  <span key={f.id} className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm">
                    {new Date(f.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - {f.descricao}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {resultado && (
        <Tabs defaultValue="geral" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="geral" className="gap-2">
              <FileText className="h-4 w-4" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="flash" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Flash
              <Badge variant="secondary" className="ml-1">
                {resultado.calculos.filter(c => c.tipoTransporte === 'Flash').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="transporte" className="gap-2">
              <Bus className="h-4 w-4" />
              Transporte
              <Badge variant="secondary" className="ml-1">
                {resultado.calculos.filter(c => c.valorValeTransporte > 0).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unimed" className="gap-2">
              <Heart className="h-4 w-4" />
              Unimed
            </TabsTrigger>
          </TabsList>

          {/* ABA GERAL */}
          <TabsContent value="geral" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="capitalize">Resultados Gerais - {formatMesAno(resultado.mes)}</CardTitle>
                <Button onClick={handleExportarFolha} variant="default" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar Folha
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Funcionário</TableHead>
                        <TableHead className="text-center">Faltas</TableHead>
                        <TableHead className="text-right">Salário Base</TableHead>
                        <TableHead className="text-right">Total Flash</TableHead>
                        <TableHead className="text-right">VT Calculado</TableHead>
                        <TableHead className="text-right">Copart.</TableHead>
                        <TableHead className="text-right">Salário Final</TableHead>
                        <TableHead className="text-center">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultado.calculos.map((calc) => (
                        <TableRow key={calc.id}>
                          <TableCell>
                            <div>
                              <div>{calc.nome}</div>
                              <div className="text-xs text-muted-foreground">{calc.setor}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              min="0"
                              className="w-16 text-center"
                              value={faltasEditando[calc.id] ?? 0}
                              onChange={(e) => setFaltasEditando({
                                ...faltasEditando,
                                [calc.id]: parseInt(e.target.value) || 0
                              })}
                            />
                          </TableCell>
                          <TableCell className="text-right">R$ {calc.salarioBase.toFixed(2)}</TableCell>
                          <TableCell className="text-right">R$ {calc.recargaFlashTotal.toFixed(2)}</TableCell>
                          <TableCell className="text-right">R$ {calc.valorValeTransporte.toFixed(2)}</TableCell>
                          <TableCell className="text-right">R$ {calc.valorCoparticipacao.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <span className="bg-primary text-primary-foreground px-3 py-1 rounded">
                              R$ {calc.salarioFinal.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              onClick={() => handleSalvarFalta(calc.id)}
                              disabled={faltasEditando[calc.id] === calc.faltas}
                            >
                              Salvar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Funcionários</p>
                    <p className="text-2xl">{resultado.calculos.length}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Salários Base</p>
                    <p className="text-2xl">
                      R$ {resultado.calculos.reduce((sum, c) => sum + c.salarioBase, 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-primary text-primary-foreground rounded-lg">
                    <p className="text-sm opacity-90">Total Folha Final</p>
                    <p className="text-2xl">
                      R$ {resultado.calculos.reduce((sum, c) => sum + c.salarioFinal, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA FLASH */}
          <TabsContent value="flash">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="capitalize">Flash (VA/VR) - {formatMesAno(resultado.mes)}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Crédito total (VA/VR + VT) enviado ao cartão Flash
                  </p>
                </div>
                <Button onClick={handleExportarFlash} variant="default" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar Remessa
                </Button>
              </CardHeader>
              <CardContent>
                {resultado.calculos.filter(c => c.tipoTransporte === 'Flash').length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum funcionário com transporte Flash
                  </p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID Flash</TableHead>
                            <TableHead>Funcionário</TableHead>
                            <TableHead className="text-center">Dias Trab.</TableHead>
                            <TableHead className="text-right">VA/VR</TableHead>
                            <TableHead className="text-right">VT</TableHead>
                            <TableHead className="text-right">Total Flash</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {resultado.calculos
                            .filter(c => c.tipoTransporte === 'Flash')
                            .map((calc) => (
                              <TableRow key={calc.id}>
                                <TableCell className="font-mono">{calc.idFlash || '-'}</TableCell>
                                <TableCell>
                                  <div>
                                    <div>{calc.nome}</div>
                                    <div className="text-xs text-muted-foreground">{calc.setor}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">{calc.diasTrabalhadosNoMes}</TableCell>
                                <TableCell className="text-right">R$ {calc.valorFlash.toFixed(2)}</TableCell>
                                <TableCell className="text-right">R$ {calc.valorValeTransporte.toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                  <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded font-medium">
                                    R$ {calc.recargaFlashTotal.toFixed(2)}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="mt-6 p-6 bg-primary text-primary-foreground rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm opacity-90">Total de Recargas</p>
                          <p className="text-2xl">
                            {resultado.calculos.filter(c => c.tipoTransporte === 'Flash').length}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm opacity-90">Valor Total Remessa Flash</p>
                          <p className="text-3xl">
                            R$ {resultado.calculos
                              .filter(c => c.tipoTransporte === 'Flash')
                              .reduce((sum, c) => sum + c.recargaFlashTotal, 0)
                              .toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA TRANSPORTE */}
          <TabsContent value="transporte">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="capitalize">Vale Transporte (VT/BHBus) - {formatMesAno(resultado.mes)}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Solicitação de passagens BHBus (valores separados do Flash)
                  </p>
                </div>
                <Button onClick={handleExportarBhBus} variant="default" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar BHBus
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Funcionário</TableHead>
                        <TableHead>Tipo Transporte</TableHead>
                        <TableHead className="text-center">Dias Presenciais</TableHead>
                        <TableHead className="text-center">Dias HO</TableHead>
                        <TableHead className="text-right">VT Calculado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultado.calculos.map((calc) => (
                        <TableRow key={calc.id}>
                          <TableCell>
                            <div>
                              <div>{calc.nome}</div>
                              <div className="text-xs text-muted-foreground">{calc.setor}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={calc.tipoTransporte === 'Flash' ? 'default' : 'secondary'}>
                              {calc.tipoTransporte}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{calc.diasPresenciais}</TableCell>
                          <TableCell className="text-center">{calc.diasHomeOffice}</TableCell>
                          <TableCell className="text-right">
                            {calc.valorValeTransporte > 0 ? (
                              <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded">
                                R$ {calc.valorValeTransporte.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">R$ 0,00</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-6 p-6 bg-primary text-primary-foreground rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Funcionários com VT</p>
                      <p className="text-2xl">
                        {resultado.calculos.filter(c => c.valorValeTransporte > 0).length}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm opacity-90">Total VT Calculado</p>
                      <p className="text-3xl">
                        R$ {resultado.calculos.reduce((sum, c) => sum + c.valorValeTransporte, 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA UNIMED */}
          <TabsContent value="unimed">
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">Unimed - Coparticipação - {formatMesAno(resultado.mes)}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Lançamento de valores de coparticipação por funcionário
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Funcionário</TableHead>
                        <TableHead>Setor</TableHead>
                        <TableHead className="text-right">Valor Coparticipação</TableHead>
                        <TableHead className="text-center">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultado.calculos.map((calc) => (
                        <TableRow key={calc.id}>
                          <TableCell>{calc.nome}</TableCell>
                          <TableCell>{calc.setor}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              className="w-32 ml-auto"
                              value={copartEditando[calc.id] ?? 0}
                              onChange={(e) => setCopartEditando({
                                ...copartEditando,
                                [calc.id]: parseFloat(e.target.value) || 0
                              })}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              onClick={() => handleSalvarCopart(calc.id)}
                              disabled={copartEditando[calc.id] === calc.valorCoparticipacao}
                            >
                              Salvar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-6 p-6 bg-primary text-primary-foreground rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Funcionários com Coparticipação</p>
                      <p className="text-2xl">
                        {resultado.calculos.filter(c => c.valorCoparticipacao > 0).length}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm opacity-90">Total Coparticipação</p>
                      <p className="text-3xl">
                        R$ {resultado.calculos.reduce((sum, c) => sum + c.valorCoparticipacao, 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
