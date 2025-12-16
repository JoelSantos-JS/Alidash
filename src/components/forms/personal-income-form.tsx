"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { X, DollarSign, Calendar, User, Building, Tag, FileText } from "lucide-react";
import { formatCurrency, formatCurrencyInputBRL, parseCurrencyInputBRL } from "@/lib/utils";

interface PersonalIncome {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  source: string;
  is_recurring: boolean;
  is_taxable: boolean;
  tax_withheld?: number;
  notes?: string;
}

interface PersonalIncomeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingIncome?: PersonalIncome | null;
}

const INCOME_CATEGORIES = {
  salary: 'Salário',
  freelance: 'Freelance',
  investment: 'Investimentos',
  rental: 'Aluguel Recebido',
  bonus: 'Bônus',
  gift: 'Presente',
  pension: 'Pensão',
  benefit: 'Benefício',
  other: 'Outros'
};

export default function PersonalIncomeForm({ isOpen, onClose, onSuccess, editingIncome }: PersonalIncomeFormProps) {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    date: editingIncome?.date || new Date().toISOString().split('T')[0],
    description: editingIncome?.description || '',
    amount: editingIncome?.amount != null ? formatCurrency(editingIncome.amount) : '',
    category: editingIncome?.category || 'salary',
    source: editingIncome?.source || '',
    is_recurring: editingIncome?.is_recurring || false,
    is_taxable: editingIncome?.is_taxable || false,
    tax_withheld: editingIncome?.tax_withheld != null ? formatCurrency(editingIncome.tax_withheld) : '',
    notes: editingIncome?.notes || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.description || !formData.amount || !formData.source) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // O usuário já é do Supabase, usar ID diretamente
      const supabaseUserId = user.id;
      
      const incomeData = {
        user_id: supabaseUserId,
        date: formData.date,
        description: formData.description,
        amount: parseCurrencyInputBRL(formData.amount),
        category: formData.category,
        source: formData.source,
        is_recurring: formData.is_recurring,
        is_taxable: formData.is_taxable,
        tax_withheld: formData.is_taxable ? parseCurrencyInputBRL(formData.tax_withheld) : 0,
        notes: formData.notes || null
      };
      
      const method = editingIncome ? 'PUT' : 'POST';
      const url = editingIncome 
        ? `/api/personal/incomes/${editingIncome.id}`
        : '/api/personal/incomes';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(incomeData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar receita');
      }
      
      toast({
        title: "Sucesso!",
        description: `Receita ${editingIncome ? 'atualizada' : 'criada'} com sucesso.`,
      });
      
      onSuccess();
      
    } catch (error) {
      console.error('Erro ao salvar receita:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar receita.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            {editingIncome ? 'Editar Entrada' : 'Nova Entrada Pessoal'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valor *
              </Label>
              <Input
                id="amount"
                type="text"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', formatCurrencyInputBRL(e.target.value))}
                required
              />
            </div>
          </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Descrição *
              </Label>
              <Input
                id="description"
                placeholder="Ex: Salário Janeiro 2025"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                required
              />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category" className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Categoria *
                </Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  required
                >
                  {Object.entries(INCOME_CATEGORIES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="source" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Fonte/Pagador *
                </Label>
                <Input
                  id="source"
                  placeholder="Ex: Empresa XYZ Ltda"
                  value={formData.source}
                  onChange={(e) => handleInputChange('source', e.target.value)}
                  required
                />
              </div>
            </div>
            
            {/* Configurações */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Configurações</h3>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label htmlFor="is_recurring" className="font-medium">Entrada Recorrente</Label>
                  <p className="text-sm text-muted-foreground">Esta entrada se repete mensalmente</p>
                </div>
                <Switch
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) => handleInputChange('is_recurring', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label htmlFor="is_taxable" className="font-medium">Entrada Tributável</Label>
                  <p className="text-sm text-muted-foreground">Sujeita a imposto de renda</p>
                </div>
                <Switch
                  id="is_taxable"
                  checked={formData.is_taxable}
                  onCheckedChange={(checked) => handleInputChange('is_taxable', checked)}
                />
              </div>
              
              {formData.is_taxable && (
                <div className="space-y-2 ml-4">
                  <Label htmlFor="tax_withheld">Imposto Retido na Fonte</Label>
                  <Input
                    id="tax_withheld"
                    type="text"
                    inputMode="numeric"
                    placeholder="R$ 0,00"
                    value={formData.tax_withheld}
                    onChange={(e) => handleInputChange('tax_withheld', formatCurrencyInputBRL(e.target.value))}
                  />
                </div>
              )}
            </div>
            
            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Informações adicionais sobre esta entrada..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
              />
            </div>
            
            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Salvando...' : (editingIncome ? 'Atualizar' : 'Criar Entrada')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
