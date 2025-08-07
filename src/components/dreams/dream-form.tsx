"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import type { Dream } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const dreamSchema = z.object({
  name: z.string().min(3, { message: "O nome do sonho deve ter pelo menos 3 caracteres." }),
  type: z.enum(['travel', 'business', 'personal'], { required_error: "O tipo de sonho é obrigatório." }),
  targetAmount: z.coerce.number().min(0, { message: "O valor da meta deve ser positivo." }),
  currentAmount: z.coerce.number().min(0, { message: "O valor atual deve ser positivo." }),
  status: z.enum(['planning', 'in_progress', 'completed']),
  notes: z.string().optional(),
}).refine(data => data.currentAmount <= data.targetAmount, {
    message: "O valor atual não pode ser maior que a meta.",
    path: ["currentAmount"],
});

const typeOptions: Record<Dream['type'], string> = {
    travel: 'Viagem',
    business: 'Negócio',
    personal: 'Pessoal',
}

const statusOptions: Record<Dream['status'], string> = {
    planning: 'Planejando',
    in_progress: 'Em Progresso',
    completed: 'Concluído',
}

interface DreamFormProps {
  onSave: (data: Omit<Dream, 'id'>) => void;
  dreamToEdit: Dream | null;
  onCancel: () => void;
}

export function DreamForm({ onSave, dreamToEdit, onCancel }: DreamFormProps) {
  const form = useForm<z.infer<typeof dreamSchema>>({
    resolver: zodResolver(dreamSchema),
    defaultValues: dreamToEdit ? { ...dreamToEdit } : {
        name: "",
        type: "personal",
        targetAmount: 1000,
        currentAmount: 0,
        status: 'planning',
        notes: "",
    },
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = (data: z.infer<typeof dreamSchema>) => {
    onSave(data);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{dreamToEdit ? "Editar Sonho" : "Adicionar Novo Sonho"}</DialogTitle>
        <DialogDescription>
            {dreamToEdit ? "Ajuste os detalhes do seu sonho." : "Qual é o próximo grande objetivo que você quer alcançar?"}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="max-h-[60vh] p-1 pr-6">
                <div className="space-y-4 p-2">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Sonho</FormLabel>
                            <FormControl><Input {...field} placeholder="Ex: Comprar um carro novo" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="type" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o tipo de sonho" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {Object.entries(typeOptions).map(([key, value]) => (
                                        <SelectItem key={key} value={key}>{value}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />

                     <div className="grid grid-cols-2 gap-4">
                         <FormField control={form.control} name="targetAmount" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Meta (R$)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="currentAmount" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Valor Atual (R$)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
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

                     <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Anotações Pessoais</FormLabel>
                            <FormControl><Textarea {...field} placeholder="Adicione detalhes, links, ou qualquer informação que te ajude a planejar." /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
            </ScrollArea>
            <DialogFooter className="pt-6">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : (dreamToEdit ? "Salvar Alterações" : "Adicionar Sonho")}
                </Button>
            </DialogFooter>
        </form>
      </Form>
    </>
  );
}
