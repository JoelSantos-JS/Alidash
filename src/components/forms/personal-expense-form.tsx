"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { X, TrendingDown, Calendar, CreditCard, Tag, FileText, MapPin, Building } from "lucide-react";

interface PersonalExpense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  subcategory?: string;
  payment_method: string;
  is_essential: boolean;
  is_recurring: boolean;
  location?: string;
  merchant?: string;
  notes?: string;
}

interface PersonalExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingExpense?: PersonalExpense | null;
}

const EXPENSE_CATEGORIES = {
  housing: 'Moradia',
  food: 'Alimentação',
  transportation: 'Transporte',
  healthcare: 'Saúde',
  education: 'Educação',
  entertainment: 'Entretenimento',
  clothing: 'Vestuário',
  utilities: 'Utilidades',
  insurance: 'Seguros',
  personal_care: 'Cuidados Pessoais',
  gifts: 'Presentes',
  savings: 'Poupança',
  other: 'Outros'
};

const PAYMENT_METHODS = {
  cash: 'Dinheiro',
  debit_card: 'Cartão de Débito',
  credit_card: 'Cartão de Crédito',
  pix: 'PIX',
  bank_transfer: 'Transferência Bancária',
  automatic_debit: 'Débito Automático'
};

export default function PersonalExpenseForm({ isOpen, onClose, onSuccess, editingExpense }: PersonalExpenseFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    date: editingExpense?.date || new Date().toISOString().split('T')[0],
    description: editingExpense?.description || '',
    amount: editingExpense?.amount?.toString() || '',
    category: editingExpense?.category || 'food',
    subcategory: editingExpense?.subcategory || '',
    payment_method: editingExpense?.payment_method || 'debit_card',
    is_essential: editingExpense?.is_essential || false,
    is_recurring: editingExpense?.is_recurring || false,
    location: editingExpense?.location || '',
    merchant: editingExpense?.merchant || '',
    notes: editingExpense?.notes || ''
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

    if (!formData.description || !formData.amount) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Buscar usuário Supabase
      const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user.uid}&email=${user.email}`);
      if (!userResponse.ok) {
        throw new Error('Usuário não encontrado');
      }
      
      const userResult = await userResponse.json();
      const supabaseUserId = userResult.user.id;
      
      const expenseData = {
        user_id: supabaseUserId,
        date: formData.date,
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        subcategory: formData.subcategory || null,
        payment_method: formData.payment_method,
        is_essential: formData.is_essential,
        is_recurring: formData.is_recurring,
        location: formData.location || null,
        merchant: formData.merchant || null,
        notes: formData.notes || null
      };
      
      const method = editingExpense ? 'PUT' : 'POST';
      const url = editingExpense 
        ? `/api/personal/expenses/${editingExpense.id}`
        : '/api/personal/expenses';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(expenseData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar despesa');
      }
      
      toast({
        title: "Sucesso!",
        description: `Despesa ${editingExpense ? 'atualizada' : 'criada'} com sucesso.`,
      });
      
      onSuccess();
      
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar despesa.",
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
            <TrendingDown className="h-5 w-5 text-red-600" />
            {editingExpense ? 'Editar Despesa' : 'Nova Despesa Pessoal'}
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
                  <TrendingDown className="h-4 w-4" />
                  Valor *
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
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
                placeholder="Ex: Supermercado - Compras do mês"
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
                  {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payment_method" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Forma de Pagamento *
                </Label>
                <select
                  id="payment_method"
                  value={formData.payment_method}
                  onChange={(e) => handleInputChange('payment_method', e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  required
                >
                  {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategoria</Label>
                <Input
                  id="subcategory"
                  placeholder="Ex: Frutas e verduras"
                  value={formData.subcategory}
                  onChange={(e) => handleInputChange('subcategory', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="merchant" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Estabelecimento
                </Label>
                <Input
                  id="merchant"
                  placeholder="Ex: Supermercado ABC"
                  value={formData.merchant}
                  onChange={(e) => handleInputChange('merchant', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Localização
              </Label>
              <Input
                id="location"
                placeholder="Ex: Shopping Center, Centro da cidade"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
            </div>
            
            {/* Configurações */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Configurações</h3>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label htmlFor="is_essential" className="font-medium">Despesa Essencial</Label>
                  <p className="text-sm text-muted-foreground">Esta despesa é necessária/obrigatória</p>
                </div>
                <Switch
                  id="is_essential"
                  checked={formData.is_essential}
                  onCheckedChange={(checked) => handleInputChange('is_essential', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label htmlFor="is_recurring" className="font-medium">Despesa Recorrente</Label>
                  <p className="text-sm text-muted-foreground">Esta despesa se repete mensalmente</p>
                </div>
                <Switch
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) => handleInputChange('is_recurring', checked)}
                />
              </div>
            </div>
            
            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Informações adicionais sobre esta despesa..."
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
                {loading ? 'Salvando...' : (editingExpense ? 'Atualizar' : 'Criar Despesa')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}