"use client";

import { useState, useEffect } from 'react';
import { Header } from "@/components/layout/header";
import { KeyRound, PlusCircle } from "lucide-react";
import { Button } from '@/components/ui/button';
import { DreamCard } from '@/components/dreams/dream-card';
import { DreamForm } from '@/components/dreams/dream-form';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { Dream, DreamPlan } from '@/types';
import { planDream } from '@/ai/flows/dream-planner';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle } from 'lucide-react';


const initialDreams: Dream[] = [
  {
    id: '1',
    name: 'Viagem para o Chile',
    type: 'travel',
    targetAmount: 20000,
    currentAmount: 7500,
    status: 'planning',
    notes: 'Verificar a melhor época para ver a neve e pesquisar vinícolas.',
  },
  {
    id: '2',
    name: 'Expandir linha de produtos',
    type: 'business',
    targetAmount: 50000,
    currentAmount: 12000,
    status: 'in_progress',
    notes: 'Focar em produtos de casa inteligente e gadgets de produtividade.',
  }
];

const LOCAL_STORAGE_KEY_DREAMS = 'product-dash-dreams';
const LOCAL_STORAGE_KEY_PLANS = 'product-dash-dream-plans';

export default function DreamsPage() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [plans, setPlans] = useState<Record<string, DreamPlan>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPlanning, setIsPlanning] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [dreamToEdit, setDreamToEdit] = useState<Dream | null>(null);
  const [dreamToDelete, setDreamToDelete] = useState<Dream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedDreams = localStorage.getItem(LOCAL_STORAGE_KEY_DREAMS);
      const savedPlans = localStorage.getItem(LOCAL_STORAGE_KEY_PLANS);

      if (savedDreams) {
        setDreams(JSON.parse(savedDreams));
      } else {
        setDreams(initialDreams);
      }

      if (savedPlans) {
        setPlans(JSON.parse(savedPlans));
      }
    } catch (error) {
      console.error("Failed to load dreams from localStorage", error);
      setDreams(initialDreams);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(LOCAL_STORAGE_KEY_DREAMS, JSON.stringify(dreams));
      localStorage.setItem(LOCAL_STORAGE_KEY_PLANS, JSON.stringify(plans));
    }
  }, [dreams, plans, isLoading]);

  const handleOpenForm = (dream: Dream | null = null) => {
    setDreamToEdit(dream);
    setIsFormOpen(true);
  }

  const handleSaveDream = (dreamData: Omit<Dream, 'id'>) => {
    if(dreamToEdit) {
      setDreams(dreams.map(d => d.id === dreamToEdit.id ? { ...dreamToEdit, ...dreamData } : d));
       toast({ title: "Sonho Atualizado!", description: `Seu sonho "${dreamData.name}" foi atualizado.` });
    } else {
      const newDream: Dream = { ...dreamData, id: new Date().getTime().toString() };
      setDreams([newDream, ...dreams]);
       toast({ title: "Sonho Adicionado!", description: `Seu sonho "${dreamData.name}" foi adicionado. Boa sorte!` });
    }
    setIsFormOpen(false);
    setDreamToEdit(null);
  }

  const handleDeleteDream = (dreamId: string) => {
     const dream = dreams.find(p => p.id === dreamId);
     if (!dream) return;
    setDreams(dreams.filter(d => d.id !== dreamId));
    setPlans(prev => {
        const newPlans = {...prev};
        delete newPlans[dreamId];
        return newPlans;
    });
    setDreamToDelete(null);
     toast({ variant: 'destructive', title: "Sonho Excluído!", description: `O sonho "${dream.name}" foi removido.` });
  }

  const handlePlanDream = async (dream: Dream) => {
    setIsPlanning(dream.id);
    try {
      const existingPlan = plans[dream.id];
      if (existingPlan) {
        const userConfirmed = await new Promise((resolve) => {
            const onConfirm = () => resolve(true);
            const onCancel = () => resolve(false);
            toast({
                title: 'Gerar novo plano?',
                description: 'Isso substituirá o plano existente. Deseja continuar?',
                action: (
                    <>
                        <Button onClick={onConfirm}>Sim</Button>
                        <Button variant="ghost" onClick={onCancel}>Não</Button>
                    </>
                ),
            });
        });
        if (!userConfirmed) {
            setIsPlanning(null);
            return;
        }
      }
      
      const result = await planDream({ dreamName: dream.name, dreamType: dream.type });
      setPlans(prev => ({...prev, [dream.id]: result}));
      toast({
        title: "Plano Gerado com Sucesso!",
        description: `A IA criou um plano para o seu sonho: "${dream.name}".`
      })
    } catch (error) {
        console.error("Error planning dream: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao Planejar Sonho",
            description: "Não foi possível gerar o plano com a IA. Tente novamente."
        })
    } finally {
        setIsPlanning(null);
    }
  }

  return (
    <>
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold mb-1 flex items-center gap-2">
              <KeyRound className="w-8 h-8 text-primary" />
              Dashboard de Sonhos
            </h2>
            <p className="text-muted-foreground">
              Planeje, acompanhe e conquiste seus maiores objetivos.
            </p>
          </div>
          <Button size="lg" onClick={() => handleOpenForm()}>
              <PlusCircle className="mr-2"/>
              Adicionar Sonho
          </Button>
        </div>
        
        {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Skeleton className="h-[500px] w-full" />
                <Skeleton className="h-[500px] w-full" />
             </div>
        ) : dreams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {dreams.map(dream => (
                    <DreamCard 
                        key={dream.id} 
                        dream={dream}
                        plan={plans[dream.id]}
                        isPlanning={isPlanning === dream.id}
                        onPlan={() => handlePlanDream(dream)}
                        onEdit={() => handleOpenForm(dream)}
                        onDelete={() => setDreamToDelete(dream)}
                    />
                ))}
            </div>
        ) : (
            <div className="text-center py-20 bg-muted rounded-lg">
                <h3 className="text-2xl font-bold">Comece a Sonhar!</h3>
                <p className="text-muted-foreground mt-2 mb-6">Você ainda não tem nenhum sonho cadastrado. Que tal adicionar o primeiro?</p>
                <Button size="lg" onClick={() => handleOpenForm()}>
                    <PlusCircle className="mr-2"/>
                    Adicionar Meu Primeiro Sonho
                </Button>
            </div>
        )}

      </main>
    </div>

    <Dialog open={isFormOpen} onOpenChange={isOpen => {
        if(!isOpen) {
            setIsFormOpen(false);
            setDreamToEdit(null);
        }
    }}>
        <DialogContent>
            <DreamForm
                onSave={handleSaveDream}
                dreamToEdit={dreamToEdit}
                onCancel={() => {
                    setIsFormOpen(false);
                    setDreamToEdit(null);
                }}
            />
        </DialogContent>
    </Dialog>

     <AlertDialog open={!!dreamToDelete} onOpenChange={(isOpen) => !isOpen && setDreamToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>
                <div className="flex items-center gap-2">
                    <AlertTriangle className="text-destructive"/>
                    Você tem certeza?
                </div>
            </AlertDialogTitle>
            <AlertDialogDescription>
                Essa ação não pode ser desfeita. Isso excluirá permanentemente o sonho <strong className="text-foreground">"{dreamToDelete?.name}"</strong> e todo o seu plano.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => dreamToDelete && handleDeleteDream(dreamToDelete.id)}>
                Sim, excluir sonho
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
