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
import { useAuth } from '@/hooks/use-supabase-auth';
import { useDualSync } from '@/lib/dual-database-sync';

const initialDreams: Dream[] = [];

export default function DreamsPage() {
  const { user, loading: authLoading } = useAuth();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlanning, setIsPlanning] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [dreamToEdit, setDreamToEdit] = useState<Dream | null>(null);
  const [dreamToDelete, setDreamToDelete] = useState<Dream | null>(null);
  const [dreamToRefine, setDreamToRefine] = useState<Dream | null>(null);
  const { toast } = useToast();
  
  // Hook de sincronização dual
  const dualSync = useDualSync(user?.id || '', 'BEST_EFFORT');

  useEffect(() => {
    if (authLoading || !user) return;

    const fetchData = async () => {
      try {
        console.log('🎯 Carregando sonhos do Supabase para usuário:', user.id)
        
        // Carregar sonhos diretamente da API do Supabase
        const response = await fetch(`/api/dreams?user_id=${user.id}`)
        const data = await response.json()
        
        if (data.success && data.dreams) {
          setDreams(data.dreams)
          console.log('✅ Sonhos carregados do Supabase:', data.dreams.length)
        } else {
          console.log('⚠️ Nenhum sonho encontrado no Supabase')
          setDreams(initialDreams)
        }
      } catch (error) {
        console.error('❌ Erro ao carregar sonhos:', error)
        setDreams(initialDreams)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData();
  }, [user, authLoading]);

  useEffect(() => {
    if (isLoading || authLoading || !user) return;

    const saveData = async () => {
      try {
        const dreamsToSave = dreams.map(d => {
          const { plan, ...dreamWithoutPlan } = d;
          // Only include plan if it's not null/undefined
          if (plan && Object.keys(plan).length > 0) {
            // Create a serializable version of the plan
            const serializablePlan = {
              description: plan.description,
              estimatedCost: plan.estimatedCost || [],
              totalEstimatedCost: plan.totalEstimatedCost || 0,
              actionPlan: plan.actionPlan || [],
              importantNotes: plan.importantNotes || [],
              // Only include imageUrl if it's a simple string and not too large
              ...(plan.imageUrl && 
                  typeof plan.imageUrl === 'string' && 
                  plan.imageUrl.length < 1000000 && // Limit to 1MB
                  !plan.imageUrl.startsWith('data:') // Exclude base64 data URIs
                  ? { imageUrl: plan.imageUrl } 
                  : {})
            };
            return { ...dreamWithoutPlan, plan: serializablePlan };
          }
          return dreamWithoutPlan;
        });

        // Usar sincronização dual para salvar sonhos
        const result = await dualSync.saveDreams(dreamsToSave);
        
        if (result.success) {
          console.log(`✅ Sonhos salvos - Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`)
        } else {
          console.error('❌ Erro ao salvar sonhos:', result.errors)
          toast({
            variant: 'destructive',
            title: "Erro ao Salvar Dados",
            description: "Não foi possível salvar os sonhos na nuvem.",
          })
        }
      } catch (error) {
        console.error("Failed to save dreams", error);
        toast({
          variant: 'destructive',
          title: "Erro ao Salvar Dados",
          description: "Não foi possível salvar os sonhos na nuvem.",
        })
      }
    }
    saveData();
  }, [dreams, isLoading, user, authLoading, toast, dualSync]);
  
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

  const handleSaveDream = async (dreamData: Omit<Dream, 'id'>) => {
    if(dreamToEdit) {
      // Editar sonho existente
      const updatedDream = { ...dreamToEdit, ...dreamData };
      setDreams(dreams.map(d => d.id === dreamToEdit.id ? updatedDream : d));
      
      // Usar sincronização dual para atualizar
      try {
        // Como não temos updateDream no dual sync ainda, usamos o estado local
        console.log('✅ Sonho atualizado localmente (sincronização dual em desenvolvimento)');
        toast({ 
          title: "Sonho Atualizado!", 
          description: `${dreamData.name} - Atualizado localmente` 
        });
      } catch (error) {
        console.error('Erro na sincronização dual:', error);
        toast({ 
          title: "Sonho Atualizado!", 
          description: `Seu sonho "${dreamData.name}" foi atualizado localmente.` 
        });
      }
    } else {
      // Adicionar novo sonho
      const newDream: Dream = { ...dreamData, id: new Date().getTime().toString() };
      setDreams([newDream, ...dreams]);
      
      // Usar sincronização dual para criar
      try {
        const result = await dualSync.createDream(newDream);
        console.log(`Sonho criado - Firebase: ${result.firebaseSuccess ? '✅' : '❌'} | Supabase: ${result.supabaseSuccess ? '✅' : '❌'}`);
        
        toast({ 
          title: "Sonho Adicionado!", 
          description: `${dreamData.name} - Supabase: ${result.supabaseSuccess ? '✅' : '❌'}` 
        });
      } catch (error) {
        console.error('Erro na sincronização dual:', error);
        toast({ 
          title: "Sonho Adicionado!", 
          description: `Seu sonho "${dreamData.name}" foi adicionado localmente.` 
        });
      }
    }
    setIsFormOpen(false);
    setDreamToEdit(null);
  }

  const handleDeleteDream = async (dreamId: string) => {
     const dream = dreams.find(p => p.id === dreamId);
     if (!dream) return;
     
    // Remover do estado local
    setDreams(dreams.filter(d => d.id !== dreamId));
    setDreamToDelete(null);
    
    // Usar sincronização dual para deletar
    try {
      // Como não temos deleteDream no dual sync ainda, simulamos
      console.log('✅ Sonho deletado localmente (sincronização dual em desenvolvimento)');
      toast({ 
        variant: 'destructive', 
        title: "Sonho Excluído!", 
        description: `${dream.name} - Removido localmente (dual sync em desenvolvimento)` 
      });
    } catch (error) {
      console.error('Erro na sincronização dual:', error);
      toast({ 
        variant: 'destructive', 
        title: "Sonho Excluído!", 
        description: `O sonho "${dream.name}" foi removido localmente.` 
      });
    }
  }

  const handlePlanClick = (dream: Dream) => {
    handlePlanDream(dream);
  }

  const handleRefineClick = (dream: Dream) => {
    setDreamToRefine(dream);
  }

  const handlePlanDream = async (dream: Dream) => {
    setIsPlanning(dream.id);
    try {
      const existingPlan = dream.plan;
      if (existingPlan) {
        toast({
            title: 'Gerando novo plano...',
            description: 'Isso substituirá o plano existente.',
        });
      }
      
      const result = await planDream({ dreamName: dream.name, dreamType: dream.type });
      setDreams(dreams.map(d => d.id === dream.id ? { ...d, plan: result } : d));

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
        const existingPlan = dreamToRefine.plan;
        if (!existingPlan) {
            toast({ variant: "destructive", title: "Nenhum plano para refinar!", description: "Gere um plano inicial antes de aprimorá-lo."})
            return;
        }

        // Remove imageUrl to avoid token limit issues and serialization problems
        const { imageUrl, ...planToRefine } = existingPlan;

        const result = await planDream({
            dreamName: dreamToRefine.name,
            dreamType: dreamToRefine.type,
            existingPlan: JSON.stringify(planToRefine),
            refinementInstruction: instruction,
        });
        
        // Add the old imageUrl back to the new plan
        setDreams(dreams.map(d => d.id === dreamId ? { ...d, plan: { ...result, imageUrl: imageUrl || result.imageUrl } } : d));

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
                        plan={dream.plan}
                        isPlanning={isPlanning === dream.id}
                        onPlan={() => handlePlanClick(dream)}
                        onRefine={() => handleRefineClick(dream)}
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
