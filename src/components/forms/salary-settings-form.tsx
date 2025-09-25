"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Briefcase, Settings, Calendar, DollarSign, Save, Info } from "lucide-react";

interface SalarySettingsFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SalarySettings {
  id?: string;
  amount: number;
  description: string;
  payment_day: number;
  is_active: boolean;
  is_taxable: boolean;
  tax_withheld: number;
  source: string;
  notes?: string;
}

export default function SalarySettingsForm({ isOpen, onClose, onSuccess }: SalarySettingsFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [applyingCurrentMonth, setApplyingCurrentMonth] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    description: 'Salário Mensal',
    payment_day: '1',
    is_active: true,
    is_taxable: true,
    tax_withheld: '0',
    source: '',
    notes: ''
  });

  // Carregar configurações existentes
  useEffect(() => {
    if (isOpen && user?.uid) {
      loadSalarySettings();
    }
  }, [isOpen, user]);

  const loadSalarySettings = async () => {
    if (!user?.uid) return;
    
    setLoadingSettings(true);
    try {
      // Buscar usuário Supabase
      const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user.uid}&email=${user.email}`);
      if (!userResponse.ok) {
        throw new Error('Usuário não encontrado');
      }
      
      const userResult = await userResponse.json();
      const supabaseUserId = userResult.user.id;

      // Buscar configurações de salário
      const response = await fetch(`/api/personal/salary-settings?user_id=${supabaseUserId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setFormData({
            amount: data.settings.amount.toString(),
            description: data.settings.description || 'Salário Mensal',
            payment_day: data.settings.payment_day.toString(),
            is_active: data.settings.is_active,
            is_taxable: data.settings.is_taxable,
            tax_withheld: data.settings.tax_withheld?.toString() || '0',
            source: data.settings.source || '',
            notes: data.settings.notes || ''
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) {
      console.error('❌ Usuário não autenticado');
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Iniciando salvamento das configurações de salário...');
      console.log('👤 Firebase UID:', user.uid);
      console.log('📧 Email:', user.email);
      
      // Buscar usuário Supabase
      const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user.uid}&email=${user.email}`);
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error('❌ Erro ao buscar usuário:', errorText);
        throw new Error('Usuário não encontrado');
      }
      
      const userResult = await userResponse.json();
      const supabaseUserId = userResult.user.id;
      console.log('✅ Supabase User ID:', supabaseUserId);

      // Preparar dados das configurações
      const settingsData = {
        user_id: supabaseUserId,
        amount: parseFloat(formData.amount),
        description: formData.description,
        payment_day: parseInt(formData.payment_day),
        is_active: formData.is_active,
        is_taxable: formData.is_taxable,
        tax_withheld: parseFloat(formData.tax_withheld) || 0,
        source: formData.source,
        notes: formData.notes
      };

      console.log('📋 Dados a serem salvos:', settingsData);

      const response = await fetch('/api/personal/salary-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na resposta da API:', errorText);
        throw new Error(`Erro ao salvar configurações: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Configurações salvas com sucesso:', result);

      toast({
        title: "✅ Configurações Salvas!",
        description: "Seu salário fixo foi configurado e será aplicado automaticamente todo mês.",
      });

      onSuccess();
    } catch (error) {
      console.error('❌ Erro ao salvar configurações:', error);
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCurrentMonth = async () => {
    if (!user?.uid) return;

    setApplyingCurrentMonth(true);
    try {
      // Buscar usuário Supabase
      const userResponse = await fetch(`/api/auth/get-user?firebase_uid=${user.uid}&email=${user.email}`);
      if (!userResponse.ok) {
        throw new Error('Usuário não encontrado');
      }
      
      const userResult = await userResponse.json();
      const supabaseUserId = userResult.user.id;

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Aplicar salário para o mês atual
      const response = await fetch('/api/personal/salary-automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: supabaseUserId,
          month: currentMonth,
          year: currentYear
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "✅ Salário Aplicado!",
          description: `Salário de ${currentMonth}/${currentYear} foi adicionado às suas receitas.`,
        });
        onSuccess(); // Recarrega os dados do dashboard
      } else {
        throw new Error(result.error || 'Erro ao aplicar salário');
      }
    } catch (error) {
      console.error('Erro ao aplicar salário:', error);
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Não foi possível aplicar o salário.",
        variant: "destructive",
      });
    } finally {
      setApplyingCurrentMonth(false);
    }
  };

  if (loadingSettings) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurar Salário Fixo
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando configurações...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Configurar Salário Fixo
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valor *
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment_day" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Dia do Recebimento
              </Label>
              <Select value={formData.payment_day} onValueChange={(value) => setFormData({...formData, payment_day: value})}>
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
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Descrição *
            </Label>
            <Input
              id="description"
              placeholder="Ex: Salário Janeiro 2025"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Categoria *
              </Label>
              <select
                value="salary"
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                disabled
              >
                <option value="salary">Salário</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="source" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Fonte/Pagador *
              </Label>
              <Input
                id="source"
                placeholder="Ex: Empresa XYZ Ltda"
                value={formData.source}
                onChange={(e) => setFormData({...formData, source: e.target.value})}
                required
              />
            </div>
          </div>
          
          {/* Configurações */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Configurações</h3>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label htmlFor="is_active" className="font-medium">Receita Recorrente</Label>
                <p className="text-sm text-muted-foreground">Esta receita se repete mensalmente</p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label htmlFor="is_taxable" className="font-medium">Receita Tributável</Label>
                <p className="text-sm text-muted-foreground">Sujeita a imposto de renda</p>
              </div>
              <Switch
                id="is_taxable"
                checked={formData.is_taxable}
                onCheckedChange={(checked) => setFormData({...formData, is_taxable: checked})}
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
                  onChange={(e) => setFormData({...formData, tax_withheld: e.target.value})}
                />
              </div>
            )}
          </div>
          
          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Informações adicionais sobre esta receita..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
            />
          </div>
          
          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleApplyCurrentMonth}
              disabled={applyingCurrentMonth || !formData.amount}
              className="flex-1"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Aplicar Mês Atual
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}