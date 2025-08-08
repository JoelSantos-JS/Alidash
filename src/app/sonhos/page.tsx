"use client";

import { useState, useEffect } from 'react';
import { Header } from "@/components/layout/header";
import { KeyRound, PlusCircle } from "lucide-react";
import { Button } from '@/components/ui/button';
import { DreamCard } from '@/components/dreams/dream-card';
import { DreamForm } from '@/components/dreams/dream-form';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { Dream, DreamPlan } from '@/types';
import { planDream, getToughLoveReminder } from '@/ai/flows/dream-planner';
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
import { DreamRefineDialog } from '@/components/dreams/dream-refine-dialog';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const initialDreams: Dream[] = [];

export default function DreamsPage() {
  const { user, loading: authLoading } = useAuth();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [plans, setPlans] = useState<Record<string, DreamPlan>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPlanning, setIsPlanning] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [dreamToEdit, setDreamToEdit] = useState<Dream | null>(null);
  const [dreamToDelete, setDreamToDelete] = useState<Dream | null>(null);
  const [dreamToRefine, setDreamToRefine] = useState<Dream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading || !user) return;

    const fetchData = async () => {
        const docRef = doc(db, "user-data", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            setDreams(data.dreams || initialDreams);
            setPlans(data.dreamPlans || {});
        } else {
            setDreams(initialDreams);
            setPlans({});
        }
        setIsLoading(false);
    }
    fetchData();
  }, [user, authLoading]);

  useEffect(() => {
    if (isLoading || authLoading || !user) return;

     const saveData = async () => {
        try {
            const docRef = doc(db, "user-data", user.uid);
            await setDoc(docRef, { dreams, dreamPlans: plans }, { merge: true });
        } catch (error) {
            console.error("Failed to save dreams to Firestore", error);
            toast({
                variant: 'destructive',
                title: "Erro ao Salvar Dados",
                description: "Não foi possível salvar os sonhos na nuvem.",
            })
        }
    }
    saveData();
  }, [dreams, plans, isLoading, user, authLoading, toast]);
  
  useEffect(() => {
    if (isLoading || dreams.length === 0) return;

    // Find the dream with the lowest progress percentage
    const dreamWithLowestProgress = dreams
      .filter(d => d.status !== 'completed')
      .sort((a, b) => (a.currentAmount / a.targetAmount) - (b.currentAmount / b.targetAmount))[0];

    if (dreamWithLowestProgress) {
      const progress = (dreamWithLowestProgress.currentAmount / dreamWithLowestProgress.targetAmount) * 100;
      if (progress < 50) { // Only remind if progress is less than 50%
        setTimeout(() => {
          getToughLoveReminder({ dreamName: dreamWithLowestProgress.name, progress })
            .then(result => {
              toast({
                variant: "default",
                title: `Lembrete para: ${dreamWithLowestProgress.name}`,
                description: result.reminder,
                duration: 8000,
              });
            })
            .catch(err => console.error("Could not get reminder", err));
        }, 2000); // Delay to allow the user to settle
      }
    }
  }, [isLoading, dreams, toast]);

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
        toast({
            title: 'Gerando novo plano...',
            description: 'Isso substituirá o plano existente.',
        });
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

  const handleRefinePlan = async (instruction: string) => {
    if (!dreamToRefine) return;
    const dreamId = dreamToRefine.id;
    setIsPlanning(dreamId);
    setDreamToRefine(null);
    try {
        const existingPlan = plans[dreamId];
        if (!existingPlan) {
            toast({ variant: "destructive", title: "Nenhum plano para refinar!", description: "Gere um plano inicial antes de aprimorá-lo."})
            return;
        }

        // Remove imageUrl to avoid token limit issues
        const { imageUrl, ...planToRefine } = existingPlan;

        const result = await planDream({
            dreamName: dreamToRefine.name,
            dreamType: dreamToRefine.type,
            existingPlan: JSON.stringify(planToRefine),
            refinementInstruction: instruction,
        });
        
        // Mantém a imagem original, pois a IA não gera uma nova ao refinar
        setPlans(prev => ({...prev, [dreamId]: { ...result, imageUrl: prev[dreamId]?.imageUrl || result.imageUrl }}));
        toast({
            title: "Plano Aprimorado!",
            description: "A IA atualizou o plano com base na sua instrução."
        });

    } catch (error) {
        console.error("Error refining plan:", error);
        toast({
            variant: "destructive",
            title: "Erro ao Aprimorar",
            description: "Não foi possível aprimorar o plano. Tente novamente."
        });
    } finally {
        setIsPlanning(null);
    }
  }


  return (
    <>
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold mb-1 flex items-center gap-2">
              <KeyRound className="w-8 h-8 text-primary" />
              Dashboard de Sonhos
            </h2>
            <p className="text-muted-foreground">
              Planeje, acompanhe e conquiste seus maiores objetivos.
            </p>
          </div>
          <Button size="lg" onClick={() => handleOpenForm()} className="w-full md:w-auto">
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
                        onRefine={() => setDreamToRefine(dream)}
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

    <DreamRefineDialog 
        isOpen={!!dreamToRefine}
        onOpenChange={(isOpen) => !isOpen && setDreamToRefine(null)}
        onRefine={handleRefinePlan}
        dreamName={dreamToRefine?.name}
    />
    </>
  );
}
