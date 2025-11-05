"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, calculateInstallmentInfo, generateInstallmentTransactions } from "@/lib/utils";
import type { Transaction } from "@/types";

const transactionSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.number().min(0.01, "Valor deve ser maior que zero"),
  type: z.enum(['revenue', 'expense']),
  category: z.string().min(1, "Categoria é obrigatória"),
  subcategory: z.string().optional(),
  paymentMethod: z.enum(['pix', 'credit_card', 'debit_card', 'bank_transfer', 'cash']).optional(),
  status: z.enum(['completed', 'pending', 'cancelled']),
  date: z.date(),
  notes: z.string().optional(),
  // Campos para parcelamento
  isInstallment: z.boolean().default(false),
  totalInstallments: z.number().min(1).optional(),
  currentInstallment: z.number().min(1).optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  onSave: (data: Transaction) => void;
  onCancel: () => void;
  transactionToEdit?: Transaction | null;
}

// Categorias padrão como fallback
const defaultTransactionCategories = [
  "Vendas",
  "Compras",
  "Serviços",
  "Impostos",
  "Marketing",
  "Operacional",
  "Pessoal",
  "Outros"
];

const paymentMethods = [
  { value: 'pix', label: 'PIX' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'debit_card', label: 'Cartão de Débito' },
  { value: 'bank_transfer', label: 'Transferência Bancária' },
  { value: 'cash', label: 'Dinheiro' },
];

const transactionStatuses = [
  { value: 'completed', label: 'Concluída' },
  { value: 'pending', label: 'Pendente' },
  { value: 'cancelled', label: 'Cancelada' },
];

export function TransactionForm({ onSave, onCancel, transactionToEdit }: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInstallmentFields, setShowInstallmentFields] = useState(false);
  const [categories, setCategories] = useState<string[]>(defaultTransactionCategories);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Carregar categorias da API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetch('/api/categories');
        
        if (response.ok) {
          const data = await response.json();
          
          // Filtrar apenas categorias de transação
          const transactionCategories = data.categories
            ?.filter((cat: any) => cat.type === 'transaction' || !cat.type) // Incluir categorias sem tipo definido
            ?.map((cat: any) => cat.name) || [];
          
          // Se encontrou categorias, usar elas; senão, manter as padrão
          if (transactionCategories.length > 0) {
            // Combinar categorias da API com as padrão (sem duplicatas)
            const allCategories = [...new Set([...transactionCategories, ...defaultTransactionCategories])];
            setCategories(allCategories);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        // Em caso de erro, manter as categorias padrão
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: transactionToEdit?.description || "",
      amount: transactionToEdit?.amount || 0,
      type: transactionToEdit?.type || "revenue",
      category: transactionToEdit?.category || "",
      subcategory: transactionToEdit?.subcategory || "",
      paymentMethod: transactionToEdit?.paymentMethod || "pix",
      status: transactionToEdit?.status || "completed",
      date: transactionToEdit?.date || new Date(),
      notes: transactionToEdit?.notes || "",
      isInstallment: transactionToEdit?.isInstallment || false,
      totalInstallments: transactionToEdit?.installmentInfo?.totalInstallments || 1,
      currentInstallment: transactionToEdit?.installmentInfo?.currentInstallment || 1,
    },
  });

  const watchPaymentMethod = form.watch("paymentMethod");
  const watchIsInstallment = form.watch("isInstallment");
  const watchAmount = form.watch("amount");
  const watchTotalInstallments = form.watch("totalInstallments");

  // Mostrar campos de parcelamento apenas para cartão de crédito
  React.useEffect(() => {
    setShowInstallmentFields(watchPaymentMethod === 'credit_card');
  }, [watchPaymentMethod]);

  const onSubmit = async (data: TransactionFormData) => {
    setIsSubmitting(true);
    try {
      let transaction: Transaction = {
        id: transactionToEdit?.id || new Date().getTime().toString(),
        ...data,
        date: data.date,
        tags: transactionToEdit?.tags || [],
      };

      // Se for uma compra parcelada, adicionar informações de parcelamento
      if (data.isInstallment && data.totalInstallments && data.totalInstallments > 1) {
        console.log('🎯 Criando transação parcelada:', {
          amount: data.amount,
          totalInstallments: data.totalInstallments,
          currentInstallment: data.currentInstallment || 1
        });

        const installmentInfo = calculateInstallmentInfo(
          data.amount,
          data.totalInstallments,
          data.currentInstallment || 1
        );
        
        console.log('✅ installmentInfo criado:', installmentInfo);
        
        transaction = {
          ...transaction,
          isInstallment: true,
          installmentInfo,
          tags: [...(transaction.tags || []), 'parcelado', 'cartão-credito'],
        };

        console.log('✅ Transação final com installmentInfo:', {
          id: transaction.id,
          description: transaction.description,
          isInstallment: transaction.isInstallment,
          installmentInfo: transaction.installmentInfo
        });
      }
      
      onSave(transaction);
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Venda de produto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="revenue">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
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
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {transactionStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingCategories ? (
                        <SelectItem value="__loading__" disabled>
                          Carregando categorias...
                        </SelectItem>
                      ) : (
                        categories
                          .filter((category) => category && category.trim() !== "")
                          .map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pagamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o método" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
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
            name="subcategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subcategoria (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Eletrônicos, Marketing Digital" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data</FormLabel>
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
                          format(field.value, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
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
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações (opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Adicione observações sobre esta transação..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {showInstallmentFields && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="isInstallment"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isInstallment"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <FormLabel htmlFor="isInstallment" className="text-sm font-medium">
                      💳 É uma compra parcelada no cartão?
                    </FormLabel>
                  </FormItem>
                )}
              />

              {watchIsInstallment && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="totalInstallments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total de Parcelas</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            min="1"
                            placeholder="Ex: 12"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currentInstallment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parcela Atual</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            min="1"
                            placeholder="Ex: 1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Preview de informações de parcelamento */}
              {watchIsInstallment && watchTotalInstallments && watchTotalInstallments > 1 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-3">📋 Resumo do Parcelamento</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-800 font-medium">Valor Total:</span>
                      <span className="ml-2 text-gray-900 font-semibold">R$ {watchAmount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-blue-800 font-medium">Parcelas:</span>
                      <span className="ml-2 text-gray-900 font-semibold">{watchTotalInstallments}x</span>
                    </div>
                    <div>
                      <span className="text-blue-800 font-medium">Valor da Parcela:</span>
                      <span className="ml-2 text-gray-900 font-semibold">R$ {(watchAmount / watchTotalInstallments).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-blue-800 font-medium">Próximo Vencimento:</span>
                      <span className="ml-2 text-gray-900 font-semibold">
                        {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-blue-700 font-medium">
                    💡 Esta compra será automaticamente categorizada como "Compras Parceladas" e você receberá lembretes de vencimento.
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : transactionToEdit ? "Atualizar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}