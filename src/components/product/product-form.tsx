"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, Package, ClipboardList, DollarSign, Calculator, Truck, ImageIcon, Loader2, Upload } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import React, { useState } from "react";

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
import { AlertTriangle, Info } from "lucide-react";
// IA removida: sem import de clientes de IA
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrackingView } from "./tracking-view";
import { ImageGallery } from "./image-gallery";
import { useAuth } from "@/hooks/use-supabase-auth";
// IA removida: sem tooltip de ações de IA
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const productSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  category: z.string().min(1, { message: "A categoria é obrigatória" }),
  supplier: z.string().min(2, { message: "O fornecedor deve ter pelo menos 2 caracteres." }),
  aliexpressLink: z.string().url({ message: "Por favor, insira uma URL válida." }).optional().or(z.literal('')),
  imageUrl: z.string().url({ message: "Por favor, insira uma URL de imagem válida." }).optional().or(z.literal('')), // Agora opcional
  images: z.array(z.object({
    id: z.string(),
    url: z.string().url(),
    type: z.enum(['main', 'gallery', 'thumbnail']),
    alt: z.string(),
    created_at: z.string(),
    order: z.number().optional()
  })).default([]), // Novo campo para múltiplas imagens
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
}).refine(data => (data.images && data.images.length > 0) || (data.imageUrl && data.imageUrl.trim() !== ''), {
    message: "Pelo menos uma imagem é obrigatória (URL única ou galeria).",
    path: ["images"],
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
  const [activeTab, setActiveTab] = useState("basic")
  
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: productToEdit ? { 
        ...productToEdit,
        notes: productToEdit.notes || '',
        trackingCode: productToEdit.trackingCode || '',
        description: productToEdit.description || '',
        aliexpressLink: productToEdit.aliexpressLink || '',
        images: (productToEdit.images && productToEdit.images.length > 0)
          ? productToEdit.images
          : (productToEdit.imageUrl
              ? [{
                  id: (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`,
                  url: productToEdit.imageUrl,
                  type: 'main',
                  alt: 'Imagem principal do produto',
                  created_at: new Date().toISOString(),
                  order: 1,
                }]
              : []),
     } : {
        name: "",
        category: undefined,
        supplier: "",
        aliexpressLink: "",
        imageUrl: "",
        images: [],
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
  const { user } = useAuth();
  const [isCustomCategory, setIsCustomCategory] = React.useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  

  const watchedValues = watch();
  const watchedCategory = watch("category");

  React.useEffect(() => {
    if(productToEdit && !categoryOptions.includes(productToEdit.category)) {
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

  const onSubmit = async (data: z.infer<typeof productSchema>) => {
    const financials = calculateFinancials(data);
    await onSave({ 
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

  React.useEffect(() => {
    const imgs = watchedValues.images || []
    const mainUrl = watchedValues.imageUrl
    if (productToEdit && imgs.length === 0 && mainUrl && mainUrl.trim() !== '') {
      const synthesized = [{
        id: (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        url: mainUrl,
        type: 'main' as const,
        alt: 'Imagem principal do produto',
        created_at: new Date().toISOString(),
        order: 1,
      }]
      setValue('images', synthesized)
    }
  }, [productToEdit, watchedValues.imageUrl])

  // IA removida: sem handlers de sugestão de preço/descrição
  
  const { totalCost, expectedProfit, profitMargin, roi } = calculateFinancials(watchedValues);
  const isLowProfit = profitMargin < 15 && profitMargin !== 0;

  return (
    <>
      <DialogHeader className="p-6 pb-2">
        <DialogTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {productToEdit ? "Editar Produto" : "Adicionar Novo Produto"}
        </DialogTitle>
        <DialogDescription>
          {productToEdit ? "Atualize as informações do seu produto." : "Preencha os detalhes do novo produto que você adquiriu."}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="product" className="w-full">
            <TabsList className="flex w-full justify-center gap-2 sm:gap-3 px-4 mb-4 flex-wrap">
              <TabsTrigger value="product" className="flex items-center gap-2 h-9 sm:h-10 px-3">
                <Package className="h-5 w-5" />
                <span className="hidden sm:inline">Produto</span>
              </TabsTrigger>
              <TabsTrigger value="stock" className="flex items-center gap-2 h-9 sm:h-10 px-3">
                <Calculator className="h-5 w-5" />
                <span className="hidden sm:inline">Estoque</span>
              </TabsTrigger>
              <TabsTrigger value="images" className="flex items-center gap-2 h-9 sm:h-10 px-3">
                <ImageIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Imagens</span>
              </TabsTrigger>
              <TabsTrigger value="supplier" className="flex items-center gap-2 h-9 sm:h-10 px-3">
                <Truck className="h-5 w-5" />
                <span className="hidden sm:inline">Fornecedor</span>
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex items-center gap-2 h-9 sm:h-10 px-3">
                <DollarSign className="h-5 w-5" />
                <span className="hidden sm:inline">Financeiro</span>
              </TabsTrigger>
              <TabsTrigger value="tracking" className="flex items-center gap-2 h-9 sm:h-10 px-3">
                <ClipboardList className="h-5 w-5" />
                <span className="hidden sm:inline">Rastreio</span>
              </TabsTrigger>
            </TabsList>

            {/* Aba Produto */}
            <TabsContent value="product" className="space-y-6">
              <ScrollArea className="h-[55vh] sm:h-[60vh] px-4 sm:px-6">
                <div className="space-y-4 sm:space-y-6">
                  {/* Informações Básicas do Produto */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informações do Produto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Produto *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ex: Fone Bluetooth Wireless" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        
                        <FormField control={control} name="category" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria *</FormLabel>
                            {isCustomCategory ? (
                              <div className="flex items-center gap-2">
                                <Input {...field} placeholder="Digite a categoria" />
                                <Button 
                                  type="button"
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setIsCustomCategory(false)
                                    setValue('category', '')
                                  }}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            ) : (
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma categoria" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categoryOptions.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                  ))}
                                  <SelectItem value="custom">Outra categoria</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Descreva as características do produto..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Aba Estoque e Status */}
            <TabsContent value="stock" className="space-y-6">
              <ScrollArea className="h-[55vh] sm:h-[60vh] px-4 sm:px-6">
                <div className="space-y-4 sm:space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Estoque e Status</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Controle de quantidade, status do produto e data de compra.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="quantity" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantidade Comprada *</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} min={1} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        
                        <FormField control={form.control} name="quantitySold" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantidade Vendida</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} min={0} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status *</FormLabel>
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
                        <FormItem className="flex flex-col">
                          <FormLabel>Data da Compra *</FormLabel>
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
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Aba Imagens */}
            <TabsContent value="images" className="space-y-6">
              <ScrollArea className="h-[55vh] sm:h-[60vh] px-4 sm:px-6">
                <div className="space-y-4 sm:space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Imagens do Produto</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Adicione múltiplas imagens para o produto. A imagem principal será usada como destaque.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField control={form.control} name="imageUrl" render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL da Imagem Principal *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://exemplo.com/imagem.jpg" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      {/* Galeria de Imagens */}
                      <div className="space-y-4">
                        <FormLabel>Galeria de Imagens</FormLabel>
                        <ImageGallery 
                          images={watchedValues.images || []}
                          onChange={(images) => setValue('images', images)}
                          userId={user?.id}
                          productId={productToEdit?.id}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          />
                          <Select onValueChange={(value: any) => setValue('imageUrlType' as any, value)} defaultValue={'gallery'}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="main">Principal</SelectItem>
                              <SelectItem value="gallery">Galeria</SelectItem>
                              <SelectItem value="thumbnail">Miniatura</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={!selectedFile || isUploading || !user?.id}
                            onClick={async () => {
                              if (!selectedFile || !user?.id) return
                              try {
                                setIsUploading(true)
                                const fd = new FormData()
                                fd.append('file', selectedFile)
                                const t = (watchedValues as any).imageUrlType || 'gallery'
                                fd.append('type', t)
                                const params = new URLSearchParams({ user_id: user.id })
                                if (productToEdit?.id) params.set('product_id', productToEdit.id)
                                const res = await fetch(`/api/products/images/upload?${params.toString()}`, {
                                  method: 'POST',
                                  body: fd
                                })
                                if (!res.ok) {
                                  const t = await res.text()
                                  throw new Error(t)
                                }
                                const data = await res.json()
                                const url = data.url as string
                                const current = watchedValues.images || []
                                const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`
                                const uploadedType = t as 'main' | 'gallery' | 'thumbnail'
                                if (uploadedType === 'main') {
                                  setValue('imageUrl', url)
                                }
                                const newImage = { id, url, type: uploadedType, alt: 'Imagem do produto', created_at: new Date().toISOString(), order: (current.length || 0) + 1 }
                                let nextImages = [newImage, ...current]
                                if (uploadedType === 'main') {
                                  nextImages = nextImages.map(i => ({ ...i, type: i.id === newImage.id ? 'main' as const : (i.type === 'main' ? 'gallery' as const : i.type) }))
                                }
                                setValue('images', nextImages)
                                toast({ title: 'Imagem enviada', description: 'A imagem foi salva e vinculada ao produto.' })
                                setSelectedFile(null)
                              } catch (err) {
                                toast({ variant: 'destructive', title: 'Erro no upload', description: err instanceof Error ? err.message : 'Falha ao enviar a imagem' })
                              } finally {
                                setIsUploading(false)
                              }
                            }}
                            className="flex items-center gap-2"
                          >
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            Enviar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Aba Fornecedor */}
            <TabsContent value="supplier" className="space-y-6">
              <ScrollArea className="h-[55vh] sm:h-[60vh] px-4 sm:px-6">
                <div className="space-y-4 sm:space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informações do Fornecedor</CardTitle>
                      <p className="text-sm text-muted-foreground">Dados sobre onde e como o produto foi adquirido</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField control={form.control} name="supplier" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fornecedor *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: AliExpress, Amazon..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="aliexpressLink" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Link do Produto (Opcional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://pt.aliexpress.com/item/..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="purchaseEmail" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email da Compra</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="email@exemplo.com" />
                          </FormControl>
                          <FormDescription>Email usado para fazer a compra</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Anotações</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Detalhes de envio, observações do fornecedor..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Aba Financeiro */}
            <TabsContent value="financial" className="space-y-6">
              <ScrollArea className="h-[55vh] sm:h-[60vh] px-4 sm:px-6">
                <div className="space-y-4 sm:space-y-6">
                  {/* Alertas Financeiros */}
                  {isLowProfit && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Atenção: Margem Baixa</AlertTitle>
                      <AlertDescription>
                        A margem de lucro está abaixo de 15%. Considere revisar seus custos ou preço de venda.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Custos */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Custos do Produto</CardTitle>
                      <p className="text-sm text-muted-foreground">Preencha todos os custos envolvidos na aquisição</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="purchasePrice" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço de Compra (R$) *</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} placeholder="0,00" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        
                        <FormField control={form.control} name="shippingCost" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frete (R$)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} placeholder="0,00" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="importTaxes" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Impostos (R$)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} placeholder="0,00" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        
                        <FormField control={form.control} name="packagingCost" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Embalagem (R$)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} placeholder="0,00" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="marketingCost" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Marketing (R$)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} placeholder="0,00" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        
                        <FormField control={form.control} name="otherCosts" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Outros Custos (R$)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} placeholder="0,00" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Preço de Venda */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Preço de Venda</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField control={form.control} name="sellingPrice" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço de Venda (R$) *</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input type="number" step="0.01" {...field} placeholder="0,00" />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>

                  {/* Resumo Financeiro */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Resumo Financeiro
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Custo Total</p>
                          <p className="text-lg font-bold text-red-600">
                            {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Lucro Esperado</p>
                          <p className={`text-lg font-bold ${expectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {expectedProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Margem</p>
                          <p className={`text-lg font-bold ${profitMargin >= 15 ? 'text-green-600' : 'text-orange-600'}`}>
                            {profitMargin.toFixed(1)}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">ROI</p>
                          <p className={`text-lg font-bold ${roi >= 50 ? 'text-green-600' : roi >= 25 ? 'text-blue-600' : 'text-orange-600'}`}>
                            {roi.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Aba Rastreio */}
            <TabsContent value="tracking" className="space-y-6">
              <ScrollArea className="h-[55vh] sm:h-[60vh] px-4 sm:px-6">
                <div className="space-y-4 sm:space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informações de Rastreio</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField control={form.control} name="trackingCode" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código de Rastreio</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input {...field} placeholder="Código fornecido pelo vendedor" className="flex-1" />
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
                          <FormDescription>Código para rastrear a encomenda</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>

                  {watchedValues.trackingCode && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Acompanhamento</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <TrackingView trackingCode={watchedValues.trackingCode} />
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Footer com Botões */}
          <div className="flex flex-col gap-4 border-t bg-muted/30 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={onCancel} 
                disabled={isSubmitting} 
                className="flex-1 h-10 sm:h-9 text-sm font-medium"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="flex-1 h-10 sm:h-9 text-sm font-medium"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {productToEdit ? "Salvar Alterações" : "Adicionar Produto"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </>
  );
}
