
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import type { Product, Sale } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SaleFormProps {
  onSave: (data: Omit<Sale, 'id' | 'date'>) => void;
  product: Product;
  onCancel: () => void;
}

export function SaleForm({ onSave, product, onCancel }: SaleFormProps) {
  
  const remainingQuantity = product.quantity - product.quantitySold;

  const saleSchema = z.object({
    quantity: z.coerce.number().int()
        .min(1, { message: "Venda pelo menos 1 item." })
        .max(remainingQuantity, { message: `Você só tem ${remainingQuantity} em estoque.` }),
    buyerName: z.string().optional(),
  });

  const form = useForm<z.infer<typeof saleSchema>>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
        quantity: 1,
        buyerName: "",
    },
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = (data: z.infer<typeof saleSchema>) => {
    onSave(data);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Registrar Venda para "{product.name}"</DialogTitle>
        <DialogDescription>
            Quantos itens foram vendidos? Você pode adicionar o nome do comprador (opcional).
            Estoque restante: {remainingQuantity}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="max-h-[60vh] p-1 pr-6">
                <div className="space-y-4 p-4">
                    <FormField control={form.control} name="quantity" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Quantidade Vendida</FormLabel>
                            <FormControl>
                                <Input type="number" {...field} min={1} max={remainingQuantity} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="buyerName" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Comprador (Opcional)</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Ex: João Silva" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
            </ScrollArea>
            <DialogFooter className="pt-6">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Registrar Venda"}
                </Button>
            </DialogFooter>
        </form>
      </Form>
    </>
  );
}
