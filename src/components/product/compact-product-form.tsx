"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Package, Sparkles, Loader2 } from "lucide-react";
import React, { useState } from "react";

import type { Product } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { suggestDescription } from "@/ai/flows/dream-planner";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const compactProductSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  category: z.string().min(1, { message: "A categoria é obrigatória" }),
  description: z.string().optional(),
});

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

interface CompactProductFormProps {
  onSave: (data: Partial<Product>) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export function CompactProductForm({ onSave, onCancel, isOpen }: CompactProductFormProps) {
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  const form = useForm<z.infer<typeof compactProductSchema>>({
    resolver: zodResolver(compactProductSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
    },
  });

  const { formState: { isSubmitting }, watch, setValue, control } = form;
  const { toast } = useToast();
  
  const watchedValues = watch();
  const watchedCategory = watch("category");

  React.useEffect(() => {
    if(watchedCategory === 'custom') {
        setIsCustomCategory(true);
        setValue('category', '');
    } else if (watchedCategory !== '' && watchedCategory !== 'custom') {
        setIsCustomCategory(false);
    }
  }, [watchedCategory, setValue]);

  const handleSuggestDescription = async () => {
    const { name, description } = watchedValues;
    if (!name) {
        toast({ variant: "destructive", title: "Nome do Produto Necessário", description: "Por favor, preencha o nome do produto primeiro." });
        return;
    }
    setIsSuggesting(true);
    try {
        const result = await suggestDescription({ productName: name, currentDescription: description });
        setValue("description", result.suggestedDescription, { shouldValidate: true });
        toast({ title: "Descrição Sugerida!", description: "A IA criou uma nova descrição para o seu produto." });
    } catch (error) {
         console.error("Error suggesting description:", error);
        toast({ variant: "destructive", title: "Erro na Sugestão", description: "Não foi possível obter a sugestão da IA. Tente novamente." });
    } finally {
        setIsSuggesting(false);
    }
  };

  const onSubmit = (data: z.infer<typeof compactProductSchema>) => {
    // Criar um produto básico com valores padrão
    const basicProduct: Partial<Product> = {
      name: data.name,
      category: data.category,
      description: data.description || "",
      supplier: "",
      purchasePrice: 0,
      shippingCost: 0,
      importTaxes: 0,
      packagingCost: 0,
      marketingCost: 0,
      otherCosts: 0,
      sellingPrice: 0,
      quantity: 1,
      quantitySold: 0,
      status: 'purchased' as const,
      purchaseDate: new Date(),
      imageUrl: "",
      images: [],
    };
    
    onSave(basicProduct);
    form.reset();
  };

  if (!isOpen) return null;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4" />
          Adicionar Novo Produto
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Preencha os detalhes do novo produto que você adquiriu.
        </p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="product" className="w-full">
              <TabsList className="grid w-full grid-cols-6 h-8 p-0.5">
                <TabsTrigger value="product" className="text-xs px-2 py-1">
                  Produto
                </TabsTrigger>
                <TabsTrigger value="stock" className="text-xs px-2 py-1">
                  Estoque
                </TabsTrigger>
                <TabsTrigger value="images" className="text-xs px-2 py-1">
                  Imagens
                </TabsTrigger>
                <TabsTrigger value="supplier" className="text-xs px-2 py-1">
                  Fornecedor
                </TabsTrigger>
                <TabsTrigger value="financial" className="text-xs px-2 py-1">
                  Financeiro
                </TabsTrigger>
                <TabsTrigger value="tracking" className="text-xs px-2 py-1">
                  Rastreio
                </TabsTrigger>
              </TabsList>

              <TabsContent value="product" className="mt-4">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4 pr-4">
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">Informações do Produto</h3>
                      
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Nome do Produto *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Fone Bluetooth Wireless" className="h-8" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      
                      <FormField control={control} name="category" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Categoria *</FormLabel>
                          {isCustomCategory ? (
                            <div className="flex items-center gap-2">
                              <Input {...field} placeholder="Digite a categoria" className="h-8 flex-1" />
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => {
                                  setIsCustomCategory(false)
                                  setValue('category', '')
                                }}
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-8">
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

                      <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between text-xs">
                            <span>Descrição</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    type="button" 
                                    variant="link" 
                                    size="sm" 
                                    onClick={handleSuggestDescription} 
                                    disabled={isSuggesting} 
                                    className="p-0 h-auto text-xs"
                                  >
                                    {isSuggesting ? (
                                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    ) : (
                                      <Sparkles className="mr-1 h-3 w-3 text-primary" />
                                    )}
                                    Sugerir com IA
                                  </Button>
                                </TooltipTrigger>
                              </Tooltip>
                            </TooltipProvider>
                          </FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Descreva as características do produto..." className="min-h-[60px] text-xs" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Outras abas vazias por enquanto */}
              <TabsContent value="stock" className="mt-4">
                <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                  Funcionalidade em desenvolvimento
                </div>
              </TabsContent>
              
              <TabsContent value="images" className="mt-4">
                <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                  Funcionalidade em desenvolvimento
                </div>
              </TabsContent>
              
              <TabsContent value="supplier" className="mt-4">
                <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                  Funcionalidade em desenvolvimento
                </div>
              </TabsContent>
              
              <TabsContent value="financial" className="mt-4">
                <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                  Funcionalidade em desenvolvimento
                </div>
              </TabsContent>
              
              <TabsContent value="tracking" className="mt-4">
                <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
                  Funcionalidade em desenvolvimento
                </div>
              </TabsContent>
            </Tabs>

            {/* Botões de ação */}
            <div className="flex gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel} 
                disabled={isSubmitting} 
                className="flex-1 h-8 text-xs"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="flex-1 h-8 text-xs"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Adicionar Produto"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}