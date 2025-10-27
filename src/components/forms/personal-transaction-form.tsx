"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { X, ArrowUp, ArrowDown, Calendar, CreditCard, Tag, FileText, MapPin, Building } from "lucide-react";

interface PersonalTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Categorias padrão como fallback
const DEFAULT_INCOME_CATEGORIES = {
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

const DEFAULT_EXPENSE_CATEGORIES = {
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

export default function PersonalTransactionForm({ isOpen, onClose, onSuccess }: PersonalTransactionFormProps) {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [dynamicIncomeCategories, setDynamicIncomeCategories] = useState(DEFAULT_INCOME_CATEGORIES);
  const [dynamicExpenseCategories, setDynamicExpenseCategories] = useState(DEFAULT_EXPENSE_CATEGORIES);
  
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    category: 'food',
    source: '', // Para receitas
    payment_method: 'debit_card', // Para despesas
    is_essential: false, // Para despesas
    is_recurring: false,
    is_taxable: false, // Para receitas
    tax_withheld: '0', // Para receitas
    location: '',
    merchant: '',
    notes: ''
  });

  // Carregar categorias da API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetch('/api/categories');
        
        if (response.ok) {
          const data = await response.json();
          
          // Separar categorias por tipo
          const incomeCategories: Record<string, string> = {};
          const expenseCategories: Record<string, string> = {};
          
          data.categories?.forEach((cat: any) => {
            // Criar uma chave baseada no nome (sem espaços e minúscula)
            const key = cat.name.toLowerCase().replace(/\s+/g, '_');
            
            // Categorizar baseado no tipo ou nome
            if (cat.type === 'income' || 
                ['salário', 'freelance', 'investimento', 'renda'].some(word => 
                  cat.name.toLowerCase().includes(word))) {
              incomeCategories[key] = cat.name;
            } else {
              expenseCategories[key] = cat.name;
            }
          });
          
          // Combinar com categorias padrão
          if (Object.keys(incomeCategories).length > 0) {
            setDynamicIncomeCategories({
              ...DEFAULT_INCOME_CATEGORIES,
              ...incomeCategories
            });
          }
          
          if (Object.keys(expenseCategories).length > 0) {
            setDynamicExpenseCategories({
              ...DEFAULT_EXPENSE_CATEGORIES,
              ...expenseCategories
            });
          }
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        // Em caso de erro, manter as categorias padrão
      } finally {
        setLoadingCategories(false);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

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

    if (formData.type === 'income' && !formData.source) {
      toast({
        title: "Erro",
        description: "Informe a fonte da receita.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // O usuário já é do Supabase, usar ID diretamente
      const supabaseUserId = user.id;
      
      let transactionData: any = {
        user_id: supabaseUserId,
        date: formData.date,
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        is_recurring: formData.is_recurring,
        notes: formData.notes || null
      };
      
      let apiUrl = '';
      
      if (formData.type === 'income') {
        // Dados específicos para receitas
        transactionData = {
          ...transactionData,
          source: formData.source,
          is_taxable: formData.is_taxable,
          tax_withheld: formData.is_taxable ? parseFloat(formData.tax_withheld) : 0
        };
        apiUrl = '/api/personal/incomes';
      } else {
        // Dados específicos para despesas
        transactionData = {
          ...transactionData,
          payment_method: formData.payment_method,
          is_essential: formData.is_essential,
          location: formData.location || null,
          merchant: formData.merchant || null
        };
        apiUrl = '/api/personal/expenses';
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactionData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar transação');
      }
      
      toast({
        title: "Sucesso!",
        description: `${formData.type === 'income' ? 'Receita' : 'Despesa'} criada com sucesso.`,
      });
      
      onSuccess();
      
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar transação.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Resetar categoria quando mudar o tipo
      if (field === 'type') {
        newData.category = value === 'income' ? 'salary' : 'food';
      }
      
      return newData;
    });
  };

  const getCurrentCategories = () => {
    return formData.type === 'income' ? dynamicIncomeCategories : dynamicExpenseCategories;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            {formData.type === 'income' ? (
              <ArrowUp className="h-5 w-5 text-green-600" />
            ) : (
              <ArrowDown className="h-5 w-5 text-red-600" />
            )}
            Nova Transação Pessoal
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Transação */}
            <div className="space-y-3">
              <Label>Tipo de Transação *</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={formData.type === 'income' ? 'default' : 'outline'}
                  onClick={() => handleInputChange('type', 'income')}
                  className="flex items-center gap-2"
                >
                  <ArrowUp className="h-4 w-4" />
                  Receita
                </Button>
                <Button
                  type="button"
                  variant={formData.type === 'expense' ? 'default' : 'outline'}
                  onClick={() => handleInputChange('type', 'expense')}
                  className="flex items-center gap-2"
                >
                  <ArrowDown className="h-4 w-4" />
                  Despesa
                </Button>
              </div>
            </div>
            
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
                  {formData.type === 'income' ? (
                    <ArrowUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-red-600" />
                  )}
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
                placeholder={formData.type === 'income' ? 'Ex: Salário Janeiro 2025' : 'Ex: Supermercado - Compras do mês'}
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
                  disabled={loadingCategories}
                >
                  {loadingCategories ? (
                    <option value="">Carregando categorias...</option>
                  ) : (
                    Object.entries(getCurrentCategories()).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))
                  )}
                </select>
              </div>
              
              {formData.type === 'income' ? (
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
              ) : (
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
              )}
            </div>
            
            {/* Campos específicos para despesas */}
            {formData.type === 'expense' && (
              <div className="grid gap-4 md:grid-cols-2">
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
                
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Localização
                  </Label>
                  <Input
                    id="location"
                    placeholder="Ex: Shopping Center"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  />
                </div>
              </div>
            )}
            
            {/* Configurações */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Configurações</h3>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label htmlFor="is_recurring" className="font-medium">
                    {formData.type === 'income' ? 'Receita Recorrente' : 'Despesa Recorrente'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Esta {formData.type === 'income' ? 'receita' : 'despesa'} se repete mensalmente
                  </p>
                </div>
                <Switch
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) => handleInputChange('is_recurring', checked)}
                />
              </div>
              
              {formData.type === 'income' ? (
                <>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label htmlFor="is_taxable" className="font-medium">Receita Tributável</Label>
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
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        value={formData.tax_withheld}
                        onChange={(e) => handleInputChange('tax_withheld', e.target.value)}
                      />
                    </div>
                  )}
                </>
              ) : (
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
              )}
            </div>
            
            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Informações adicionais sobre esta transação..."
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
                {loading ? 'Salvando...' : `Criar ${formData.type === 'income' ? 'Receita' : 'Despesa'}`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}