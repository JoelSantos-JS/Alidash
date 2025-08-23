"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, Loader2, Sparkles, Package, ClipboardList, Lock } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrackingView } from "./tracking-view";
import { useAuth } from "@/hooks/use-auth";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "../ui/tooltip";


const productSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  category: z.string().min(1, { message: "A categoria é obrigatória" }),
  supplier: z.string().min(2, { message: "O fornecedor deve ter pelo menos 2 caracteres." }),
  aliexpressLink: z.string().url({ message: "Por favor, insira uma URL válida." }).optional().or(z.literal('')),
  imageUrl: z.string().url({ message: "Por favor, insira uma URL de imagem válida." }),
  description: z.string().optional(),
  notes: z.string().optional(),
  trackingCode: z.string().optional(),
  purchaseEmail: z.string().email({ message: "Por favor, insira um email válido." }).optional().or(z.literal('')),
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
    defaultValues: productToEdit ? { 
        ...productToEdit,
        notes: productToEdit.notes || '',
        trackingCode: productToEdit.trackingCode || '',
        description: productToEdit.description || '',
        aliexpressLink: productToEdit.aliexpressLink || '',
     } : {
        name: "",
        category: "",
        supplier: "",
        aliexpressLink: "",
        imageUrl: "",
        description: "",
        notes: "",
        trackingCode: "",
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
  const { user, isPro, openUpgradeModal } = useAuth();
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
        aliexpressLink: data.aliexpressLink || '',
        description: data.description || '',
        notes: data.notes || '',
        trackingCode: data.trackingCode || '',
     });
  };

  const handleSuggestPrice = async () => {
    if (!isPro) {
        openUpgradeModal();
        return;
    }
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
     if (!isPro) {
        openUpgradeModal();
        return;
    }
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
            <Tabs defaultValue="details">
                 <TabsList className={`mx-6 grid w-[calc(100%-48px)] ${user?.email === 'joeltere9@gmail.com' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    <TabsTrigger value="details"><Package className="mr-2 h-4 w-4"/> Detalhes do Produto</TabsTrigger>
                    <TabsTrigger value="tracking"><ClipboardList className="mr-2 h-4 w-4"/> Rastreio</TabsTrigger>
                    {user?.email === 'joeltere9@gmail.com' && (
                        <TabsTrigger value="settings"><Sparkles className="mr-2 h-4 w-4"/> Configurações</TabsTrigger>
                    )}
                </TabsList>
                
                <TabsContent value="details">
                     <ScrollArea className="h-[65vh]">
                        <div className="space-y-6 px-6 pt-4 pb-6">
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
                                             <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button type="button" variant="link" size="sm" onClick={handleSuggestDescription} disabled={isSuggesting.description} className="p-0 h-auto">
                                                            {isSuggesting.description ? <Loader2 className="animate-spin mr-2" /> : (isPro ? <Sparkles className="mr-2 text-primary" /> : <Lock className="mr-2"/>) }
                                                            Sugerir com IA
                                                        </Button>
                                                    </TooltipTrigger>
                                                    {!isPro && <TooltipContent><p>Funcionalidade Pro</p></TooltipContent>}
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </FormLabel>
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
                            <FormField control={form.control} name="purchaseEmail" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email da Compra</FormLabel>
                                    <FormControl><Input {...field} type="email" placeholder="email@exemplo.com (opcional)" /></FormControl>
                                    <FormDescription>Email usado para fazer a compra (para controle e suporte).</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />
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
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button type="button" size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={handleSuggestPrice} disabled={isSuggesting.price}>
                                                            {isSuggesting.price ? <Loader2 className="animate-spin" /> : (isPro ? <Sparkles className="text-primary" /> : <Lock />) }
                                                        </Button>
                                                    </TooltipTrigger>
                                                    {!isPro && <TooltipContent><p>Funcionalidade Pro</p></TooltipContent>}
                                                </Tooltip>
                                            </TooltipProvider>
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
                            
                            <FormField control={form.control} name="trackingCode" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Código de Rastreio</FormLabel>
                                    <div className="flex gap-2">
                                        <FormControl>
                                            <Input {...field} placeholder="Código fornecido pelo vendedor (opcional)" className="flex-1" />
                                        </FormControl>
                                        {field.value && (
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => {
                                                    if (field.value) {
                                                        navigator.clipboard.writeText(field.value);
                                                        toast({
                                                            title: "Código copiado!",
                                                            description: "O código de rastreio foi copiado para a área de transferência.",
                                                        });
                                                    }
                                                }}
                                            >
                                                Copiar
                                            </Button>
                                        )}
                                    </div>
                                    {field.value && (
                                        <div className="mt-2">
                                            <Button 
                                                type="button" 
                                                variant="secondary" 
                                                size="sm"
                                                onClick={() => {
                                                    // Switch to tracking tab
                                                    const trackingTab = document.querySelector('[data-value="tracking"]') as HTMLElement;
                                                    if (trackingTab) {
                                                        trackingTab.click();
                                                    }
                                                }}
                                                className="w-full"
                                            >
                                                <Package className="mr-2 h-4 w-4" />
                                                Ver Rastreio Completo
                                            </Button>
                                        </div>
                                    )}
                                    <FormDescription>Código para rastrear a encomenda. Será salvo junto com o produto.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                    </ScrollArea>
                </TabsContent>
                <TabsContent value="tracking">
                    <ScrollArea className="h-[65vh]">
                        <div className="space-y-6 px-6 pt-4 pb-6">
                            <FormField control={form.control} name="trackingCode" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Código de Rastreio</FormLabel>
                                    <div className="flex gap-2">
                                        <FormControl>
                                            <Input {...field} placeholder="Insira o código fornecido pelo vendedor" className="flex-1" />
                                        </FormControl>
                                        {field.value && (
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => {
                                                     // Copy tracking code to clipboard for easy access
                                                     if (field.value) {
                                                         navigator.clipboard.writeText(field.value);
                                                         toast({
                                                             title: "Código copiado!",
                                                             description: "O código de rastreio foi copiado para a área de transferência.",
                                                         });
                                                     }
                                                 }}
                                            >
                                                Copiar
                                            </Button>
                                        )}
                                    </div>
                                    <FormDescription>Este código será usado para buscar o status da encomenda.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {watchedValues.trackingCode && (
                                <div className="mb-4">
                                    <Button 
                                        type="button" 
                                        variant="secondary" 
                                        size="sm"
                                        onClick={() => {
                                            // Switch to tracking tab and focus on tracking
                                            const trackingTab = document.querySelector('[data-value="tracking"]') as HTMLElement;
                                            if (trackingTab) {
                                                trackingTab.click();
                                                // Scroll to tracking view
                                                setTimeout(() => {
                                                    const trackingView = document.querySelector('.tracking-view');
                                                    if (trackingView) {
                                                        trackingView.scrollIntoView({ behavior: 'smooth' });
                                                    }
                                                }, 100);
                                            }
                                        }}
                                        className="w-full"
                                    >
                                        <Package className="mr-2 h-4 w-4" />
                                        Visualizar Rastreio Completo
                                    </Button>
                                </div>
                            )}

                            <div className="tracking-view">
                                <TrackingView trackingCode={watchedValues.trackingCode} />
                            </div>
                        </div>
                    </ScrollArea>
                </TabsContent>
                {user?.email === 'joeltere9@gmail.com' && (
                <TabsContent value="settings">
                    <ScrollArea className="h-[65vh]">
                        <div className="space-y-6 px-6 pt-4 pb-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-medium">Configurações da API de Rastreio</h3>
                                    <p className="text-sm text-muted-foreground">Gerencie a chave da API da Wonca Labs para rastreamento de encomendas.</p>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Chave da API Wonca Labs</label>
                                        <div className="flex gap-2">
                                            <Input 
                                                type="password"
                                                placeholder="Insira sua chave da API"
                                                className="flex-1"
                                                id="wonca-api-key"
                                            />
                                            <Button 
                                                type="button" 
                                                variant="outline"
                                                onClick={() => {
                                                    const input = document.getElementById('wonca-api-key') as HTMLInputElement;
                                                    const apiKey = input.value.trim();
                                                    if (apiKey) {
                                                        // Save to localStorage for now (in production, use secure storage)
                                                        localStorage.setItem('wonca_api_key', apiKey);
                                                        toast({
                                                            title: "API Key salva!",
                                                            description: "A chave da API foi salva com sucesso.",
                                                        });
                                                        input.value = '';
                                                    } else {
                                                        toast({
                                                            variant: "destructive",
                                                            title: "Erro",
                                                            description: "Por favor, insira uma chave válida.",
                                                        });
                                                    }
                                                }}
                                            >
                                                Salvar
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Esta chave será usada para fazer requisições à API de rastreio da Wonca Labs.
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Button 
                                            type="button" 
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => {
                                                const currentKey = localStorage.getItem('wonca_api_key');
                                                if (currentKey) {
                                                    const input = document.getElementById('wonca-api-key') as HTMLInputElement;
                                                    input.type = input.type === 'password' ? 'text' : 'password';
                                                    input.value = currentKey;
                                                    setTimeout(() => {
                                                        input.type = 'password';
                                                        input.value = '';
                                                    }, 3000);
                                                } else {
                                                    toast({
                                                        variant: "destructive",
                                                        title: "Nenhuma chave encontrada",
                                                        description: "Não há chave da API salva.",
                                                    });
                                                }
                                            }}
                                        >
                                            Visualizar Chave Atual
                                        </Button>
                                        
                                        <Button 
                                            type="button" 
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => {
                                                localStorage.removeItem('wonca_api_key');
                                                toast({
                                                    title: "Chave removida",
                                                    description: "A chave da API foi removida.",
                                                });
                                            }}
                                        >
                                            Remover Chave
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </TabsContent>
                )}
            </Tabs>

            <div className="flex flex-col sm:flex-row items-center gap-4 border-t bg-muted/30 p-4">
                <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1">
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
                <div className="flex w-full sm:w-auto gap-2">
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting} className="flex-1 sm:flex-auto">Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-auto">
                        {isSubmitting ? <Loader2 className="animate-spin" /> : (productToEdit ? "Salvar Alterações" : "Adicionar Produto")}
                    </Button>
                </div>
            </div>
        </form>
      </Form>
    </>
  );
}
