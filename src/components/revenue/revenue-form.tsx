"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, formatCurrency, formatCurrencyInputBRL, parseCurrencyInputBRL } from "@/lib/utils";
import type { Revenue, Product } from "@/types";

const revenueSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.number().min(0.01, "Valor deve ser maior que zero"),
  category: z.string().min(1, "Categoria é obrigatória"),
  source: z.enum(['sale', 'commission', 'bonus', 'other']),
  date: z.date(),
  notes: z.string().optional(),
  productId: z.string().optional(),
});

type RevenueFormData = z.infer<typeof revenueSchema>;

interface RevenueFormProps {
  onSave: (data: Revenue) => void;
  onCancel: () => void;
  revenueToEdit?: Revenue | null;
  products?: Product[];
}

const revenueCategories = [
  "Vendas de Produtos",
  "Comissões",
  "Bônus",
  "Freelance",
  "Investimentos",
  "Outros"
];

const revenueSources = [
  { value: 'sale', label: 'Venda' },
  { value: 'commission', label: 'Comissão' },
  { value: 'bonus', label: 'Bônus' },
  { value: 'other', label: 'Outro' },
];

export function RevenueForm({ onSave, onCancel, revenueToEdit, products = [] }: RevenueFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amountInput, setAmountInput] = useState<string>(revenueToEdit?.amount != null ? formatCurrency(revenueToEdit.amount) : '');

  const form = useForm<RevenueFormData>({
    resolver: zodResolver(revenueSchema),
    defaultValues: {
      description: revenueToEdit?.description || "",
      amount: revenueToEdit?.amount || 0,
      category: revenueToEdit?.category || undefined,
      source: revenueToEdit?.source || "sale",
      date: revenueToEdit?.date || new Date(),
      notes: revenueToEdit?.notes || "",
      productId: revenueToEdit?.productId || undefined,
    },
  });

  const onSubmit = async (data: RevenueFormData) => {
    setIsSubmitting(true);
    try {
      const revenue: Revenue = {
        id: revenueToEdit?.id || new Date().getTime().toString(),
        ...data,
        date: data.date,
      };
      
      onSave(revenue);
    } catch (error) {
      console.error("Erro ao salvar receita:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Venda de smartphone" {...field} />
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
                      type="text"
                      inputMode="numeric"
                      placeholder="R$ 0,00"
                      value={amountInput}
                      onChange={(e) => {
                        const formatted = formatCurrencyInputBRL(e.target.value);
                        setAmountInput(formatted);
                        const parsed = parseCurrencyInputBRL(formatted);
                        field.onChange(parsed || 0);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {revenueCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
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
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fonte</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a fonte" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {revenueSources.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          </div>

          {form.watch('source') === 'sale' && products && products.length > 0 && (
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Produto (opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products
                        .filter((p) => p.id && String(p.id).trim() !== "")
                        .map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

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
                          "w-full h-9 pl-3 text-left font-normal",
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
                    placeholder="Adicione observações sobre esta entrada..."
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="sticky bottom-0 border-t bg-card/80 backdrop-blur p-3">
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : revenueToEdit ? "Atualizar" : "Adicionar"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </>
  );
}
