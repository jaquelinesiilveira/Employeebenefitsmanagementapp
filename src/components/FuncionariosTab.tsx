import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Plus, Pencil, Trash2, ChevronDown, UserPlus } from 'lucide-react';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Funcionario {
  id: string;
  nome: string;
  cpf: string;
  setor: string;
  salarioBase: number;
  idFlash?: string;
  tipoTransporte: 'Flash' | 'BHBus' | 'Nenhum';
  diasHomeOfficeNoMes: number;
  valorPassagemBhBus?: number;
  ativo: boolean;
  aniversario?: string;
}

interface Setor {
  id: string;
  nome: string;
  valorFlashDiario: number;
}

export function FuncionariosTab() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    setorId: '',
    salarioBase: '',
    idFlash: '',
    tipoTransporte: 'Flash' as 'Flash' | 'BHBus' | 'Nenhum',
    diasHomeOfficeNoMes: '',
    valorPassagem: '',
    ativo: true,
    aniversario: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [funcRes, setoresRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/funcionarios`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/setores`, {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        })
      ]);

      const funcData = await funcRes.json();
      const setoresData = await setoresRes.json();

      setFuncionarios(Array.isArray(funcData) ? funcData.filter(f => f && f.id) : []);
      setSetores(Array.isArray(setoresData) ? setoresData.filter(s => s && s.id) : []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
      setFuncionarios([]);
      setSetores([]);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cpf: '',
      setorId: '',
      salarioBase: '',
      idFlash: '',
      tipoTransporte: 'Flash',
      diasHomeOfficeNoMes: '',
      valorPassagem: '',
      ativo: true,
      aniversario: '',
    });
    setEditingId(null);
  };

  const handleEdit = (funcionario: Funcionario) => {
    setFormData({
      nome: funcionario.nome,
      cpf: funcionario.cpf,
      setorId: funcionario.setor,
      salarioBase: funcionario.salarioBase.toString(),
      idFlash: funcionario.idFlash || '',
      tipoTransporte: funcionario.tipoTransporte,
      diasHomeOfficeNoMes: funcionario.diasHomeOfficeNoMes?.toString() || '',
      valorPassagem: funcionario.valorPassagemBhBus?.toString() || '',
      ativo: funcionario.ativo,
      aniversario: funcionario.aniversario || '',
    });
    setEditingId(funcionario.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.cpf || !formData.setorId || !formData.salarioBase) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const funcionario: any = {
        nome: formData.nome,
        cpf: formData.cpf,
        setor: formData.setorId,
        salarioBase: parseFloat(formData.salarioBase),
        idFlash: formData.idFlash || undefined,
        tipoTransporte: formData.tipoTransporte,
        diasHomeOfficeNoMes: formData.diasHomeOfficeNoMes ? parseInt(formData.diasHomeOfficeNoMes) : 0,
        valorPassagemBhBus: formData.valorPassagem ? parseFloat(formData.valorPassagem) : undefined,
        ativo: formData.ativo,
        aniversario: formData.aniversario || undefined
      };

      const url = editingId
        ? `https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/funcionarios/${editingId}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/funcionarios`;

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(funcionario)
      });

      if (response.ok) {
        toast.success(editingId ? 'Funcionário atualizado!' : 'Funcionário cadastrado!');
        setDialogOpen(false);
        resetForm();
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar');
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Erro ao salvar funcionário');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/funcionarios/${id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );

      if (response.ok) {
        toast.success('Funcionário removido!');
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao deletar');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Erro ao deletar funcionário');
    }
    setDeleteConfirmId(null);
  };

  const getSetorNome = (setorId: string) => {
    return setores.find(s => s.id === setorId)?.nome || setorId;
  };

  const funcionariosAtivos = funcionarios.filter(f => f.ativo);
  const funcionariosInativos = funcionarios.filter(f => !f.ativo);

  return (
    <div className="space-y-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="border-2 border-primary/20">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserPlus className="h-5 w-5 text-primary" />
                  <CardTitle>Gestão de Cadastros</CardTitle>
                  <Badge variant="secondary">{funcionariosAtivos.length} ativos</Badge>
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-6">
              <div className="flex gap-4 mb-6">
                <Button
                  onClick={() => {
                    resetForm();
                    setDialogOpen(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Novo Funcionário
                </Button>
              </div>

              {funcionariosAtivos.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum funcionário cadastrado
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>CPF</TableHead>
                        <TableHead>Setor</TableHead>
                        <TableHead className="text-right">Salário Base</TableHead>
                        <TableHead>ID Flash</TableHead>
                        <TableHead>Transporte</TableHead>
                        <TableHead className="text-center">Dias HO</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {funcionariosAtivos.map((func) => (
                        <TableRow key={func.id}>
                          <TableCell>{func.nome}</TableCell>
                          <TableCell className="font-mono text-sm">{func.cpf}</TableCell>
                          <TableCell>{getSetorNome(func.setor)}</TableCell>
                          <TableCell className="text-right">R$ {func.salarioBase.toFixed(2)}</TableCell>
                          <TableCell className="font-mono text-sm">{func.idFlash || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={func.tipoTransporte === 'Flash' ? 'default' : 'secondary'}>
                              {func.tipoTransporte}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{func.diasHomeOfficeNoMes || 0}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(func)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirmId(func.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Dialog de Formulário */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Funcionário' : 'Novo Funcionário'}</DialogTitle>
            <DialogDescription>
              Preencha os dados do funcionário
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="setor">Setor *</Label>
                <Select value={formData.setorId} onValueChange={(value) => setFormData({ ...formData, setorId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {setores.map(setor => (
                      <SelectItem key={setor.id} value={setor.id}>
                        {setor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salarioBase">Salário Base *</Label>
                <Input
                  id="salarioBase"
                  type="number"
                  step="0.01"
                  value={formData.salarioBase}
                  onChange={(e) => setFormData({ ...formData, salarioBase: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="idFlash">ID Flash</Label>
                <Input
                  id="idFlash"
                  value={formData.idFlash}
                  onChange={(e) => setFormData({ ...formData, idFlash: e.target.value })}
                  placeholder="Opcional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoTransporte">Tipo de Transporte *</Label>
                <Select value={formData.tipoTransporte} onValueChange={(value: any) => setFormData({ ...formData, tipoTransporte: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Flash">Flash</SelectItem>
                    <SelectItem value="BHBus">BHBus</SelectItem>
                    <SelectItem value="Nenhum">Nenhum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="diasHO">Dias Home Office/Mês</Label>
                <Input
                  id="diasHO"
                  type="number"
                  value={formData.diasHomeOfficeNoMes}
                  onChange={(e) => setFormData({ ...formData, diasHomeOfficeNoMes: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valorPassagem">Valor Passagem</Label>
                <Input
                  id="valorPassagem"
                  type="number"
                  step="0.01"
                  value={formData.valorPassagem}
                  onChange={(e) => setFormData({ ...formData, valorPassagem: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aniversario">Aniversário</Label>
                <Input
                  id="aniversario"
                  type="date"
                  value={formData.aniversario}
                  onChange={(e) => setFormData({ ...formData, aniversario: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
              <Label htmlFor="ativo">Funcionário Ativo</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingId ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este funcionário? Esta ação não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}