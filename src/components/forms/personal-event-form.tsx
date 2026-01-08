"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatCurrencyInputBRL, parseCurrencyInputBRL } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  Target,
  PiggyBank,
  Heart,
  Bell,
  Calendar,
  X
} from "lucide-react";

interface PersonalEvent {
  id?: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  type: 'payment' | 'goal_deadline' | 'investment' | 'appointment' | 'reminder' | 'other';
  category?: string;
  amount?: number;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'cancelled';
  recurring?: boolean;
  recurrence_type?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  notes?: string;
}

interface PersonalEventFormProps {
  event?: PersonalEvent;
  onSubmit: (event: PersonalEvent) => void;
  onCancel: () => void;
  isOpen: boolean;
}

const EVENT_TYPES = {
  payment: { label: 'Pagamento', icon: CreditCard, color: 'bg-red-100 text-red-600' },
  goal_deadline: { label: 'Meta/Prazo', icon: Target, color: 'bg-blue-100 text-blue-600' },
  investment: { label: 'Investimento', icon: PiggyBank, color: 'bg-green-100 text-green-600' },
  appointment: { label: 'Consulta', icon: Heart, color: 'bg-pink-100 text-pink-600' },
  reminder: { label: 'Lembrete', icon: Bell, color: 'bg-yellow-100 text-yellow-600' },
  other: { label: 'Outros', icon: Calendar, color: 'bg-gray-100 text-gray-600' }
};

const PRIORITY_LEVELS = {
  high: { label: 'Alta', color: 'text-red-600' },
  medium: { label: 'Média', color: 'text-yellow-600' },
  low: { label: 'Baixa', color: 'text-green-600' }
};

export function PersonalEventForm({ event, onSubmit, onCancel, isOpen }: PersonalEventFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [amountInput, setAmountInput] = useState<string>(event?.amount != null ? formatCurrency(event.amount) : '');
  const [formData, setFormData] = useState<PersonalEvent>({
    title: event?.title || '',
    description: event?.description || '',
    date: event?.date || new Date().toISOString().split('T')[0],
    time: event?.time || '',
    type: event?.type || 'reminder',
    category: event?.category || '',
    amount: event?.amount || undefined,
    priority: event?.priority || 'medium',
    status: event?.status || 'pending',
    recurring: event?.recurring || false,
    recurrence_type: event?.recurrence_type || undefined,
    notes: event?.notes || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "O título do evento é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.date) {
      toast({
        title: "Erro",
        description: "A data do evento é obrigatória.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Criar objeto do evento
      const eventData: PersonalEvent = {
        ...formData,
        id: event?.id || `event_${Date.now()}`,
        amount: formData.amount ? Number(formData.amount) : undefined
      };

      onSubmit(eventData);
      
      toast({
        title: "Sucesso!",
        description: event ? "Evento atualizado com sucesso." : "Evento criado com sucesso.",
      });
      
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o evento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PersonalEvent, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-xl">
            {event ? 'Editar Evento' : 'Novo Evento Pessoal'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-3 sm:space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="w-full overflow-auto">
                <TabsTrigger value="basic" className="flex-1">Básico</TabsTrigger>
                <TabsTrigger value="schedule" className="flex-1">Agendamento</TabsTrigger>
                <TabsTrigger value="extras" className="flex-1">Extras</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ex: Pagamento da fatura do cartão"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Detalhes adicionais sobre o evento..."
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Data *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Hora</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleInputChange('time', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label>Tipo do Evento</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleInputChange('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EVENT_TYPES).map(([key, type]) => {
                          const IconComponent = type.icon;
                          return (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Prioridade</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => handleInputChange('priority', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIORITY_LEVELS).map(([key, priority]) => (
                          <SelectItem key={key} value={key}>
                            <span className={priority.color}>{priority.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="extras" className="space-y-3 sm:space-y-4">
                {(formData.type === 'payment' || formData.type === 'investment') && (
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor (R$)</Label>
                    <Input
                      id="amount"
                      type="text"
                      inputMode="numeric"
                      value={amountInput}
                      onChange={(e) => {
                        const formatted = formatCurrencyInputBRL(e.target.value);
                        setAmountInput(formatted);
                        const parsed = parseCurrencyInputBRL(formatted);
                        handleInputChange('amount', parsed);
                      }}
                      placeholder="R$ 0,00"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    placeholder="Ex: Cartão de crédito, Investimentos, Saúde..."
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="recurring"
                      checked={formData.recurring}
                      onChange={(e) => handleInputChange('recurring', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="recurring">Evento recorrente</Label>
                  </div>
                  
                  {formData.recurring && (
                    <Select
                      value={formData.recurrence_type}
                      onValueChange={(value) => handleInputChange('recurrence_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a frequência" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Observações adicionais..."
                    rows={2}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="sm:sticky bottom-0 bg-card px-2 sm:px-0 pt-3 border-t">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Salvando...' : (event ? 'Atualizar' : 'Criar Evento')}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
