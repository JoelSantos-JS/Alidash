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
import { Switch } from "@/components/ui/switch";
import { 
  DollarSign,
  Briefcase,
  TrendingUp,
  Gift,
  Utensils,
  Car,
  Home,
  Heart,
  GraduationCap,
  Gamepad2,
  Shirt,
  Zap,
  Shield,
  PiggyBank,
  User,
  Palette,
  Tag,
  Save,
  X,
  Eye,
  Plus
} from "lucide-react";

// Tipos baseados no arquivo SQL
type PersonalIncomeCategory = 
  | 'salary' | 'freelance' | 'investment' | 'rental' | 'bonus' 
  | 'gift' | 'pension' | 'benefit' | 'other';

type PersonalExpenseCategory = 
  | 'housing' | 'food' | 'transportation' | 'healthcare' | 'education' 
  | 'entertainment' | 'clothing' | 'utilities' | 'insurance' | 'personal_care' 
  | 'gifts' | 'pets' | 'charity' | 'taxes' | 'debt_payment' | 'savings' | 'other';

type CategoryType = 'income' | 'expense';

const personalCategoryFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(50, "Nome deve ter no máximo 50 caracteres"),
  type: z.enum(["income", "expense"], {
    required_error: "Tipo é obrigatório",
  }),
  category: z.string().min(1, "Categoria é obrigatória"),
  description: z.string().max(200, "Descrição deve ter no máximo 200 caracteres").optional(),
  color: z.string().min(1, "Cor é obrigatória"),
  icon: z.string().min(1, "Ícone é obrigatório"),
  is_essential: z.boolean().optional(),
  budget_limit: z.number().min(0, "Limite deve ser maior ou igual a 0").optional(),
});

type PersonalCategoryFormData = z.infer<typeof personalCategoryFormSchema>;

interface PersonalCategory {
  id: string;
  name: string;
  type: CategoryType;
  category: string;
  color: string;
  icon: string;
  description?: string;
  is_essential?: boolean;
  budget_limit?: number;
  createdDate: Date;
}

interface PersonalCategoryFormProps {
  category?: PersonalCategory | null;
  onSubmit: (data: PersonalCategoryFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Categorias de receita baseadas no SQL
const incomeCategories: { value: PersonalIncomeCategory; label: string }[] = [
  { value: "salary", label: "Salário" },
  { value: "freelance", label: "Freelance" },
  { value: "investment", label: "Investimentos" },
  { value: "rental", label: "Aluguel Recebido" },
  { value: "bonus", label: "Bônus" },
  { value: "gift", label: "Presente" },
  { value: "pension", label: "Pensão" },
  { value: "benefit", label: "Benefício" },
  { value: "other", label: "Outros" },
];

// Categorias de despesa baseadas no SQL
const expenseCategories: { value: PersonalExpenseCategory; label: string }[] = [
  { value: "housing", label: "Moradia" },
  { value: "food", label: "Alimentação" },
  { value: "transportation", label: "Transporte" },
  { value: "healthcare", label: "Saúde" },
  { value: "education", label: "Educação" },
  { value: "entertainment", label: "Entretenimento" },
  { value: "clothing", label: "Vestuário" },
  { value: "utilities", label: "Utilidades" },
  { value: "insurance", label: "Seguros" },
  { value: "personal_care", label: "Cuidados Pessoais" },
  { value: "gifts", label: "Presentes" },
  { value: "pets", label: "Pets" },
  { value: "charity", label: "Caridade" },
  { value: "taxes", label: "Impostos" },
  { value: "debt_payment", label: "Pagamento de Dívidas" },
  { value: "savings", label: "Poupança" },
  { value: "other", label: "Outros" },
];

const iconOptions = [
  { value: "DollarSign", label: "Dinheiro", icon: DollarSign },
  { value: "Briefcase", label: "Trabalho", icon: Briefcase },
  { value: "TrendingUp", label: "Investimento", icon: TrendingUp },
  { value: "Gift", label: "Presente", icon: Gift },
  { value: "Utensils", label: "Alimentação", icon: Utensils },
  { value: "Car", label: "Transporte", icon: Car },
  { value: "Home", label: "Casa", icon: Home },
  { value: "Heart", label: "Saúde", icon: Heart },
  { value: "GraduationCap", label: "Educação", icon: GraduationCap },
  { value: "Gamepad2", label: "Entretenimento", icon: Gamepad2 },
  { value: "Shirt", label: "Vestuário", icon: Shirt },
  { value: "Zap", label: "Energia", icon: Zap },
  { value: "Shield", label: "Seguros", icon: Shield },
  { value: "PiggyBank", label: "Poupança", icon: PiggyBank },
  { value: "User", label: "Pessoal", icon: User },
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
];

export function PersonalCategoryForm({ category, onSubmit, onCancel, isLoading = false }: PersonalCategoryFormProps) {
  const [selectedColor, setSelectedColor] = useState(category?.color || "#3B82F6");
  const [selectedIcon, setSelectedIcon] = useState(category?.icon || "Tag");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PersonalCategoryFormData>({
    resolver: zodResolver(personalCategoryFormSchema),
    defaultValues: {
      name: category?.name || "",
      type: category?.type || "expense",
      category: category?.category || "",
      description: category?.description || "",
      color: category?.color || "#3B82F6",
      icon: category?.icon || "Tag",
      is_essential: category?.is_essential || false,
      budget_limit: category?.budget_limit || undefined,
    },
  });

  const watchType = watch("type");
  const watchCategory = watch("category");
  const watchIsEssential = watch("is_essential");

  useEffect(() => {
    setValue("color", selectedColor);
    setValue("icon", selectedIcon);
  }, [selectedColor, selectedIcon, setValue]);

  // Resetar categoria quando mudar o tipo
  useEffect(() => {
    if (watchType) {
      setValue("category", "");
    }
  }, [watchType, setValue]);

  const handleFormSubmit = (data: PersonalCategoryFormData) => {
    onSubmit({
      ...data,
      color: selectedColor,
      icon: selectedIcon,
    });
  };

  const availableCategories = watchType === "income" ? incomeCategories : expenseCategories;

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
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
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
                    placeholder="Ex: Salário Principal, Supermercado"
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
                    onValueChange={(value: CategoryType) => setValue("type", value)}
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
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={watchCategory}
                  onValueChange={(value: string) => setValue("category", value)}
                  disabled={!watchType}
                >
                  <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                    <SelectValue placeholder={watchType ? "Selecione a categoria" : "Primeiro selecione o tipo"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-500">{errors.category.message}</p>
                )}
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
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_essential"
                      checked={watchIsEssential}
                      onCheckedChange={(checked) => setValue("is_essential", checked)}
                    />
                    <Label htmlFor="is_essential">Despesa Essencial</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="budget_limit">Limite Orçamentário (R$)</Label>
                    <Input
                      id="budget_limit"
                      type="number"
                      placeholder="0,00"
                      step="0.01"
                      min="0"
                      {...register("budget_limit", { valueAsNumber: true })}
                      className={errors.budget_limit ? "border-red-500" : ""}
                    />
                    {errors.budget_limit && (
                      <p className="text-sm text-red-500">{errors.budget_limit.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Deixe em branco se não quiser definir um limite
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visual" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Palette className="h-5 w-5" />
                Personalização Visual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seleção de Cor */}
              <div className="space-y-3">
                <Label>Cor da Categoria *</Label>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
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
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
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
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Eye className="h-5 w-5" />
                Preview da Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-6 rounded-lg border border-border bg-muted/30">
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
                      <div className="text-xl font-bold text-card-foreground">
                        {watch("name") || "Nome da Categoria"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {watch("description") || "Descrição da categoria"}
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant={watchType === 'income' ? 'default' : 'secondary'}>
                          {watchType === 'income' ? 'Receita' : 'Despesa'}
                        </Badge>
                        {watchCategory && (
                          <Badge variant="outline">
                            {availableCategories.find(c => c.value === watchCategory)?.label}
                          </Badge>
                        )}
                        {watchType === "expense" && watchIsEssential && (
                          <Badge variant="destructive">
                            Essencial
                          </Badge>
                        )}
                        {watchType === "expense" && watch("budget_limit") && (
                          <Badge variant="outline">
                            Limite: {watch("budget_limit")?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Salvando..." : category ? "Atualizar Categoria" : "Criar Categoria"}
        </Button>
      </div>
    </form>
  );
}

export default PersonalCategoryForm;