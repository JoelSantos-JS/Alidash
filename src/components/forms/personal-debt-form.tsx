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
import { X, CreditCard, Calendar, DollarSign, Tag, FileText, Building, Percent } from "lucide-react";

interface PersonalDebt {
  id: string;
  name: string;
  description?: string;
  total_amount: number;
  remaining_amount: number;
  paid_amount: number;
  interest_rate?: number;
  monthly_payment: number;
  due_date: string;
  start_date: string;
  category: string;
  creditor: string;
  status: 'active' | 'paid' | 'overdue' | 'paused';
  payment_method?: string;
  notes?: string;
}

interface PersonalDebtFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingDebt?: PersonalDebt | null;
}

const DEBT_CATEGORIES = {
  credit_card: 'Cartão de Crédito',
  personal_loan: 'Empréstimo Pessoal',
  mortgage: 'Financiamento Imobiliário',
  car_loan: 'Financiamento Veicular',
  student_loan: 'Financiamento Estudantil',
  installment: 'Parcelamento',
  other: 'Outros'
};

const DEBT_STATUS = {
  active: 'Ativa',
  paid: 'Quitada',
  overdue: 'Em Atraso',
  paused: 'Pausada'
};

const PAYMENT_METHODS = {
  automatic_debit: 'Débito Automático',
  bank_slip: 'Boleto Bancário',
  bank_transfer: 'Transferência Bancária',
  credit_card: 'Cartão de Crédito',
  pix: 'PIX',
  cash: 'Dinheiro'
};

export default function PersonalDebtForm({ isOpen, onClose, onSuccess, editingDebt }: PersonalDebtFormProps) {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: editingDebt?.name || '',
    description: editingDebt?.description || '',
    total_amount: editingDebt?.total_amount?.toString() || '',
    current_amount: editingDebt?.paid_amount?.toString() || '0',
    interest_rate: editingDebt?.interest_rate?.toString() || '0',
    monthly_payment: editingDebt?.monthly_payment?.toString() || '',
    due_date: editingDebt?.due_date || new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    start_date: editingDebt?.start_date || new Date().toISOString().split('T')[0],
    category: editingDebt?.category || 'credit_card',
    creditor: editingDebt?.creditor || '',
    status: editingDebt?.status || 'active',
    payment_method: editingDebt?.payment_method || 'automatic_debit',
    notes: editingDebt?.notes || ''
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

    if (!formData.name || !formData.total_amount || !formData.monthly_payment || !formData.creditor) {
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
      
      const totalAmount = parseFloat(formData.total_amount);
      const currentAmount = parseFloat(formData.current_amount);
      const remainingAmount = totalAmount - currentAmount;
      
      const debtData = {
        user_id: supabaseUserId,
        name: formData.name,
        description: formData.description || null,
        total_amount: totalAmount,
        remaining_amount: remainingAmount,
        paid_amount: currentAmount,
        interest_rate: parseFloat(formData.interest_rate) || 0,
        monthly_payment: parseFloat(formData.monthly_payment),
        due_date: formData.due_date,
        start_date: formData.start_date,
        category: formData.category,
        creditor: formData.creditor,
        status: formData.status,
        payment_method: formData.payment_method,
        notes: formData.notes || null
      };
      
      // Como não temos API de dívidas pessoais ainda, vamos simular o sucesso
      // TODO: Implementar API real para dívidas pessoais
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Sucesso!",
        description: `Dívida ${editingDebt ? 'atualizada' : 'criada'} com sucesso.`,
      });
      
      onSuccess();
      
    } catch (error) {
      console.error('Erro ao salvar dívida:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar dívida.",
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

  const calculateProgress = () => {
    const total = parseFloat(formData.total_amount) || 0;
    const current = parseFloat(formData.current_amount) || 0;
    if (total === 0) return 0;
    return Math.min((current / total) * 100, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-red-600" />
            {editingDebt ? 'Editar Dívida' : 'Nova Dívida Pessoal'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Informações Básicas</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Nome da Dívida *
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: Cartão de Crédito Nubank"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  placeholder="Ex: Fatura do cartão de crédito"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
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
                    {Object.entries(DEBT_CATEGORIES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="creditor" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Credor *
                  </Label>
                  <Input
                    id="creditor"
                    placeholder="Ex: Nubank, Caixa, Banco do Brasil"
                    value={formData.creditor}
                    onChange={(e) => handleInputChange('creditor', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Valores */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Valores</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="total_amount" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Valor Total *
                  </Label>
                  <Input
                    id="total_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formData.total_amount}
                    onChange={(e) => handleInputChange('total_amount', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="current_amount">Valor Já Pago</Label>
                  <Input
                    id="current_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formData.current_amount}
                    onChange={(e) => handleInputChange('current_amount', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="monthly_payment">Parcela Mensal *</Label>
                  <Input
                    id="monthly_payment"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formData.monthly_payment}
                    onChange={(e) => handleInputChange('monthly_payment', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="interest_rate" className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Taxa de Juros (% a.m.)
                  </Label>
                  <Input
                    id="interest_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formData.interest_rate}
                    onChange={(e) => handleInputChange('interest_rate', e.target.value)}
                  />
                </div>
              </div>
              
              {/* Progresso */}
              {(formData.total_amount && parseFloat(formData.total_amount) > 0) && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progresso do pagamento</span>
                    <span className="font-medium">{calculateProgress().toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all" 
                      style={{ width: `${calculateProgress()}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Pago: R$ {parseFloat(formData.current_amount || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span>Restante: R$ {(parseFloat(formData.total_amount) - parseFloat(formData.current_amount || '0')).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Datas e Status */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Datas e Status</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data de Início *
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="due_date">Próximo Vencimento *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    {Object.entries(DEBT_STATUS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Forma de Pagamento</Label>
                  <select
                    id="payment_method"
                    value={formData.payment_method}
                    onChange={(e) => handleInputChange('payment_method', e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Informações adicionais sobre esta dívida..."
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
                {loading ? 'Salvando...' : (editingDebt ? 'Atualizar' : 'Criar Dívida')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}