"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

const refineSchema = z.object({
  instruction: z.string().min(10, { message: "A instrução deve ter pelo menos 10 caracteres." }),
});

type DreamRefineDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onRefine: (instruction: string) => Promise<void>;
  dreamName?: string;
};

export function DreamRefineDialog({ isOpen, onOpenChange, onRefine, dreamName }: DreamRefineDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof refineSchema>>({
    resolver: zodResolver(refineSchema),
    defaultValues: { instruction: "" },
  });

  const onSubmit = async (values: z.infer<typeof refineSchema>) => {
    setIsSubmitting(true);
    await onRefine(values.instruction);
    setIsSubmitting(false);
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aprimorar Plano do Sonho</DialogTitle>
          <DialogDescription>
            Dê uma instrução para a IA refinar o plano para <strong className="text-primary">"{dreamName}"</strong>. Seja específico para obter o melhor resultado.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="instruction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instrução para a IA</FormLabel>
                  <FormControl>
                    <Textarea 
                        {...field} 
                        rows={4}
                        placeholder="Ex: 'Seja mais detalhista nos custos de transporte' ou 'Sugira atividades gratuitas para fazer no destino'."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2" />}
                Aprimorar Agora
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
