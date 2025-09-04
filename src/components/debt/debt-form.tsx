"use client";
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import type { Debt } from "@/types";

const debtFormSchema = z.object({
  creditorName: z.string().min(1, "Nome do credor é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  originalAmount: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  currentAmount: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  interestRate: z.coerce.number().min(0, "Taxa de juros deve ser maior ou igual a zero").optional(),
  dueDate: z.date({
    required_error: "Data de vencimento é obrigatória",
  }),
  category: z.enum(["credit_card", "loan", "financing", "supplier", "personal", "other"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["pending", "overdue", "paid", "negotiating", "cancelled"]),
  paymentMethod: z.enum(["pix", "credit_card", "debit_card", "bank_transfer", "cash"]).optional(),
  hasInstallments: z.boolean().default(false),
  installmentTotal: z.coerce.number().min(1, "Total de parcelas deve ser maior que zero").optional(),
  installmentPaid: z.coerce.number().min(0, "Parcelas pagas deve ser maior ou igual a zero").optional(),
  installmentAmount: z.coerce.number().min(0.01, "Valor da parcela deve ser maior que zero").optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
}).refine((data) => {
  if (data.hasInstallments) {
    if (!data.installmentTotal || data.installmentTotal <= 0) {
      return false;
    }
    if (data.installmentPaid !== undefined && data.installmentPaid > data.installmentTotal) {
      return false;
    }
  }
  return true;
}, {
  message: "Para dívidas parceladas, informe o total de parcelas e verifique se as parcelas pagas não excedem o total",
  path: ["installmentTotal"]
});

type DebtFormValues = z.infer<typeof debtFormSchema>;

interface DebtFormProps {
  debt?: Debt;
  onSubmit: (data: Omit<Debt, 'id' | 'createdDate' | 'payments'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const categoryOptions = [
  { value: "credit_card", label: "Cartão de Crédito" },
  { value: "loan", label: "Empréstimo" },
  { value: "financing", label: "Financiamento" },
  { value: "supplier", label: "Fornecedor" },
  { value: "personal", label: "Pessoal" },
  { value: "other", label: "Outros" },
];

const priorityOptions = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
];

const statusOptions = [
  { value: "pending", label: "Pendente" },
  { value: "overdue", label: "Vencida" },
  { value: "paid", label: "Paga" },
  { value: "negotiating", label: "Negociando" },
  { value: "cancelled", label: "Cancelada" },
];

const paymentMethodOptions = [
  { value: "pix", label: "PIX" },
  { value: "credit_card", label: "Cartão de Crédito" },
  { value: "debit_card", label: "Cartão de Débito" },
  { value: "bank_transfer", label: "Transferência Bancária" },
  { value: "cash", label: "Dinheiro" },
];

export function DebtForm({ debt, onSubmit, onCancel, isLoading }: DebtFormProps) {
  const form = useForm<DebtFormValues>({
    resolver: zodResolver(debtFormSchema),
    defaultValues: {
      creditorName: debt?.creditorName || "",
      description: debt?.description || "",
      originalAmount: debt?.originalAmount || 0,
      currentAmount: debt?.currentAmount || 0,
      interestRate: debt?.interestRate || 0,
      dueDate: debt?.dueDate || new Date(),
      category: debt?.category || "other",
      priority: debt?.priority || "medium",
      status: debt?.status || "pending",
      paymentMethod: debt?.paymentMethod || undefined,
      hasInstallments: !!debt?.installments,
      installmentTotal: debt?.installments?.total || undefined,
      installmentPaid: debt?.installments?.paid || 0,
      installmentAmount: debt?.installments?.amount || undefined,
      notes: debt?.notes || "",
      tags: debt?.tags?.join(", ") || "",
    },
  });

  const handleSubmit = (values: DebtFormValues) => {
    const debtData: Omit<Debt, 'id' | 'createdDate' | 'payments'> = {
      creditorName: values.creditorName,
      description: values.description,
      originalAmount: values.originalAmount,
      currentAmount: values.currentAmount,
      interestRate: values.interestRate || undefined,
      dueDate: values.dueDate,
      category: values.category,
      priority: values.priority,
      status: values.status,
      paymentMethod: values.paymentMethod,
      installments: values.hasInstallments && values.installmentTotal ? {
        total: values.installmentTotal,
        paid: values.installmentPaid || 0,
        amount: values.installmentAmount || 0,
      } : undefined,
      notes: values.notes,
      tags: values.tags ? values.tags.split(",").map(tag => tag.trim()).filter(Boolean) : undefined,
    };

    onSubmit(debtData);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">{debt ? "Editar Dívida" : "Nova Dívida"}</h2>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Informações Básicas */}
          <div className="bg-card rounded-lg border p-4 sm:p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Informações Básicas</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                <FormField
                  control={form.control}
                  name="creditorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Nome do Credor *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Banco do Brasil" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Categoria *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categoryOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Descrição *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva a dívida..." 
                        className="resize-none" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </div>

          {/* Valores */}
          <div className="bg-card rounded-lg border p-4 sm:p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Valores</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                <FormField
                  control={form.control}
                  name="originalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Valor Original *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0.01"
                          placeholder="0,00" 
                          {...field}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Valor Atual *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0.01"
                          placeholder="0,00" 
                          {...field}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Valor com juros, multas, etc.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interestRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Taxa de Juros (% a.m.)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          placeholder="0,00" 
                          {...field}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
          </div>

          {/* Configurações */}
          <div className="bg-card rounded-lg border p-4 sm:p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Configurações</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-sm font-medium">Data de Vencimento *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecione a data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Prioridade *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a prioridade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {priorityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Método de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o método de pagamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethodOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </div>

          {/* Parcelamento */}
          <div className="bg-card rounded-lg border p-4 sm:p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Parcelamento</h3>
            
            <FormField
              control={form.control}
              name="hasInstallments"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-medium">
                      Esta dívida é parcelada?
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {form.watch("hasInstallments") && (
              <div className="space-y-4">
                <div className="p-4 sm:p-5 bg-muted/50 rounded-lg border">
                  <p className="text-sm text-muted-foreground mb-4">
                    Para dívidas parceladas, preencha as informações abaixo:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                    <FormField
                      control={form.control}
                      name="installmentTotal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Total de Parcelas *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              placeholder="12" 
                              {...field}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                field.onChange(isNaN(value) ? undefined : value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="installmentPaid"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Parcelas Pagas</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              placeholder="0" 
                              {...field}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                field.onChange(isNaN(value) ? 0 : value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="installmentAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Valor da Parcela</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              min="0.01"
                              placeholder="0,00" 
                              {...field}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                field.onChange(isNaN(value) ? undefined : value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="bg-card rounded-lg border p-4 sm:p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Observações</h3>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observações adicionais..." 
                        className="resize-none" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Tags</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="urgente, banco, cartão (separadas por vírgula)" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Separe as tags com vírgulas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6">
            <Button type="submit" disabled={isLoading} className="flex-1 h-11">
              {isLoading ? "Salvando..." : debt ? "Atualizar" : "Criar"} Dívida
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-11">
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}