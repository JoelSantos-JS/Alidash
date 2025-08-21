"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Star, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Plan = 'biweekly' | 'monthly';

interface UpgradeToProDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpgrade: (plan: Plan) => Promise<void>;
}

export function UpgradeToProDialog({ isOpen, onOpenChange, onUpgrade }: UpgradeToProDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan>('monthly');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { toast } = useToast();

  const handleUpgradeClick = async () => {
    setIsUpgrading(true);
    try {
        await onUpgrade(selectedPlan);
        toast({
            title: "Upgrade Concluído!",
            description: "Bem-vindo ao Pro! Você desbloqueou todas as funcionalidades.",
        });
    } catch (error) {
        console.error("Upgrade failed:", error);
        toast({
            variant: "destructive",
            title: "Erro no Upgrade",
            description: "Não foi possível processar sua assinatura. Tente novamente."
        })
    } finally {
        setIsUpgrading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mx-auto bg-primary/20 p-3 rounded-full mb-4 w-fit">
            <Star className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">Faça o Upgrade para o Pro</DialogTitle>
          <DialogDescription className="text-center">
            Desbloqueie funcionalidades exclusivas com IA para acelerar seus resultados.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
            <PlanOption 
                plan="biweekly"
                title="15 Dias de Acesso"
                price="9,90"
                selectedPlan={selectedPlan}
                onSelect={setSelectedPlan}
            />
             <PlanOption 
                plan="monthly"
                title="30 Dias de Acesso"
                price="19,90"
                bestValue
                selectedPlan={selectedPlan}
                onSelect={setSelectedPlan}
            />
        </div>

        <DialogFooter>
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleUpgradeClick}
            disabled={isUpgrading}
          >
            {isUpgrading ? <Loader2 className="animate-spin" /> : `Assinar Plano (${selectedPlan === 'biweekly' ? 'R$ 9,90' : 'R$ 19,90'})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


interface PlanOptionProps {
    plan: Plan;
    title: string;
    price: string;
    bestValue?: boolean;
    selectedPlan: Plan;
    onSelect: (plan: Plan) => void;
}

function PlanOption({ plan, title, price, bestValue = false, selectedPlan, onSelect }: PlanOptionProps) {
    const isSelected = selectedPlan === plan;
    return (
        <div 
            onClick={() => onSelect(plan)}
            className={cn(
                "p-4 border-2 rounded-lg cursor-pointer transition-all relative",
                isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
            )}
        >
            {bestValue && (
                 <div className="absolute -top-3 right-4 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                    MELHOR VALOR
                </div>
            )}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                    )}>
                       {isSelected && <CheckCircle className="w-3 h-3 text-primary-foreground"/>}
                    </div>
                    <span className="font-semibold">{title}</span>
                </div>
                <div className="text-lg font-bold">
                    R$ <span className="text-2xl">{price}</span>
                </div>
            </div>
        </div>
    )
}
