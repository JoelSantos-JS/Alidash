"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, Loader2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import React from "react";

import type { Product } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { suggestPrice, suggestDescription } from "@/ai/flows/dream-planner";
import { useToast } from "@/hooks/use-toast";


const productSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  category: z.string().min(1, { message: "A categoria é obrigatória" }),
  supplier: z.string().min(2, { message: "O fornecedor deve ter pelo menos 2 caracteres." }),
  aliexpressLink: z.string().url({ message: "Por favor, insira uma URL válida." }).optional().or(z.literal('')),
  imageUrl: z.string().url({ message: "Por favor, insira uma URL de imagem válida." }),
  description: z.string().optional(),
  notes: z.string().optional(),
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
    sold: 'Esgotado',
}

const categoryOptions = [
    "Eletrônicos",
    "Casa e Cozinha",
    "Roupas e Acessórios",
    "Saúde e Beleza",
    "Brinquedos e Jogos",
    "Esportes e Lazer",
    "Automotivo",
    "Iluminação",
    "Áudio",
]

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
        notes: "",
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

  const { formState: { isSubmitting }, watch, setValue, control } = form;
  const { toast } = useToast();
  const [isSuggesting, setIsSuggesting] = React.useState({ price: false, description: false});
  const [isCustomCategory, setIsCustomCategory] = React.useState(false);

  const watchedValues = watch();
  const watchedCategory = watch("category");

  React.useEffect(() => {
    if (productToEdit && !categoryOptions.includes(productToEdit.category)) {
        setIsCustomCategory(true);
    }
  }, [productToEdit]);
  
  React.useEffect(() => {
    if(watchedCategory === 'custom') {
        setIsCustomCategory(true);
        setValue('category', '');
    } else if (watchedCategory !== '' && watchedCategory !== 'custom') {
        setIsCustomCategory(false);
    }
  }, [watchedCategory, setValue]);


  const calculateFinancials = React.useCallback((data: Partial<z.infer<typeof productSchema>>) => {
    const purchasePrice = parseFloat(String(data.purchasePrice || 0));
    const shippingCost = parseFloat(String(data.shippingCost || 0));
    const importTaxes = parseFloat(String(data.importTaxes || 0));
    const packagingCost = parseFloat(String(data.packagingCost || 0));
    const marketingCost = parseFloat(String(data.marketingCost || 0));
    const otherCosts = parseFloat(String(data.otherCosts || 0));
    const sellingPrice = parseFloat(String(data.sellingPrice || 0));
    const quantitySold = parseInt(String(data.quantitySold || 0), 10);

    const totalCost = purchasePrice + shippingCost + importTaxes + packagingCost + marketingCost + otherCosts;
    const expectedProfit = sellingPrice - totalCost;
    const profitMargin = sellingPrice > 0 ? (expectedProfit / sellingPrice) * 100 : 0;
    const roi = totalCost > 0 ? (expectedProfit / totalCost) * 100 : 0;
    const actualProfit = expectedProfit * quantitySold;

    return { totalCost, expectedProfit, profitMargin, roi, actualProfit };
  }, []);

  const onSubmit = (data: z.infer<typeof productSchema>) => {
    const financials = calculateFinancials(data);
    onSave({ 
        ...data, 
        ...financials, 
        id: productToEdit?.id || '',
        sales: productToEdit?.sales || [],
     });
  };

  const handleSuggestPrice = async () => {
    const { name, category } = watchedValues;
    const { totalCost } = calculateFinancials(watchedValues);
    
    if (!name || totalCost <= 0) {
        toast({
            variant: "destructive",
            title: "Dados Insuficientes",
            description: "Preencha o nome e os custos do produto para obter uma sugestão."
        })
        return;
    }
    
    setIsSuggesting(s => ({...s, price: true}));
    try {
        const result = await suggestPrice({ productName: name, category, totalCost });
        setValue("sellingPrice", result.suggestedPrice, { shouldValidate: true });
        toast({
            title: "Preço Sugerido!",
            description: result.justification
        })
    } catch(error) {
        console.error("Error suggesting price:", error);
        toast({
            variant: "destructive",
            title: "Erro na Sugestão",
            description: "Não foi possível obter a sugestão da IA. Tente novamente."
        })
    } finally {
        setIsSuggesting(s => ({...s, price: false}));
    }
  }

  const handleSuggestDescription = async () => {
    const { name, description } = watchedValues;
    if (!name) {
        toast({ variant: "destructive", title: "Nome do Produto Necessário", description: "Por favor, preencha o nome do produto primeiro." });
        return;
    }
    setIsSuggesting(s => ({...s, description: true}));
    try {
        const result = await suggestDescription({ productName: name, currentDescription: description });
        setValue("description", result.suggestedDescription, { shouldValidate: true });
        toast({ title: "Descrição Sugerida!", description: "A IA criou uma nova descrição para o seu produto." });
    } catch (error) {
         console.error("Error suggesting description:", error);
        toast({ variant: "destructive", title: "Erro na Sugestão", description: "Não foi possível obter a sugestão da IA. Tente novamente." });
    } finally {
        setIsSuggesting(s => ({...s, description: false}));
    }
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
                        <FormField control={control} name="category" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Categoria</FormLabel>
                                {isCustomCategory ? (
                                    <div className="flex items-center gap-2">
                                        <Input {...field} placeholder="Digite a nova categoria" />
                                        <Button variant="ghost" onClick={() => {
                                            setIsCustomCategory(false)
                                            setValue('category', '')
                                        }}>Cancelar</Button>
                                    </div>
                                ) : (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione uma categoria" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categoryOptions.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                            <SelectItem value="custom">Outra (especificar)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                     <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                <div className="flex items-center justify-between">
                                    <span>Descrição</span>
                                     <Button type="button" variant="link" size="sm" onClick={handleSuggestDescription} disabled={isSuggesting.description} className="p-0 h-auto">
                                        {isSuggesting.description ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 text-primary" />}
                                        Sugerir com IA
                                    </Button>
                                </div>
                            </FormLabel>
                            <FormControl><Textarea {...field} rows={5} /></FormControl>
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
                                <div className="relative">
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} className="pr-10"/>
                                    </FormControl>
                                    <Button type="button" size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={handleSuggestPrice} disabled={isSuggesting.price}>
                                        {isSuggesting.price ? <Loader2 className="animate-spin" /> : <Sparkles className="text-primary" />}
                                    </Button>
                                </div>
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
                                            className={cn("w-full justify-start pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? (
                                                format(field.value, "PPP", { locale: ptBR })
                                            ) : (
                                                <span>Escolha uma data</span>
                                            )}
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
                     <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Anotações Pessoais</FormLabel>
                            <FormControl><Textarea {...field} placeholder="Detalhes de envio, observações do fornecedor, ideias de marketing..." /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
            </ScrollArea>
             <div className="p-6 pt-2 flex flex-col md:flex-row justify-between items-center gap-4 bg-background border-t">
                <div className="flex flex-wrap gap-4 items-center">
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
                <div className="flex gap-2 w-full md:w-auto">
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting} className="flex-1">Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                        {isSubmitting ? <Loader2 className="animate-spin" /> : (productToEdit ? "Salvar Alterações" : "Adicionar Produto")}
                    </Button>
                </div>
            </div>
        </form>
      </Form>
    </>
  );
}
