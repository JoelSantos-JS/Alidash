
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
    <div className="flex flex-col h-full">
      <DialogHeader className="text-center pb-6">
        <DialogTitle className="text-2xl font-bold">Registrar Venda</DialogTitle>
        <DialogDescription className="text-base">
          Produto: <span className="font-semibold text-foreground">"{product.name}"</span>
        </DialogDescription>
        <div className="mt-2 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Estoque disponível: <span className="font-semibold text-foreground">{remainingQuantity} unidades</span>
          </p>
        </div>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1">
          <div className="flex-1 space-y-6 px-1">
            <FormField 
              control={form.control} 
              name="quantity" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Quantidade Vendida</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      min={1} 
                      max={remainingQuantity}
                      className="text-lg h-12"
                      placeholder="1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />
            
            <FormField 
              control={form.control} 
              name="buyerName" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Nome do Comprador <span className="text-muted-foreground font-normal">(Opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Ex: João Silva"
                      className="text-lg h-12"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} 
            />
          </div>
          
          <DialogFooter className="pt-8 gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              disabled={isSubmitting}
              className="flex-1 h-12 text-base"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 h-12 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Registrar Venda"
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </div>
  );
}
