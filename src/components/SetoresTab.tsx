import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Setor {
  id: string;
  nome: string;
  valorFlashDiario: number;
}

export function SetoresTab() {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSetor, setEditingSetor] = useState<Setor | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    valorFlashDiario: ''
  });

  useEffect(() => {
    loadSetores();
  }, []);

  const loadSetores = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/setores`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );
      const data = await response.json();
      // Filter out any null or invalid values
      setSetores(Array.isArray(data) ? data.filter(s => s && s.id && s.nome) : []);
    } catch (error) {
      console.error('Error loading setores:', error);
      toast.error('Erro ao carregar setores');
      setSetores([]);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.valorFlashDiario) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      const setor = {
        nome: formData.nome,
        valorFlashDiario: parseFloat(formData.valorFlashDiario)
      };

      const url = editingSetor
        ? `https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/setores/${editingSetor.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/setores`;

      const response = await fetch(url, {
        method: editingSetor ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(setor)
      });

      if (response.ok) {
        toast.success(editingSetor ? 'Setor atualizado!' : 'Setor cadastrado!');
        setDialogOpen(false);
        resetForm();
        loadSetores();
      } else {
        const error = await response.json();
        toast.error('Erro ao salvar: ' + error.error);
      }
    } catch (error) {
      console.error('Error saving setor:', error);
      toast.error('Erro ao salvar setor');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este setor?')) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-262f7ff4/setores/${id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );

      if (response.ok) {
        toast.success('Setor excluído!');
        loadSetores();
      }
    } catch (error) {
      console.error('Error deleting setor:', error);
      toast.error('Erro ao excluir setor');
    }
  };

  const handleEdit = (setor: Setor) => {
    setEditingSetor(setor);
    setFormData({
      nome: setor.nome,
      valorFlashDiario: setor.valorFlashDiario.toString()
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingSetor(null);
    setFormData({
      nome: '',
      valorFlashDiario: ''
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Setores e Valores Flash</CardTitle>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Setor
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : setores.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Nenhum setor cadastrado</p>
              <p className="text-sm text-muted-foreground">
                Cadastre setores como "Técnico" (R$ 38,26) e "Estagiário" (R$ 19,13)
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Setor</TableHead>
                  <TableHead>Valor Flash Diário</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {setores.map((setor) => (
                  <TableRow key={setor.id}>
                    <TableCell>{setor.nome}</TableCell>
                    <TableCell>R$ {setor.valorFlashDiario.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(setor)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(setor.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog separado */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSetor ? 'Editar' : 'Novo'} Setor</DialogTitle>
            <DialogDescription>
              {editingSetor ? 'Atualize os detalhes do setor' : 'Adicione um novo setor'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Setor</Label>
              <Input
                id="nome"
                placeholder="Ex: Técnico, Estagiário, Administrativo"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="valor">Valor Flash Diário (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                placeholder="Ex: 38.26"
                value={formData.valorFlashDiario}
                onChange={(e) => setFormData({ ...formData, valorFlashDiario: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Este é o valor de vale alimentação/refeição por dia trabalhado
              </p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
