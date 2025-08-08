"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const DREAMS_PASSWORD = "joel8812";
const BETS_PASSWORD = "aposta123";

const passwordSchema = z.object({
  password: z.string().min(1, { message: "A senha é obrigatória." }),
});

type PasswordDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: (path: 'sonhos' | 'apostas') => void;
};

export function PasswordDialog({ isOpen, onOpenChange, onSuccess }: PasswordDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  });

  const onSubmit = (values: z.infer<typeof passwordSchema>) => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
        if (values.password === DREAMS_PASSWORD) {
          toast({
            title: "Acesso Concedido!",
            description: "Bem-vindo ao seu cofre de sonhos.",
          });
          onSuccess('sonhos');
        } else if (values.password === BETS_PASSWORD) {
           toast({
            title: "Acesso Concedido!",
            description: "Bem-vindo ao seu dashboard de apostas.",
          });
          onSuccess('apostas');
        } else {
          toast({
            variant: "destructive",
            title: "Acesso Negado",
            description: "A senha está incorreta. Tente novamente.",
          });
          form.reset();
        }
        setIsSubmitting(false);
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Acesso Restrito</DialogTitle>
          <DialogDescription>
            Esta área é protegida. Por favor, insira a senha para continuar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entrar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
