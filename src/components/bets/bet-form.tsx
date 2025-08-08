"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import type { Bet } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const betSchema = z.object({
  sport: z.string().min(1, { message: "O esporte é obrigatório." }),
  event: z.string().min(3, { message: "O evento deve ter pelo menos 3 caracteres." }),
  betType: z.string().min(3, { message: "O tipo de aposta é obrigatório." }),
  stake: z.coerce.number().min(0.01, { message: "O valor apostado deve ser maior que zero." }),
  odds: z.coerce.number().min(1.01, { message: "As odds devem ser maiores que 1.00." }),
  status: z.enum(['pending', 'won', 'lost', 'cashed_out']),
  date: z.date({ required_error: "A data da aposta é obrigatória." }),
  notes: z.string().optional(),
});


const sportOptions = [
    "Futebol",
    "Basquete",
    "Tênis",
    "Vôlei",
    "Futebol Americano",
    "MMA",
    "E-Sports",
]

const statusOptions: Record<Bet['status'], string> = {
    pending: 'Pendente',
    won: 'Ganha',
    lost: 'Perdida',
    cashed_out: 'Cash Out',
}

interface BetFormProps {
  onSave: (data: Omit<Bet, 'id'>) => void;
  betToEdit: Bet | null;
  onCancel: () => void;
}

export function BetForm({ onSave, betToEdit, onCancel }: BetFormProps) {
  const form = useForm<z.infer<typeof betSchema>>({
    resolver: zodResolver(betSchema),
    defaultValues: betToEdit ? { 
        ...betToEdit,
        date: new Date(betToEdit.date)
    } : {
        sport: "Futebol",
        event: "",
        betType: "",
        stake: 10,
        odds: 1.5,
        status: 'pending',
        date: new Date(),
        notes: "",
    },
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = (data: z.infer<typeof betSchema>) => {
    onSave(data);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{betToEdit ? "Editar Aposta" : "Adicionar Nova Aposta"}</DialogTitle>
        <DialogDescription>
            {betToEdit ? "Ajuste os detalhes da sua aposta." : "Registre uma nova aposta para acompanhar seus resultados."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="max-h-[60vh] p-1 pr-6">
                <div className="space-y-4 p-2">
                     <FormField control={form.control} name="event" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Evento</FormLabel>
                            <FormControl><Input {...field} placeholder="Ex: Time A vs Time B" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                     <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="sport" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Esporte</FormLabel>
                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o esporte" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {sportOptions.map((sport) => (
                                            <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                         <FormField control={form.control} name="betType" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Aposta</FormLabel>
                                <FormControl><Input {...field} placeholder="Ex: Vitória Time A" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                     <div className="grid grid-cols-2 gap-4">
                         <FormField control={form.control} name="stake" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Valor Apostado (R$)</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="odds" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Odds</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                     <div className="grid grid-cols-2 gap-4">
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
                         <FormField control={form.control} name="date" render={({ field }) => (
                            <FormItem className="flex flex-col pt-2">
                                <FormLabel>Data da Aposta</FormLabel>
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
                            <FormLabel>Análise / Notas (Opcional)</FormLabel>
                            <FormControl><Textarea {...field} placeholder="Ex: Jogador chave lesionado, time vem de 5 vitórias..." /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
            </ScrollArea>
            <DialogFooter className="pt-6">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : (betToEdit ? "Salvar Alterações" : "Adicionar Aposta")}
                </Button>
            </DialogFooter>
        </form>
      </Form>
    </>
  );
}
