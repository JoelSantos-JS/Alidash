"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import type { Product } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";


const productSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  category: z.string().min(1, { message: "A categoria é obrigatória" }),
  supplier: z.string().min(2, { message: "O fornecedor deve ter pelo menos 2 caracteres." }),
  aliexpressLink: z.string().url({ message: "Por favor, insira uma URL válida." }).optional().or(z.literal('')),
  imageUrl: z.string().url({ message: "Por favor, insira uma URL de imagem válida." }),
  description: z.string().optional(),
  purchasePrice: z.coerce.number().min(0, { message: "O preço de compra não pode ser negativo." }),
  shippingCost: z.coerce.number().min(0, { message: "O custo de frete não pode ser negativo." }),
  importTaxes: z.coerce.number().min(0, { message: "As taxas de importação não podem ser negativas." }),
  packagingCost: z.coerce.number().min(0, { message: "O custo de embalagem não pode ser negativo." }),
  marketingCost: z.coerce.number().min(0, { message: "O custo de marketing não pode ser negativo." }),
  otherCosts: z.coerce.number().min(0, { message: "Outros custos não podem ser negativos." }),
  sellingPrice: z.coerce.number().min(0.01, { message: "O preço de venda deve ser maior que zero." }),
  quantity: z.coerce.number().int().min(1, { message: "A quantidade deve ser pelo menos 1." }),
  quantitySold: z.coerce.number().int().min(0, { message: "A quantidade vendida não pode ser negativa." }),
  status: z.enum(['purchased', 'shipping', 'received', 'selling', 'sold']),
  purchaseDate: z.date({ required_error: "A data de compra é obrigatória." }),
}).refine(data => data.quantitySold <= data.quantity, {
    message: "A quantidade vendida não pode ser maior que a comprada.",
    path: ["quantitySold"],
});


type ProductFormValues = Omit<Product, 'id' | 'totalCost' | 'expectedProfit' | 'profitMargin' | 'roi' | 'actualProfit'> & { purchaseDate: Date };

interface ProductFormProps {
  onSave: (data: Product) => void;
  productToEdit: Product | null;
  onCancel: () => void;
}

const statusOptions = {
    purchased: 'Comprado',
    shipping: 'Em trânsito',
    received: 'Recebido',
    selling: 'À venda',
    sold: 'Vendido',
}

export function ProductForm({ onSave, productToEdit, onCancel }: ProductFormProps) {
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: productToEdit ? { ...productToEdit } : {
        name: "",
        category: "",
        supplier: "",
        aliexpressLink: "",
        imageUrl: "",
        description: "",
        purchasePrice: 0,
        shippingCost: 0,
        importTaxes: 0,
        packagingCost: 0,
        marketingCost: 0,
        otherCosts: 0,
        sellingPrice: 0,
        quantity: 1,
        quantitySold: 0,
        status: 'purchased',
        purchaseDate: new Date(),
    },
  });

  const { formState: { isSubmitting }, watch } = form;

  const watchedValues = watch();

  const calculateFinancials = (data: Partial<z.infer<typeof productSchema>>) => {
    const totalCost = 
        (data.purchasePrice ?? 0) + 
        (data.shippingCost ?? 0) + 
        (data.importTaxes ?? 0) + 
        (data.packagingCost ?? 0) + 
        (data.marketingCost ?? 0) + 
        (data.otherCosts ?? 0);

    const expectedProfit = (data.sellingPrice ?? 0) - totalCost;
    const profitMargin = (data.sellingPrice ?? 0) > 0 ? (expectedProfit / (data.sellingPrice ?? 1)) * 100 : 0;
    const roi = totalCost > 0 ? (expectedProfit / totalCost) * 100 : 0;
    const actualProfit = expectedProfit * (data.quantitySold ?? 0);

    return { totalCost, expectedProfit, profitMargin, roi, actualProfit };
  }

  const onSubmit = (data: z.infer<typeof productSchema>) => {
    const financials = calculateFinancials(data);
    onSave({ ...data, ...financials, id: productToEdit?.id || '' });
  };
  
  const { totalCost, expectedProfit, profitMargin } = calculateFinancials(watchedValues);
  const isLowProfit = profitMargin < 15 && profitMargin !== 0;


  return (
    <>
      <DialogHeader className="p-6 pb-2">
        <DialogTitle>{productToEdit ? "Editar Produto" : "Adicionar Novo Produto"}</DialogTitle>
        <DialogDescription>
          {productToEdit ? "Atualize as informações do seu produto." : "Preencha os detalhes do novo produto que você adquiriu."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[70vh] px-6">
                <div className="space-y-6">
                    {isLowProfit && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Margem de Lucro Baixa</AlertTitle>
                            <AlertDescription>
                                A margem de lucro para este produto está abaixo de 15%. Considere revisar seus custos ou preço de venda.
                            </AlertDescription>
                        </Alert>
                    )}
                    <h3 className="text-lg font-medium border-b pb-2">Informações Básicas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome do Produto</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="category" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Categoria</FormLabel>
                                <FormControl><Input {...field} placeholder="Ex: Eletrônicos, Casa e Cozinha..." /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl><Textarea {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="supplier" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fornecedor / Loja</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="imageUrl" render={({ field }) => (
                            <FormItem>
                                <FormLabel>URL da Imagem</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <FormField control={form.control} name="aliexpressLink" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Link do AliExpress (Opcional)</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <h3 className="text-lg font-medium border-b pb-2 pt-4">Custos do Produto</h3>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="purchasePrice" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Preço de Compra (R$)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="shippingCost" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Frete (R$)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="importTaxes" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Impostos (R$)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="packagingCost" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Embalagem (R$)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="marketingCost" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Marketing (R$)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="otherCosts" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Outros Custos (R$)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                    <h3 className="text-lg font-medium border-b pb-2 pt-4">Venda e Estoque</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={form.control} name="sellingPrice" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Preço de Venda (R$)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="quantity" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Quantidade Comprada</FormLabel>
                                <FormControl><Input type="number" {...field} min={1} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="quantitySold" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Quantidade Vendida</FormLabel>
                                <FormControl><Input type="number" {...field} min={0} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <FormField control={form.control} name="status" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Object.entries(statusOptions).map(([key, value]) => (
                                            <SelectItem key={key} value={key}>{value}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="purchaseDate" render={({ field }) => (
                            <FormItem className="flex flex-col pt-2">
                                <FormLabel>Data da Compra</FormLabel>
                                <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP", { locale: ptBR })
                                            ) : (
                                                <span>Escolha uma data</span>
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
                                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                        initialFocus
                                        locale={ptBR}
                                    />
                                </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                </div>
            </ScrollArea>
             <div className="p-6 pt-2 flex flex-col md:flex-row justify-between items-center gap-4 bg-background border-t">
                <div className="flex gap-4 items-center">
                    <div>
                        <span className="text-sm text-muted-foreground">Custo Total/un</span>
                        <p className="font-bold text-lg text-destructive">{totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                     <div>
                        <span className="text-sm text-muted-foreground">Lucro Esperado/un</span>
                        <p className={`font-bold text-lg ${expectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {expectedProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>
                     <div>
                        <span className="text-sm text-muted-foreground">Margem</span>
                         <p className={`font-bold text-lg ${expectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {profitMargin.toFixed(2)}%
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : (productToEdit ? "Salvar Alterações" : "Adicionar Produto")}
                    </Button>
                </div>
            </div>
        </form>
      </Form>
    </>
  );
}
