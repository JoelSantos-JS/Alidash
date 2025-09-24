"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';
import { Loader2, DollarSign, Briefcase, User, TrendingUp, Home, Gift, Building, PiggyBank } from "lucide-react";

interface MonthlyIncomeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingIncome?: any;
}

const INCOME_CATEGORIES = {
  salary: { label: 'Salário', icon: Briefcase, description: 'Salário fixo mensal' },
  freelance: { label: 'Freelance', icon: User, description: 'Trabalho autônomo' },
  investment: { label: 'Investimentos', icon: TrendingUp, description: 'Rendimentos de investimentos' },
  rental: { label: 'Aluguel Recebido', icon: Home, description: 'Renda de aluguel' },
  bonus: { label: 'Bônus', icon: Gift, description: 'Bônus e comissões' },
  pension: { label: 'Pensão', icon: Building, description: 'Pensão ou aposentadoria' },
  benefit: { label: 'Benefício', icon: PiggyBank, description: 'Benefícios sociais' },
  other: { label: 'Outros', icon: DollarSign, description: 'Outras fontes de renda' }
};

export default function MonthlyIncomeForm({ isOpen, onClose, onSuccess, editingIncome }: MonthlyIncomeFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    description: editingIncome?.description || '',
    amount: editingIncome?.amount?.toString() || '',
    category: editingIncome?.category || 'salary',
    source: editingIncome?.source || '',
    is_recurring: editingIncome?.is_recurring ?? true,
    is_taxable: editingIncome?.is_taxable ?? true,
    tax_withheld: editingIncome?.tax_withheld?.toString() || '0',
    notes: editingIncome?.notes || '',
    recurring_day: editingIncome?.recurring_info?.day?.toString() || '1'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    setLoading(true);
    try {
      // Buscar usuário Supabase
      const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user.uid}&email=${user.email}`);
      if (!userResponse.ok) {
        throw new Error('Usuário não encontrado');
      }
      
      const userResult = await userResponse.json();
      const supabaseUserId = userResult.user.id;

      // Preparar dados da receita
      const incomeData = {
        user_id: supabaseUserId,
        date: new Date().toISOString().split('T')[0],
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        source: formData.source,
        is_recurring: formData.is_recurring,
        is_taxable: formData.is_taxable,
        tax_withheld: parseFloat(formData.tax_withheld) || 0,
        notes: formData.notes,
        recurring_info: formData.is_recurring ? {
          frequency: 'monthly',
          day: parseInt(formData.recurring_day)
        } : null
      };

      const url = editingIncome 
        ? `/api/personal/incomes/${editingIncome.id}`
        : '/api/personal/incomes';
      
      const method = editingIncome ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incomeData),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar receita');
      }

      toast({
        title: editingIncome ? "Receita atualizada!" : "Receita cadastrada!",
        description: `${formData.description} foi ${editingIncome ? 'atualizada' : 'adicionada'} com sucesso.`,
      });

      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        description: '',
        amount: '',
        category: 'salary',
        source: '',
        is_recurring: true,
        is_taxable: true,
        tax_withheld: '0',
        notes: '',
        recurring_day: '1'
      });

    } catch (error) {
      console.error('Erro ao salvar receita:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a receita. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = INCOME_CATEGORIES[formData.category as keyof typeof INCOME_CATEGORIES];
  const IconComponent = selectedCategory?.icon || DollarSign;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            {editingIncome ? 'Editar Receita' : 'Cadastrar Renda Mensal'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INCOME_CATEGORIES).map(([key, cat]) => {
                  const Icon = cat.icon;
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{cat.label}</div>
                          <div className="text-xs text-muted-foreground">{cat.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Ex: Salário Janeiro 2025"
              required
            />
          </div>

          {/* Valor e Fonte */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="0,00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Fonte</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => setFormData({...formData, source: e.target.value})}
                placeholder="Ex: Empresa XYZ"
                required
              />
            </div>
          </div>

          {/* Configurações de Recorrência */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_recurring">Receita Recorrente</Label>
                <p className="text-xs text-muted-foreground">Receita que se repete mensalmente</p>
              </div>
              <Switch
                id="is_recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) => setFormData({...formData, is_recurring: checked})}
              />
            </div>

            {formData.is_recurring && (
              <div className="space-y-2">
                <Label htmlFor="recurring_day">Dia do Recebimento</Label>
                <Select value={formData.recurring_day} onValueChange={(value) => setFormData({...formData, recurring_day: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                      <SelectItem key={day} value={day.toString()}>
                        Dia {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Configurações de Impostos */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_taxable">Tributável</Label>
                <p className="text-xs text-muted-foreground">Esta receita está sujeita a impostos</p>
              </div>
              <Switch
                id="is_taxable"
                checked={formData.is_taxable}
                onCheckedChange={(checked) => setFormData({...formData, is_taxable: checked})}
              />
            </div>

            {formData.is_taxable && (
              <div className="space-y-2">
                <Label htmlFor="tax_withheld">Imposto Retido (R$)</Label>
                <Input
                  id="tax_withheld"
                  type="number"
                  step="0.01"
                  value={formData.tax_withheld}
                  onChange={(e) => setFormData({...formData, tax_withheld: e.target.value})}
                  placeholder="0,00"
                />
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Informações adicionais sobre esta receita..."
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingIncome ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}