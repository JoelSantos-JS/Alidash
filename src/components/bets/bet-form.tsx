"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ShieldCheck, Trash2, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import React from 'react';

import type { Bet, SubBet } from "@/types";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const subBetSchema = z.object({
  id: z.string().optional(),
  bookmaker: z.string().min(1, "Obrigatório"),
  betType: z.string().min(1, "Obrigatório"),
  odds: z.coerce.number().min(1.01, "Deve ser > 1.00"),
  stake: z.coerce.number().min(0.01, "Deve ser > 0"),
});

const betSchema = z.object({
  type: z.enum(['single', 'surebet']),
  sport: z.string().min(1, "O esporte é obrigatório."),
  event: z.string().min(3, "O evento deve ter pelo menos 3 caracteres."),
  date: z.date({ required_error: "A data da aposta é obrigatória." }),
  status: z.enum(['pending', 'won', 'lost', 'cashed_out', 'void']),
  notes: z.string().optional(),
  
  // Single bet fields
  betType: z.string().optional(),
  stake: z.coerce.number().optional(),
  odds: z.coerce.number().optional(),

  // Surebet fields
  subBets: z.array(subBetSchema).optional(),

  // Calculated fields - not part of the form but for the final object
  totalStake: z.number().optional(),
  guaranteedProfit: z.number().optional(),
  profitPercentage: z.number().optional(),

}).superRefine((data, ctx) => {
    if (data.type === 'single') {
        if (!data.betType || data.betType.length < 3) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "O tipo de aposta é obrigatório.", path: ['betType'] });
        }
        if (!data.stake || data.stake <= 0) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "O valor apostado deve ser maior que zero.", path: ['stake'] });
        }
        if (!data.odds || data.odds <= 1) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "As odds devem ser maiores que 1.00.", path: ['odds'] });
        }
    }
    if (data.type === 'surebet') {
        if (!data.subBets || data.subBets.length < 2) {
             ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Uma surebet deve ter pelo menos 2 apostas.", path: ['subBets'] });
        }
    }
});


const sportOptions = ["Futebol", "Basquete", "Tênis", "Vôlei", "Futebol Americano", "MMA", "E-Sports"];
const statusOptions: Record<Bet['status'], string> = { pending: 'Pendente', won: 'Ganha', lost: 'Perdida', cashed_out: 'Cash Out', void: 'Anulada' };

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
        date: new Date(betToEdit.date),
    } : {
        type: 'single',
        sport: "Futebol",
        event: "",
        betType: "",
        stake: 10,
        odds: 1.5,
        status: 'pending',
        date: new Date(),
        notes: "",
        subBets: [{ id: '1', bookmaker: '', betType: '', odds: 1.5, stake: 10 }, { id: '2', bookmaker: '', betType: '', odds: 1.5, stake: 10 }],
    },
  });

  const { control, handleSubmit, watch, formState: { isSubmitting } } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "subBets" });

  const watchedType = watch("type");
  const watchedSubBets = watch("subBets");

  const surebetCalculations = React.useMemo(() => {
    if (watchedType !== 'surebet' || !watchedSubBets || watchedSubBets.length < 2) {
        return { totalStake: 0, guaranteedProfit: 0, profitPercentage: 0 };
    }
    const totalStake = watchedSubBets.reduce((acc, bet) => acc + (bet.stake || 0), 0);
    if(totalStake <= 0) return { totalStake, guaranteedProfit: 0, profitPercentage: 0 };

    // Para uma surebet real, o retorno de cada resultado deve ser o mais próximo possível.
    // Usamos a média dos retornos potenciais para calcular o lucro garantido aproximado.
    const potentialReturns = watchedSubBets.map(bet => (bet.stake || 0) * (bet.odds || 0));
    const averageReturn = potentialReturns.reduce((acc, ret) => acc + ret, 0) / potentialReturns.length;
    const guaranteedProfit = averageReturn - totalStake;
    const profitPercentage = totalStake > 0 ? (guaranteedProfit / totalStake) * 100 : 0;

    return { totalStake, guaranteedProfit, profitPercentage };
  }, [watchedType, watchedSubBets]);

  const onSubmit = (data: z.infer<typeof betSchema>) => {
    let finalData: Omit<Bet, 'id'> = data;
    if (data.type === 'surebet') {
        const { totalStake, guaranteedProfit, profitPercentage } = surebetCalculations;
        finalData = { ...data, totalStake, guaranteedProfit, profitPercentage };
    }
    onSave(finalData);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{betToEdit ? "Editar Aposta" : "Adicionar Nova Aposta"}</DialogTitle>
        <DialogDescription>
            {betToEdit ? "Ajuste os detalhes da sua aposta." : "Registre uma aposta simples ou uma surebet para acompanhar."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
            <ScrollArea className="max-h-[70vh] p-1 pr-6">
                <div className="space-y-4 p-2">
                    <FormField control={control} name="type" render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Tipo de Aposta</FormLabel>
                             <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4">
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="single" /></FormControl>
                                        <FormLabel className="font-normal">Aposta Simples</FormLabel>
                                    </FormItem>
                                     <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="surebet" /></FormControl>
                                        <FormLabel className="font-normal flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-teal-500"/> Surebet</FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                     
                     <div className="grid grid-cols-2 gap-4">
                        <FormField control={control} name="sport" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Esporte</FormLabel>
                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione o esporte" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {sportOptions.map((sport) => <SelectItem key={sport} value={sport}>{sport}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={control} name="event" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Evento</FormLabel>
                                <FormControl><Input {...field} placeholder="Ex: Time A vs Time B" /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                    {watchedType === 'single' ? (
                        <>
                            <FormField control={control} name="betType" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Aposta</FormLabel>
                                    <FormControl><Input {...field} placeholder="Ex: Vitória Time A" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={control} name="stake" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor Apostado (R$)</FormLabel>
                                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={control} name="odds" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Odds</FormLabel>
                                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </>
                    ) : (
                        <div>
                             <h3 className="text-md font-medium mb-2">Apostas da Surebet</h3>
                            <div className="space-y-4">
                                {fields.map((item, index) => (
                                    <div key={item.id} className="p-4 bg-muted/50 rounded-lg space-y-3 relative">
                                        <FormField control={control} name={`subBets.${index}.bookmaker`} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Casa de Apostas</FormLabel>
                                                <FormControl><Input placeholder="Ex: Bet365" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={control} name={`subBets.${index}.betType`} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tipo de Aposta</FormLabel>
                                                <FormControl><Input placeholder="Ex: Vitória Time A" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={control} name={`subBets.${index}.odds`} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Odds</FormLabel>
                                                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={control} name={`subBets.${index}.stake`} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Aposta (R$)</FormLabel>
                                                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>
                                         {fields.length > 2 && (
                                            <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}>
                                                <Trash2 className="w-4 h-4"/>
                                            </Button>
                                         )}
                                    </div>
                                ))}
                            </div>
                            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ id: new Date().toISOString() , bookmaker: '', betType: '', odds: 1.5, stake: 0 })}>
                                <PlusCircle className="mr-2"/> Adicionar Aposta
                            </Button>
                        </div>
                    )}
                     <div className="grid grid-cols-2 gap-4">
                        <FormField control={control} name="status" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {Object.entries(statusOptions).map(([key, value]) => (
                                            <SelectItem key={key} value={key}>{value}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={control} name="date" render={({ field }) => (
                            <FormItem className="flex flex-col pt-2">
                                <FormLabel>Data da Aposta</FormLabel>
                                <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant={"outline"} className={cn("w-full justify-start pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR}/>
                                </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                     <FormField control={control} name="notes" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Análise / Notas (Opcional)</FormLabel>
                            <FormControl><Textarea {...field} placeholder="Ex: Jogador chave lesionado, time vem de 5 vitórias..." /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
            </ScrollArea>
             <DialogFooter className="pt-6 p-4 flex-col md:flex-row md:justify-between border-t gap-4">
                 {watchedType === 'surebet' && (
                    <div className="flex flex-wrap gap-4 items-center text-sm">
                        <div>
                            <span className="text-muted-foreground">Total Apostado:</span>
                            <p className="font-bold">{surebetCalculations.totalStake.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                         <div>
                            <span className="text-muted-foreground">Lucro Garantido:</span>
                            <p className="font-bold text-green-500">{surebetCalculations.guaranteedProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                         <div>
                            <span className="text-muted-foreground">Retorno:</span>
                            <p className="font-bold text-green-500">{surebetCalculations.profitPercentage.toFixed(2)}%</p>
                        </div>
                    </div>
                 )}
                <div className="flex gap-2 ml-auto">
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : (betToEdit ? "Salvar Alterações" : "Adicionar Aposta")}
                    </Button>
                </div>
            </DialogFooter>
        </form>
      </Form>
    </>
  );
}
