"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Bell,
  DollarSign,
  CreditCard,
  PiggyBank,
  Target,
  Heart,
  Car,
  Home,
  GraduationCap,
  Briefcase,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { PersonalEventForm } from "@/components/forms/personal-event-form";

interface PersonalEvent {
  id: string;
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
  created_at: string;
}

const EVENT_TYPES = {
  payment: { label: 'Pagamento', icon: CreditCard, color: 'bg-red-100 text-red-600' },
  goal_deadline: { label: 'Meta/Prazo', icon: Target, color: 'bg-blue-100 text-blue-600' },
  investment: { label: 'Investimento', icon: PiggyBank, color: 'bg-green-100 text-green-600' },
  appointment: { label: 'Consulta', icon: Heart, color: 'bg-pink-100 text-pink-600' },
  reminder: { label: 'Lembrete', icon: Bell, color: 'bg-yellow-100 text-yellow-600' },
  other: { label: 'Outros', icon: Calendar, color: 'bg-gray-100 text-gray-600' }
};

const EVENT_STATUS = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-600', variant: 'outline' as const },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-600', variant: 'secondary' as const },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-600', variant: 'destructive' as const }
};

const PRIORITY_LEVELS = {
  high: { label: 'Alta', color: 'text-red-600', variant: 'destructive' as const },
  medium: { label: 'Média', color: 'text-yellow-600', variant: 'outline' as const },
  low: { label: 'Baixa', color: 'text-green-600', variant: 'secondary' as const }
};

export default function PersonalAgendaPage() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<PersonalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PersonalEvent | null>(null);

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Simular dados de agenda pessoal para demonstração
      // TODO: Implementar API real para agenda pessoal
      const mockEvents: PersonalEvent[] = [
        {
          id: '1',
          title: 'Pagamento Cartão de Crédito',
          description: 'Fatura do Nubank - vencimento',
          date: '2025-02-15',
          time: '09:00',
          type: 'payment',
          amount: 1800.00,
          priority: 'high',
          status: 'pending',
          recurring: true,
          recurrence_type: 'monthly',
          notes: 'Configurar débito automático',
          created_at: '2025-01-15T10:00:00Z'
        },
        {
          id: '2',
          title: 'Aporte em Investimentos',
          description: 'Investimento mensal em CDB',
          date: '2025-02-05',
          time: '14:00',
          type: 'investment',
          amount: 2000.00,
          priority: 'high',
          status: 'pending',
          recurring: true,
          recurrence_type: 'monthly',
          notes: 'Verificar melhores taxas disponíveis',
          created_at: '2025-01-05T10:00:00Z'
        },
        {
          id: '3',
          title: 'Revisão de Metas Financeiras',
          description: 'Análise trimestral do progresso das metas',
          date: '2025-02-28',
          time: '19:00',
          type: 'goal_deadline',
          priority: 'medium',
          status: 'pending',
          recurring: true,
          recurrence_type: 'monthly',
          notes: 'Revisar reserva de emergência e entrada do apartamento',
          created_at: '2025-01-28T10:00:00Z'
        },
        {
          id: '4',
          title: 'Consulta Médica - Check-up',
          description: 'Exames de rotina anuais',
          date: '2025-02-20',
          time: '08:30',
          type: 'appointment',
          amount: 350.00,
          priority: 'medium',
          status: 'pending',
          notes: 'Dr. Silva - Clínica São Paulo',
          created_at: '2025-01-20T10:00:00Z'
        },
        {
          id: '5',
          title: 'Renovação Seguro do Carro',
          description: 'Vencimento do seguro automotivo',
          date: '2025-03-10',
          time: '10:00',
          type: 'payment',
          amount: 1200.00,
          priority: 'high',
          status: 'pending',
          notes: 'Comparar preços de outras seguradoras',
          created_at: '2025-01-10T10:00:00Z'
        },
        {
          id: '6',
          title: 'Declaração de Imposto de Renda',
          description: 'Prazo para entrega da declaração',
          date: '2025-04-30',
          time: '23:59',
          type: 'reminder',
          priority: 'high',
          status: 'pending',
          notes: 'Reunir todos os documentos necessários',
          created_at: '2025-01-01T10:00:00Z'
        },
        {
          id: '7',
          title: 'Pagamento IPVA',
          description: 'Imposto sobre veículo',
          date: '2025-01-31',
          time: '18:00',
          type: 'payment',
          amount: 850.00,
          priority: 'high',
          status: 'completed',
          notes: 'Pago com desconto à vista',
          created_at: '2025-01-01T10:00:00Z'
        }
      ];
      
      setEvents(mockEvents);
      
    } catch (error) {
      console.error('Erro ao carregar agenda:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a agenda pessoal.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setIsFormOpen(true);
  };

  const handleEditEvent = (event: PersonalEvent) => {
    setSelectedEvent(event);
    setIsFormOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('Tem certeza que deseja excluir este evento?')) {
      setEvents(prev => prev.filter(event => event.id !== eventId));
      toast({
        title: "Evento excluído",
        description: "O evento foi removido da sua agenda.",
      });
    }
  };

  const handleSubmitEvent = (eventData: PersonalEvent) => {
    if (selectedEvent) {
      // Editar evento existente
      setEvents(prev => prev.map(event => 
        event.id === selectedEvent.id ? { ...eventData, id: selectedEvent.id } : event
      ));
    } else {
      // Criar novo evento
      setEvents(prev => [...prev, { ...eventData, created_at: new Date().toISOString() }]);
    }
    
    setIsFormOpen(false);
    setSelectedEvent(null);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setSelectedEvent(null);
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = !selectedType || event.type === selectedType;
    const matchesStatus = !selectedStatus || event.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Filtrar eventos por período
  const today = new Date();
  const upcomingEvents = filteredEvents.filter(event => new Date(event.date) >= today && event.status === 'pending');
  const overdueEvents = filteredEvents.filter(event => new Date(event.date) < today && event.status === 'pending');
  const completedEvents = filteredEvents.filter(event => event.status === 'completed');
  const totalAmount = upcomingEvents.reduce((sum, event) => sum + (event.amount || 0), 0);

  const getTypeInfo = (type: string) => {
    return EVENT_TYPES[type as keyof typeof EVENT_TYPES] || EVENT_TYPES.other;
  };

  const getStatusInfo = (status: string) => {
    return EVENT_STATUS[status as keyof typeof EVENT_STATUS] || EVENT_STATUS.pending;
  };

  const getPriorityInfo = (priority: string) => {
    return PRIORITY_LEVELS[priority as keyof typeof PRIORITY_LEVELS] || PRIORITY_LEVELS.medium;
  };

  const isOverdue = (date: string) => {
    return new Date(date) < today;
  };

  const isToday = (date: string) => {
    const eventDate = new Date(date);
    return eventDate.toDateString() === today.toDateString();
  };

  const isThisWeek = (date: string) => {
    const eventDate = new Date(date);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return eventDate >= weekStart && eventDate <= weekEnd;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b px-3 md:px-6 py-3 md:py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Voltar ao Dashboard</span>
              </Button>
            </Link>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
                Agenda Pessoal
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                <span className="hidden sm:inline">Organize seus compromissos e lembretes financeiros</span>
                <span className="sm:hidden">Seus compromissos</span>
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex border rounded-md">
              <Button 
                variant={viewMode === 'list' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex-1 sm:flex-none"
              >
                Lista
              </Button>
              <Button 
                variant={viewMode === 'week' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setViewMode('week')}
                className="flex-1 sm:flex-none"
              >
                <span className="hidden xs:inline">Semana</span>
                <span className="xs:hidden">Sem</span>
              </Button>
              <Button 
                variant={viewMode === 'month' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setViewMode('month')}
                className="flex-1 sm:flex-none"
              >
                Mês
              </Button>
            </div>
            <Button onClick={handleCreateEvent} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Novo Evento</span>
              <span className="xs:hidden">Novo</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">

        {/* Cards de Resumo */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Próximos Eventos</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
                {upcomingEvents.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Eventos pendentes
              </p>
            </CardContent>
          </Card>

          <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Eventos Atrasados</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">
                {overdueEvents.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {overdueEvents.length === 0 ? 'Nenhum atraso' : 'Requer atenção'}
              </p>
            </CardContent>
          </Card>

          <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Valor Total Pendente</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600 break-words">
                {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Compromissos financeiros
              </p>
            </CardContent>
          </Card>

          <Card className="transform-gpu hover:scale-105 transition-transform duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Eventos Concluídos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                {completedEvents.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Este período
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar eventos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm"
                  />
              </div>
            </div>
              <div className="w-full sm:w-48">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Todos os tipos</option>
                  {Object.entries(EVENT_TYPES).map(([key, type]) => (
                    <option key={key} value={key}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-40">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Todos os status</option>
                  {Object.entries(EVENT_STATUS).map(([key, status]) => (
                    <option key={key} value={key}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Eventos */}
        <div className="space-y-4 sm:space-y-6">
        {/* Eventos de Hoje */}
        {filteredEvents.filter(event => isToday(event.date)).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredEvents
                  .filter(event => isToday(event.date))
                  .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
                  .map((event) => {
                    const typeInfo = getTypeInfo(event.type);
                    const statusInfo = getStatusInfo(event.status);
                    const priorityInfo = getPriorityInfo(event.priority);
                    const IconComponent = typeInfo.icon;
                    
                    return (
                      <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50/50">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{event.title}</h4>
                              <Badge variant={statusInfo.variant} className="text-xs">
                                {statusInfo.label}
                              </Badge>
                              <Badge variant={priorityInfo.variant} className="text-xs">
                                {priorityInfo.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {event.time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {event.time}
                                </span>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {typeInfo.label}
                              </Badge>
                              {event.amount && (
                                <span className="font-medium text-orange-600">
                                  {event.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" title="Visualizar evento">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditEvent(event)} title="Editar evento">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteEvent(event.id)} title="Excluir evento">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Próximos Eventos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.filter(event => !isToday(event.date)).length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedType || selectedStatus 
                    ? 'Nenhum evento encontrado com os filtros aplicados.' 
                    : 'Nenhum evento próximo agendado.'}
                </p>
                <Button onClick={handleCreateEvent}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar Evento
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents
                  .filter(event => !isToday(event.date))
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((event) => {
                    const typeInfo = getTypeInfo(event.type);
                    const statusInfo = getStatusInfo(event.status);
                    const priorityInfo = getPriorityInfo(event.priority);
                    const IconComponent = typeInfo.icon;
                    const overdue = isOverdue(event.date);
                    
                    return (
                      <div key={event.id} className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
                        overdue ? 'border-red-200 bg-red-50/50' : ''
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{event.title}</h4>
                              <Badge variant={statusInfo.variant} className="text-xs">
                                {statusInfo.label}
                              </Badge>
                              <Badge variant={priorityInfo.variant} className="text-xs">
                                {priorityInfo.label}
                              </Badge>
                              {overdue && (
                                <Badge variant="destructive" className="text-xs">
                                  Atrasado
                                </Badge>
                              )}
                              {event.recurring && (
                                <Badge variant="outline" className="text-xs">
                                  Recorrente
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(event.date).toLocaleDateString('pt-BR')}
                              </span>
                              {event.time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {event.time}
                                </span>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {typeInfo.label}
                              </Badge>
                              {event.amount && (
                                <span className="font-medium text-orange-600">
                                  {event.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" title="Visualizar evento">
                             <Eye className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="sm" onClick={() => handleEditEvent(event)} title="Editar evento">
                             <Edit className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="sm" onClick={() => handleDeleteEvent(event.id)} title="Excluir evento">
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Eventos Concluídos */}
        {completedEvents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Eventos Concluídos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completedEvents
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 5)
                  .map((event) => {
                    const typeInfo = getTypeInfo(event.type);
                    const IconComponent = typeInfo.icon;
                    
                    return (
                      <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50/50">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${typeInfo.color} opacity-60`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-muted-foreground">{event.title}</h4>
                              <Badge variant="secondary" className="text-xs">
                                Concluído
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(event.date).toLocaleDateString('pt-BR')}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {typeInfo.label}
                              </Badge>
                              {event.amount && (
                                <span className="font-medium">
                                  {event.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Formulário de Evento Pessoal */}
       <PersonalEventForm
         event={selectedEvent}
         onSubmit={handleSubmitEvent}
         onCancel={handleCancelForm}
         isOpen={isFormOpen}
       />
      </div>
    </div>
  );
}