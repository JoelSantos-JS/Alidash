"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign,
  Briefcase,
  TrendingUp,
  Gift,
  Utensils,
  Car,
  Home,
  Stethoscope,
  GraduationCap,
  Gamepad2,
  ShoppingCart,
  Wifi,
  Zap,
  Palette,
  Heart,
  BookOpen,
  Plane,
  Tag,
  Save,
  X,
  Eye
} from "lucide-react";

const categoryFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(50, "Nome deve ter no máximo 50 caracteres"),
  type: z.enum(["income", "expense"], {
    required_error: "Tipo é obrigatório",
  }),
  description: z.string().max(200, "Descrição deve ter no máximo 200 caracteres").optional(),
  budget: z.number().min(0, "Orçamento deve ser maior ou igual a 0").optional(),
  color: z.string().min(1, "Cor é obrigatória"),
  icon: z.string().min(1, "Ícone é obrigatório"),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  description?: string;
  budget?: number;
  spent?: number;
  transactions?: number;
  createdDate: Date;
  isDefault?: boolean;
}

interface CategoryFormProps {
  category?: Category | null;
  onSubmit: (data: CategoryFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const iconOptions = [
  { value: "DollarSign", label: "Dinheiro", icon: DollarSign },
  { value: "Briefcase", label: "Trabalho", icon: Briefcase },
  { value: "TrendingUp", label: "Investimento", icon: TrendingUp },
  { value: "Gift", label: "Presente", icon: Gift },
  { value: "Utensils", label: "Alimentação", icon: Utensils },
  { value: "Car", label: "Transporte", icon: Car },
  { value: "Home", label: "Casa", icon: Home },
  { value: "Stethoscope", label: "Saúde", icon: Stethoscope },
  { value: "GraduationCap", label: "Educação", icon: GraduationCap },
  { value: "Gamepad2", label: "Entretenimento", icon: Gamepad2 },
  { value: "ShoppingCart", label: "Compras", icon: ShoppingCart },
  { value: "Wifi", label: "Serviços", icon: Wifi },
  { value: "Zap", label: "Energia", icon: Zap },
  { value: "Palette", label: "Arte", icon: Palette },
  { value: "Heart", label: "Saúde", icon: Heart },
  { value: "BookOpen", label: "Educação", icon: BookOpen },
  { value: "Plane", label: "Viagem", icon: Plane },
];

const colorOptions = [
  { value: "#EF4444", label: "Vermelho" },
  { value: "#F97316", label: "Laranja" },
  { value: "#F59E0B", label: "Âmbar" },
  { value: "#EAB308", label: "Amarelo" },
  { value: "#84CC16", label: "Lime" },
  { value: "#22C55E", label: "Verde" },
  { value: "#10B981", label: "Esmeralda" },
  { value: "#14B8A6", label: "Teal" },
  { value: "#06B6D4", label: "Ciano" },
  { value: "#0EA5E9", label: "Azul Claro" },
  { value: "#3B82F6", label: "Azul" },
  { value: "#6366F1", label: "Índigo" },
  { value: "#8B5CF6", label: "Violeta" },
  { value: "#A855F7", label: "Roxo" },
  { value: "#EC4899", label: "Rosa" },
  { value: "#F43F5E", label: "Rose" },
  { value: "#6B7280", label: "Cinza" },
  { value: "#374151", label: "Cinza Escuro" },
];

export function CategoryForm({ category, onSubmit, onCancel, isLoading = false }: CategoryFormProps) {
  const [selectedColor, setSelectedColor] = useState(category?.color || "#3B82F6");
  const [selectedIcon, setSelectedIcon] = useState(category?.icon || "Tag");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name || "",
      type: category?.type || "expense",
      description: category?.description || "",
      budget: category?.budget || undefined,
      color: category?.color || "#3B82F6",
      icon: category?.icon || "Tag",
    },
  });

  const watchType = watch("type");

  useEffect(() => {
    setValue("color", selectedColor);
    setValue("icon", selectedIcon);
  }, [selectedColor, selectedIcon, setValue]);

  const handleFormSubmit = (data: CategoryFormData) => {
    onSubmit({
      ...data,
      color: selectedColor,
      icon: selectedIcon,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Básico
          </TabsTrigger>
          <TabsTrigger value="visual" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Visual
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Categoria *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Alimentação, Salário, Transporte"
                    {...register("name")}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo *</Label>
                  <Select
                    value={watchType}
                    onValueChange={(value: "income" | "expense") => setValue("type", value)}
                  >
                    <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full" />
                          Receita
                        </div>
                      </SelectItem>
                      <SelectItem value="expense">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full" />
                          Despesa
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-red-500">{errors.type.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva brevemente esta categoria..."
                  {...register("description")}
                  className={errors.description ? "border-red-500" : ""}
                  rows={3}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>

              {watchType === "expense" && (
                <div className="space-y-2">
                  <Label htmlFor="budget">Orçamento Mensal (R$)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="0,00"
                    step="0.01"
                    min="0"
                    {...register("budget", { valueAsNumber: true })}
                    className={errors.budget ? "border-red-500" : ""}
                  />
                  {errors.budget && (
                    <p className="text-sm text-red-500">{errors.budget.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco se não quiser definir um orçamento
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Personalização Visual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seleção de Cor */}
              <div className="space-y-3">
                <Label>Cor da Categoria *</Label>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSelectedColor(color.value)}
                      className={`
                        w-12 h-12 rounded-lg border-2 transition-all duration-200 hover:scale-110
                        ${selectedColor === color.value 
                          ? "border-gray-900 dark:border-white shadow-lg" 
                          : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                        }
                      `}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
                {errors.color && (
                  <p className="text-sm text-red-500">{errors.color.message}</p>
                )}
              </div>

              {/* Seleção de Ícone */}
              <div className="space-y-3">
                <Label>Ícone da Categoria *</Label>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                  {iconOptions.map((iconOption) => {
                    const IconComponent = iconOption.icon;
                    return (
                      <button
                        key={iconOption.value}
                        type="button"
                        onClick={() => setSelectedIcon(iconOption.value)}
                        className={`
                          p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105
                          ${selectedIcon === iconOption.value 
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" 
                            : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                          }
                        `}
                        title={iconOption.label}
                      >
                        <IconComponent className="h-6 w-6 mx-auto" />
                        <p className="text-xs mt-1 text-center">{iconOption.label}</p>
                      </button>
                    );
                  })}
                </div>
                {errors.icon && (
                  <p className="text-sm text-red-500">{errors.icon.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview da Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-6 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: selectedColor }}
                    >
                      {React.createElement(
                        iconOptions.find(opt => opt.value === selectedIcon)?.icon || Tag,
                        { className: "h-8 w-8 text-white" }
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-xl font-bold">
                        {watch("name") || "Nome da Categoria"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {watch("description") || "Descrição da categoria"}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={watchType === 'income' ? 'default' : 'secondary'}>
                          {watchType === 'income' ? 'Receita' : 'Despesa'}
                        </Badge>
                        {watchType === "expense" && watch("budget") && (
                          <Badge variant="outline">
                            Orçamento: {watch("budget")?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  Esta é como sua categoria aparecerá na aplicação
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botões de Ação */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Salvando..." : category ? "Atualizar Categoria" : "Criar Categoria"}
        </Button>
      </div>
    </form>
  );
} 