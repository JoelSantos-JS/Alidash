"use client";

import Image from 'next/image';
import type { Dream, DreamPlan } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Wand2, PiggyBank, ListChecks, Info, Loader2, Edit, Trash2, NotebookText, Sparkles } from 'lucide-react';
import { Badge } from '../ui/badge';

interface DreamCardProps {
  dream: Dream;
  plan?: DreamPlan | null;
  isPlanning?: boolean;
  onPlan: () => void;
  onRefine: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const statusMap = {
  planning: { label: 'Planejando', color: 'bg-yellow-500' },
  in_progress: { label: 'Em Progresso', color: 'bg-blue-500' },
  completed: { label: 'Concluído', color: 'bg-green-500' },
};


export function DreamCard({ dream, plan, isPlanning = false, onPlan, onRefine, onEdit, onDelete }: DreamCardProps) {
  const progress = dream.targetAmount > 0 ? (dream.currentAmount / dream.targetAmount) * 100 : 0;
  const statusInfo = statusMap[dream.status];

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="p-0 relative">
        <div className="aspect-video relative bg-muted flex items-center justify-center">
            {plan?.imageUrl ? (
                 <Image src={plan.imageUrl} alt={dream.name} fill className="object-cover" data-ai-hint="dream illustration" />
            ): (
                <Wand2 className="w-16 h-16 text-muted-foreground/30"/>
            )}
        </div>
         <div className="absolute top-2 right-2 flex gap-2">
            <Badge className={`border-transparent text-white ${statusInfo.color}`}>
                {statusInfo.label}
            </Badge>
         </div>
      </CardHeader>
      <CardContent className="p-6 flex-1">
        <CardTitle className="text-xl font-bold">{dream.name}</CardTitle>
        {plan?.description && (
             <CardDescription className="mt-2 text-base">{plan.description}</CardDescription>
        )}
       

        <div className='mt-6'>
            <div className="flex justify-between items-end mb-1">
                <span className="text-sm font-medium text-muted-foreground">Progresso</span>
                <span className="text-sm font-bold text-primary">{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} />
            <div className="flex justify-between items-end mt-1 text-xs text-muted-foreground">
                <span>{dream.currentAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                <span>{dream.targetAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
        </div>
        
        {(plan || dream.notes) && (
             <div className='mt-6 space-y-4'>
                 {dream.notes && (
                    <div>
                        <h4 className='font-semibold flex items-center gap-2 mb-2'><NotebookText className="w-5 h-5 text-primary"/> Minhas Anotações</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{dream.notes}</p>
                    </div>
                 )}

                {plan && (
                    <>
                        <div>
                            <h4 className='font-semibold flex items-center gap-2 mb-2'><PiggyBank className="w-5 h-5 text-primary"/> Custos Estimados (IA)</h4>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                                {plan.estimatedCost.map(item => (
                                    <li key={item.item} className='flex justify-between'>
                                        <span>{item.item}</span>
                                        <span className='font-medium'>{item.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                    </li>
                                ))}
                                <li className='flex justify-between border-t pt-1 font-bold text-foreground'>
                                    <span>Total</span>
                                    <span>{plan.totalEstimatedCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className='font-semibold flex items-center gap-2 mb-2'><ListChecks className="w-5 h-5 text-primary"/> Plano de Ação (IA)</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                {plan.actionPlan.map(step => (
                                    <li key={step.step}>
                                        <strong className='text-foreground'>{step.step}. {step.action}:</strong> {step.details}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className='font-semibold flex items-center gap-2 mb-2'><Info className="w-5 h-5 text-primary"/> Dicas Importantes (IA)</h4>
                            <ul className="space-y-1 text-sm list-disc list-inside text-muted-foreground">
                                {plan.importantNotes.map((note, i) => (
                                    <li key={i}>{note}</li>
                                ))}
                            </ul>
                        </div>
                    </>
                )}
            </div>
        )}

      </CardContent>
      <CardFooter className="p-4 bg-secondary/30 flex flex-col sm:flex-row gap-2">
         <Button className="w-full sm:w-auto sm:flex-1" onClick={onPlan} disabled={isPlanning}>
            {isPlanning ? (
                <><Loader2 className="mr-2 animate-spin"/> Gerando...</>
            ) : (
                <><Wand2 className="mr-2"/> {plan ? 'Novo Plano' : 'Planejar com IA'}</>
            )}
        </Button>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
            <Button variant="outline" onClick={onRefine} disabled={!plan || isPlanning} className="flex-1">
                <Sparkles className="mr-2"/> Aprimorar
            </Button>
            <Button variant="outline" onClick={onEdit} className="flex-1">
                <Edit className="mr-2"/>Editar
            </Button>
            <Button variant="destructive" onClick={onDelete} className="flex-1">
                <Trash2 className="mr-2"/>Excluir
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
