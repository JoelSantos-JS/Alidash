"use client";

import type { Bet } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, MoreVertical, Calendar, TrendingUp, TrendingDown, Hourglass, DollarSign, ShieldCheck, List, GitCommitHorizontal } from 'lucide-react';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

interface BetCardProps {
  bet: Bet;
  onEdit: () => void;
  onDelete: () => void;
}

const statusMap = {
  pending: { label: 'Pendente', color: 'bg-yellow-500', icon: Hourglass },
  won: { label: 'Ganha', color: 'bg-green-500', icon: TrendingUp },
  lost: { label: 'Perdida', color: 'bg-red-500', icon: TrendingDown },
  cashed_out: { label: 'Cash Out', color: 'bg-blue-500', icon: DollarSign },
  void: { label: 'Anulada', color: 'bg-gray-500', icon: GitCommitHorizontal },
};

export function BetCard({ bet, onEdit, onDelete }: BetCardProps) {
  const statusInfo = statusMap[bet.status];
  
  const profit = bet.type === 'single'
    ? (bet.status === 'won' && bet.stake && bet.odds ? bet.stake * bet.odds - bet.stake : (bet.status === 'lost' && bet.stake ? -bet.stake : 0))
    : (bet.status === 'won' ? bet.guaranteedProfit || 0 : 0);

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
            <div className='flex-1'>
                 <div className='flex items-center gap-2'>
                    {bet.type === 'surebet' && (
                        <Badge className="bg-teal-500 hover:bg-teal-600 border-transparent text-white gap-1.5">
                            <ShieldCheck className='w-4 h-4' /> Surebet
                        </Badge>
                    )}
                    <Badge variant="secondary">{bet.sport}</Badge>
                 </div>
                 <CardTitle className="text-lg font-bold mt-2">{bet.event}</CardTitle>
            </div>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreVertical />
                        <span className="sr-only">Mais opções</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onEdit}>
                        <Edit className="mr-2" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2" /> Excluir
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {bet.type === 'single' ? (
            <>
                <div>
                    <p className="text-sm font-semibold text-primary">{bet.betType}</p>
                    <p className="text-xs text-muted-foreground">Tipo de Aposta</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="font-bold">{bet.stake?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        <p className="text-xs text-muted-foreground">Apostado (Stake)</p>
                    </div>
                    <div>
                        <p className="font-bold">@{bet.odds?.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Odds</p>
                    </div>
                </div>
            </>
        ) : (
            <>
                <div className="grid grid-cols-3 gap-2 text-sm text-center">
                    <div>
                        <p className="font-bold">{bet.totalStake?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        <p className="text-xs text-muted-foreground">Total Apostado</p>
                    </div>
                     <div>
                        <p className="font-bold text-green-500">{bet.guaranteedProfit?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        <p className="text-xs text-muted-foreground">Lucro Garantido</p>
                    </div>
                     <div>
                        <p className="font-bold text-green-500">{bet.profitPercentage?.toFixed(2)}%</p>
                        <p className="text-xs text-muted-foreground">Retorno (%)</p>
                    </div>
                </div>
                {bet.subBets && (
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="sub-bets">
                            <AccordionTrigger>
                                <List className='w-4 h-4 mr-2'/> Ver {bet.subBets.length} Apostas
                            </AccordionTrigger>
                            <AccordionContent>
                                <ul className='space-y-2 text-sm mt-2'>
                                    {bet.subBets.map(sub => (
                                        <li key={sub.id} className="p-2 bg-secondary/50 rounded-md">
                                            <div className='flex justify-between items-center font-semibold'>
                                                <span>{sub.bookmaker}</span>
                                                <Badge variant="outline">@{sub.odds.toFixed(2)}</Badge>
                                            </div>
                                            <div className='text-xs text-muted-foreground'>{sub.betType}</div>
                                            <div className='text-right font-bold text-primary mt-1'>
                                                {sub.stake.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )}
            </>
        )}

        {bet.notes && (
            <div>
                <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-md whitespace-pre-wrap">{bet.notes}</p>
            </div>
        )}
      </CardContent>
      <CardFooter className="p-4 bg-secondary/30 flex justify-between items-center mt-auto">
        <div className="flex items-center gap-2 text-sm">
             <Calendar className="w-4 h-4 text-muted-foreground"/>
             <span>{new Date(bet.date).toLocaleDateString('pt-BR')}</span>
        </div>
         <Badge className={`border-transparent text-white gap-1.5 ${statusInfo.color}`}>
                <statusInfo.icon className="w-4 h-4" />
                <span>{statusInfo.label}</span>
                {bet.status !== 'pending' && bet.status !== 'cashed_out' && bet.status !== 'void' && (
                     <span className="font-bold">({profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</span>
                )}
        </Badge>
      </CardFooter>
    </Card>
  );
}
